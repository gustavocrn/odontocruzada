import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ConversationMessage, MessageDirection, SenderType } from '@/types';
import { SupabaseClient } from '@supabase/supabase-js';

let localMessages: ConversationMessage[] = [];

export function clearLocalMessagesForTest(): void {
  localMessages = [];
}

export function clearConversationMessagesForLead(leadId: string): void {
  localMessages = localMessages.filter((m) => m.leadId !== leadId);
}

/**
 * Serviço de histórico de conversas do SDR com Supabase e Fallback Local.
 */
export async function getConversationMessages(
  leadId: string,
  client?: SupabaseClient | null
): Promise<ConversationMessage[]> {
  const db = client || supabase;
  if (!isSupabaseConfigured() || !db) {
    return leadId ? localMessages.filter((m) => m.leadId === leadId) : localMessages;
  }

  let query = db.from('conversation_messages').select('*');
  if (leadId) {
    query = query.eq('lead_id', leadId);
  }

  const { data, error } = await query.order('created_at', { ascending: true });

  if (error) {
    console.error('Erro ao buscar mensagens do Supabase:', error);
    return leadId ? localMessages.filter((m) => m.leadId === leadId) : localMessages;
  }

  return (data || []).map((row) => ({
    id: row.id,
    leadId: row.lead_id,
    direction: row.direction as MessageDirection,
    senderType: row.sender_type as SenderType,
    content: row.content,
    createdAt: row.created_at,
    externalId: row.external_id || undefined,
    sdrTurnId: row.sdr_turn_id || row.metadata?.sdrTurnId || undefined,
    metadata: row.metadata || {}
  }));
}

export async function addConversationMessage(
  leadId: string,
  direction: MessageDirection,
  senderType: SenderType,
  content: string,
  externalId?: string,
  metadata?: Record<string, any>,
  client?: SupabaseClient | null,
  sdrTurnId?: string
): Promise<ConversationMessage | null> {
  const finalSdrTurnId = sdrTurnId || metadata?.sdrTurnId || undefined;
  const newMessage: ConversationMessage = {
    id: crypto.randomUUID(),
    leadId,
    direction,
    senderType,
    content,
    createdAt: new Date().toISOString(),
    externalId,
    sdrTurnId: finalSdrTurnId,
    metadata: metadata || {}
  };

  const db = client || supabase;
  if (!isSupabaseConfigured() || !db) {
    // Idempotência atômica em modo local de teste (por externalId ou sdrTurnId)
    if (externalId && localMessages.some((m) => m.externalId === externalId)) {
      return null;
    }
    if (finalSdrTurnId && localMessages.some((m) => m.sdrTurnId === finalSdrTurnId || m.metadata?.sdrTurnId === finalSdrTurnId)) {
      return null;
    }
    localMessages.push(newMessage);
    return newMessage;
  }

  const { data, error } = await db
    .from('conversation_messages')
    .insert([
      {
        id: newMessage.id,
        lead_id: leadId,
        direction,
        sender_type: senderType,
        content,
        external_id: externalId || null,
        sdr_turn_id: finalSdrTurnId || null,
        metadata: metadata || {}
      }
    ])
    .select()
    .single();

  if (error) {
    if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('idx_conversation_messages_sdr_turn_id')) {
      // Duplicidade capturada por UNIQUE constraint no external_id (wamid) ou sdr_turn_id
      return null;
    }
    console.error('Erro ao salvar mensagem no Supabase:', error);
    if (externalId && localMessages.some((m) => m.externalId === externalId)) {
      return null;
    }
    if (finalSdrTurnId && localMessages.some((m) => m.sdrTurnId === finalSdrTurnId)) {
      return null;
    }
    localMessages.push(newMessage);
    return newMessage;
  }

  return {
    id: data.id,
    leadId: data.lead_id,
    direction: data.direction as MessageDirection,
    senderType: data.sender_type as SenderType,
    content: data.content,
    createdAt: data.created_at,
    externalId: data.external_id || undefined,
    sdrTurnId: data.sdr_turn_id || undefined,
    metadata: data.metadata || {}
  };
}

