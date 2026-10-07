-- Migration: Criação da Tabela de Imóveis (properties) e Relacionamento N:N (lead_properties)
-- GC SDR IMOBILIÁRIO - GUSTAVO CARNEIRO (CRECI 52321)

-- 1. TABELA DE IMÓVEIS
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    property_type TEXT NOT NULL,
    neighborhood TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Ponta Grossa',
    price NUMERIC(12, 2) CHECK (price IS NULL OR price >= 0),
    bedrooms INTEGER CHECK (bedrooms IS NULL OR bedrooms >= 0),
    suites INTEGER CHECK (suites IS NULL OR suites >= 0),
    parking_spaces INTEGER CHECK (parking_spaces IS NULL OR parking_spaces >= 0),
    bathrooms INTEGER CHECK (bathrooms IS NULL OR bathrooms >= 0),
    description TEXT,
    key_features TEXT[] DEFAULT '{}'::TEXT[],
    main_image_url TEXT,
    
    -- Status de disponibilidade e anúncio (REGRA CENTRAL)
    availability_status TEXT NOT NULL DEFAULT 'Disponível' 
        CHECK (availability_status IN ('Disponível', 'Reservado', 'Vendido', 'Inativo')),
    ad_active BOOLEAN NOT NULL DEFAULT false,
    show_price_to_customer BOOLEAN NOT NULL DEFAULT true,
    
    -- Metadados para Ads e CRM Legado
    meta_ad_id TEXT,
    meta_campaign_id TEXT,
    external_crm_id TEXT,
    raw_metadata JSONB DEFAULT '{}'::JSONB,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Nota de Arquitetura: Preparado para futura tabela public.property_ads
-- (relacionando property_id, plataforma, meta_ad_id, meta_campaign_id, ativo, datas)

-- 2. CAMPO DE CONTEXTO ATUAL DO IMÓVEL NA TABELA LEADS (ÚNICA FONTE DO IMÓVEL ATUAL)
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS current_property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL;

-- 3. TABELA N:N DE INTERESSE DE LEADS EM IMÓVEIS
CREATE TABLE IF NOT EXISTS public.lead_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    interest_status TEXT NOT NULL DEFAULT 'Interessado' 
        CHECK (interest_status IN ('Interessado', 'Visitou', 'Proposta', 'Desistiu')),
    meta_ad_id TEXT,
    meta_campaign_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_lead_property UNIQUE (lead_id, property_id)
);

-- 4. ÍNDICES DE PERFORMANCE (FILTRO ESTRITO DE ANÚNCIOS ATIVOS)
CREATE INDEX IF NOT EXISTS idx_properties_ad_active 
ON public.properties (ad_active, availability_status) 
WHERE ad_active = true AND availability_status = 'Disponível';

CREATE INDEX IF NOT EXISTS idx_properties_code ON public.properties (property_code);
CREATE INDEX IF NOT EXISTS idx_leads_current_property ON public.leads(current_property_id);
CREATE INDEX IF NOT EXISTS idx_lead_properties_lead ON public.lead_properties(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_properties_property ON public.lead_properties(property_id);

-- 5. TRIGGER DE UPDATED_AT
DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
CREATE TRIGGER update_properties_updated_at 
BEFORE UPDATE ON public.properties
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 6. HABILITAÇÃO DE RLS E POLÍTICAS DE SEGURANÇA (EXCLUSIVAMENTE AUTHENTICATED)
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso estrito a properties para usuarios autenticados" ON public.properties;
CREATE POLICY "Acesso estrito a properties para usuarios autenticados" 
  ON public.properties 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso estrito a lead_properties para usuarios autenticados" ON public.lead_properties;
CREATE POLICY "Acesso estrito a lead_properties para usuarios autenticados" 
  ON public.lead_properties 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);
