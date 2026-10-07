-- =============================================================================
-- ESQUEMA COMPLETO E SEGURO DO BANCO DE DADOS SUPABASE (POSTGRESQL)
-- GC SDR IMOBILIÁRIO - GUSTAVO CARNEIRO (CRECI 52321)
-- =============================================================================
-- REVISÃO DE SEGURANÇA E ACESSO RLS:
-- 1. Criação idempotente de tipos ENUM, tabelas, índices e triggers.
-- 2. Habilitação de RLS em 100% das tabelas.
-- 3. Restrição estrita: NENHUM acesso para usuários anônimos (public/anon).
-- 4. Acesso total (SELECT, INSERT, UPDATE, DELETE) permitido EXCLUSIVAMENTE para usuários autenticados (TO authenticated).
-- 5. Preparado para integração server-side (service_role) de IA e WhatsApp.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. CRIAÇÃO IDEMPOTENTE DOS TIPOS ENUM
-- -----------------------------------------------------------------------------
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_classification_type') THEN
    CREATE TYPE lead_classification_type AS ENUM ('quente', 'morno', 'planejamento', 'nao_classificado');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status_type') THEN
    CREATE TYPE lead_status_type AS ENUM (
      'Novo',
      'Em atendimento',
      'Qualificando',
      'Qualificado',
      'Aguardando cliente',
      'Aguardando corretor',
      'Visita agendada',
      'Negociação',
      'Convertido',
      'Perdido'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_source_type') THEN
    CREATE TYPE lead_source_type AS ENUM (
      'WhatsApp',
      'Facebook',
      'Instagram',
      'Indicação',
      'Cadastro manual',
      'Site',
      'Outro',
      'Origem não identificada'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'purchase_form_type') THEN
    CREATE TYPE purchase_form_type AS ENUM (
      'À vista',
      'Financiamento',
      'Financiamento + recursos próprios',
      'Ainda não sabe'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credit_status_type') THEN
    CREATE TYPE credit_status_type AS ENUM (
      'Não analisado',
      'Pretende analisar',
      'Em análise',
      'Pré-aprovado',
      'Aprovado',
      'Não aprovado',
      'Não informado'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'purchase_timeline_type') THEN
    CREATE TYPE purchase_timeline_type AS ENUM (
      'Imediatamente',
      'Até 30 dias',
      '1 a 3 meses',
      '3 a 6 meses',
      '6 a 12 meses',
      'Mais de 12 meses',
      'Apenas pesquisando',
      'Não informado'
    );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. TABELAS PRINCIPAIS DO CRM
-- -----------------------------------------------------------------------------

-- Tabela Principal de Leads
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Origem
  source lead_source_type DEFAULT 'Cadastro manual' NOT NULL,
  campaign TEXT,
  ad TEXT,
  external_id TEXT,
  source_notes TEXT,

  -- Classificação & Status
  classification lead_classification_type DEFAULT 'nao_classificado' NOT NULL,
  status lead_status_type DEFAULT 'Novo' NOT NULL,
  purchase_timeline purchase_timeline_type DEFAULT 'Não informado' NOT NULL,
  next_action TEXT
);

-- Tabela de Perfil do Imóvel Procurado (Necessidade Imobiliária)
CREATE TABLE IF NOT EXISTS public.property_demands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL UNIQUE,
  purpose TEXT DEFAULT 'Moradia' NOT NULL,
  property_type TEXT DEFAULT 'Apartamento' NOT NULL,
  city TEXT DEFAULT 'Ponta Grossa' NOT NULL,
  regions TEXT[] DEFAULT ARRAY['Vila Estrela', 'Jardim Carvalho', 'Oficinas']::TEXT[],
  bedrooms INTEGER DEFAULT 3,
  needs_suite BOOLEAN DEFAULT true,
  parking_spaces INTEGER DEFAULT 2,
  min_price NUMERIC(12,2) DEFAULT 0,
  max_price NUMERIC(12,2) DEFAULT 1000000,
  key_features TEXT[] DEFAULT ARRAY[]::TEXT[],
  property_notes TEXT
);

