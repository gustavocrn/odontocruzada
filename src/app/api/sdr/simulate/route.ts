import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured, createAuthenticatedSupabaseClient } from '@/lib/supabase';
import { processSDRTurn, generateOfflineFallbackReply, evaluateFollowUpEligibility } from '@/services/sdr/qualificationEngine';
import { getAIStatus, generateSDRReply } from '@/services/ai';
import { getConversationMessages, addConversationMessage } from '@/services/sdr/conversationService';
import { leadService } from '@/services/leadService';
import { propertyService } from '@/services/propertyService';
import { SupabaseClient } from '@supabase/supabase-js';
import { Lead } from '@/types';

/**
 * Obtém e valida o cliente Supabase autenticado server-side via Bearer Token.
 */
async function getAuthenticatedServerClient(req: NextRequest): Promise<{ isAuth: boolean; client: SupabaseClient | null }> {
  if (!isSupabaseConfigured()) {
    // Se o Supabase não estiver configurado, permite em modo local demo
    return { isAuth: true, client: null };
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isAuth: false, client: null };
  }

  const token = authHeader.substring(7);
  const client = createAuthenticatedSupabaseClient(token);
  if (!client) {
    return { isAuth: false, client: null };
  }

  try {
    const { data: { user }, error } = await client.auth.getUser(token);
    if (user && !error) {
      return { isAuth: true, client };
    }
  } catch (err) {
    console.warn('Erro ao validar token do usuário no servidor:', err);
  }

  return { isAuth: false, client: null };
}

export async function GET(req: NextRequest) {
  const { isAuth } = await getAuthenticatedServerClient(req);
  if (!isAuth) {
    return NextResponse.json(
      { success: false, error: 'Acesso não autorizado. É necessário estar autenticado no CRM.' },
      { status: 401 }
    );
  }

  const status = getAIStatus();
  return NextResponse.json({ success: true, aiStatus: status });
}

