import {
  SDREngineInput,
  SDRMessageAnalysis,
  SDRMissingField,
  ExtractedDemand,
  ExtractedFinancial,
  PendingPropertyIntent
} from './types';
import { extractDemandFromText, extractFinancialFromText, extractVisitPreference } from './extractor';
import { classifyLead } from './classifier';
import {
  PropertyDemand,
  FinancialQualification,
  PurchaseTimeline,
  LeadStatus,
  ConversationMessage,
  DocChecklist,
  Lead,
  SDRNextAction,
  ScheduledPeriod,
  FollowUpTask
} from '@/types';

/**
 * Verifica se o handoff da análise de crédito já foi confirmado/comunicado ao cliente no histórico.
 */
export function hasHandoffBeenConfirmedToClient(history: ConversationMessage[] = []): boolean {
  if (!history || history.length === 0) return false;

  const reversed = [...history].reverse();
  const confirmationMsg = reversed.find(
    (m) =>
      (m.direction === 'outbound' || m.senderType === 'ai' || m.senderType === 'human') &&
      /(gustavo|encaminh|análise de crédito|analise de credito|dar andamento|entrará em contato|entrara em contato)/i.test(
        m.content
      )
  );

  return Boolean(confirmationMsg);
}

/**
 * Detecta a aceitação do cliente para realizar visita presencial ao imóvel.
 */
export function detectVisitAcceptance(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return /(posso visitar|quero visitar|agendar visita|ver a casa|conhecer a casa|marcar visita|visitar|sim, quero|quero sim|pode ser|vamos agendar|gostaria de visitar|com certeza)/i.test(
    lower
  );
}

/**
 * Detecta a intenção de dúvida sobre o imóvel contida no texto do lead.
 */
export function detectPropertyIntent(text: string): PendingPropertyIntent | undefined {
  if (!text) return undefined;
  const lower = text.toLowerCase();

  if (/(qual o valor|qual o preco|qual o preço|quanto custa|valor|preço|preco)/i.test(lower)) {
    return 'price';
  }
  if (/(onde fica|qual a localização|qual a localizacao|onde é|onde e|qual bairro|quais bairros|quais os bairros|bairros|em que bairro|localização|localizacao)/i.test(lower)) {
    return 'location';
  }
  if (/(quantos quartos|quantos dormitórios|quantos dormitorios|tem quantos quartos|tem quartos|quantos qts)/i.test(lower)) {
    return 'bedrooms';
  }
  if (/(tem garagem|quantas vagas|quantas garagens|tem vaga|vaga de garagem)/i.test(lower)) {
    return 'parking';
  }
  if (/(posso visitar|quero visitar|agendar visita|ver a casa|conhecer a casa|marcar visita|visitar)/i.test(lower)) {
    return 'visit';
  }
  return undefined;
}

/**
 * Recupera a intenção de pergunta sobre imóvel pendente a partir do histórico de conversa.
 */
export function getPendingPropertyIntentFromHistory(
  newMessage: string,
  history: ConversationMessage[] = []
): PendingPropertyIntent | undefined {
  const currentIntent = detectPropertyIntent(newMessage);
  if (currentIntent) return currentIntent;

  if (!history || history.length === 0) return undefined;

  const reversed = [...history].reverse();
  const lastAIIndex = reversed.findIndex(
    (m) => m.direction === 'outbound' || m.senderType === 'ai' || m.senderType === 'human'
  );

  if (lastAIIndex !== -1) {
    const lastAIMsg = reversed[lastAIIndex];
    const isAISolicitingPropertySelection =
      /(qual dessas opções|qual desses imóveis|selecione|anúncio|anuncio|qual imóvel|qual imovel)/i.test(
        lastAIMsg.content
      );

    if (isAISolicitingPropertySelection) {
      const leadMsgBeforeAI = reversed
        .slice(lastAIIndex + 1)
        .find((m) => m.direction === 'inbound' || m.senderType === 'lead');
      if (leadMsgBeforeAI) {
        return detectPropertyIntent(leadMsgBeforeAI.content);
      }
    }
  }

  return undefined;
}

// Valores padrão para demandas de imóveis quando vazias
const DEFAULT_DEMAND: PropertyDemand = {
  purpose: 'Moradia',
  propertyType: '',
  city: 'Ponta Grossa',
  regions: [],
  bedrooms: 0,
  needsSuite: false,
  parkingSpaces: 0,
  minPrice: 0,
  maxPrice: 0,
  keyFeatures: []
};

// Valores padrão para qualificação financeira quando vazias
const DEFAULT_FINANCIAL: FinancialQualification = {
  purchaseForm: 'Ainda não sabe',
  hasDownPayment: false,
  downPaymentAmount: 0,
  intendsToIncreaseDownPayment: false,
  hasFGTS: false,
  intendsToUseFGTS: false,
  fgtsAmount: 0,
  fgtsStatus: 'Não informado',
  hasVehicleOrAsset: false,
  assetAmount: 0,
  hasSimulated: false,
  hasCreditAnalysis: false,
  creditStatus: 'Não informado',
  approvedAmount: 0,
  analysisStage: 'nao_oferecido',
  idDocType: null,
  docChecklist: {
    id_doc: false,
    cpf: false,
    residence_proof: false,
    paystub: false,
    work_card: false,
    civil_cert: false
  },
  simpleSimData: {
    paystub_recent: false,
    birth_date: null,
    has_dependents: null,
    work_years_over_3: null
  },
  docRequestedAt: null,
  lastClientResponseAt: null,
  clientWillSendLater: false,
  followup30mSent: false
};

/**
 * Motor centralizado do SDR Imobiliário.
 * Recebe o estado atual do lead e a nova mensagem recebida,
 * extrai informações sem apagar o que já existia, identifica campos pendentes,
 * define a classificação de temperatura e o foco da próxima interação.
 */
