import {
  LeadClassification,
  LeadStatus,
  PropertyDemand,
  FinancialQualification,
  PurchaseTimeline
} from '@/types';

export interface SDRClassificationResult {
  classification: LeadClassification;
  suggestedStatus: LeadStatus;
  decisionReason: string;
  requiresHumanIntervention: boolean;
}

/**
 * Classifica a temperatura do lead e sugere o status operacional
 * com base em critérios objetivos e sem inferências não fundamentadas.
 */
export function classifyLead(
  demand: PropertyDemand,
  financial: FinancialQualification,
  timeline: PurchaseTimeline,
  currentStatus: LeadStatus = 'Qualificando'
): SDRClassificationResult {
  // Define rigorosamente se o perfil do imóvel está preenchido
  const isDemandDefined =
    Boolean(demand.propertyType) &&
    demand.propertyType.trim() !== '' &&
    (demand.maxPrice > 0 || (demand.regions && demand.regions.length > 0) || demand.bedrooms > 0);

  // Verificações de Prazo e Finanças
  const isShortTerm =
    timeline === 'Imediatamente' ||
    timeline === 'Até 30 dias' ||
    timeline === '1 a 3 meses';

  const isCreditApproved =
    financial.creditStatus === 'Aprovado' ||
    financial.creditStatus === 'Pré-aprovado';

  const isFinancialReady =
    isCreditApproved ||
    financial.purchaseForm === 'À vista' ||
    (financial.hasDownPayment && financial.downPaymentAmount > 0);

  const isPlanningTimeline =
    timeline === 'Apenas pesquisando' ||
    timeline === '6 a 12 meses' ||
    timeline === 'Mais de 12 meses';

  // 1. PLANEJAMENTO (Compra no futuro, sem pressa, apenas pesquisando ou timeline > 6 meses)
  if (isPlanningTimeline && !isCreditApproved) {
    return {
      classification: 'planejamento',
      suggestedStatus: currentStatus === 'Novo' ? 'Em atendimento' : currentStatus,
      decisionReason:
        'Lead em fase de pesquisa e planejamento inicial sem intenção de compra imediata.',
      requiresHumanIntervention: false
    };
  }

  // 2. QUENTE
  // Regra A: Prazo curto + Finanças Prontas + Imóvel Definido
  if (isShortTerm && isFinancialReady && isDemandDefined) {
    const isReadyForBroker = isCreditApproved || timeline === 'Imediatamente';
    return {
      classification: 'quente',
      suggestedStatus: isReadyForBroker ? 'Qualificado' : 'Qualificando',
      decisionReason:
        'Lead com alta intenção de compra no curto prazo, imóvel definido e capacidade financeira/crédito validado.',
      requiresHumanIntervention: isReadyForBroker
    };
  }

  // Regra B: Crédito Aprovado + Prazo Curto (Alta prontidão financeira/urgência, mas Imóvel ainda Pendente)
  if (isShortTerm && isCreditApproved && !isDemandDefined) {
    return {
      classification: 'quente',
      suggestedStatus: 'Qualificado',
      decisionReason:
        'Lead com alta intenção de compra no curto prazo e crédito aprovado, porém pendente de definição do perfil do imóvel pretendido.',
      requiresHumanIntervention: true
    };
  }

  // 3. MORNO
  // Existe algum parâmetro conhecido (demanda parcial, entrada ou formulário financeiro), mas faltam definições críticas ou análise financeira.
  const hasSomeDemand = Boolean(demand.propertyType) || demand.maxPrice > 0;
  const hasSomeFinancial =
    financial.hasDownPayment ||
    financial.hasSimulated ||
    financial.purchaseForm !== 'Ainda não sabe';

  if (hasSomeDemand || hasSomeFinancial || isShortTerm) {
    let reason = 'Interesse real identificado, porém faltam definições financeiras (simulação/crédito) ou alinhamento de prazo.';
    if (isShortTerm && isFinancialReady && !isDemandDefined) {
      reason = 'Interesse real e capacidade financeira identificados, porém pendente de definição do perfil do imóvel pretendido.';
    }

    return {
      classification: 'morno',
      suggestedStatus: currentStatus === 'Novo' ? 'Em atendimento' : currentStatus,
      decisionReason: reason,
      requiresHumanIntervention: false
    };
  }

  // 4. NÃO CLASSIFICADO (Informações insuficientes)
  return {
    classification: 'nao_classificado',
    suggestedStatus: currentStatus,
    decisionReason: 'Informações ainda insuficientes para classificação de temperatura do lead.',
    requiresHumanIntervention: false
  };
}
