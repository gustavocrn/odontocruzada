import {
  Lead,
  LeadStatus,
  LeadClassification,
  FollowUpTask,
  LeadActivity,
  LeadNote,
  LeadSource,
  PurchaseTimeline,
  PurchaseForm,
  CreditStatus
} from '../types';
import { INITIAL_LEADS, INITIAL_TASKS } from '../data/mockData';
import { supabase, isSupabaseConfigured, getSupabaseConfigStatus } from '../lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';
import { clearConversationMessagesForLead } from './sdr/conversationService';

// Local reactive fallback store
let localLeads: Lead[] = typeof window !== 'undefined'
  ? JSON.parse(localStorage.getItem('gc_sdr_leads') || 'null') || INITIAL_LEADS
  : INITIAL_LEADS;

let localTasks: FollowUpTask[] = typeof window !== 'undefined'
  ? JSON.parse(localStorage.getItem('gc_sdr_tasks') || 'null') || INITIAL_TASKS
  : INITIAL_TASKS;

const saveLocalStorage = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('gc_sdr_leads', JSON.stringify(localLeads));
    localStorage.setItem('gc_sdr_tasks', JSON.stringify(localTasks));
  }
};

// Helper to format Supabase row into Lead object
const formatSupabaseLeadRow = (row: any): Lead => {
  const demand = row.property_demands?.[0] || row.property_demands || {};
  const financial = row.financial_qualifications?.[0] || row.financial_qualifications || {};
  const activities = (row.activities || []).map((a: any) => ({
    id: a.id,
    timestamp: a.timestamp,
    author: a.author,
    action: a.action,
    type: a.type
  }));
  const notes = (row.notes || []).map((n: any) => ({
    id: n.id,
    timestamp: n.timestamp,
    author: n.author,
    content: n.content
  }));

  const currentPropertyRow = row.current_property || row.properties;
  const currentProperty = currentPropertyRow ? {
    id: currentPropertyRow.id,
    propertyCode: currentPropertyRow.property_code || currentPropertyRow.propertyCode || '',
    title: currentPropertyRow.title || '',
    propertyType: currentPropertyRow.property_type || currentPropertyRow.propertyType || '',
    neighborhood: currentPropertyRow.neighborhood || '',
    city: currentPropertyRow.city || 'Ponta Grossa',
    price: Number(currentPropertyRow.price || 0),
    bedrooms: Number(currentPropertyRow.bedrooms || 0),
    suites: Number(currentPropertyRow.suites || 0),
    parkingSpaces: Number(currentPropertyRow.parking_spaces || currentPropertyRow.parkingSpaces || 0),
    bathrooms: Number(currentPropertyRow.bathrooms || 0),
    description: currentPropertyRow.description || '',
    keyFeatures: Array.isArray(currentPropertyRow.key_features) ? currentPropertyRow.key_features : [],
    mainImageUrl: currentPropertyRow.main_image_url || currentPropertyRow.mainImageUrl || undefined,
    availabilityStatus: currentPropertyRow.availability_status || currentPropertyRow.availabilityStatus || 'Disponível',
    adActive: Boolean(currentPropertyRow.ad_active ?? currentPropertyRow.adActive ?? false),
    showPriceToCustomer: Boolean(currentPropertyRow.show_price_to_customer ?? currentPropertyRow.showPriceToCustomer ?? true),
    createdAt: currentPropertyRow.created_at || new Date().toISOString(),
    updatedAt: currentPropertyRow.updated_at || new Date().toISOString()
  } : undefined;

  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    source: (row.source as LeadSource) || 'Cadastro manual',
    campaign: row.campaign || '',
    ad: row.ad || '',
    externalId: row.external_id || '',
    sourceNotes: row.source_notes || '',
    classification: (row.classification as LeadClassification) || 'nao_classificado',
    status: (row.status as LeadStatus) || 'Novo',
    purchaseTimeline: (row.purchase_timeline as PurchaseTimeline) || 'Não informado',
    nextAction: row.next_action || '',
    currentPropertyId: row.current_property_id || undefined,
    currentProperty,
    demand: {
      purpose: demand.purpose || 'Moradia',
      propertyType: demand.property_type && demand.property_type.trim() ? demand.property_type : '',
      city: demand.city && demand.city.trim() ? demand.city : '',
      regions: Array.isArray(demand.regions) ? demand.regions : [],
      bedrooms: typeof demand.bedrooms === 'number' ? demand.bedrooms : 0,
      needsSuite: Boolean(demand.needs_suite),
      parkingSpaces: typeof demand.parking_spaces === 'number' ? demand.parking_spaces : 0,
      minPrice: Number(demand.min_price) || 0,
      maxPrice: Number(demand.max_price) || 0,
      keyFeatures: Array.isArray(demand.key_features) ? demand.key_features : [],
      propertyNotes: demand.property_notes || ''
    },
    financial: {
      purchaseForm: (financial.purchase_form as PurchaseForm) || 'Ainda não sabe',
      hasDownPayment: Boolean(financial.has_down_payment),
      downPaymentAmount: Number(financial.down_payment_amount) || 0,
      intendsToIncreaseDownPayment: Boolean(financial.intends_to_increase_down_payment),
      downPaymentNotes: financial.down_payment_notes || '',
      hasFGTS: Boolean(financial.has_fgts),
      intendsToUseFGTS: Boolean(financial.intends_to_use_fgts),
      fgtsAmount: Number(financial.fgts_amount) || 0,
      fgtsStatus: financial.fgts_status || 'Não informado',
      hasVehicleOrAsset: Boolean(financial.has_vehicle_or_asset),
      assetDescription: financial.asset_description || '',
      assetAmount: Number(financial.asset_amount) || 0,
      hasSimulated: Boolean(financial.has_simulated),
      hasCreditAnalysis: Boolean(financial.has_credit_analysis),
      bankInstitution: financial.bank_institution || '',
      creditStatus: (financial.credit_status as CreditStatus) || 'Não informado',
      approvedAmount: Number(financial.approved_amount) || 0,
      analysisStage: financial.analysis_stage || 'nao_oferecido',
      idDocType: financial.id_doc_type || null,
      docChecklist: financial.doc_checklist || {
        id_doc: false,
        cpf: false,
        residence_proof: false,
        paystub: false,
        work_card: false,
        civil_cert: false
      },
      simpleSimData: financial.simple_sim_data || {
        paystub_recent: false,
        birth_date: null,
        has_dependents: null,
        work_years_over_3: null
      },
      docRequestedAt: financial.doc_requested_at || null,
      lastClientResponseAt: financial.last_client_response_at || null,
      clientWillSendLater: Boolean(financial.client_will_send_later),
      followup30mSent: Boolean(financial.followup_30m_sent)
    },
    scheduledFollowupAt: row.scheduled_followup_at || null,
    scheduledPeriod: row.scheduled_period || null,
    followupCycleId: row.followup_cycle_id || null,
    cycleFollowupCount: Number(row.cycle_followup_count) || 0,
    totalFollowupCount: Number(row.total_followup_count) || 0,
    lastFollowupAt: row.last_followup_at || null,
    aiPaused: Boolean(row.ai_paused),
    waId: row.wa_id || undefined,
    phoneE164: row.phone_e164 || undefined,
    lastClientMessageAt: row.last_client_message_at || undefined,
    whatsappWindowExpiresAt: row.whatsapp_window_expires_at || undefined,
    ctwaClid: row.ctwa_clid || undefined,
    metaAdId: row.meta_ad_id || undefined,
    activities,
    notes
  };
};