export function processSDRTurn(input: SDREngineInput): SDRMessageAnalysis {
  const currentDemand: PropertyDemand = {
    ...DEFAULT_DEMAND,
    ...(input.demand || {})
  };

  const currentFinancial: FinancialQualification = {
    ...DEFAULT_FINANCIAL,
    ...(input.financial || {}),
    docChecklist: {
      ...DEFAULT_FINANCIAL.docChecklist!,
      ...((input.financial && input.financial.docChecklist) || {})
    },
    simpleSimData: {
      ...DEFAULT_FINANCIAL.simpleSimData!,
      ...((input.financial && input.financial.simpleSimData) || {})
    }
  };

  let currentTimeline: PurchaseTimeline = input.purchaseTimeline || 'Não informado';
  const currentStatus: LeadStatus = input.lead.status || 'Qualificando';

  // 1. Extração de informações na nova mensagem com contexto do histórico
  const extDemand: ExtractedDemand = extractDemandFromText(input.newMessage);
  const extFinancial: ExtractedFinancial = extractFinancialFromText(
    input.newMessage,
    input.conversationHistory || []
  );

  const newFieldsIdentified: string[] = [];

  // 2. Mesclagem incremental para a Demanda do Imóvel
  const updatedDemand: PropertyDemand = { ...currentDemand };

  if (extDemand.propertyType && extDemand.propertyType !== currentDemand.propertyType) {
    const isIncidentalTerrenoOverwriting =
      currentDemand.propertyType &&
      currentDemand.propertyType !== 'Terreno' &&
      extDemand.propertyType === 'Terreno' &&
      !/(procuro|quero|comprar|pode ser|buscando|procurando)\s+(um\s+)?(terreno|lote)\b/i.test(input.newMessage);

    if (!isIncidentalTerrenoOverwriting) {
      updatedDemand.propertyType = extDemand.propertyType;
      newFieldsIdentified.push('tipo_imovel');
    }
  }
  if (extDemand.keyFeatures && extDemand.keyFeatures.length > 0) {
    const combinedFeatures = Array.from(new Set([...(currentDemand.keyFeatures || []), ...extDemand.keyFeatures]));
    updatedDemand.keyFeatures = combinedFeatures;
  }
  if (extDemand.purpose && extDemand.purpose !== currentDemand.purpose) {
    updatedDemand.purpose = extDemand.purpose;
    newFieldsIdentified.push('finalidade');
  }
  if (extDemand.city && extDemand.city !== currentDemand.city) {
    updatedDemand.city = extDemand.city;
    newFieldsIdentified.push('cidade');
  }
  if (extDemand.bedrooms && extDemand.bedrooms !== currentDemand.bedrooms) {
    updatedDemand.bedrooms = extDemand.bedrooms;
    newFieldsIdentified.push('quartos');
  }
  if (extDemand.needsSuite !== undefined && extDemand.needsSuite !== currentDemand.needsSuite) {
    updatedDemand.needsSuite = extDemand.needsSuite;
    newFieldsIdentified.push('suite');
  }
  if (extDemand.parkingSpaces && extDemand.parkingSpaces !== currentDemand.parkingSpaces) {
    updatedDemand.parkingSpaces = extDemand.parkingSpaces;
    newFieldsIdentified.push('vagas_garagem');
  }
  if (extDemand.maxPrice && extDemand.maxPrice !== currentDemand.maxPrice) {
    updatedDemand.maxPrice = extDemand.maxPrice;
    newFieldsIdentified.push('valor_maximo');
  }
  if (extDemand.regions && extDemand.regions.length > 0) {
    const combined = Array.from(new Set([...(currentDemand.regions || []), ...extDemand.regions]));
    updatedDemand.regions = combined;
    newFieldsIdentified.push('regioes_bairros');
  }

  // 3. Mesclagem incremental para a Qualificação Financeira & Fluxo de Análise
  const updatedFinancial: FinancialQualification = {
    ...currentFinancial,
    docChecklist: { ...currentFinancial.docChecklist! },
    simpleSimData: { ...currentFinancial.simpleSimData! }
  };

  const nowIso = new Date().toISOString();

  if (extFinancial.purchaseForm && extFinancial.purchaseForm !== currentFinancial.purchaseForm) {
    updatedFinancial.purchaseForm = extFinancial.purchaseForm;
    newFieldsIdentified.push('forma_pagamento');
  }
  if (extFinancial.hasDownPayment !== undefined) {
    updatedFinancial.hasDownPayment = extFinancial.hasDownPayment;
  }
  if (extFinancial.downPaymentAmount && extFinancial.downPaymentAmount !== currentFinancial.downPaymentAmount) {
    updatedFinancial.downPaymentAmount = extFinancial.downPaymentAmount;
    updatedFinancial.hasDownPayment = true;
    newFieldsIdentified.push('valor_entrada');
  }
  if (extFinancial.hasFGTS !== undefined) {
    updatedFinancial.hasFGTS = extFinancial.hasFGTS;
    updatedFinancial.intendsToUseFGTS = extFinancial.intendsToUseFGTS || false;
    newFieldsIdentified.push('uso_fgts');
  }
  if (extFinancial.fgtsAmount) {
    updatedFinancial.fgtsAmount = extFinancial.fgtsAmount;
    newFieldsIdentified.push('valor_fgts');
  }
  if (extFinancial.hasVehicleOrAsset !== undefined) {
    updatedFinancial.hasVehicleOrAsset = extFinancial.hasVehicleOrAsset;
    if (extFinancial.assetDescription) {
      updatedFinancial.assetDescription = extFinancial.assetDescription;
    }
    newFieldsIdentified.push('veiculo_bem_troca');
  }
  if (extFinancial.hasSimulated !== undefined) {
    updatedFinancial.hasSimulated = extFinancial.hasSimulated;
    newFieldsIdentified.push('simulacao_bancaria');
  }
  if (extFinancial.hasCreditAnalysis !== undefined) {
    updatedFinancial.hasCreditAnalysis = extFinancial.hasCreditAnalysis;
  }
  if (extFinancial.creditStatus && extFinancial.creditStatus !== currentFinancial.creditStatus) {
    const isExplicitRefusal = /(não quero|nao quero|prefiro não|prefiro nao|cancela|sem análise|sem analise|não tenho interesse|nao tenho interesse)/i.test(input.newMessage);
    if (currentFinancial.creditStatus === 'Pretende analisar' && extFinancial.creditStatus === 'Não analisado' && !isExplicitRefusal) {
      updatedFinancial.creditStatus = 'Pretende analisar';
    } else {
      updatedFinancial.creditStatus = extFinancial.creditStatus;
      newFieldsIdentified.push('status_credito');
    }
  }
  if (extFinancial.approvedAmount && extFinancial.approvedAmount !== currentFinancial.approvedAmount) {
    updatedFinancial.approvedAmount = extFinancial.approvedAmount;
    newFieldsIdentified.push('valor_aprovado');
  }
  if (extFinancial.bankInstitution && extFinancial.bankInstitution !== currentFinancial.bankInstitution) {
    updatedFinancial.bankInstitution = extFinancial.bankInstitution;
    newFieldsIdentified.push('instituicao_bancaria');
  }

  // REGRA 7: PROCESSAMENTO CONTROLADO DE RECEBIMENTO DE DOCUMENTOS (SIMULADOR / MÍDIA FUTURA CLOUD API)
  if (input.simulatedReceivedDocs && input.simulatedReceivedDocs.length > 0) {
    for (const docKey of input.simulatedReceivedDocs) {
      if (docKey === 'rg') {
        updatedFinancial.docChecklist!.id_doc = true;
        updatedFinancial.idDocType = 'RG';
      } else if (docKey === 'cnh') {
        updatedFinancial.docChecklist!.id_doc = true;
        updatedFinancial.idDocType = 'CNH';
      } else if (docKey === 'id_doc') {
        updatedFinancial.docChecklist!.id_doc = true;
        if (!updatedFinancial.idDocType) updatedFinancial.idDocType = 'RG';
      } else if (docKey === 'cpf') {
        updatedFinancial.docChecklist!.cpf = true;
      } else if (docKey === 'residence_proof') {
        updatedFinancial.docChecklist!.residence_proof = true;
      } else if (docKey === 'paystub') {
        updatedFinancial.docChecklist!.paystub = true;
        updatedFinancial.simpleSimData!.paystub_recent = true;
      } else if (docKey === 'work_card') {
        updatedFinancial.docChecklist!.work_card = true;
      } else if (docKey === 'civil_cert') {
        updatedFinancial.docChecklist!.civil_cert = true;
      } else if (docKey === 'paystub_recent') {
        updatedFinancial.simpleSimData!.paystub_recent = true;
      }
    }
  }

  // REGRA 3: DADOS PARA SIMULAÇÃO SIMPLES EXTRAÍDOS DE TEXTO
  if (extFinancial.extractedBirthDate) {
    updatedFinancial.simpleSimData!.birth_date = extFinancial.extractedBirthDate;
  }
  if (extFinancial.extractedHasDependents !== undefined) {
    updatedFinancial.simpleSimData!.has_dependents = extFinancial.extractedHasDependents;
  }
  if (extFinancial.extractedWorkYearsOver3 !== undefined) {
    updatedFinancial.simpleSimData!.work_years_over_3 = extFinancial.extractedWorkYearsOver3;
  }

  // Prazo / Timeline
  if (extFinancial.purchaseTimeline && extFinancial.purchaseTimeline !== currentTimeline) {
    currentTimeline = extFinancial.purchaseTimeline;
    newFieldsIdentified.push('prazo_compra');
  }

  // REGRA 4: REGISTRO DE RESPOSTA DO CLIENTE & INTENÇÃO DE ENVIAR MAIS TARDE
  if (extFinancial.isWillSendLater) {
    updatedFinancial.clientWillSendLater = true;
    updatedFinancial.lastClientResponseAt = nowIso;
  }

  // 4. Mapeamento de Informações Faltantes com Prioridades
  const missingFields: SDRMissingField[] = [];

  if (!updatedDemand.propertyType) {
    missingFields.push({
      category: 'demand',
      field: 'propertyType',
      description: 'Tipo de imóvel (casa, apartamento, sobrado, terreno)',
      priority: 1
    });
  }

  if (updatedDemand.maxPrice <= 0 && updatedFinancial.approvedAmount <= 0) {
    missingFields.push({
      category: 'demand',
      field: 'maxPrice',
      description: 'Faixa de valor ou orçamento teto pretendido',
      priority: 1
    });
  }

  if (updatedFinancial.purchaseForm === 'Ainda não sabe') {
    missingFields.push({
      category: 'financial',
      field: 'purchaseForm',
      description: 'Forma de pagamento pretendida (à vista, financiamento)',
      priority: 2
    });
  }

  if (
    (updatedFinancial.purchaseForm === 'Financiamento' ||
      updatedFinancial.purchaseForm === 'Financiamento + recursos próprios') &&
    !updatedFinancial.hasDownPayment &&
    updatedFinancial.downPaymentAmount <= 0
  ) {
    missingFields.push({
      category: 'financial',
      field: 'downPaymentAmount',
      description: 'Valor disponível para sinal/entrada',
      priority: 2
    });
  }

  if (
    (updatedFinancial.purchaseForm === 'Financiamento' ||
      updatedFinancial.purchaseForm === 'Financiamento + recursos próprios') &&
    updatedFinancial.creditStatus === 'Não informado'
  ) {
    missingFields.push({
      category: 'financial',
      field: 'creditStatus',
      description: 'Situação da simulação/análise de crédito bancário',
      priority: 3
    });
  }

  if (currentTimeline === 'Não informado') {
    missingFields.push({
      category: 'general',
      field: 'purchaseTimeline',
      description: 'Prazo ou urgência de compra',
      priority: 3
    });
  }

  if (!updatedDemand.regions || updatedDemand.regions.length === 0) {
    missingFields.push({
      category: 'demand',
      field: 'regions',
      description: 'Bairros ou regiões preferenciais',
      priority: 4
    });
  }

  if (updatedDemand.bedrooms === 0) {
    missingFields.push({
      category: 'demand',
      field: 'bedrooms',
      description: 'Quantidade de quartos',
      priority: 4
    });
  }

  // Ordena missingFields por prioridade
  missingFields.sort((a, b) => a.priority - b.priority);

  // 5. Definição da Próxima Ação Comercial Prioritária (Regra de Ouro SDR Persuasivo & Proativo)
  let nextPriorityField = '';
  let nextQuestionFocus = '';
  let commercialObjective = '';
  let outPendingIntent: PendingPropertyIntent | undefined = undefined;

  const activePendingIntent: PendingPropertyIntent | undefined =
    input.pendingPropertyIntent ||
    getPendingPropertyIntentFromHistory(input.newMessage, input.conversationHistory || []);

  const extractedVisitPref = extractVisitPreference(input.newMessage);
  const isVisitAcceptance = detectVisitAcceptance(input.newMessage);

  const isAdInquiryWithoutProperty =
    !input.currentProperty &&
    !extFinancial.isExplicitVisitRefusal &&
    !extFinancial.isDirectFullAnalysisRequest &&
    (Boolean(activePendingIntent) ||
      /(qual o valor|qual o preco|qual o preço|quanto custa|qual a casa|qual o apartamento|qual o imóvel|qual o imovel|vi o anúncio|vi o anuncio|vi no instagram|vi no facebook|sobre o anúncio|sobre o anuncio|onde fica|quantos quartos|tem garagem)/i.test(
        input.newMessage
      ));

  // AVALIAÇÃO DE CONCLUSAO DE DOCUMENTOS
  const cl = updatedFinancial.docChecklist!;
  const isCnh = updatedFinancial.idDocType === 'CNH';
  if (isCnh) {
    cl.id_doc = true;
    cl.cpf = true; // CNH satisfaz/dispensa a necessidade de CPF separado
  }
  const isIdentificationComplete = cl.id_doc && (cl.cpf || isCnh);

  const isFullChecklistComplete = isIdentificationComplete && cl.residence_proof && cl.paystub && cl.work_card && cl.civil_cert;
  const isAnyDocReceived = cl.id_doc || cl.cpf || cl.residence_proof || cl.paystub || cl.work_card || cl.civil_cert;

  const sim = updatedFinancial.simpleSimData!;
  const isSimpleSimComplete = Boolean(sim.paystub_recent && sim.birth_date && sim.has_dependents !== null && sim.has_dependents !== undefined && sim.work_years_over_3 !== null && sim.work_years_over_3 !== undefined);

  // HIERARQUIA COMERCIAL DINÂMICA
  if (extFinancial.isExplicitRefusal) {
    nextPriorityField = 'recusa_atendimento';
    nextQuestionFocus = 'Respeitar a recusa do cliente e encerrar o acompanhamento comercial sem insistência.';
    commercialObjective = 'O cliente informou que não deseja continuar a conversa. Responda de forma cortês respeitando a decisão e encerrando o acompanhamento sem insistência comercial nem novos disparos de follow-up.';
  } else if (extFinancial.scheduleIntent) {
    nextPriorityField = 'aguardar_data_solicitada';
    nextQuestionFocus = `Registrar agendamento solicitado pelo cliente (${extFinancial.scheduleIntent.rawText}).`;
    commercialObjective = `O cliente solicitou retorno especificamente para "${extFinancial.scheduleIntent.rawText}". Responda confirmando de forma simpática que o retorno será realizado no momento combinado.`;
  } else if (isAdInquiryWithoutProperty) {
    nextPriorityField = 'selecionar_imovel_anuncio';
    nextQuestionFocus = 'Apresentar imóveis ativos em anúncio para o cliente identificar qual viu.';
    commercialObjective =
      'O cliente está perguntando sobre um imóvel de anúncio que ainda não foi identificado. Apresente de forma amigável a lista de opções de imóveis em anúncio ativo para ele indicar qual viu.';
    outPendingIntent = activePendingIntent || detectPropertyIntent(input.newMessage);
  } else if (input.currentProperty && activePendingIntent) {
    outPendingIntent = undefined;

    switch (activePendingIntent) {
      case 'price':
        nextPriorityField = 'informar_preco_imovel';
        nextQuestionFocus = `Responder com o preço do imóvel ${input.currentProperty.title} (${input.currentProperty.propertyCode}).`;
        if (input.currentProperty.showPriceToCustomer && input.currentProperty.price > 0) {
          commercialObjective = `Informar com clareza o valor exato de R$ ${input.currentProperty.price.toLocaleString('pt-BR')} cadastrado para o imóvel ${input.currentProperty.title} (${input.currentProperty.propertyCode}) no bairro ${input.currentProperty.neighborhood}. NUNCA inventar outro valor.`;
        } else {
          commercialObjective = `Explicar de forma gentil que o valor do imóvel ${input.currentProperty.title} (${input.currentProperty.propertyCode}) é sob consulta direta com o corretor Gustavo Carneiro. NUNCA inventar valor.`;
        }
        break;

      case 'location':
        nextPriorityField = 'informar_localizacao_imovel';
        nextQuestionFocus = `Responder com a localização do imóvel ${input.currentProperty.title} (${input.currentProperty.propertyCode}).`;
        commercialObjective = `Informar com clareza que o imóvel ${input.currentProperty.title} (${input.currentProperty.propertyCode}) fica localizado no bairro ${input.currentProperty.neighborhood} em ${input.currentProperty.city}.`;
        break;

      case 'bedrooms':
        nextPriorityField = 'informar_quartos_imovel';
        nextQuestionFocus = `Responder com o número de quartos do imóvel ${input.currentProperty.title} (${input.currentProperty.propertyCode}).`;
        commercialObjective = `Informar com clareza que o imóvel ${input.currentProperty.title} (${input.currentProperty.propertyCode}) conta com ${input.currentProperty.bedrooms} quarto(s)${input.currentProperty.suites > 0 ? ` (sendo ${input.currentProperty.suites} suíte)` : ''}.`;
        break;

      case 'parking':
        nextPriorityField = 'informar_vagas_imovel';
        nextQuestionFocus = `Responder com o número de vagas de garagem do imóvel ${input.currentProperty.title} (${input.currentProperty.propertyCode}).`;
        commercialObjective = `Informar com clareza que o imóvel ${input.currentProperty.title} (${input.currentProperty.propertyCode}) possui ${input.currentProperty.parkingSpaces} vaga(s) de garagem.`;
        break;

      case 'visit':
        if (extractedVisitPref) {
          nextPriorityField = 'confirmar_solicitacao_visita';
          nextQuestionFocus = `Registrar preferência de visita (${extractedVisitPref}) para o corretor Gustavo confirmar.`;
          commercialObjective = `O cliente informou a preferência de horário/dia para visita (${extractedVisitPref}). Registre que a solicitação foi enviada para o corretor Gustavo Carneiro verificar a disponibilidade de agenda e confirmar com o cliente. NÃO confirme horário fixo nem invente disponibilidade.`;
        } else {
          nextPriorityField = 'coletar_preferencia_visita';
          nextQuestionFocus = `Perguntar qual dia ou período do dia costuma ser melhor para a visita presencial ao imóvel ${input.currentProperty.title} (${input.currentProperty.propertyCode}).`;
          commercialObjective = `Como o cliente selecionou o imóvel e manifestou intenção de visita, pergunte qual dia ou período do dia costuma ser melhor para ele (ex: sábado de manhã, meio da semana), sem inventar horários disponíveis ou confirmar agendamento final.`;
        }
        break;
    }
  } else if (extractedVisitPref) {
    nextPriorityField = 'confirmar_solicitacao_visita';
    nextQuestionFocus = `Registrar preferência de visita (${extractedVisitPref}) para o corretor Gustavo confirmar.`;
    commercialObjective = `O cliente informou a preferência de horário/dia para visita (${extractedVisitPref}). Registre que a solicitação foi enviada para o corretor Gustavo Carneiro verificar a disponibilidade de agenda e confirmar com o cliente. NÃO confirme horário fixo nem invente disponibilidade.`;
  } else if (isVisitAcceptance && !extFinancial.isCreditInquiry && !extFinancial.isDirectFullAnalysisRequest && (input.currentProperty || updatedDemand.propertyType)) {
    nextPriorityField = 'coletar_preferencia_visita';
    nextQuestionFocus = 'Perguntar qual dia ou período do dia costuma ser melhor para a visita presencial.';
    commercialObjective = `O cliente aceitou realizar uma visita presencial ao imóvel${input.currentProperty ? ` ${input.currentProperty.title} (${input.currentProperty.propertyCode})` : ''}. Pergunte de forma natural qual dia ou período do dia costuma ser melhor para ele (ex: sábado de manhã, meio da semana), sem inventar horários disponíveis ou confirmar agendamento final.`;
  } else if (input.currentProperty && /(qual o valor|qual o preco|qual o preço|quanto custa|valor|preço|preco)/i.test(input.newMessage)) {
    nextPriorityField = 'informar_preco_imovel';
    nextQuestionFocus = `Responder com o preço do imóvel ${input.currentProperty.title} (${input.currentProperty.propertyCode}).`;
    if (input.currentProperty.showPriceToCustomer && input.currentProperty.price > 0) {
      commercialObjective = `Informar com clareza o valor exato de R$ ${input.currentProperty.price.toLocaleString('pt-BR')} cadastrado para o imóvel ${input.currentProperty.title} (${input.currentProperty.propertyCode}) no bairro ${input.currentProperty.neighborhood}. NUNCA inventar outro valor.`;
    } else {
      commercialObjective = `Explicar de forma gentil que o valor do imóvel ${input.currentProperty.title} (${input.currentProperty.propertyCode}) é sob consulta direta com o corretor Gustavo Carneiro. NUNCA inventar valor.`;
    }
  } else if (input.currentProperty && /(onde fica|qual a localização|qual a localizacao|onde é|onde e|qual bairro|em que bairro|localização|localizacao)/i.test(input.newMessage)) {
    nextPriorityField = 'informar_localizacao_imovel';
    nextQuestionFocus = `Responder com a localização do imóvel ${input.currentProperty.title} (${input.currentProperty.propertyCode}).`;
    commercialObjective = `Informar com clareza que o imóvel ${input.currentProperty.title} (${input.currentProperty.propertyCode}) fica localizado no bairro ${input.currentProperty.neighborhood} em ${input.currentProperty.city}.`;
  } else if (input.currentProperty && /(quantos quartos|quantos dormitórios|quantos dormitorios|tem quantos quartos|tem quartos)/i.test(input.newMessage)) {
    nextPriorityField = 'informar_quartos_imovel';
    nextQuestionFocus = `Responder com o número de quartos do imóvel ${input.currentProperty.title} (${input.currentProperty.propertyCode}).`;
    commercialObjective = `Informar com clareza que o imóvel ${input.currentProperty.title} (${input.currentProperty.propertyCode}) conta com ${input.currentProperty.bedrooms} quarto(s)${input.currentProperty.suites > 0 ? ` (sendo ${input.currentProperty.suites} suíte)` : ''}.`;
  } else if (input.currentProperty && /(tem garagem|quantas vagas|quantas garagens|tem vaga|vaga de garagem)/i.test(input.newMessage)) {
    nextPriorityField = 'informar_vagas_imovel';
    nextQuestionFocus = `Responder com o número de vagas de garagem do imóvel ${input.currentProperty.title} (${input.currentProperty.propertyCode}).`;
    commercialObjective = `Informar com clareza que o imóvel ${input.currentProperty.title} (${input.currentProperty.propertyCode}) possui ${input.currentProperty.parkingSpaces} vaga(s) de garagem.`;
  } else if (input.currentProperty && /(posso visitar|quero visitar|agendar visita|ver a casa|conhecer a casa|marcar visita|visitar)/i.test(input.newMessage) && !extFinancial.isExplicitVisitRefusal) {
    nextPriorityField = 'coletar_preferencia_visita';
    nextQuestionFocus = `Perguntar qual dia ou período do dia costuma ser melhor para a visita presencial ao imóvel ${input.currentProperty.title} (${input.currentProperty.propertyCode}).`;
    commercialObjective = `O cliente manifestou intenção de visitar o imóvel ${input.currentProperty.title} (${input.currentProperty.propertyCode}). Pergunte qual dia ou período do dia costuma ser melhor para ele (ex: sábado de manhã, meio da semana), sem inventar horários disponíveis.`;
  } else if (extFinancial.isCNHQuestion) {
    // REGRA 4: PERGUNTA SE CNH SERVE COMO DOCUMENTO DE IDENTIFICAÇÃO
    nextPriorityField = 'responder_cnh_serve';
    nextQuestionFocus = 'Explicar de forma natural que a CNH serve no lugar do RG e não cobra o CPF separadamente.';
    commercialObjective = 'Confirmar de forma amigável e natural que a CNH é aceita como documento de identificação em substituição ao RG. Não cobrar RG nem CPF se a CNH for enviada.';
  } else if (extFinancial.isWillSendLater) {
    // REGRA 10: CLIENTE RESPONDEU QUE VAI ENVIAR MAIS TARDE
    updatedFinancial.analysisStage = 'aguardando_documentacao';
    updatedFinancial.clientWillSendLater = true;
    updatedFinancial.lastClientResponseAt = nowIso;
    nextPriorityField = 'aguardar_envio_documentos';
    nextQuestionFocus = 'Confirmar de forma gentil que ficaremos no aguardo dos documentos.';
    commercialObjective = 'O cliente informou que vai separar ou enviar os documentos mais tarde. Responda de forma receptiva que fica no aguardo, sem cobrar imediatamente nem disparar o follow-up de 30 minutos.';
  } else if (extFinancial.isExplicitDocResistance || updatedFinancial.analysisStage === 'resistencia_documentacao') {
    // REGRA 9 & 10: RESISTÊNCIA EXPLÍCITA A DOCUMENTOS -> OFERECER SIMULAÇÃO SIMPLES
    updatedFinancial.analysisStage = 'simulacao_simples_oferecida';
    nextPriorityField = 'oferecer_simulacao_simples';
    nextQuestionFocus = 'Apresentar a alternativa da simulação simples em tópicos verticais com quebras de linha.';
    commercialObjective = 'Como o cliente demonstrou resistência em enviar toda a documentação completa agora, ofereça de forma natural a simulação simples (1 holerite recente, data de nascimento, dependentes e mais de 3 anos de carteira assinada) em tópicos verticais com quebras de linha como um caminho inicial mais fácil.';
  } else if (extFinancial.isPrefersSimpleSim) {
    // REGRA 9: CLIENTE PREFERE A SIMULAÇÃO SIMPLES
    updatedFinancial.analysisStage = 'simulacao_simples_oferecida';
    if (isSimpleSimComplete) {
      updatedFinancial.analysisStage = 'dados_simples_prontos';
      updatedFinancial.creditStatus = 'Pretende analisar';
      nextPriorityField = 'confirmar_analise_credito';
      nextQuestionFocus = 'Confirmar recebimento dos 4 dados da simulação simples e encaminhamento para o corretor Gustavo.';
      commercialObjective = 'Confirmar o recebimento das informações da simulação simples e avisar de forma positiva que os dados foram encaminhados para o Gustavo realizar a simulação inicial no sistema bancário.';
    } else {
      updatedFinancial.analysisStage = 'aguardando_dados_simples';
      nextPriorityField = 'solicitar_dados_simples_pendentes';
      nextQuestionFocus = 'Solicitar as informações que faltam para a simulação simples em tópicos verticais.';
      commercialObjective = 'Como o cliente prefere realizar uma simulação simples em vez da análise completa, solicite diretamente as 4 informações necessárias (1 holerite recente, data de nascimento, se possui dependentes e se ultrapassa 3 anos de registro em carteira) em tópicos verticais com quebras de linha, sem apresentar justificativas bancárias não confirmadas.';
    }
  } else if (input.is30MinFollowupTrigger) {
    // REGRA 10: DISPARO DE FOLLOW-UP DE 30m POR AUSÊNCIA DE RESPOSTA
    updatedFinancial.analysisStage = 'simulacao_simples_oferecida';
    updatedFinancial.followup30mSent = true;
    nextPriorityField = 'oferecer_simulacao_simples';
    nextQuestionFocus = 'Oferecer a alternativa de simulação simples por ausência de resposta após 30 minutos em tópicos verticais.';
    commercialObjective = 'Como o cliente passou 30 minutos sem nenhuma resposta após a solicitação da documentação, ofereça de forma amigável a alternativa da simulação simples em tópicos verticais para ajudar a iniciar.';
  } else if (updatedFinancial.analysisStage === 'simulacao_simples_oferecida' || updatedFinancial.analysisStage === 'aguardando_dados_simples') {
    // REGRA 9: COLETA DE DADOS DA SIMULAÇÃO SIMPLES
    if (isSimpleSimComplete) {
      updatedFinancial.analysisStage = 'dados_simples_prontos';
      updatedFinancial.creditStatus = 'Pretende analisar';
      nextPriorityField = 'confirmar_analise_credito';
      nextQuestionFocus = 'Confirmar recebimento dos 4 dados da simulação simples e encaminhamento para o corretor Gustavo.';
      commercialObjective = 'Confirmar o recebimento das informações da simulação simples e avisar de forma positiva que os dados foram encaminhados para o Gustavo realizar a simulação inicial no sistema bancário.';
    } else {
      updatedFinancial.analysisStage = 'aguardando_dados_simples';
      nextPriorityField = 'solicitar_dados_simples_pendentes';
      nextQuestionFocus = 'Solicitar as informações que faltam para a simulação simples em tópicos verticais com quebras de linha.';
      commercialObjective = 'Solicitar de forma direta e gentil em tópicos verticais com quebras de linha as informações pendentes para a simulação simples (1 holerite recente, data de nascimento, se possui dependentes e se ultrapassa 3 anos de registro em carteira). Não apresentar justificativas bancárias não confirmadas.';
    }
  } else if (isFullChecklistComplete) {
    // ANÁLISE COMPLETA CONCLUÍDA
    updatedFinancial.analysisStage = 'documentacao_pronta';
    updatedFinancial.creditStatus = 'Pretende analisar';
    nextPriorityField = 'confirmar_analise_credito';
    nextQuestionFocus = 'Confirmar recebimento de toda a documentação completa e encaminhamento para o Gustavo.';
    commercialObjective = 'Confirmar de forma alegre que toda a documentação completa foi recebida e encaminhada para o corretor Gustavo Carneiro dar entrada na análise de crédito bancária!';
  } else if (isAnyDocReceived || updatedFinancial.analysisStage === 'documentacao_parcial') {
    // DOCUMENTAÇÃO PARCIAL
    updatedFinancial.analysisStage = 'documentacao_parcial';
    nextPriorityField = 'solicitar_documentos_restantes';
    nextQuestionFocus = 'Confirmar recebimento dos documentos enviados e informar os itens que faltam no checklist em tópicos verticais com quebras de linha.';
    commercialObjective = 'Agradecer os documentos já enviados e informar de forma organizada em tópicos verticais com quebras de linha quais itens da lista ainda faltam enviar (ex: comprovante de residência, certidão civil, etc.). NUNCA fazer perguntas genéricas por comprovantes.';
  } else if (extFinancial.isDirectFullAnalysisRequest) {
    // PEDIDO DIRETO DE ANÁLISE COMPLETA (REGRA 3)
    updatedFinancial.analysisStage = 'analise_completa_solicitada';
    updatedFinancial.docRequestedAt = updatedFinancial.docRequestedAt || nowIso;
    updatedFinancial.creditStatus = 'Pretende analisar';
    nextPriorityField = 'solicitar_documentacao_completa';
    nextQuestionFocus = 'Apresentar a lista dos 5 tópicos de documentos necessários para a análise de crédito completa em tópicos verticais com quebras de linha.';
    commercialObjective = 'Como o cliente solicitou a realização da análise de crédito, apresente de forma amigável no WhatsApp a lista dos documentos necessários em tópicos verticais com quebras de linha (• RG + CPF ou CNH, • Comprovante de residência atualizado, • Holerite atualizado, • Carteira de Trabalho, • Certidão civil). NUNCA oferecer visita nem fazer perguntas genéricas por comprovantes.';
  } else if (
    updatedFinancial.analysisStage === 'analise_completa_solicitada' &&
    !extFinancial.isPrefersSimpleSim &&
    !extFinancial.isExplicitDocResistance &&
    !extFinancial.isWillSendLater
  ) {
    // MANTER FLUXO DE ANÁLISE COMPLETA APÓS OFERTA OU RESPOSTA CONTEXTUAL (REGRAS 3, 5, 8, 12)
    updatedFinancial.docRequestedAt = updatedFinancial.docRequestedAt || nowIso;
    updatedFinancial.creditStatus = 'Pretende analisar';
    nextPriorityField = 'solicitar_documentacao_completa';
    nextQuestionFocus = 'Apresentar a lista dos documentos necessários para a análise de crédito completa em tópicos verticais com quebras de linha.';
    commercialObjective = 'Apresentar no WhatsApp a lista dos documentos necessários para a análise em tópicos verticais com quebras de linha (• RG + CPF ou CNH, • Comprovante de residência atualizado, • Holerite atualizado de preferência dos últimos 2 meses, • Carteira de Trabalho, • Certidão de nascimento ou casamento). NUNCA fazer perguntas genéricas como "você tem algum documento que ajude?" nem oferecer visita.';
  } else if (extFinancial.isCreditInquiry) {
    // CAMINHO PREFERENCIAL: OFERECER ANÁLISE COMPLETA PRIMEIRO (REGRA 2)
    updatedFinancial.analysisStage = 'analise_completa_solicitada';
    updatedFinancial.docRequestedAt = nowIso;
    updatedFinancial.creditStatus = 'Pretende analisar';
    nextPriorityField = 'oferecer_analise_completa';
    nextQuestionFocus = 'Explicar que a análise de crédito é o caminho mais indicado e preciso para descobrir o valor de financiamento e condições de entrada, e oferecer a lista de documentos.';
    commercialObjective = 'Explicar de forma natural e amigável no WhatsApp que o caminho mais indicado e preciso para descobrir quanto consegue financiar e a entrada necessária é realizar uma análise de crédito bancário. Oferecer apresentar a lista dos documentos necessários para darmos andamento, sem inventar percentuais/valores mínimos de entrada nem exigir orçamento máximo antes desse fluxo.';
  } else {
    const isFinancingNeeded =
      updatedFinancial.purchaseForm === 'Financiamento' ||
      updatedFinancial.purchaseForm === 'Financiamento + recursos próprios';

    const handoffAlreadyConfirmed = hasHandoffBeenConfirmedToClient(input.conversationHistory || []);

    if (
      (updatedDemand.propertyType || input.currentProperty) &&
      (updatedFinancial.creditStatus === 'Aprovado' ||
        updatedFinancial.creditStatus === 'Pré-aprovado' ||
        updatedFinancial.creditStatus === 'Pretende analisar' ||
        updatedFinancial.purchaseForm === 'À vista' ||
        updatedFinancial.downPaymentAmount > 0)
    ) {
      nextPriorityField = 'oferecer_visita';
      nextQuestionFocus = 'Propor agendamento de visita presencial ao imóvel.';
      if (input.currentProperty) {
        commercialObjective = `Como existe o imóvel ${input.currentProperty.title} (${input.currentProperty.propertyCode}) no bairro ${input.currentProperty.neighborhood}, proponha de forma natural ver um horário para o cliente conhecer o imóvel pessoalmente com o Gustavo, sem inventar disponibilidade ou horários fixos. ${handoffAlreadyConfirmed ? 'NÃO repetir mensagens de encaminhamento da análise de crédito.' : ''}`;
      } else {
        commercialObjective = `Propor de forma natural a possibilidade de agendar uma visita presencial para conhecer imóveis compatíveis com o corretor Gustavo Carneiro. ${handoffAlreadyConfirmed ? 'NÃO repetir mensagens de encaminhamento da análise de crédito.' : ''}`;
      }
    } else if (isFinancingNeeded && updatedFinancial.creditStatus === 'Não analisado') {
      nextPriorityField = 'oferecer_analise_credito';
      nextQuestionFocus = 'Auxiliar com análise de crédito bancário sem compromisso.';
      commercialObjective =
        'Como o cliente necessita de financiamento e ainda não tem análise de crédito, explique de forma simples que a análise prévia ajuda a descobrir o valor real liberado pelos bancos para não perder tempo com imóveis fora da realidade. Pergunto se ele quer que a gente veja isso para ele.';
    } else if (isFinancingNeeded && updatedFinancial.creditStatus === 'Pretende analisar' && !handoffAlreadyConfirmed && updatedFinancial.analysisStage === 'nao_oferecido') {
      updatedFinancial.analysisStage = 'analise_completa_solicitada';
      updatedFinancial.docRequestedAt = nowIso;
      nextPriorityField = 'solicitar_documentacao_completa';
      nextQuestionFocus = 'Apresentar a lista dos 6 documentos necessários para a análise de crédito.';
      commercialObjective =
        'Como o cliente aceitou o auxílio para a análise de crédito, apresente de forma amigável a lista dos 6 documentos necessários (RG ou CNH, CPF, comprovante de residência atualizado, holerite recente dos últimos 2 meses, Carteira de Trabalho e certidão civil) para darmos andamento.';
    } else {
      const topMissing = missingFields[0];
      nextPriorityField = topMissing ? topMissing.field : 'Nenhum (Qualificação completa)';
      nextQuestionFocus = topMissing
        ? topMissing.description
        : 'Qualificação completa. Propor próximo passo com o corretor.';

      if (topMissing) {
        switch (topMissing.field) {
          case 'propertyType':
            commercialObjective =
              'Entender qual tipo de imóvel (casa, apartamento, sobrado ou terreno) o cliente procura em Ponta Grossa para apresentar as opções mais adequadas.';
            break;
          case 'maxPrice':
            commercialObjective =
              'Descobrir o orçamento ou valor teto pretendido pelo cliente para direcionar opções compatíveis com a realidade financeira dele.';
            break;
          case 'purchaseForm':
            commercialObjective =
              'Entender se o cliente pretende comprar à vista ou por financiamento bancário para orientar os melhores caminhos.';
            break;
          case 'downPaymentAmount':
            commercialObjective =
              'Descobrir se o cliente possui valor disponível para entrada, auxiliando no cálculo das opções de financiamento.';
            break;
          case 'creditStatus':
            commercialObjective =
              'Saber se o cliente já realizou simulação ou análise de crédito bancário prévia.';
            break;
          case 'purchaseTimeline':
            commercialObjective =
              'Entender a previsão de mudança ou urgência de compra para organizar a busca no tempo certo do cliente.';
            break;
          case 'regions':
            commercialObjective =
              'Descobrir os bairros ou regiões de preferência em Ponta Grossa para focar nas melhores localizações.';
            break;
          case 'bedrooms':
            commercialObjective =
              'Entender a quantidade de quartos necessária para atender a família do cliente.';
            break;
          default:
            commercialObjective = `Entender ${topMissing.description.toLowerCase()} de forma natural para orientar o cliente.`;
        }
      } else {
        commercialObjective =
          'Lead totalmente qualificado! Propor o próximo passo de atendimento direto com o corretor Gustavo Carneiro.';
      }

      if (handoffAlreadyConfirmed) {
        commercialObjective += ' O encaminhamento para o Gustavo já foi informado anteriormente, continue a conversa de forma direta e natural sem repetir avisos de CRM.';
      }
    }
  }

  // Processamento de Agendamento Temporal (scheduled_followup_at e scheduled_period)
  let updatedScheduledFollowupAt: string | null | undefined = input.lead.scheduledFollowupAt || null;
  let updatedScheduledPeriod: ScheduledPeriod | null | undefined = input.lead.scheduledPeriod || null;

  if (extFinancial.scheduleIntent) {
    if (extFinancial.scheduleIntent.explicitRefusal) {
      updatedScheduledFollowupAt = null;
      updatedScheduledPeriod = null;
    } else if (extFinancial.scheduleIntent.type === 'exact') {
      const dateStr = extFinancial.scheduleIntent.date;
      const timeStr = extFinancial.scheduleIntent.time || '15:00';
      const iso = extFinancial.scheduleIntent.isoTimestamp || new Date(`${dateStr}T${timeStr}:00-03:00`).toISOString();
      updatedScheduledFollowupAt = iso;
      updatedScheduledPeriod = null; // Para horário exato, scheduled_period é NULL no banco!
    } else {
      // Vago ou Período
      if (extFinancial.scheduleIntent.date) {
        updatedScheduledFollowupAt = new Date(`${extFinancial.scheduleIntent.date}T00:00:00-03:00`).toISOString();
      }
      updatedScheduledPeriod = extFinancial.scheduleIntent.period || 'dia_inteiro';
    }
  } else if (extFinancial.isExplicitRefusal) {
    updatedScheduledFollowupAt = null;
    updatedScheduledPeriod = null;
  }

  // Determinar Ação Operacional do Lead (next_action) - Estritamente separada de nextPriorityField (campo faltante de qualificação)
  const isFinancingNeededForNextAction =
    updatedFinancial.purchaseForm === 'Financiamento' ||
    updatedFinancial.purchaseForm === 'Financiamento + recursos próprios';

  let suggestedNextAction: SDRNextAction = 'aguardar_cliente';
  if (extFinancial.isExplicitRefusal) {
    suggestedNextAction = 'sem_followup';
  } else if (extFinancial.scheduleIntent && !extFinancial.scheduleIntent.explicitRefusal) {
    suggestedNextAction = 'aguardar_data_solicitada';
  } else if (isFinancingNeededForNextAction && updatedFinancial.creditStatus === 'Pretende analisar') {
    suggestedNextAction = 'solicitar_documentacao_analise';
  } else if (nextPriorityField === 'coletar_preferencia_visita' || nextPriorityField === 'confirmar_solicitacao_visita') {
    suggestedNextAction = 'confirmar_visita';
  } else if (currentStatus === 'Aguardando corretor') {
    suggestedNextAction = 'aguardar_corretor';
  } else {
    suggestedNextAction = 'aguardar_cliente';
  }

  // 6. Classificação e Status Sugerido
  const classificationResult = classifyLead(
    updatedDemand,
    updatedFinancial,
    currentTimeline,
    currentStatus
  );

  return {
    extractedDemand: extDemand,
    extractedFinancial: extFinancial,
    newFieldsIdentified,
    updatedDemand,
    updatedFinancial,
    updatedTimeline: currentTimeline,
    missingFields,
    suggestedClassification: classificationResult.classification,
    suggestedStatus: classificationResult.suggestedStatus,
    nextPriorityField,
    nextQuestionFocus,
    commercialObjective,
    requiresHumanIntervention: classificationResult.requiresHumanIntervention,
    decisionReason: classificationResult.decisionReason,
    pendingPropertyIntent: outPendingIntent,
    visitPreference: extractedVisitPref || undefined,
    updatedScheduledFollowupAt,
    updatedScheduledPeriod,
    suggestedNextAction
  };
}

