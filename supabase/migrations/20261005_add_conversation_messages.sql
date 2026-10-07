-- =============================================================================
-- SCRIPT INCREMENTAL: TABELA DE HISTÓRICO DE MENSAGENS E CONVERSAS DO SDR
-- GC SDR IMOBILIÁRIO - GUSTAVO CARNEIRO (CRECI 52321)
-- DATA: 05/10/2026
-- =============================================================================
-- Este script é 100% idempotente e seguro para execução no SQL Editor do Supabase.
-- NÃO realiza nenhuma operação destrutiva nem altera dados existentes.
-- =============================================================================

-- 1. Criação da Tabela de Mensagens da Conversa (SDR / WhatsApp / Chat)
CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  direction TEXT CHECK (direction IN ('inbound', 'outbound')) NOT NULL,
  sender_type TEXT CHECK (sender_type IN ('lead', 'ai', 'human', 'system')) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  external_id TEXT,
  metadata JSONB DEFAULT '{}'::JSONB
);

-- 2. Criação dos Índices de Performance
CREATE INDEX IF NOT EXISTS idx_conversation_messages_lead_id 
  ON public.conversation_messages(lead_id);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at 
  ON public.conversation_messages(created_at);

-- 3. Habilitação de RLS (Row Level Security)
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- 4. Limpeza e Criação da Política de Acesso RLS Restrita a Usuários Autenticados
DROP POLICY IF EXISTS "Permitir tudo para usuários autenticados mensagens" ON public.conversation_messages;
DROP POLICY IF EXISTS "Acesso estrito a mensagens para usuarios autenticados" ON public.conversation_messages;

CREATE POLICY "Acesso estrito a mensagens para usuarios autenticados" 
  ON public.conversation_messages 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);
