export type LeadClassification = 'quente' | 'morno' | 'planejamento' | 'nao_classificado';

export type LeadStatus =
  | 'Novo'
  | 'Em atendimento'
  | 'Qualificando'
  | 'Qualificado'
  | 'Aguardando cliente'
  | 'Aguardando corretor'
  | 'Visita agendada'
  | 'Negociação'
  | 'Convertido'
  | 'Perdido';

export type LeadSource =
  | 'WhatsApp'
  | 'Facebook'
  | 'Instagram'
  | 'Indicação'
  | 'Cadastro manual'
  | 'Site'
  | 'Outro'
  | 'Origem não identificada';

export type PurchaseForm =
  | 'À vista'
  | 'Financiamento'
  | 'Financiamento + recursos próprios'
  | 'Ainda não sabe';

export type CreditStatus =
  | 'Não analisado'
  | 'Pretende analisar'
  | 'Em análise'
  | 'Pré-aprovado'
  | 'Aprovado'
  | 'Não aprovado'
  | 'Não informado';

export type PurchaseTimeline =
  | 'Imediatamente'
  | 'Até 30 dias'
  | '1 a 3 meses'
  | '3 a 6 meses'
  | '6 a 12 meses'
  | 'Mais de 12 meses'
  | 'Apenas pesquisando'
  | 'Não informado';

export interface PropertyDemand {
  purpose: 'Moradia' | 'Investimento' | 'Outro';
  propertyType: string; // e.g., 'Apartamento', 'Sobrado', 'Casa em Condomínio'
  city: string; // e.g., 'Ponta Grossa'
  regions: string[]; // e.g., ['Vila Estrela', 'Jardim Carvalho', 'Oficinas']
  bedrooms: number;
  needsSuite: boolean;
  parkingSpaces: number;
  minPrice: number;
  maxPrice: number;
  keyFeatures: string[];
  propertyNotes?: string;
}

export type CreditAnalysisStage =
  | 'nao_oferecido'
  | 'analise_completa_solicitada'
  | 'aguardando_documentacao'
  | 'documentacao_parcial'
  | 'documentacao_pronta'
  | 'resistencia_documentacao'
  | 'simulacao_simples_oferecida'
  | 'aguardando_dados_simples'
  | 'dados_simples_prontos'
  | 'encaminhado_gestao';

export interface DocChecklist {
  id_doc: boolean; // RG ou CNH (CNH substitui RG)
  cpf: boolean;
  residence_proof: boolean;
  paystub: boolean; // Holerite atualizado (preferencialmente últimos 2 meses)
  work_card: boolean; // Carteira de Trabalho (CTPS)
  civil_cert: boolean; // Certidão de Nascimento ou Casamento
}

export interface SimpleSimData {
  paystub_recent: boolean; // 1 holerite de um dos últimos 2 meses
  birth_date?: string | null; // Data de nascimento
  has_dependents?: boolean | null; // Possui dependentes
  work_years_over_3?: boolean | null; // Soma registros em carteira ultrapassa 3 anos
}

export interface FinancialQualification {
  purchaseForm: PurchaseForm;
  
  // Down Payment (Entrada)
  hasDownPayment: boolean;
  downPaymentAmount: number;
  intendsToIncreaseDownPayment: boolean;
  downPaymentNotes?: string;
  
  // FGTS
  hasFGTS: boolean;
  intendsToUseFGTS: boolean;
  fgtsAmount: number;
  fgtsStatus: 'Informado' | 'Não informado';

  // Other Assets (Outros Recursos)
  hasVehicleOrAsset: boolean;
  assetDescription?: string;
  assetAmount: number;

  // Credit / Financing (Financiamento)
  hasSimulated: boolean;
  hasCreditAnalysis: boolean;
  bankInstitution?: string;
  creditStatus: CreditStatus;
  approvedAmount: number; // Set only when provided

  // Fluxo Real de Análise & Simulação de Crédito
  analysisStage?: CreditAnalysisStage;
  idDocType?: 'RG' | 'CNH' | null;
  docChecklist?: DocChecklist;
  simpleSimData?: SimpleSimData;
  docRequestedAt?: string | null;
  lastClientResponseAt?: string | null;
  clientWillSendLater?: boolean;
  followup30mSent?: boolean;
}