/**
 * Formata a lista de documentos pendentes em tópicos verticais com quebras de linha para o WhatsApp.
 */
export function formatMissingDocsList(cl?: DocChecklist, idDocType?: string | null): string {
  if (!cl) {
    return '• RG + CPF ou CNH\n• Comprovante de residência atualizado\n• Holerite atualizado, de preferência dos últimos 2 meses\n• Carteira de Trabalho\n• Certidão de nascimento ou casamento';
  }
  const isCnh = idDocType === 'CNH';
  const missing: string[] = [];

  if (!cl.id_doc && !cl.cpf) {
    missing.push('• RG + CPF ou CNH');
  } else if (!cl.id_doc && cl.cpf) {
    missing.push('• RG ou CNH');
  } else if (cl.id_doc && !cl.cpf && !isCnh) {
    missing.push('• CPF (ou CNH para dispensar o RG)');
  }

  if (!cl.residence_proof) missing.push('• Comprovante de residência atualizado');
  if (!cl.paystub) missing.push('• Holerite atualizado, de preferência dos últimos 2 meses');
  if (!cl.work_card) missing.push('• Carteira de Trabalho');
  if (!cl.civil_cert) missing.push('• Certidão de nascimento ou casamento');

  return missing.length > 0
    ? missing.join('\n')
    : '• RG + CPF ou CNH\n• Comprovante de residência atualizado\n• Holerite atualizado, de preferência dos últimos 2 meses\n• Carteira de Trabalho\n• Certidão de nascimento ou casamento';
}

