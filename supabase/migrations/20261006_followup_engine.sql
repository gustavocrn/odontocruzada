-- =============================================================================
-- MIGRATION INCREMENTAL: MOTOR DE FOLLOW-UP E PRÓXIMA AÇÃO COMERCIAL DO SDR
-- GC SDR IMOBILIÁRIO - GUSTAVO CARNEIRO (CRECI 52321)
-- DATA: 06/10/2026
-- =============================================================================
-- ATENÇÃO: ESTE ARQUIVO É UMA PROPOSTA E NÃO DEVE SER EXECUTADO AGORA NO SUPABASE.
-- Contém colunas para agendamento relativo, controle por ciclo de follow-up,
-- flag de pausa manual da IA (takeover) e controle de prazos para tarefas.
-- =============================================================================

-- 1. NOVAS COLUNAS NA TABELA LEADS
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS scheduled_followup_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS scheduled_period TEXT DEFAULT NULL 
    CHECK (scheduled_period IN ('manha', 'tarde', 'noite', 'dia_inteiro', NULL)),
  ADD COLUMN IF NOT EXISTS followup_cycle_id TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cycle_followup_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_followup_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_followup_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_paused BOOLEAN NOT NULL DEFAULT false;

-- 2. NOVAS COLUNAS NA TABELA TASKS PARA CONTROLE DE SLA DO CORRETOR
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_overdue_alert_sent BOOLEAN NOT NULL DEFAULT false;

-- 3. ÍNDICES DE PERFORMANCE PARA MÁQUINA DE FOLLOW-UP E CRONJOB
CREATE INDEX IF NOT EXISTS idx_leads_scheduled_followup 
ON public.leads (status, next_action, scheduled_followup_at)
WHERE status NOT IN ('Convertido', 'Perdido');

CREATE INDEX IF NOT EXISTS idx_leads_followup_cycle 
ON public.leads (id, followup_cycle_id);

CREATE INDEX IF NOT EXISTS idx_tasks_due_status 
ON public.tasks (status, due_at) 
WHERE status = 'Pendente';
