import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin';
import { SupabaseClient } from '@supabase/supabase-js';
import { leadService } from '../leadService';
import { propertyService } from '../propertyService';
import { processSDRTurn, generateOfflineFallbackReply } from '../sdr/qualificationEngine';
import { getAIStatus, generateSDRReply } from '../ai';
import { getConversationMessages, addConversationMessage } from '../sdr/conversationService';
import { WhatsAppProvider } from './WhatsAppProvider';
import { claimWebhookJobs, completeWebhookJob, failWebhookJob } from './queueService';
import { WebhookQueueJob, META_TEMPLATE_MAP } from './types';
import { Property } from '@/types';

export interface ProcessJobsResult {
  processedCount: number;
  completedCount: number;
  failedCount: number;
  jobResults: Array<{
    jobId: string;
    status: 'completed' | 'failed' | 'dead_letter';
    reason?: string;
  }>;
}

/**
 * Worker Processor de Ingestão e Qualificação WhatsApp SDR.
 * Executa claim atômico via FOR UPDATE SKIP LOCKED / RPC e processa a fila de trabalhos duráveis.
 */
export async function processNextWhatsAppJobs(
  limit: number = 10,
  workerId: string = 'worker_node_1',
  client?: SupabaseClient | null
): Promise<ProcessJobsResult> {
  const claimedJobs = await claimWebhookJobs(workerId, limit, 300, client);

  const result: ProcessJobsResult = {
    processedCount: claimedJobs.length,
    completedCount: 0,
    failedCount: 0,
    jobResults: []
  };

  for (const job of claimedJobs) {
    const jobRes = await processSingleWhatsAppJob(job, workerId, client);
    result.jobResults.push(jobRes);

    if (jobRes.status === 'completed') result.completedCount++;
    else result.failedCount++;
  }

  return result;
}

/**
 * Processa um único Job da webhook_queue.
 */