/**
 * Gera modelo determinístico de resposta de fallback offline (sem OpenAI) em linguagem natural humanizada de WhatsApp.
 */
export function generateOfflineFallbackReply(
  nextPriorityField: string,
  demand?: Partial<PropertyDemand>,
  financial?: Partial<FinancialQualification>
): string {
  switch (nextPriorityField) {
    case 'selecionar_imovel_anuncio':
      return 'Claro! Qual dessas opções você viu no anúncio? Deixa eu te mostrar os imóveis que estamos anunciando hoje em Ponta Grossa.';
    case 'informar_preco_imovel':
      return 'Vou consultar o valor exato deste imóvel cadastrado no nosso sistema para te passar os detalhes!';
    case 'informar_localizacao_imovel':
      return 'Este imóvel fica bem localizado em Ponta Grossa! Quer saber mais detalhes dele ou agendar uma visita?';
    case 'informar_quartos_imovel':
      return 'Este imóvel possui ótimos quartos para a sua família! Gostaria de agendar uma visita para conhecer?';
    case 'informar_vagas_imovel':
      return 'Este imóvel conta com vaga de garagem. Quer agendar uma visita para conhecer de perto?';
    case 'coletar_preferencia_visita':
      return 'Que ótimo! Qual dia ou período do dia (como sábado de manhã ou meio da semana) costuma ser melhor pra você realizar a visita?';
    case 'confirmar_solicitacao_visita':
      return 'Perfeito! Anotei sua preferência e vou pedir pro Gustavo verificar a agenda e te confirmar o horário!';
    case 'solicitar_documentacao_completa':
      return `Para fazermos a análise, precisamos:\n• RG + CPF ou CNH\n• Comprovante de residência atualizado\n• Holerite atualizado, de preferência dos últimos 2 meses\n• Carteira de Trabalho\n• Certidão de nascimento ou casamento\n\nPode me enviar por aqui mesmo 👍`;
    case 'oferecer_analise_completa':
      return `O mais indicado é fazermos primeiro uma análise de crédito bancária, porque ela dá uma informação mais precisa do que você consegue financiar e das condições. Se quiser, já te passo os documentos que precisamos!`;
    case 'responder_cnh_serve':
      return 'Pode sim! A CNH serve perfeitamente no lugar do RG e já substitui a necessidade do CPF separadamente 👍';
    case 'oferecer_simulacao_simples':
      return `Se preferir uma alternativa mais simples no momento, conseguimos fazer uma simulação inicial com:\n• 1 holerite recente\n• Data de nascimento\n• Se possui dependentes\n• Se a soma dos registros em carteira ultrapassa 3 anos`;
    case 'solicitar_dados_simples_pendentes':
      return `Para essa simulação inicial, preciso apenas das informações que faltam:\n• 1 holerite recente\n• Data de nascimento\n• Se possui dependentes\n• Se a soma dos registros em carteira ultrapassa 3 anos`;
    case 'solicitar_documentos_restantes':
      return `Anotado! Recebi os documentos enviados. Para completar a lista da análise, ainda precisamos dos seguintes itens:\n${formatMissingDocsList(financial?.docChecklist, financial?.idDocType)}`;
    case 'aguardar_envio_documentos':
      return 'Combinado! Fico no aguardo quando você conseguir enviar os documentos. Se tiver qualquer dúvida sobre os imóveis enquanto isso, é só me chamar!';
    case 'oferecer_analise_credito':
      return 'Dá pra gente verificar isso pra você sem compromisso. Fazendo uma análise de crédito, conseguimos ver certinho o valor que o banco libera e procurar algo dentro da sua realidade. Quer que a gente veja isso?';
    case 'confirmar_analise_credito':
      return 'Perfeito! Vou passar as informações para o corretor Gustavo Carneiro dar andamento nessa análise pra você. Você tem algum horário de preferência para o contato?';
    case 'oferecer_visita':
      return 'Legal! Se quiser, podemos agendar uma visita pra você conhecer o imóvel pessoalmente com o Gustavo. Qual dia fica melhor pra você?';
    case 'retomar_interesse':
      return 'Olá! Passando para saber se ficou alguma dúvida sobre aquele imóvel que conversamos em Ponta Grossa. Se quiser ver fotos ou mais detalhes, estou à disposição!';
    case 'aguardar_data_solicitada':
      return 'Combinado! Conforme combinamos, estou te chamando para darmos sequência. Como posso ajudar agora?';
    case 'recusa_atendimento':
      return 'Entendido! Agradeço a atenção e, se precisar de algo no futuro, estaremos à disposição. Um ótimo dia!';
    case 'propertyType':
      return 'Olá! Que tipo de imóvel você está buscando em Ponta Grossa? Casa, apartamento, sobrado ou terreno?';
    case 'maxPrice':
      return 'E mais ou menos até que valor você pretende investir?';
    case 'purchaseForm':
      return 'Você pretende comprar à vista ou fazer financiamento bancário?';
    case 'downPaymentAmount':
      return 'Para o financiamento, você tem algum valor disponível para dar de entrada?';
    case 'creditStatus':
      return 'Você já chegou a fazer alguma simulação ou análise de crédito no banco?';
    case 'purchaseTimeline':
      return 'E você pretende se mudar em quanto tempo mais ou menos?';
    case 'regions':
      return 'Tem algum bairro ou região específica de Ponta Grossa que você prefere?';
    case 'bedrooms':
      return 'De quantos quartos você precisa no imóvel?';
    default:
      return 'Olá! Como posso te ajudar a encontrar seu imóvel ideal em Ponta Grossa hoje?';
  }
}

