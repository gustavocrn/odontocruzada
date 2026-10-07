import {
  LeadClassification,
  LeadStatus,
  PropertyDemand,
  FinancialQualification,
  PurchaseTimeline,
  Property
} from '@/types';

export interface AIStructuredResponse {
  reply: string;
  nextFocus?: string;
  humanHandoff?: boolean;
  handoffReason?: string;
  responseMode?: 'openai' | 'fallback_offline';
  commercialObjective?: string;
}

export interface AISDRInput {
  leadName: string;
  demand: PropertyDemand;
  financial: FinancialQualification;
  purchaseTimeline: PurchaseTimeline;
  classification: LeadClassification;
  status: LeadStatus;
  missingFields: string[];
  nextPriorityField: string;
  nextQuestionFocus: string;
  commercialObjective: string;
  currentProperty?: Property;
  conversationHistory: { senderType: string; content: string }[];
  newMessage: string;
}

export interface AIProviderStatus {
  isConfigured: boolean;
  providerName: string;
  model: string;
  message: string;
}

export interface AIProvider {
  name: string;
  model: string;
  isAvailable(): boolean;
  generateSDRResponse(input: AISDRInput): Promise<AIStructuredResponse>;
}