export async function processSingleWhatsAppJob(
  job: WebhookQueueJob,
  workerId: string = 'worker_node_1',
  client?: SupabaseClient | null
): Promise<{ jobId: string; status: 'completed' | 'failed' | 'dead_letter'; reason?: string }> {
  try {
    const db = client || supabaseAdmin || supabase;

    // 1. CARREGAR MENSAGEM INBOUND DE conversation_messages
    let inboundMessage: any = null;

    if (!db || (!isSupabaseAdminConfigured() && !isSupabaseConfigured())) {
      // Fallback local
      const msgs = await getConversationMessages('', client);
      inboundMessage = msgs.find((m) => m.id === job.conversationMessageId);
    } else {
      const { data, error } = await db
        .from('conversation_messages')
        .select('*')
        .eq('id', job.conversationMessageId)
        .single();

      if (error || !data) {
        const msgs = await getConversationMessages('', client);
        inboundMessage = msgs.find((m) => m.id === job.conversationMessageId);
      } else {
        inboundMessage = {
          id: data.id,
          leadId: data.lead_id,
          direction: data.direction,
          senderType: data.sender_type,
          content: data.content,
          createdAt: data.created_at,
          externalId: data.external_id,
          metadata: data.metadata || {}
        };
      }
    }

    if (!inboundMessage) {
      await failWebhookJob(job.id, 'MESSAGE_NOT_FOUND', `Mensagem id ${job.conversationMessageId} não encontrada.`, 30, undefined, client);
      return { jobId: job.id, status: 'failed', reason: 'Inbound message not found' };
    }

    // 2. CARREGAR LEAD E CONTEXTO DE QUALIFICAÇÃO
    const lead = await leadService.getLeadById(inboundMessage.leadId, client);
    if (!lead) {
      await failWebhookJob(job.id, 'LEAD_NOT_FOUND', `Lead ${inboundMessage.leadId} não encontrado.`, 30, undefined, client);
      return { jobId: job.id, status: 'failed', reason: 'Lead not found' };
    }

    // 3. VERIFICAR SE O ATENDIMENTO POR IA ESTÁ PAUSADO (ai_paused = true)
    if (lead.aiPaused) {
      await completeWebhookJob(job.id, client);
      return { jobId: job.id, status: 'completed', reason: 'AI atendimento pausado (ai_paused = true)' };
    }

    // 4. HISTÓRICO COMPLETO DA CONVERSA E IMÓVEL DE INTERESSE
    const history = await getConversationMessages(lead.id, client);

    let currentProperty: Property | undefined = undefined;
    if (lead.currentPropertyId) {
      const prop = await propertyService.getPropertyById(lead.currentPropertyId);
      if (prop) currentProperty = prop;
    }

    // Documentos/Mídias permanecem como unclassified_media (SEM OCR / VISÃO)
    const newMessageContent = inboundMessage.content;

    // 5. PROCESSAR MENSAGEM PELO MESMO MOTOR SDR DETERMINÍSTICO (A–DF)
    const sdrTurn = processSDRTurn({
      lead,
      demand: lead.demand,
      financial: lead.financial,
      currentProperty,
      conversationHistory: history,
      newMessage: newMessageContent
    });

    // Gera a resposta conversacional do SDR (OpenAI ou Fallback Determinístico)
    const aiStatus = getAIStatus();
    let aiResponseText: string | null = null;

    if (aiStatus.isConfigured) {
      const aiResult = await generateSDRReply({
        leadName: lead.name,
        demand: sdrTurn.updatedDemand,
        financial: sdrTurn.updatedFinancial,
        purchaseTimeline: sdrTurn.updatedTimeline,
        classification: sdrTurn.suggestedClassification,
        status: sdrTurn.suggestedStatus,
        missingFields: sdrTurn.missingFields.map((m) => m.description),
        nextPriorityField: sdrTurn.nextPriorityField,
        nextQuestionFocus: sdrTurn.nextQuestionFocus,
        commercialObjective: sdrTurn.commercialObjective,
        conversationHistory: history.slice(-6).map((m) => ({
          senderType: m.senderType,
          content: m.content
        })),
        newMessage: newMessageContent
      });
      if (aiResult.isConfigured && aiResult.response) {
        aiResponseText = aiResult.response.reply;
      }
    }

    if (!aiResponseText) {
      aiResponseText = generateOfflineFallbackReply(
        sdrTurn.nextPriorityField,
        sdrTurn.updatedDemand,
        sdrTurn.updatedFinancial
      );
    }

    // 6. PERSISTIR ATUALIZAÇÕES DO LEAD
    await leadService.updateLead(
      lead.id,
      {
        classification: sdrTurn.suggestedClassification,
        status: sdrTurn.suggestedStatus,
        nextAction: sdrTurn.suggestedNextAction,
        purchaseTimeline: sdrTurn.updatedTimeline || lead.purchaseTimeline,
        currentPropertyId: sdrTurn.currentProperty?.id || lead.currentPropertyId,
        demand: sdrTurn.updatedDemand,
        financial: sdrTurn.updatedFinancial
      },
      client
    );

    // Se o cliente solicitou visita ou aceite de análise de crédito, gera a tarefa interna apropriada
    if (sdrTurn.nextPriorityField === 'coletar_preferencia_visita' || sdrTurn.nextPriorityField === 'confirmar_solicitacao_visita' || sdrTurn.visitPreference) {
      await leadService.createTask(
        {
          leadId: lead.id,
          leadName: lead.name,
          type: 'Agendar visita',
          description: `Solicitação de visita registrada para o imóvel ${currentProperty?.propertyCode || ''}. Aguardando confirmação.`,
          dueAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        },
        client
      );
    } else if (sdrTurn.updatedFinancial.creditStatus === 'Pretende analisar') {
      await leadService.createTask(
        {
          leadId: lead.id,
          leadName: lead.name,
          type: 'Verificar financiamento',
          description: `Realizar análise de crédito bancário para o cliente ${lead.name}`,
          dueAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        },
        client
      );
    }

    // 7. IDEMPOTÊNCIA OUTBOUND: CHAVE ÚNICA DO TURNO (sdr_turn_id)
    const turnLogicalId = `outbound_${inboundMessage.id}`;

    // Verificação preambular se o disparo desse turno já foi realizado
    const existingOutbound = history.find((m) => m.externalId === turnLogicalId || m.metadata?.sdrTurnId === turnLogicalId);

    if (existingOutbound && (existingOutbound.metadata?.status === 'sent' || existingOutbound.metadata?.status === 'delivered')) {
      await completeWebhookJob(job.id, client);
      return { jobId: job.id, status: 'completed', reason: 'Outbound já enviado previamente (Idempotente)' };
    }

    // Persistir registro preambular outbound em conversation_messages com status pending
    const preambularOutbound = existingOutbound || await addConversationMessage(
      lead.id,
      'outbound',
      'ai',
      aiResponseText,
      turnLogicalId,
      { status: 'pending', sdrTurnId: turnLogicalId },
      client
    );

    // 8. VERIFICAR JANELA DE 24 HORAS DO WHATSAPP
    const nowMs = Date.now();
    const isWindowActive = Boolean(
      lead.whatsappWindowExpiresAt && new Date(lead.whatsappWindowExpiresAt).getTime() > nowMs
    );

    const whatsappProvider = new WhatsAppProvider();
    const recipientPhone = lead.waId || lead.phone;

    let sendResult: any = { success: false };

    if (isWindowActive) {
      // Janela ativa -> envio de texto livre
      sendResult = await whatsappProvider.sendText({
        to: recipientPhone,
        text: aiResponseText
      });
    } else {
      // Janela expirada -> seleção determinística de template aprovado
      const selectedTemplateKey = sdrTurn.suggestedNextAction || sdrTurn.nextPriorityField || 'retomar_interesse';
      const templateConfig = META_TEMPLATE_MAP[selectedTemplateKey] || META_TEMPLATE_MAP['retomar_interesse'];

      // Verificação do requisito 8: Se não houver template configurado, cria tarefa para Gustavo e NÃO envia texto livre
      if (!templateConfig) {
        await leadService.createTask(
          {
            leadId: lead.id,
            leadName: lead.name,
            type: 'Contatar Cliente - Janela WhatsApp Expirada',
            description: `⚠️ Janela de 24h expirada e nenhum template aprovado configurado para a ação [${selectedTemplateKey}]. Mensagem pendente: "${aiResponseText}"`,
            dueAt: new Date().toISOString()
          },
          client
        );

        if (preambularOutbound) {
          preambularOutbound.metadata = { ...preambularOutbound.metadata, status: 'failed', errorCode: 'NO_TEMPLATE_CONFIGURED' };
          if (db && (isSupabaseAdminConfigured() || isSupabaseConfigured())) {
            await db.from('conversation_messages').update({
              metadata: preambularOutbound.metadata
            }).eq('id', preambularOutbound.id);
          }
        }

        await completeWebhookJob(job.id, client);
        return { jobId: job.id, status: 'completed', reason: 'Janela expirada sem template. Tarefa criada para corretor.' };
      }

      // Template configurado -> envia template
      sendResult = await whatsappProvider.sendTemplate({
        to: recipientPhone,
        templateName: templateConfig.name,
        languageCode: templateConfig.language
      });
    }

    // 9. TRATAR RESULTADO DO ENVIO DA META API
    if (sendResult.success) {
      if (preambularOutbound) {
        preambularOutbound.metadata = {
          ...preambularOutbound.metadata,
          status: 'sent',
          metaMessageId: sendResult.messageId
        };
        if (sendResult.messageId) {
          preambularOutbound.externalId = sendResult.messageId;
        }
        if (db && (isSupabaseAdminConfigured() || isSupabaseConfigured())) {
          await db.from('conversation_messages').update({
            status: 'sent',
            external_id: sendResult.messageId || turnLogicalId,
            metadata: preambularOutbound.metadata
          }).eq('id', preambularOutbound.id);
        }
      }

      await completeWebhookJob(job.id, client);
      return { jobId: job.id, status: 'completed' };
    }

    // Tratar Resultado Ambíguo / Timeout na API da Meta
    if (sendResult.errorCode === 'AMBIGUOUS_TIMEOUT') {
      if (preambularOutbound) {
        preambularOutbound.metadata = {
          ...preambularOutbound.metadata,
          status: 'failed',
          errorCode: 'AMBIGUOUS_TIMEOUT',
          errorMessage: 'Timeout na API da Meta. Envio suspenso para impedir duplicidade.'
        };
        if (db && (isSupabaseAdminConfigured() || isSupabaseConfigured())) {
          await db.from('conversation_messages').update({
            status: 'failed',
            error_code: 'AMBIGUOUS_TIMEOUT',
            error_message: 'Timeout na API da Meta. Envio suspenso para impedir duplicidade.',
            metadata: preambularOutbound.metadata
          }).eq('id', preambularOutbound.id);
        }
      }

      await leadService.createTask(
        {
          leadId: lead.id,
          leadName: lead.name,
          type: 'Alerta Envio Ambíguo WhatsApp',
          description: `🚨 Timeout ao enviar mensagem pelo WhatsApp. Verificar no Meta Business Suite se a mensagem foi entregue antes de tentar novamente.`,
          dueAt: new Date().toISOString()
        },
        client
      );

      await completeWebhookJob(job.id, client);
      return { jobId: job.id, status: 'completed', reason: 'Resultado ambíguo tratado com segurança sem retry cego' };
    }

    // Erro recuperável (ex: rate limit ou instabilidade) -> Aplica Exponential Backoff
    const backoffSeconds = Math.min(300, Math.pow(3, job.retryCount + 1) * 10);
    await failWebhookJob(
      job.id,
      sendResult.errorCode || 'META_API_ERROR',
      sendResult.errorMessage || 'Falha no envio via Meta Cloud API',
      backoffSeconds,
      lead.id,
      client
    );

    return { jobId: job.id, status: 'failed', reason: sendResult.errorMessage };

  } catch (err: any) {
    console.error(`Erro ao processar job ${job.id}:`, err);
    await failWebhookJob(job.id, 'UNHANDLED_WORKER_ERROR', err.message || 'Erro não tratado no worker', 30, undefined, client);
    return { jobId: job.id, status: 'failed', reason: err.message };
  }
}