export const leadService = {
  // Check Connection Status
  getStatus() {
    return getSupabaseConfigStatus();
  },

  // Get all leads (From Supabase when configured, otherwise from local store)
  async getLeads(
    filters?: {
      search?: string;
      status?: LeadStatus | 'todos';
      classification?: LeadClassification | 'todos';
      source?: string;
      timeline?: string;
      maxBudget?: number;
    },
    client?: SupabaseClient | null
  ): Promise<Lead[]> {
    const db = client || supabase;
    if (isSupabaseConfigured() && db) {
      try {
        let query = db
          .from('leads')
          .select(`
            *,
            property_demands (*),
            financial_qualifications (*),
            activities (*),
            notes (*)
          `)
          .order('updated_at', { ascending: false });

        if (filters?.status && filters.status !== 'todos') {
          query = query.eq('status', filters.status);
        }

        if (filters?.classification && filters.classification !== 'todos') {
          query = query.eq('classification', filters.classification);
        }

        if (filters?.source && filters.source !== 'todos') {
          query = query.eq('source', filters.source);
        }

        if (filters?.timeline && filters.timeline !== 'todos') {
          query = query.eq('purchase_timeline', filters.timeline);
        }

        const { data, error } = await query;
        if (error) throw error;

        let formatted = (data || []).map(formatSupabaseLeadRow);

        if (filters?.search) {
          const term = filters.search.toLowerCase();
          formatted = formatted.filter(
            (l) => l.name.toLowerCase().includes(term) || l.phone.includes(term)
          );
        }

        return formatted;
      } catch (err) {
        console.error('Erro ao consultar Supabase leads:', err);
        return [];
      }
    }

    // Local Store Fallback
    let result = [...localLeads];

    if (filters?.search) {
      const term = filters.search.toLowerCase();
      result = result.filter(
        (l) => l.name.toLowerCase().includes(term) || l.phone.includes(term)
      );
    }

    if (filters?.status && filters.status !== 'todos') {
      result = result.filter((l) => l.status === filters.status);
    }

    if (filters?.classification && filters.classification !== 'todos') {
      result = result.filter((l) => l.classification === filters.classification);
    }

    if (filters?.source && filters.source !== 'todos') {
      result = result.filter((l) => l.source === filters.source);
    }

    if (filters?.timeline && filters.timeline !== 'todos') {
      result = result.filter((l) => l.purchaseTimeline === filters.timeline);
    }

    return result;
  },

  // Get lead by ID
  async getLeadById(id: string, client?: SupabaseClient | null): Promise<Lead | null> {
    const db = client || supabase;
    if (isSupabaseConfigured() && db) {
      try {
        const { data, error } = await db
          .from('leads')
          .select(`
            *,
            property_demands (*),
            financial_qualifications (*),
            activities (*),
            notes (*)
          `)
          .eq('id', id)
          .single();

        if (data && !error) {
          return formatSupabaseLeadRow(data);
        }
      } catch (err) {
        console.warn('Erro ao consultar lead no Supabase:', err);
      }
    }

    const found = localLeads.find((l) => l.id === id);
    return found || null;
  },

  // Get lead by wa_id or phone_e164
  async getLeadByWaIdOrPhone(
    waId: string,
    phoneE164?: string,
    client?: SupabaseClient | null
  ): Promise<Lead | null> {
    const db = client || supabase;
    if (isSupabaseConfigured() && db) {
      try {
        if (waId) {
          const { data, error } = await db
            .from('leads')
            .select(`*, property_demands (*), financial_qualifications (*), activities (*), notes (*)`)
            .eq('wa_id', waId)
            .maybeSingle();

          if (data && !error) return formatSupabaseLeadRow(data);
        }

        if (phoneE164) {
          const { data, error } = await db
            .from('leads')
            .select(`*, property_demands (*), financial_qualifications (*), activities (*), notes (*)`)
            .eq('phone_e164', phoneE164)
            .maybeSingle();

          if (data && !error) return formatSupabaseLeadRow(data);
        }
      } catch (err) {
        console.warn('Erro ao consultar lead por wa_id ou phone_e164:', err);
      }
    }

    const found = localLeads.find(
      (l) => (waId && l.waId === waId) || (phoneE164 && l.phoneE164 === phoneE164) || (phoneE164 && l.phone === phoneE164)
    );
    return found || null;
  },

  // Create a new Lead
  async createLead(newLeadData: Partial<Lead>, client?: SupabaseClient | null): Promise<Lead> {
    const timestamp = new Date().toISOString();
    const db = client || supabase;

    if (isSupabaseConfigured() && db) {
      try {
        // Insert main lead
        const { data: leadRow, error: leadErr } = await db
          .from('leads')
          .insert({
            name: newLeadData.name || 'Sem nome',
            phone: newLeadData.phone || '(00) 00000-0000',
            wa_id: newLeadData.waId || null,
            phone_e164: newLeadData.phoneE164 || newLeadData.phone || null,
            email: newLeadData.email || null,
            source: newLeadData.source || 'Cadastro manual',
            campaign: newLeadData.campaign || null,
            ad: newLeadData.ad || null,
            external_id: newLeadData.externalId || null,
            source_notes: newLeadData.sourceNotes || null,
            ctwa_clid: newLeadData.ctwaClid || null,
            meta_ad_id: newLeadData.metaAdId || null,
            classification: newLeadData.classification || 'nao_classificado',
            status: newLeadData.status || 'Novo',
            purchase_timeline: newLeadData.purchaseTimeline || 'Não informado',
            next_action: newLeadData.nextAction || 'Realizar primeiro contato',
            current_property_id: newLeadData.currentPropertyId || null
          })
          .select()
          .single();

        if (leadErr || !leadRow) throw leadErr;
        const createdId = leadRow.id;

        // Insert demand ONLY if explicitly provided
        if (newLeadData.demand) {
          const demand = newLeadData.demand;
          await db.from('property_demands').insert({
            lead_id: createdId,
            purpose: demand.purpose || 'Moradia',
            property_type: demand.propertyType || '',
            city: demand.city || '',
            regions: demand.regions || [],
            bedrooms: typeof demand.bedrooms === 'number' ? demand.bedrooms : 0,
            needs_suite: Boolean(demand.needsSuite),
            parking_spaces: typeof demand.parkingSpaces === 'number' ? demand.parkingSpaces : 0,
            min_price: demand.minPrice || 0,
            max_price: demand.maxPrice || 0,
            key_features: demand.keyFeatures || [],
            property_notes: demand.propertyNotes || ''
          });
        }

        // Insert financial ONLY if explicitly provided
        if (newLeadData.financial) {
          const fin = newLeadData.financial;
          await db.from('financial_qualifications').insert({
            lead_id: createdId,
            purchase_form: fin.purchaseForm || 'Ainda não sabe',
            has_down_payment: Boolean(fin.hasDownPayment),
            down_payment_amount: fin.downPaymentAmount || 0,
            intends_to_increase_down_payment: Boolean(fin.intendsToIncreaseDownPayment),
            down_payment_notes: fin.downPaymentNotes || '',
            has_fgts: Boolean(fin.hasFGTS),
            intends_to_use_fgts: Boolean(fin.intendsToUseFGTS),
            fgts_amount: fin.fgtsAmount || 0,
            fgts_status: fin.fgtsStatus || 'Não informado',
            has_vehicle_or_asset: Boolean(fin.hasVehicleOrAsset),
            asset_description: fin.assetDescription || '',
            asset_amount: fin.assetAmount || 0,
            has_simulated: Boolean(fin.hasSimulated),
            has_credit_analysis: Boolean(fin.hasCreditAnalysis),
            bank_institution: fin.bankInstitution || '',
            credit_status: fin.creditStatus || 'Não informado',
            approved_amount: fin.approvedAmount || 0,
            analysis_stage: fin.analysisStage || 'nao_oferecido',
            id_doc_type: fin.idDocType || null,
            doc_checklist: fin.docChecklist || {
              id_doc: false,
              cpf: false,
              residence_proof: false,
              paystub: false,
              work_card: false,
              civil_cert: false
            },
            simple_sim_data: fin.simpleSimData || {
              paystub_recent: false,
              birth_date: null,
              has_dependents: null,
              work_years_over_3: null
            },
            doc_requested_at: fin.docRequestedAt || null,
            last_client_response_at: fin.lastClientResponseAt || null,
            client_will_send_later: Boolean(fin.clientWillSendLater),
            followup_30m_sent: Boolean(fin.followup30mSent)
          });
        }

        // Insert initial activity log
        await db.from('activities').insert({
          lead_id: createdId,
          author: 'Gustavo Carneiro',
          action: 'Lead cadastrado manualmente no sistema',
          type: 'creation'
        });

        const createdSupabaseLead = await this.getLeadById(createdId, db);
        if (createdSupabaseLead) return createdSupabaseLead;
      } catch (err) {
        console.warn('Erro ao inserir no Supabase:', err);
      }
    }

    // Local Fallback
    const id = `lead-${Date.now()}`;
    const createdLead: Lead = {
      id,
      name: newLeadData.name || 'Sem nome',
      phone: newLeadData.phone || '(00) 00000-0000',
      email: newLeadData.email || '',
      createdAt: timestamp,
      updatedAt: timestamp,
      source: newLeadData.source || 'Cadastro manual',
      campaign: newLeadData.campaign || '',
      ad: newLeadData.ad || '',
      externalId: newLeadData.externalId || '',
      sourceNotes: newLeadData.sourceNotes || '',
      waId: newLeadData.waId || undefined,
      phoneE164: newLeadData.phoneE164 || newLeadData.phone || undefined,
      ctwaClid: newLeadData.ctwaClid || undefined,
      metaAdId: newLeadData.metaAdId || undefined,
      currentPropertyId: newLeadData.currentPropertyId || undefined,
      demand: newLeadData.demand || {
        purpose: 'Moradia',
        propertyType: '',
        city: '',
        regions: [],
        bedrooms: 0,
        needsSuite: false,
        parkingSpaces: 0,
        minPrice: 0,
        maxPrice: 0,
        keyFeatures: [],
        propertyNotes: ''
      },
      financial: newLeadData.financial || {
        purchaseForm: 'Ainda não sabe',
        hasDownPayment: false,
        downPaymentAmount: 0,
        intendsToIncreaseDownPayment: false,
        hasFGTS: false,
        intendsToUseFGTS: false,
        fgtsAmount: 0,
        fgtsStatus: 'Não informado',
        hasVehicleOrAsset: false,
        assetAmount: 0,
        hasSimulated: false,
        hasCreditAnalysis: false,
        creditStatus: 'Não informado',
        approvedAmount: 0
      },
      purchaseTimeline: newLeadData.purchaseTimeline || 'Não informado',
      classification: newLeadData.classification || 'nao_classificado',
      status: newLeadData.status || 'Novo',
      nextAction: newLeadData.nextAction || 'Realizar primeiro contato',
      activities: [
        {
          id: `act-${Date.now()}`,
          timestamp,
          author: 'Gustavo Carneiro',
          action: 'Lead cadastrado manualmente no sistema',
          type: 'creation'
        }
      ],
      notes: []
    };

    localLeads.unshift(createdLead);
    saveLocalStorage();
    return createdLead;
  },

  // Update existing Lead
  async updateLead(id: string, updates: Partial<Lead>, client?: SupabaseClient | null): Promise<Lead | null> {
    const db = client || supabase;
    const current = await this.getLeadById(id, db);
    if (!current) return null;

    const timestamp = new Date().toISOString();

    if (isSupabaseConfigured() && db) {
      try {
        // Update main lead fields
        await db
          .from('leads')
          .update({
            name: updates.name ?? current.name,
            phone: updates.phone ?? current.phone,
            email: updates.email ?? current.email,
            source: updates.source ?? current.source,
            classification: updates.classification ?? current.classification,
            status: updates.status ?? current.status,
            purchase_timeline: updates.purchaseTimeline ?? current.purchaseTimeline,
            next_action: updates.nextAction ?? current.nextAction,
            scheduled_followup_at: updates.scheduledFollowupAt !== undefined ? updates.scheduledFollowupAt : current.scheduledFollowupAt,
            scheduled_period: updates.scheduledPeriod !== undefined ? updates.scheduledPeriod : current.scheduledPeriod,
            followup_cycle_id: updates.followupCycleId !== undefined ? updates.followupCycleId : current.followupCycleId,
            cycle_followup_count: updates.cycleFollowupCount !== undefined ? updates.cycleFollowupCount : current.cycleFollowupCount,
            total_followup_count: updates.totalFollowupCount !== undefined ? updates.totalFollowupCount : current.totalFollowupCount,
            last_followup_at: updates.lastFollowupAt !== undefined ? updates.lastFollowupAt : current.lastFollowupAt,
            ai_paused: updates.aiPaused !== undefined ? updates.aiPaused : current.aiPaused,
            last_client_message_at: updates.lastClientMessageAt !== undefined ? updates.lastClientMessageAt : current.lastClientMessageAt,
            whatsapp_window_expires_at: updates.whatsappWindowExpiresAt !== undefined ? updates.whatsappWindowExpiresAt : current.whatsappWindowExpiresAt,
            wa_id: updates.waId !== undefined ? updates.waId : current.waId,
            phone_e164: updates.phoneE164 !== undefined ? updates.phoneE164 : current.phoneE164,
            current_property_id: updates.currentPropertyId !== undefined ? updates.currentPropertyId : current.currentPropertyId
          })
          .eq('id', id);

        // Update demand if present
        if (updates.demand) {
          const d = updates.demand;
          await db
            .from('property_demands')
            .update({
              purpose: d.purpose,
              property_type: d.propertyType,
              city: d.city,
              regions: d.regions,
              bedrooms: d.bedrooms,
              needs_suite: d.needsSuite,
              parking_spaces: d.parkingSpaces,
              min_price: d.minPrice,
              max_price: d.maxPrice,
              key_features: d.keyFeatures,
              property_notes: d.propertyNotes
            })
            .eq('lead_id', id);
        }

        // Update financial if present
        if (updates.financial) {
          const f = updates.financial;
          await db
            .from('financial_qualifications')
            .update({
              purchase_form: f.purchaseForm,
              has_down_payment: f.hasDownPayment,
              down_payment_amount: f.downPaymentAmount,
              intends_to_increase_down_payment: f.intendsToIncreaseDownPayment,
              down_payment_notes: f.downPaymentNotes,
              has_fgts: f.hasFGTS,
              intends_to_use_fgts: f.intendsToUseFGTS,
              fgts_amount: f.fgtsAmount,
              fgts_status: f.fgtsStatus,
              has_vehicle_or_asset: f.hasVehicleOrAsset,
              asset_description: f.assetDescription,
              asset_amount: f.assetAmount,
              has_simulated: f.hasSimulated,
              has_credit_analysis: f.hasCreditAnalysis,
              bank_institution: f.bankInstitution,
              credit_status: f.creditStatus,
              approved_amount: f.approvedAmount,
              analysis_stage: f.analysisStage,
              id_doc_type: f.idDocType,
              doc_checklist: f.docChecklist,
              simple_sim_data: f.simpleSimData,
              doc_requested_at: f.docRequestedAt,
              last_client_response_at: f.lastClientResponseAt,
              client_will_send_later: f.clientWillSendLater,
              followup_30m_sent: f.followup30mSent
            })
            .eq('lead_id', id);
        }

        // Log audit activities
        if (updates.status && updates.status !== current.status) {
          await db.from('activities').insert({
            lead_id: id,
            author: 'Gustavo Carneiro',
            action: `Status alterado de "${current.status}" para "${updates.status}"`,
            type: 'status_change'
          });
        }

        if (updates.classification && updates.classification !== current.classification) {
          await db.from('activities').insert({
            lead_id: id,
            author: 'Gustavo Carneiro',
            action: `Classificação alterada para "${updates.classification.toUpperCase()}"`,
            type: 'classification_change'
          });
        }

        return this.getLeadById(id, db);
      } catch (err) {
        console.warn('Erro ao atualizar Supabase:', err);
      }
    }

    // Local fallback update
    const index = localLeads.findIndex((l) => l.id === id);
    if (index === -1) return null;

    const newActivities: LeadActivity[] = [...(current.activities || [])];
    if (updates.status && updates.status !== current.status) {
      newActivities.unshift({
        id: `act-${Date.now()}`,
        timestamp,
        author: 'Gustavo Carneiro',
        action: `Status alterado de "${current.status}" para "${updates.status}"`,
        type: 'status_change'
      });
    }

    if (updates.classification && updates.classification !== current.classification) {
      newActivities.unshift({
        id: `act-${Date.now()}-class`,
        timestamp,
        author: 'Gustavo Carneiro',
        action: `Classificação alterada para "${updates.classification.toUpperCase()}"`,
        type: 'classification_change'
      });
    }

    const updatedLead: Lead = {
      ...current,
      ...updates,
      updatedAt: timestamp,
      activities: newActivities
    };

    localLeads[index] = updatedLead;
    saveLocalStorage();
    return updatedLead;
  },

  // Add Note to Lead
  async addNote(leadId: string, content: string, client?: SupabaseClient | null): Promise<Lead | null> {
    const timestamp = new Date().toISOString();
    const db = client || supabase;

    if (isSupabaseConfigured() && db) {
      try {
        await db.from('notes').insert({
          lead_id: leadId,
          author: 'Gustavo Carneiro',
          content
        });

        await db.from('activities').insert({
          lead_id: leadId,
          author: 'Gustavo Carneiro',
          action: `Nova anotação registrada: "${content.slice(0, 40)}..."`,
          type: 'note'
        });

        return this.getLeadById(leadId, db);
      } catch (err) {
        console.warn('Erro ao adicionar nota no Supabase:', err);
      }
    }

    // Local fallback
    const lead = await this.getLeadById(leadId);
    if (!lead) return null;

    const newNote: LeadNote = {
      id: `note-${Date.now()}`,
      timestamp,
      author: 'Gustavo Carneiro',
      content
    };

    return this.updateLead(leadId, {
      notes: [newNote, ...(lead.notes || [])]
    });
  },

  // Get Tasks
  async getTasks(client?: SupabaseClient | null): Promise<FollowUpTask[]> {
    const db = client || supabase;
    if (isSupabaseConfigured() && db) {
      try {
        const { data, error } = await db
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((t: any) => ({
            id: t.id,
            leadId: t.lead_id,
            leadName: t.lead_name,
            type: t.type,
            date: t.date,
            time: t.time,
            description: t.description,
            status: t.status,
            priority: t.priority,
            createdAt: t.created_at
          }));
        }
      } catch (err) {
        console.warn('Erro ao carregar tarefas do Supabase:', err);
      }
    }

    return [...localTasks];
  },

  // Create Task
  async createTask(taskData: Partial<FollowUpTask>, client?: SupabaseClient | null): Promise<FollowUpTask> {
    const timestamp = new Date().toISOString();
    const db = client || supabase;

    if (isSupabaseConfigured() && db) {
      try {
        const { data, error } = await db
          .from('tasks')
          .insert({
            lead_id: taskData.leadId,
            lead_name: taskData.leadName || 'Sem nome',
            type: taskData.type || 'Ligar',
            date: taskData.date || new Date().toISOString().split('T')[0],
            time: taskData.time || '10:00',
            description: taskData.description || '',
            status: taskData.status || 'Pendente',
            priority: taskData.priority || 'Média'
          })
          .select()
          .single();

        if (!error && data) {
          return {
            id: data.id,
            leadId: data.lead_id,
            leadName: data.lead_name,
            type: data.type,
            date: data.date,
            time: data.time,
            description: data.description,
            status: data.status,
            priority: data.priority,
            createdAt: data.created_at
          };
        }
      } catch (err) {
        console.warn('Erro ao criar tarefa no Supabase:', err);
      }
    }

    // Local fallback
    const newTask: FollowUpTask = {
      id: `task-${Date.now()}`,
      leadId: taskData.leadId || '',
      leadName: taskData.leadName || 'Lead Sem Nome',
      type: taskData.type || 'Ligar',
      date: taskData.date || new Date().toISOString().split('T')[0],
      time: taskData.time || '10:00',
      description: taskData.description || '',
      status: taskData.status || 'Pendente',
      priority: taskData.priority || 'Média',
      createdAt: timestamp
    };

    localTasks.unshift(newTask);
    saveLocalStorage();
    return newTask;
  },

  // Update Task Status
  async updateTaskStatus(taskId: string, status: FollowUpTask['status'], client?: SupabaseClient | null): Promise<FollowUpTask | null> {
    const db = client || supabase;
    if (isSupabaseConfigured() && db) {
      try {
        await db.from('tasks').update({ status }).eq('id', taskId);
      } catch (err) {
        console.warn('Erro ao atualizar tarefa no Supabase:', err);
      }
    }

    const index = localTasks.findIndex((t) => t.id === taskId);
    if (index !== -1) {
      localTasks[index].status = status;
      saveLocalStorage();
      return localTasks[index];
    }
    return null;
  },

  // Reset simulation state for a lead
  async resetSimulation(leadId: string, client?: SupabaseClient | null): Promise<boolean> {
    const db = client || supabase;
    if (isSupabaseConfigured() && db) {
      try {
        await db.from('conversation_messages').delete().eq('lead_id', leadId);
        await db.from('tasks').delete().eq('lead_id', leadId);
        await db.from('activities').delete().eq('lead_id', leadId);
        await db.from('property_demands').delete().eq('lead_id', leadId);
        await db.from('financial_qualifications').delete().eq('lead_id', leadId);
        await db.from('leads').update({
          classification: 'nao_classificado',
          status: 'Qualificando',
          current_property_id: null,
          next_action: null,
          purchase_timeline: 'Não informado',
          scheduled_followup_at: null,
          scheduled_period: null,
          followup_cycle_id: null,
          cycle_followup_count: 0,
          total_followup_count: 0,
          last_followup_at: null,
          ai_paused: false
        }).eq('id', leadId);
      } catch (err) {
        console.error('Erro ao reiniciar simulação no Supabase:', err);
      }
    }

    const index = localLeads.findIndex((l) => l.id === leadId);
    if (index !== -1) {
      localLeads[index] = {
        ...localLeads[index],
        classification: 'nao_classificado',
        status: 'Qualificando',
        purchaseTimeline: 'Não informado',
        nextAction: '',
        currentPropertyId: undefined,
        currentProperty: undefined,
        scheduledFollowupAt: null,
        scheduledPeriod: null,
        followupCycleId: null,
        cycleFollowupCount: 0,
        totalFollowupCount: 0,
        lastFollowupAt: null,
        aiPaused: false,
        demand: {
          purpose: 'Moradia',
          propertyType: '',
          city: '',
          regions: [],
          bedrooms: 0,
          needsSuite: false,
          parkingSpaces: 0,
          minPrice: 0,
          maxPrice: 0,
          keyFeatures: [],
          propertyNotes: ''
        },
        financial: {
          purchaseForm: 'Ainda não sabe',
          hasDownPayment: false,
          downPaymentAmount: 0,
          intendsToIncreaseDownPayment: false,
          hasFGTS: false,
          intendsToUseFGTS: false,
          fgtsAmount: 0,
          fgtsStatus: 'Não informado',
          hasVehicleOrAsset: false,
          assetAmount: 0,
          hasSimulated: false,
          hasCreditAnalysis: false,
          creditStatus: 'Não informado',
          approvedAmount: 0,
          analysisStage: 'nao_oferecido',
          idDocType: null,
          docChecklist: {
            id_doc: false,
            cpf: false,
            residence_proof: false,
            paystub: false,
            work_card: false,
            civil_cert: false
          },
          simpleSimData: {
            paystub_recent: false,
            birth_date: null,
            has_dependents: null,
            work_years_over_3: null
          },
          docRequestedAt: null,
          lastClientResponseAt: null,
          clientWillSendLater: false,
          followup30mSent: false
        },
        activities: [],
        notes: []
      };
      localTasks = localTasks.filter((t) => t.leadId !== leadId);
      clearConversationMessagesForLead(leadId);
      saveLocalStorage();
    }
    return true;
  }
};