export interface LeadActivity {
  id: string;
  timestamp: string;
  author: string;
  action: string;
  type: 'creation' | 'status_change' | 'classification_change' | 'financial_update' | 'note' | 'task' | 'interaction';
}

export interface LeadNote {
  id: string;
  timestamp: string;
  author: string;
  content: string;
}

export type PropertyAvailabilityStatus = 'Disponível' | 'Reservado' | 'Vendido' | 'Inativo';

export interface Property {
  id: string;
  propertyCode: string;
  title: string;
  propertyType: string;
  neighborhood: string;
  city: string;
  price: number;
  bedrooms: number;
  suites: number;
  parkingSpaces: number;
  bathrooms: number;
  description: string;
  keyFeatures: string[];
  mainImageUrl?: string;
  availabilityStatus: PropertyAvailabilityStatus;
  adActive: boolean;
  showPriceToCustomer: boolean;
  metaAdId?: string;
  metaCampaignId?: string;
  externalCrmId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadProperty {
  id: string;
  leadId: string;
  propertyId: string;
  interestStatus: 'Interessado' | 'Visitou' | 'Proposta' | 'Desistiu';
  isCurrentContext: boolean;
  metaAdId?: string;
  metaCampaignId?: string;
  createdAt: string;
  updatedAt: string;
  property?: Property;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
  
  // Origin & WhatsApp Channel
  source: LeadSource;
  campaign?: string;
  ad?: string;
  externalId?: string;
  sourceNotes?: string;
  waId?: string;
  phoneE164?: string;
  lastClientMessageAt?: string;
  whatsappWindowExpiresAt?: string;
  ctwaClid?: string;
  metaAdId?: string;

  // Real Estate Demand
  demand: PropertyDemand;

  // Financial Qualification
  financial: FinancialQualification;

  // Timeline & Classification
  purchaseTimeline: PurchaseTimeline;
  classification: LeadClassification;
  status: LeadStatus;

  // Current Property Context
  currentPropertyId?: string;
  currentProperty?: Property;

  // Internal Audit & Notes
  activities?: LeadActivity[];
  notes?: LeadNote[];

  // Next Action & Follow-up Engine
  nextAction?: SDRNextAction | string;
  scheduledFollowupAt?: string | null;
  scheduledPeriod?: ScheduledPeriod | null;
  followupCycleId?: string | null;
  cycleFollowupCount?: number;
  totalFollowupCount?: number;
  lastFollowupAt?: string | null;
  aiPaused?: boolean;
}

export type SDRNextAction =
  | 'aguardar_cliente'
  | 'retomar_interesse'
  | 'lembrar_documentacao_analise'
  | 'oferecer_simulacao_simples'
  | 'lembrar_dados_simples'
  | 'aguardar_corretor'
  | 'confirmar_visita'
  | 'manter_relacionamento_planejamento'
  | 'aguardar_data_solicitada'
  | 'encaminhado_gustavo'
  | 'sem_followup'
  | (string & {});

export type ScheduledPeriod = 'manha' | 'tarde' | 'noite' | 'dia_inteiro';

export type TaskType =
  | 'Retornar WhatsApp'
  | 'Ligar'
  | 'Verificar financiamento'
  | 'Enviar opções'
  | 'Agendar visita'
  | 'Cobrar retorno'
  | 'Outro'
  | (string & {});

export type TaskStatus = 'Pendente' | 'Concluído' | 'Cancelado';
export type TaskPriority = 'Baixa' | 'Média' | 'Alta';

export interface FollowUpTask {
  id: string;
  leadId: string;
  leadName: string;
  type: TaskType;
  date: string;
  time: string;
  dueAt?: string | null;
  isOverdueAlertSent?: boolean;
  isOverdue?: boolean;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
}

export interface MetricCardData {
  id: string;
  title: string;
  value: number | string;
  change: string;
  isPositive: boolean;
  classification?: LeadClassification;
  iconName: string;
  description: string;
}

export type MessageDirection = 'inbound' | 'outbound';
export type SenderType = 'lead' | 'ai' | 'human' | 'system';

export interface ConversationMessage {
  id: string;
  leadId: string;
  direction: MessageDirection;
  senderType: SenderType;
  content: string;
  createdAt: string;
  externalId?: string;
  sdrTurnId?: string;
  metadata?: Record<string, any>;
}