-- Tabela de Qualificação Financeira
CREATE TABLE IF NOT EXISTS public.financial_qualifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL UNIQUE,
  purchase_form purchase_form_type DEFAULT 'Financiamento' NOT NULL,
  
  -- Entrada
  has_down_payment BOOLEAN DEFAULT true,
  down_payment_amount NUMERIC(12,2) DEFAULT 0,
  intends_to_increase_down_payment BOOLEAN DEFAULT false,
  down_payment_notes TEXT,

  -- FGTS
  has_fgts BOOLEAN DEFAULT false,
  intends_to_use_fgts BOOLEAN DEFAULT false,
  fgts_amount NUMERIC(12,2) DEFAULT 0,
  fgts_status TEXT DEFAULT 'Não informado',

  -- Outros Recursos
  has_vehicle_or_asset BOOLEAN DEFAULT false,
  asset_description TEXT,
  asset_amount NUMERIC(12,2) DEFAULT 0,

  -- Financiamento / Crédito
  has_simulated BOOLEAN DEFAULT false,
  has_credit_analysis BOOLEAN DEFAULT false,
  bank_institution TEXT,
  credit_status credit_status_type DEFAULT 'Não analisado' NOT NULL,
  approved_amount NUMERIC(12,2) DEFAULT 0
);

-- Tabela de Histórico de Atividades / Auditoria
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  author TEXT DEFAULT 'Gustavo Carneiro' NOT NULL,
  action TEXT NOT NULL,
  type TEXT DEFAULT 'interaction' NOT NULL
);

-- Tabela de Anotações do Corretor
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  author TEXT DEFAULT 'Gustavo Carneiro' NOT NULL,
  content TEXT NOT NULL
);

-- Tabela de Tarefas e Follow-ups
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  lead_name TEXT NOT NULL,
  type TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'Pendente' NOT NULL,
  priority TEXT DEFAULT 'Média' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tabela de Histórico de Conversas (SDR / WhatsApp / Chat)
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

-- -----------------------------------------------------------------------------
-- 3. ÍNDICES DE PERFORMANCE DE BUSCA E FILTROS
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_classification ON public.leads(classification);
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source);
CREATE INDEX IF NOT EXISTS idx_tasks_lead_id ON public.tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON public.activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_lead_id ON public.conversation_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON public.conversation_messages(created_at);

-- -----------------------------------------------------------------------------
-- 4. TRIGGER DE ATUALIZAÇÃO AUTOMÁTICA DE UPDATED_AT
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at 
BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 5. SEGURANÇA E POLÍTICAS DE ACESSO (RLS STRICT - AUTHENTICATED ONLY)
-- -----------------------------------------------------------------------------

-- Habilitar RLS em 100% das tabelas
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_demands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- Limpar políticas legadas para prevenir sobreposição
DROP POLICY IF EXISTS "Permitir tudo para usuários autenticados" ON public.leads;
DROP POLICY IF EXISTS "Permitir tudo para usuários autenticados demandas" ON public.property_demands;
DROP POLICY IF EXISTS "Permitir tudo para usuários autenticados financeiro" ON public.financial_qualifications;
DROP POLICY IF EXISTS "Permitir tudo para usuários autenticados atividades" ON public.activities;
DROP POLICY IF EXISTS "Permitir tudo para usuários autenticados notas" ON public.notes;
DROP POLICY IF EXISTS "Permitir tudo para usuários autenticados tarefas" ON public.tasks;
DROP POLICY IF EXISTS "Permitir tudo para usuários autenticados mensagens" ON public.conversation_messages;

DROP POLICY IF EXISTS "Acesso estrito a leads para usuarios autenticados" ON public.leads;
DROP POLICY IF EXISTS "Acesso estrito a demandas para usuarios autenticados" ON public.property_demands;
DROP POLICY IF EXISTS "Acesso estrito a financeiro para usuarios autenticados" ON public.financial_qualifications;
DROP POLICY IF EXISTS "Acesso estrito a atividades para usuarios autenticados" ON public.activities;
DROP POLICY IF EXISTS "Acesso estrito a notas para usuarios autenticados" ON public.notes;
DROP POLICY IF EXISTS "Acesso estrito a tarefas para usuarios autenticados" ON public.tasks;
DROP POLICY IF EXISTS "Acesso estrito a mensagens para usuarios autenticados" ON public.conversation_messages;

-- Criar Políticas RLS Restritas (Apenas a função TO authenticated possui permissão)
CREATE POLICY "Acesso estrito a leads para usuarios autenticados" 
  ON public.leads 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Acesso estrito a demandas para usuarios autenticados" 
  ON public.property_demands 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Acesso estrito a financeiro para usuarios autenticados" 
  ON public.financial_qualifications 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Acesso estrito a atividades para usuarios autenticados" 
  ON public.activities 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Acesso estrito a notas para usuarios autenticados" 
  ON public.notes 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Acesso estrito a tarefas para usuarios autenticados" 
  ON public.tasks 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Acesso estrito a mensagens para usuarios autenticados" 
  ON public.conversation_messages 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