/**
 * Avalia elegibilidade de follow-up e próxima ação determinística para o lead.
 */
export function evaluateFollowUpEligibility(
  lead: Partial<Lead>,
  simulatedNow?: Date
): {
  nextAction: SDRNextAction;
  canSendAutomatedFollowup: boolean;
  cycleFollowupCount: number;
  reason: string;
  taskToCreate?: Partial<FollowUpTask>;
} {
  const now = simulatedNow || new Date();
  const status = lead.status || 'Novo';

  // 1. Estados terminais ou recusa explícita
  if (status === 'Convertido' || status === 'Perdido' || lead.nextAction === 'sem_followup') {
    return {
      nextAction: 'sem_followup',
      canSendAutomatedFollowup: false,
      cycleFollowupCount: lead.cycleFollowupCount || 0,
      reason: `Lead em estado terminal (${status}) ou recusa explícita. Disparo automático bloqueado.`
    };
  }

  // 2. Agendamento solicitado pelo cliente
  if (lead.scheduledFollowupAt) {
    const scheduledTime = new Date(lead.scheduledFollowupAt).getTime();
    if (now.getTime() < scheduledTime) {
      return {
        nextAction: 'aguardar_data_solicitada',
        canSendAutomatedFollowup: false,
        cycleFollowupCount: lead.cycleFollowupCount || 0,
        reason: `Aguardando data/período solicitado pelo cliente (${lead.scheduledFollowupAt}).`
      };
    } else if (lead.scheduledPeriod !== 'dia_inteiro') {
      return {
        nextAction: 'aguardar_data_solicitada',
        canSendAutomatedFollowup: true,
        cycleFollowupCount: lead.cycleFollowupCount || 0,
        reason: `Horário agendado pelo cliente atingido (${lead.scheduledFollowupAt}). Pronto para envio de follow-up.`
      };
    }
  }

  // 3. Verificação do limite por ciclo (máximo 2 tentativas automáticas no ciclo atual)
  const currentCycleCount = lead.cycleFollowupCount || 0;
  if (currentCycleCount >= 2) {
    return {
      nextAction: 'sem_followup',
      canSendAutomatedFollowup: false,
      cycleFollowupCount: currentCycleCount,
      reason: `Limite de 2 follow-ups atingido no ciclo atual (${lead.followupCycleId || 'default'}). Pausado para avaliação manual do corretor.`,
      taskToCreate: {
        type: 'Cobrar retorno',
        description: `Lead atingiu limite de 2 follow-ups no ciclo atual sem resposta. Avaliar contato manual pelo Gustavo.`,
        status: 'Pendente',
        priority: 'Média'
      }
    };
  }

  // 4. Inatividade de 24h para retomada de imóvel
  if (lead.currentPropertyId && lead.financial?.lastClientResponseAt) {
    const lastResponseTime = new Date(lead.financial.lastClientResponseAt).getTime();
    const hoursElapsed = (now.getTime() - lastResponseTime) / (1000 * 60 * 60);

    if (hoursElapsed >= 24) {
      return {
        nextAction: 'retomar_interesse',
        canSendAutomatedFollowup: true,
        cycleFollowupCount: currentCycleCount,
        reason: `Passaram-se 24 horas (${Math.round(hoursElapsed)}h) desde a última resposta sobre o imóvel.`
      };
    }
  }

  return {
    nextAction: (lead.nextAction as SDRNextAction) || 'aguardar_cliente',
    canSendAutomatedFollowup: false,
    cycleFollowupCount: currentCycleCount,
    reason: 'Dentro da janela de atendimento normal ou aguardando cliente.'
  };
}

