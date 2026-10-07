-- =============================================================================
-- MIGRATION INCREMENTAL: INTEGRAÇÃO WHATSAPP BUSINESS PLATFORM / META CLOUD API
-- GC SDR IMOBILIÁRIO - GUSTAVO CARNEIRO (CRECI 52321)
-- DATA: 07/10/2026
-- =============================================================================
-- Migration incremental preparada para o estado atual auditado do banco.
-- NÃO ALTERA ESTRUTURAS EXISTENTES NEM APAGA DADOS.
-- ATENÇÃO: SCRIPT APENAS DEPOSITADO PARA INICIALIZAÇÃO. NÃO FOI EXECUTADO NO SUPABASE.
-- =============================================================================

-- 1. Atualizar Tabela de Leads com Identidade Canônica wa_id, E.164, Janela de 24h e CTWA
ALTER TABLE public.leads 
  ADD COLUMN IF NOT EXISTS wa_id TEXT,
  ADD COLUMN IF NOT EXISTS phone_e164 TEXT,
  ADD COLUMN IF NOT EXISTS last_client_message_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS whatsapp_window_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ctwa_clid TEXT,
  ADD COLUMN IF NOT EXISTS meta_ad_id TEXT;

-- Constraint de unicidade no wa_id do lead (garantia atômica no PostgreSQL)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_leads_wa_id') THEN
    ALTER TABLE public.leads ADD CONSTRAINT uq_leads_wa_id UNIQUE (wa_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_leads_wa_id ON public.leads(wa_id) WHERE wa_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_phone_e164 ON public.leads(phone_e164) WHERE phone_e164 IS NOT NULL;

-- 2. Atualizar Tabela de Mensagens da Conversa (conversation_messages)
ALTER TABLE public.conversation_messages
  ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'simulator',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'received',
  ADD COLUMN IF NOT EXISTS sdr_turn_id TEXT,
  ADD COLUMN IF NOT EXISTS meta_media_id TEXT,
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS original_filename TEXT,
  ADD COLUMN IF NOT EXISTS error_code TEXT,
  ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Normalização de status dos registros legados existentes (inbound -> received, outbound simulador -> delivered)
UPDATE public.conversation_messages
SET status = CASE 
  WHEN direction = 'inbound' THEN 'received'
  WHEN direction = 'outbound' THEN 'delivered'
  ELSE 'received'
END
WHERE status IS NULL OR status = 'received';

-- Fonte Única de Idempotência Atômica Inbound: external_id (wamid) ÚNICO
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversation_messages_external_id 
  ON public.conversation_messages(external_id) 
  WHERE external_id IS NOT NULL;

-- Fonte Única de Idempotência Atômica Outbound por Turno Lógico (sdr_turn_id ÚNICO)
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversation_messages_sdr_turn_id 
  ON public.conversation_messages(sdr_turn_id) 
  WHERE sdr_turn_id IS NOT NULL;

-- CHECK constraints sem quebrar dados legados do simulador
ALTER TABLE public.conversation_messages
  DROP CONSTRAINT IF EXISTS chk_conversation_messages_channel;
ALTER TABLE public.conversation_messages
  ADD CONSTRAINT chk_conversation_messages_channel 
  CHECK (channel IN ('simulator', 'whatsapp', 'web_chat', 'system'));

ALTER TABLE public.conversation_messages
  DROP CONSTRAINT IF EXISTS chk_conversation_messages_direction;
ALTER TABLE public.conversation_messages
  ADD CONSTRAINT chk_conversation_messages_direction 
  CHECK (direction IN ('inbound', 'outbound'));

ALTER TABLE public.conversation_messages
  DROP CONSTRAINT IF EXISTS chk_conversation_messages_status;
ALTER TABLE public.conversation_messages
  ADD CONSTRAINT chk_conversation_messages_status 
  CHECK (status IN ('received', 'pending', 'sending', 'sent', 'delivered', 'read', 'failed'));

-- 3. Tabela de Fila Durável (webhook_queue) com Unique Composto (conversation_message_id, job_type)
CREATE TABLE IF NOT EXISTS public.webhook_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_message_id UUID NOT NULL REFERENCES public.conversation_messages(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('process_inbound_sdr', 'send_outbound_whatsapp', 'handle_status_update')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'dead_letter')),
  retry_count INT DEFAULT 0 NOT NULL CHECK (retry_count >= 0),
  max_retries INT DEFAULT 5 NOT NULL CHECK (max_retries > 0),
  available_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  processed_at TIMESTAMPTZ,
  last_error_code TEXT,
  last_error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Constraint Única composta por (conversation_message_id, job_type)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_webhook_queue_msg_job') THEN
    ALTER TABLE public.webhook_queue ADD CONSTRAINT uq_webhook_queue_msg_job UNIQUE (conversation_message_id, job_type);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_webhook_queue_status_available 
  ON public.webhook_queue(status, available_at);

CREATE INDEX IF NOT EXISTS idx_webhook_queue_message_id 
  ON public.webhook_queue(conversation_message_id);

-- 4. Função RPC Protegida para Claim Atômico via FOR UPDATE SKIP LOCKED
CREATE OR REPLACE FUNCTION public.claim_webhook_jobs(
  p_worker_id TEXT,
  p_batch_size INT DEFAULT 1,
  p_lock_timeout_seconds INT DEFAULT 300
)
RETURNS SETOF public.webhook_queue
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Validação estrita de parâmetros operacionais
  IF p_worker_id IS NULL OR TRIM(p_worker_id) = '' THEN
    RAISE EXCEPTION 'p_worker_id é obrigatório e não pode ser vazio.';
  END IF;

  IF p_batch_size IS NULL OR p_batch_size <= 0 THEN
    p_batch_size := 1;
  ELSIF p_batch_size > 100 THEN
    p_batch_size := 100;
  END IF;

  IF p_lock_timeout_seconds IS NULL OR p_lock_timeout_seconds <= 0 THEN
    p_lock_timeout_seconds := 300;
  END IF;

  RETURN QUERY
  WITH target_jobs AS (
    SELECT id
    FROM public.webhook_queue
    WHERE 
      (
        status = 'pending' AND available_at <= NOW()
      )
      OR 
      (
        status = 'processing' AND locked_at <= NOW() - (p_lock_timeout_seconds || ' seconds')::INTERVAL
      )
    ORDER BY available_at ASC, created_at ASC
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.webhook_queue q
  SET 
    status = 'processing',
    locked_at = NOW(),
    locked_by = p_worker_id
  FROM target_jobs t
  WHERE q.id = t.id
  RETURNING q.*;
END;
$$;

-- Restringir execução da RPC exclusivamente para a role server-side service_role com caminhos totalmente qualificados
REVOKE EXECUTE ON FUNCTION public.claim_webhook_jobs(TEXT, INT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_webhook_jobs(TEXT, INT, INT) TO service_role;

-- 5. Habilitação de RLS (Row Level Security) Estrito na Fila
-- RLS Habilitado SEM NENHUMA POLICY para authenticated ou anon.
-- Apenas service_role e o banco em contexto seguro podem interagir com a fila.
ALTER TABLE public.webhook_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso estrito a webhook queue para usuarios autenticados" ON public.webhook_queue;
DROP POLICY IF EXISTS "Webhook queue RLS deny all for anon and authenticated" ON public.webhook_queue;

GRANT ALL ON public.webhook_queue TO service_role;
