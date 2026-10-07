import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (typeof window !== 'undefined') {
  throw new Error('PROIBIÇÃO DE SEGURANÇA: supabaseAdmin não pode ser importado nem executado no navegador (client-side).');
}

/**
 * Confirma se o Supabase Admin (service_role) está configurado no ambiente de servidor.
 */
export const isSupabaseAdminConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseUrl.startsWith('https://') &&
    serviceRoleKey &&
    serviceRoleKey.length > 15
  );
};

/**
 * Cria ou obtém o cliente Supabase Admin ativado com a chave SUPABASE_SERVICE_ROLE_KEY.
 * Exclusivamente server-side. Ignora RLS no banco e tem acesso à webhook_queue e claim_webhook_jobs.
 */
export const getSupabaseAdminClient = (): SupabaseClient | null => {
  if (!isSupabaseAdminConfigured()) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
};

/**
 * Instância singleton do cliente Supabase Admin server-side.
 */
export const supabaseAdmin: SupabaseClient | null = isSupabaseAdminConfigured()
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null;