/**
 * Auxiliar para atualizar/reiniciar o ciclo de follow-up quando há mudança de contexto comercial.
 */
export function ensureFollowUpCycle(
  currentLead: Partial<Lead>,
  newContextKey: string
): { followupCycleId: string; cycleFollowupCount: number } {
  const existingCycle = currentLead.followupCycleId || '';
  if (existingCycle.startsWith(newContextKey)) {
    return {
      followupCycleId: existingCycle,
      cycleFollowupCount: currentLead.cycleFollowupCount || 0
    };
  }
  // Novo ciclo comercial iniciado! Reset de tentativas para a nova etapa.
  return {
    followupCycleId: `${newContextKey}_${Date.now()}`,
    cycleFollowupCount: 0
  };
}

/**
 * Verifica se existem tarefas pendentes atribuídas ao corretor Gustavo com prazo estourado (>24h).
 * Retorna as tarefas com marcação de alerta interno (priority = 'Alta', isOverdue = true).
 */
export function checkOverdueBrokerTasks(
  tasks: FollowUpTask[],
  simulatedNow?: Date
): FollowUpTask[] {
  const now = simulatedNow || new Date();
  return tasks.map((task) => {
    if (task.status === 'Pendente') {
      const taskDateStr = task.dueAt || `${task.date}T${task.time}:00`;
      const taskTime = new Date(taskDateStr).getTime();
      if (!isNaN(taskTime) && (now.getTime() - taskTime) > 24 * 60 * 60 * 1000) {
        return {
          ...task,
          priority: 'Alta',
          isOverdue: true,
          isOverdueAlertSent: true
        };
      }
    }
    return task;
  });
}

