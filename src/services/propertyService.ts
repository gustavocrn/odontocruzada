import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Property, PropertyAvailabilityStatus } from '@/types';
import { SupabaseClient } from '@supabase/supabase-js';

// Imóveis padrão para inicialização do laboratório / modo offline local
export const INITIAL_PROPERTIES: Property[] = [
  {
    id: 'prop-cs101',
    propertyCode: 'CS-101',
    title: 'Sobrado Moderno na Vila Estrela',
    propertyType: 'Sobrado',
    neighborhood: 'Vila Estrela',
    city: 'Ponta Grossa',
    price: 480000,
    bedrooms: 3,
    suites: 1,
    parkingSpaces: 2,
    bathrooms: 2,
    description: 'Belo sobrado triplex com ótimo acabamento, churrasqueira a carvão e suíte máster.',
    keyFeatures: ['Churrasqueira', 'Garagem Coberta', 'Suíte', 'Sanca de Gesso'],
    mainImageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
    availabilityStatus: 'Disponível',
    adActive: true,
    showPriceToCustomer: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prop-ap204',
    propertyCode: 'AP-204',
    title: 'Apartamento Alto Padrão no Jardim Carvalho',
    propertyType: 'Apartamento',
    neighborhood: 'Jardim Carvalho',
    city: 'Ponta Grossa',
    price: 650000,
    bedrooms: 3,
    suites: 2,
    parkingSpaces: 2,
    bathrooms: 3,
    description: 'Apartamento amplo com varanda gourmet, sacada integrada e vista panorâmica da cidade.',
    keyFeatures: ['Sacada com Churrasqueira', 'Portaria 24h', 'Piscina', 'Salão de Festas'],
    mainImageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    availabilityStatus: 'Disponível',
    adActive: true,
    showPriceToCustomer: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prop-cs102',
    propertyCode: 'CS-102',
    title: 'Casa Térrea aconchegante em Oficinas',
    propertyType: 'Casa',
    neighborhood: 'Oficinas',
    city: 'Ponta Grossa',
    price: 320000,
    bedrooms: 2,
    suites: 0,
    parkingSpaces: 1,
    bathrooms: 1,
    description: 'Excelente casa térrea com quintal nos fundos próxima ao estádio Germano Krüger.',
    keyFeatures: ['Quintal', 'Edícula', 'Cozinha Planejada'],
    mainImageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
    availabilityStatus: 'Disponível',
    adActive: false, // Fora de Anúncio!
    showPriceToCustomer: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prop-tr301',
    propertyCode: 'TR-301',
    title: 'Terreno Residencial em Uvaranas',
    propertyType: 'Terreno',
    neighborhood: 'Uvaranas',
    city: 'Ponta Grossa',
    price: 180000,
    bedrooms: 0,
    suites: 0,
    parkingSpaces: 0,
    bathrooms: 0,
    description: 'Lote plano em condomínio fechado pronto para construir.',
    keyFeatures: ['Condomínio Fechado', 'Portaria'],
    mainImageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
    availabilityStatus: 'Vendido', // Vendido!
    adActive: true,
    showPriceToCustomer: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

function mapRowToProperty(row: any): Property {
  return {
    id: row.id,
    propertyCode: row.property_code || row.propertyCode || '',
    title: row.title || '',
    propertyType: row.property_type || row.propertyType || '',
    neighborhood: row.neighborhood || '',
    city: row.city || 'Ponta Grossa',
    price: Number(row.price || 0),
    bedrooms: Number(row.bedrooms || 0),
    suites: Number(row.suites || 0),
    parkingSpaces: Number(row.parking_spaces || row.parkingSpaces || 0),
    bathrooms: Number(row.bathrooms || 0),
    description: row.description || '',
    keyFeatures: Array.isArray(row.key_features) ? row.key_features : [],
    mainImageUrl: row.main_image_url || row.mainImageUrl || undefined,
    availabilityStatus: row.availability_status || row.availabilityStatus || 'Disponível',
    adActive: Boolean(row.ad_active ?? row.adActive ?? false),
    showPriceToCustomer: Boolean(row.show_price_to_customer ?? row.showPriceToCustomer ?? true),
    metaAdId: row.meta_ad_id || row.metaAdId || undefined,
    metaCampaignId: row.meta_campaign_id || row.metaCampaignId || undefined,
    externalCrmId: row.external_crm_id || row.externalCrmId || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString()
  };
}

export const propertyService = {
  /**
   * Busca todos os imóveis para gestão no CRM.
   */
  async getProperties(client?: SupabaseClient | null): Promise<Property[]> {
    if (isSupabaseConfigured()) {
      const db = client || supabase;
      if (db) {
        const { data, error } = await db
          .from('properties')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map(mapRowToProperty);
        }
      }
    }
    return INITIAL_PROPERTIES;
  },

  /**
   * REGRA CENTRAL DO SDR: Busca SOMENTE imóveis que possuem ad_active = true AND availability_status = 'Disponível'.
   */
  async getActiveAdProperties(client?: SupabaseClient | null): Promise<Property[]> {
    if (isSupabaseConfigured()) {
      const db = client || supabase;
      if (db) {
        const { data, error } = await db
          .from('properties')
          .select('*')
          .eq('ad_active', true)
          .eq('availability_status', 'Disponível')
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map(mapRowToProperty);
        }
      }
    }

    // Filtro estrito no mock local
    return INITIAL_PROPERTIES.filter(
      (p) => p.adActive && p.availabilityStatus === 'Disponível'
    );
  },

  /**
   * Busca um imóvel por ID.
   */
  async getPropertyById(id: string, client?: SupabaseClient | null): Promise<Property | null> {
    const cleanId = id.trim().toUpperCase();
    if (isSupabaseConfigured()) {
      const db = client || supabase;
      if (db) {
        const { data, error } = await db
          .from('properties')
          .select('*')
          .or(`id.eq.${id},property_code.eq.${id}`)
          .maybeSingle();

        if (!error && data) {
          return mapRowToProperty(data);
        }
      }
    }

    const found = INITIAL_PROPERTIES.find((p) => p.id === id || p.propertyCode.toUpperCase() === cleanId);
    return found || null;
  },

  /**
   * Busca um imóvel por código (ex: CS-101).
   */
  async getPropertyByCode(code: string, client?: SupabaseClient | null): Promise<Property | null> {
    const cleanCode = code.trim().toUpperCase();
    if (isSupabaseConfigured()) {
      const db = client || supabase;
      if (db) {
        const { data, error } = await db
          .from('properties')
          .select('*')
          .ilike('property_code', cleanCode)
          .single();

        if (!error && data) {
          return mapRowToProperty(data);
        }
      }
    }

    const found = INITIAL_PROPERTIES.find((p) => p.propertyCode.toUpperCase() === cleanCode);
    return found || null;
  },

  /**
   * Vincula um imóvel ao lead definindo-o como o contexto atual.
   */
  async linkPropertyToLead(
    leadId: string,
    propertyId: string,
    client?: SupabaseClient | null
  ): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const db = client || supabase;
      if (db) {
        // 1. Atualiza o lead com current_property_id
        await db
          .from('leads')
          .update({ current_property_id: propertyId })
          .eq('id', leadId);

        // 2. Insere/atualiza na tabela lead_properties
        await db
          .from('lead_properties')
          .upsert({
            lead_id: leadId,
            property_id: propertyId,
            interest_status: 'Interessado'
          }, { onConflict: 'lead_id,property_id' });

        return true;
      }
    }
    return true;
  },

  /**
   * Alterna o status do Anúncio Ativo (ON/OFF).
   */
  async toggleAdActive(
    propertyId: string,
    adActive: boolean,
    client?: SupabaseClient | null
  ): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const db = client || supabase;
      if (db) {
        const { error } = await db
          .from('properties')
          .update({ ad_active: adActive })
          .eq('id', propertyId);

        return !error;
      }
    }

    const found = INITIAL_PROPERTIES.find((p) => p.id === propertyId);
    if (found) {
      found.adActive = adActive;
    }
    return true;
  }
};
