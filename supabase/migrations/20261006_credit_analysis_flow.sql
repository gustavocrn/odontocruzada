-- =============================================================================
-- MIGRATION INCREMENTAL: FLUXO REAL DE ANÁLISE E SIMULAÇÃO DE CRÉDITO DO SDR
-- GC SDR IMOBILIÁRIO - GUSTAVO CARNEIRO (CRECI 52321)
-- DATA: 06/10/2026
-- =============================================================================
-- Este script adiciona os campos de controle de estágios de crédito,
-- checklist de documentos (Análise Completa com equivalência CNH/RG),
-- dados da Simulação Simples e controle de temporizador/follow-up de 30 minutos.
-- 100% idempotente e seguro para execução no SQL Editor do Supabase.
-- =============================================================================

ALTER TABLE public.financial_qualifications 
  ADD COLUMN IF NOT EXISTS analysis_stage TEXT NOT NULL DEFAULT 'nao_oferecido'
    CHECK (analysis_stage IN (
      'nao_oferecido',
      'analise_completa_solicitada',
      'aguardando_documentacao',
      'documentacao_parcial',
      'documentacao_pronta',
      'resistencia_documentacao',
      'simulacao_simples_oferecida',
      'aguardando_dados_simples',
      'dados_simples_prontos',
      'encaminhado_gestao'
    )),
  ADD COLUMN IF NOT EXISTS id_doc_type TEXT DEFAULT NULL 
    CHECK (id_doc_type IN ('RG', 'CNH', NULL)),
  ADD COLUMN IF NOT EXISTS doc_checklist JSONB DEFAULT '{
    "id_doc": false,
    "cpf": false,
    "residence_proof": false,
    "paystub": false,
    "work_card": false,
    "civil_cert": false
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS simple_sim_data JSONB DEFAULT '{
    "paystub_recent": false,
    "birth_date": null,
    "has_dependents": null,
    "work_years_over_3": null
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS doc_requested_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_client_response_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS client_will_send_later BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS followup_30m_sent BOOLEAN DEFAULT false;