export async function POST(req: NextRequest) {
  // SEGURANÇA: Bloqueia chamadas não autenticadas
  const { isAuth, client } = await getAuthenticatedServerClient(req);
  if (!isAuth) {
    return NextResponse.json(
      { success: false, error: 'Acesso não autorizado. É necessário estar autenticado no CRM para utilizar o simulador e a IA.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { leadId, newMessage, action, selectedPropertyId, simulatedReceivedDocs, is30MinFollowupTrigger } = body;

    if (!leadId) {
      return NextResponse.json(
        { success: false, error: 'leadId é obrigatório.' },
        { status: 400 }
      );
    }

    const db = client || supabase;

    // AÇÃO DE SELEÇÃO DIRETA DE IMÓVEL DO ANÚNCIO
    if (selectedPropertyId) {
      await propertyService.linkPropertyToLead(leadId, selectedPropertyId, client);
    }

    // BUSCAR DADOS DO LEAD ATUALIZADOS COM CLIENTE AUTENTICADO
    let lead = await leadService.getLeadById(leadId, client);
    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead não encontrado.' },
        { status: 404 }
      );
    }

    // Carregar lista estrita de anúncios ativos (ad_active = true AND availability_status = 'Disponível')
    const adProperties = await propertyService.getActiveAdProperties(client);

    // Carregar imóvel atual do lead, se existir
    let currentProperty = lead.currentProperty;
    if (!currentProperty && lead.currentPropertyId) {
      const prop = await propertyService.getPropertyById(lead.currentPropertyId, client);
      if (prop) currentProperty = prop;
    }

    // Se o cliente digitou o código de um imóvel (ex: "CS-101"), tentar auto-vincular
    if (!selectedPropertyId && newMessage && typeof newMessage === 'string') {
      const matchedCode = adProperties.find((p) =>
        newMessage.toUpperCase().includes(p.propertyCode.toUpperCase())
      );
      if (matchedCode) {
        await propertyService.linkPropertyToLead(leadId, matchedCode.id, client);
        currentProperty = matchedCode;
        lead = (await leadService.getLeadById(leadId, client)) || lead;
      }
    }

    // AÇÃO DE REINICIALIZAR A SIMULAÇÃO
    if (action === 'reset') {
      await leadService.resetSimulation(leadId, client);
      return NextResponse.json({
        success: true,
        message: 'Simulação reiniciada com sucesso.',
        aiStatus: getAIStatus()
      });
    }

    // AÇÃO DE EXECUTAR FOLLOW-UP ELEGÍVEL MANUAMENTE NO SIMULADOR DE TEMPO
    if (action === 'execute_followup') {
      const { simulatedNow } = body;
      const simDate = simulatedNow ? new Date(simulatedNow) : new Date();
      const eligibility = evaluateFollowUpEligibility(lead, simDate);

      if (!eligibility.canSendAutomatedFollowup) {
        return NextResponse.json({
          success: false,
          isEligible: false,
          reason: eligibility.reason || 'Lead não está elegível para disparo automático de follow-up neste momento.'
        });
      }

      let followupText = '';

      if (currentProperty) {
        const typeLower = (currentProperty.propertyType || '').toLowerCase();
        let noun = 'dessa casa';
        if (typeLower.includes('apartamento')) {
          noun = 'desse apartamento';
        } else if (typeLower.includes('sobrado')) {
          noun = 'desse sobrado';
        } else if (typeLower.includes('terreno')) {
          noun = 'desse terreno';
        } else if (typeLower.includes('imóvel') || typeLower.includes('imovel')) {
          noun = 'desse imóvel';
        }

        // NUNCA incluir código interno (ex: CS-101) na mensagem enviada ao cliente (Regra DE)
        // Preserva o referente "essa casa" / "esse imóvel" (Regras DC e DD)
        // Evita encerramento genérico ("Como posso te ajudar agora?") quando há imóvel específico
        followupText = `Olá! Como combinamos, estou te chamando agora 😊 Você tinha gostado ${noun}. Quer continuar vendo os detalhes dela?`;
      } else if (lead.demand?.propertyType) {
        // Fallback para tipo/cidade SOMENTE quando NÃO houver imóvel específico (Regra DF)
        followupText = `Olá! Conforme combinamos, estou retornando o contato para darmos sequência às opções de ${lead.demand.propertyType} em ${lead.demand.city || 'Ponta Grossa'}. Quer ver as opções que selecionei para você?`;
      } else {
        followupText = `Olá! Conforme combinamos, estou retornando o contato para darmos sequência ao seu atendimento imobiliário. Como podemos continuar?`;
      }

      await addConversationMessage(
        leadId,
        'outbound',
        'ai',
        followupText,
        undefined,
        undefined,
        client
      );

      const nextCycleCount = (lead.cycleFollowupCount || 0) + 1;
      const nextTotalCount = (lead.totalFollowupCount || 0) + 1;

      await leadService.updateLead(leadId, {
        nextAction: 'aguardar_cliente',
        cycleFollowupCount: nextCycleCount,
        totalFollowupCount: nextTotalCount,
        lastFollowupAt: simDate.toISOString(),
        scheduledFollowupAt: null,
        scheduledPeriod: null
      }, client);

      const updatedHistory = await getConversationMessages(leadId, client);
      const updatedLead = (await leadService.getLeadById(leadId, client)) || lead;

      const analysis = processSDRTurn({
        lead: { id: updatedLead.id, name: updatedLead.name, status: updatedLead.status, cycleFollowupCount: nextCycleCount, totalFollowupCount: nextTotalCount },
        demand: updatedLead.demand,
        financial: updatedLead.financial,
        purchaseTimeline: updatedLead.purchaseTimeline,
        currentProperty: currentProperty || undefined,
        conversationHistory: updatedHistory,
        newMessage: '',
        simulatedNow: simDate
      });

      return NextResponse.json({
        success: true,
        isEligible: true,
        followupText,
        messages: updatedHistory,
        analysis,
        updatedLead
      });
    }

    if (!newMessage || typeof newMessage !== 'string' || !newMessage.trim()) {
      return NextResponse.json(
        { success: false, error: 'newMessage é obrigatória.' },
        { status: 400 }
      );
    }

    const cleanedMessage = newMessage.trim();

    // PERSISTIR MENSAGEM DO LEAD (INBOUND)
    await addConversationMessage(
      leadId,
      'inbound',
      'lead',
      cleanedMessage,
      undefined,
      undefined,
      client
    );

    const history = await getConversationMessages(leadId, client);

    // PROCESSAR MOTOR SDR DETERMINÍSTICO COM CONTEXTO DO IMÓVEL ATUAL
    const analysis = processSDRTurn({
      lead: { id: lead.id, name: lead.name, status: lead.status },
      demand: lead.demand,
      financial: lead.financial,
      purchaseTimeline: lead.purchaseTimeline,
      currentProperty: currentProperty || undefined,
      conversationHistory: history,
      newMessage: cleanedMessage,
      simulatedReceivedDocs,
      is30MinFollowupTrigger
    });

    // Injeta adProperties e currentProperty no objeto analysis para consumo visual do frontend
    analysis.adProperties = adProperties;
    analysis.currentProperty = currentProperty || undefined;

    // 5. ATUALIZAR BANCO DE DADOS SUPABASE (SE CONFIGURADO)
    if (isSupabaseConfigured() && db) {
      // Atualiza Demanda
      await db.from('property_demands').upsert({
        lead_id: leadId,
        purpose: analysis.updatedDemand.purpose,
        property_type: analysis.updatedDemand.propertyType,
        max_price: analysis.updatedDemand.maxPrice,
        bedrooms: analysis.updatedDemand.bedrooms,
        needs_suite: analysis.updatedDemand.needsSuite,
        parking_spaces: analysis.updatedDemand.parkingSpaces,
        city: analysis.updatedDemand.city,
        regions: analysis.updatedDemand.regions
      }, { onConflict: 'lead_id' });

      // Atualiza Qualificação Financeira & Fluxo de Crédito Real
      await db.from('financial_qualifications').upsert({
        lead_id: leadId,
        purchase_form: analysis.updatedFinancial.purchaseForm,
        has_down_payment: analysis.updatedFinancial.hasDownPayment,
        down_payment_amount: analysis.updatedFinancial.downPaymentAmount,
        has_fgts: analysis.updatedFinancial.hasFGTS,
        fgts_amount: analysis.updatedFinancial.fgtsAmount,
        has_vehicle_or_asset: analysis.updatedFinancial.hasVehicleOrAsset,
        credit_status: analysis.updatedFinancial.creditStatus,
        approved_amount: analysis.updatedFinancial.approvedAmount,
        has_simulated: analysis.updatedFinancial.hasSimulated,
        analysis_stage: analysis.updatedFinancial.analysisStage,
        id_doc_type: analysis.updatedFinancial.idDocType,
        doc_checklist: analysis.updatedFinancial.docChecklist,
        simple_sim_data: analysis.updatedFinancial.simpleSimData,
        doc_requested_at: analysis.updatedFinancial.docRequestedAt,
        last_client_response_at: analysis.updatedFinancial.lastClientResponseAt,
        client_will_send_later: analysis.updatedFinancial.clientWillSendLater,
        followup_30m_sent: analysis.updatedFinancial.followup30mSent
      }, { onConflict: 'lead_id' });

      // Atualiza Classificação, Status, Next Action e Agendamento Temporal do Lead
      const leadUpdates: Partial<Lead> = {
        classification: analysis.suggestedClassification,
        status: analysis.suggestedStatus,
        purchaseTimeline: analysis.updatedTimeline,
        nextAction: analysis.suggestedNextAction || 'aguardar_cliente'
      };

      if (analysis.updatedScheduledFollowupAt !== undefined) {
        leadUpdates.scheduledFollowupAt = analysis.updatedScheduledFollowupAt;
      }
      if (analysis.updatedScheduledPeriod !== undefined) {
        leadUpdates.scheduledPeriod = analysis.updatedScheduledPeriod;
      }

      await leadService.updateLead(leadId, leadUpdates, client);

      // Se o cliente aceitou a análise de crédito (Pretende analisar), registra o handoff comercial no Supabase sem duplicar
      if (analysis.updatedFinancial.creditStatus === 'Pretende analisar') {
        await db.from('leads').update({
          next_action: 'Realizar análise de crédito com o cliente'
        }).eq('id', leadId);

        const { data: existingTasks } = await db.from('tasks')
          .select('id')
          .eq('lead_id', leadId)
          .eq('type', 'Verificar financiamento')
          .eq('status', 'Pendente');

        if (!existingTasks || existingTasks.length === 0) {
          await db.from('tasks').insert({
            lead_id: leadId,
            lead_name: lead.name,
            type: 'Verificar financiamento',
            date: new Date().toISOString().split('T')[0],
            time: '10:00',
            description: `Realizar análise de crédito bancário para o cliente ${lead.name}`,
            status: 'Pendente',
            priority: 'Alta'
          });

          await db.from('activities').insert({
            lead_id: leadId,
            author: 'Sistema SDR',
            action: 'Cliente aceitou auxílio para análise de crédito. Handoff criado para Gustavo Carneiro.',
            type: 'financial_update'
          });
        }
      }

      // Se o cliente manifestou interesse ou informou preferência de visita, registra a solicitação sem inventar horário fixo
      if (analysis.nextPriorityField === 'coletar_preferencia_visita' || analysis.nextPriorityField === 'confirmar_solicitacao_visita' || analysis.visitPreference) {
        const propCode = currentProperty ? currentProperty.propertyCode : '';
        const prefText = analysis.visitPreference ? ` (Preferência: ${analysis.visitPreference})` : '';

        await db.from('leads').update({
          next_action: `Agendar visita ao imóvel ${propCode}${prefText}`.trim()
        }).eq('id', leadId);

        const { data: existingVisitTasks } = await db.from('tasks')
          .select('id')
          .eq('lead_id', leadId)
          .eq('type', 'Agendar visita')
          .eq('status', 'Pendente');

        if (!existingVisitTasks || existingVisitTasks.length === 0) {
          await db.from('tasks').insert({
            lead_id: leadId,
            lead_name: lead.name,
            type: 'Agendar visita',
            date: new Date().toISOString().split('T')[0],
            time: '10:00',
            description: `Agendar visita ao imóvel ${propCode} para o cliente ${lead.name}${prefText}`,
            status: 'Pendente',
            priority: 'Alta'
          });

          await db.from('activities').insert({
            lead_id: leadId,
            author: 'Sistema SDR',
            action: `Solicitação de visita registrada para o imóvel ${propCode}${prefText}. Aguardando confirmação do Gustavo.`,
            type: 'interaction'
          });
        }
      }
    }

    // 6. SOLICITAR RESPOSTA DA IA REAL OU EXECUTAR FALLBACK OFFLINE
    const aiStatus = getAIStatus();
    let aiReplyText: string | null = null;
    let responseMode: 'openai' | 'fallback_offline' = 'fallback_offline';

    if (aiStatus.isConfigured) {
      const aiResult = await generateSDRReply({
        leadName: lead.name,
        demand: analysis.updatedDemand,
        financial: analysis.updatedFinancial,
        purchaseTimeline: analysis.updatedTimeline,
        classification: analysis.suggestedClassification,
        status: analysis.suggestedStatus,
        missingFields: analysis.missingFields.map((m) => m.description),
        nextPriorityField: analysis.nextPriorityField,
        nextQuestionFocus: analysis.nextQuestionFocus,
        commercialObjective: analysis.commercialObjective,
        conversationHistory: history.slice(-6).map((m) => ({
          senderType: m.senderType,
          content: m.content
        })),
        newMessage: cleanedMessage
      });

      if (aiResult.isConfigured && aiResult.response) {
        aiReplyText = aiResult.response.reply;
        responseMode = 'openai';
      }
    }

    // Se a IA não estiver configurada ou a API falhar, utiliza o modelo determinístico de fallback offline
    if (!aiReplyText) {
      aiReplyText = generateOfflineFallbackReply(
        analysis.nextPriorityField,
        analysis.updatedDemand,
        analysis.updatedFinancial
      );
      responseMode = 'fallback_offline';
    }

    // Persiste a mensagem de saída (outbound) no Supabase
    await addConversationMessage(
      leadId,
      'outbound',
      'ai',
      aiReplyText,
      undefined,
      undefined,
      client
    );

    // 7. BUSCAR HISTÓRICO ATUALIZADO DE MENSAGENS E LEAD ATUALIZADO PARA O FRONTEND
    const updatedMessages = await getConversationMessages(leadId, client);
    const finalLead = (await leadService.getLeadById(leadId, client)) || lead;

    return NextResponse.json({
      success: true,
      aiStatus,
      aiReply: aiReplyText,
      responseMode,
      commercialObjective: analysis.commercialObjective,
      nextPriorityField: analysis.nextPriorityField,
      analysis,
      messages: updatedMessages,
      lead: finalLead
    });

  } catch (error: any) {
    console.error('Erro no simulador SDR:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}

