import {
  LeadClassification,
  LeadStatus,
  PropertyDemand,
  FinancialQualification,
  PurchaseForm,
  CreditStatus,
  PurchaseTimeline,
  ConversationMessage,
  Lead,
  Property
} from '@/types';

export interface ExtractedDemand {
  purpose?: 'Moradia' | 'Investimento' | 'Outro';
  propertyType?: string;
  city?: string;
  regions?: string[];
  bedrooms?: number;
  needsSuite?: boolean;
  parkingSpaces?: number;
  minPrice?: number;
  maxPrice?: number;
  keyFeatures?: string[];
  propertyNotes?: string;
}

import { ScheduledPeriod, SDRNextAction } from '@/types';

export interface ExtractedScheduleIntent {
  type: 'exact' | 'period' | 'vague';
  date?: string;
  time?: string;
  period?: ScheduledPeriod;
  isoTimestamp?: string;
  rawText: string;
  explicitRefusal?: boolean;
}

export interface ExtractedFinancial {
  purchaseForm?: PurchaseForm;
  hasDownPayment?: boolean;
  downPaymentAmount?: number;
  intendsToIncreaseDownPayment?: boolean;
  hasFGTS?: boolean;
  intendsToUseFGTS?: boolean;
  fgtsAmount?: number;
  hasVehicleOrAsset?: boolean;
  assetDescription?: string;
  hasSimulated?: boolean;
  hasCreditAnalysis?: boolean;
  bankInstitution?: string;
  creditStatus?: CreditStatus;
  approvedAmount?: number;
  purchaseTimeline?: PurchaseTimeline;

  // Reconhecimento de intenções e respostas do fluxo de análise de crédito
  isCreditInquiry?: boolean; // Perguntou como funciona simulação / análise / documentos / quanto precisa de entrada / quanto consegue financiar
  isDirectFullAnalysisRequest?: boolean; // Pediu diretamente para fazer a análise de crédito
  isPrefersSimpleSim?: boolean; // Disse que prefere só a simulação / não quer análise completa agora
  isAcceptingFullAnalysis?: boolean; // Aceitou a análise completa ("pode ser", "o que precisa", "manda")
  isCNHQuestion?: boolean; // Perguntou se CNH serve
  isWillSendLater?: boolean; // Disse que vai separar / enviar depois / mais tarde
  isExplicitDocResistance?: boolean; // Disse que é muita coisa / não tem tudo isso / não quer mandar agora
  isExplicitVisitRefusal?: boolean; // Recusou visita em favor do financeiro ("quero primeiro ver o financiamento")
  isExplicitRefusal?: boolean; // Recusa explícita de acompanhamento ("não me perturbe", "não quero mais", "cancele")
  
  // Agendamento temporal extraído do cliente ("me chama amanhã", "fala comigo sexta")
  scheduleIntent?: ExtractedScheduleIntent;

  // Dados da simulação simples extraídos de texto
  extractedBirthDate?: string;
  extractedHasDependents?: boolean;
  extractedWorkYearsOver3?: boolean;
}

export interface SDRMissingField {
  category: 'demand' | 'financial' | 'general';
  field: string;
  description: string;
  priority: number; // 1 = mais prioritário
}

export type PendingPropertyIntent = 'price' | 'location' | 'bedrooms' | 'parking' | 'visit';

export interface SDREngineInput {
  lead: Partial<Lead> & { id: string; name: string };
  demand?: Partial<PropertyDemand>;
  financial?: Partial<FinancialQualification>;
  purchaseTimeline?: PurchaseTimeline;
  currentProperty?: Property;
  conversationHistory?: ConversationMessage[];
  newMessage: string;
  pendingPropertyIntent?: PendingPropertyIntent;
  
  // Simulação controlada de recebimento de documentos (Regra 7)
  simulatedReceivedDocs?: Array<'rg' | 'cnh' | 'id_doc' | 'cpf' | 'residence_proof' | 'paystub' | 'work_card' | 'civil_cert' | 'paystub_recent'>;
  
  // Flag determinística para acionar o disparo de follow-up de 30m nos testes (Regra 4)
  is30MinFollowupTrigger?: boolean;

  // Data/hora simulada para avançar o tempo no simulador (simulatedNow)
  simulatedNow?: Date;
}

export interface SDRMessageAnalysis {
  extractedDemand: ExtractedDemand;
  extractedFinancial: ExtractedFinancial;
  newFieldsIdentified: string[];
  updatedDemand: PropertyDemand;
  updatedFinancial: FinancialQualification;
  updatedTimeline: PurchaseTimeline;
  missingFields: SDRMissingField[];
  suggestedClassification: LeadClassification;
  suggestedStatus: LeadStatus;
  nextPriorityField: string;
  nextQuestionFocus: string;
  commercialObjective: string;
  requiresHumanIntervention: boolean;
  decisionReason: string;
  currentProperty?: Property;
  adProperties?: Property[];
  pendingPropertyIntent?: PendingPropertyIntent;
  visitPreference?: string;
  updatedScheduledFollowupAt?: string | null;
  updatedScheduledPeriod?: ScheduledPeriod | null;
  suggestedNextAction: SDRNextAction;
}
