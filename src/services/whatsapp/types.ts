export type WhatsAppMessageDirection = 'inbound' | 'outbound';

export type WhatsAppMessageStatus =
  | 'received'
  | 'read'
  | 'queued'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'failed';

export type WhatsAppChannel = 'whatsapp' | 'simulator';

export interface WhatsAppSendTextOptions {
  to: string;
  text: string;
}

export const META_TEMPLATE_MAP: Record<string, { name: string; language: string }> = {
  'retomar_interesse': { name: 'sdr_followup_property_retake', language: 'pt_BR' },
  'lembrar_documentacao': { name: 'sdr_followup_doc_reminder', language: 'pt_BR' },
  'solicitar_documentacao_analise': { name: 'sdr_followup_doc_reminder', language: 'pt_BR' },
  'confirmar_visita': { name: 'sdr_followup_visit_confirm', language: 'pt_BR' }
};

export interface WhatsAppSendTemplateOptions {
  to: string;
  templateName: string;
  languageCode: string;
  components?: Array<any>;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface WhatsAppMediaMetadata {
  metaMediaId?: string;
  storagePath?: string;
  mimeType?: string;
  originalFilename?: string;
}

export interface WebhookQueueJob {
  id: string;
  conversationMessageId: string;
  jobType: 'process_inbound_sdr' | 'send_outbound_whatsapp' | 'handle_status_update';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'dead_letter';
  retryCount: number;
  maxRetries?: number;
  availableAt: string;
  lockedAt?: string | null;
  lockedBy?: string | null;
  processedAt?: string | null;
  lastErrorCode?: string | null;
  lastErrorMessage?: string | null;
  createdAt: string;
}

// Structs de Webhook Payload da Meta Cloud API (Webhooks Official Schema)
export interface MetaWebhookEntry {
  id: string;
  changes: Array<{
    field: string;
    value: {
      messaging_product: string;
      metadata: {
        display_phone_number: string;
        phone_number_id: string;
      };
      contacts?: Array<{
        profile: { name: string };
        wa_id: string;
      }>;
      messages?: Array<{
        from: string;
        id: string;
        timestamp: string;
        type: string;
        text?: { body: string };
        image?: { id: string; mime_type?: string; sha256?: string; caption?: string };
        document?: { id: string; mime_type?: string; filename?: string; sha256?: string };
        audio?: { id: string; mime_type?: string };
        referral?: {
          source_url?: string;
          source_type?: string;
          source_id?: string;
          headline?: string;
          body?: string;
          ctwa_clid?: string;
        };
      }>;
      statuses?: Array<{
        id: string;
        status: 'sent' | 'delivered' | 'read' | 'failed';
        timestamp: string;
        recipient_id: string;
        errors?: Array<{ code: number; title: string; details?: string }>;
      }>;
    };
  }>;
}

export interface MetaWebhookPayload {
  object: string;
  entry: MetaWebhookEntry[];
}
