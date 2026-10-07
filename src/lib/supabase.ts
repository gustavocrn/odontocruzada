import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseUrl.startsWith('https://') &&
    supabaseKey &&
    supabaseKey.length > 15
  );
};

export const getSupabaseConfigStatus = () => {
  const configured = isSupabaseConfigured();
  const isPublishable = Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  return {
    isConfigured: configured,
    mode: configured ? ('real' as const) : ('local_demo' as const),
    keyType: isPublishable ? 'publishable (sb_publishable_...)' : 'anon',
    url: configured ? supabaseUrl : 'Não configurado'
  };
};

export const createAuthenticatedSupabaseClient = (authToken: string): SupabaseClient | null => {
  if (!isSupabaseConfigured()) return null;
  const token = authToken.startsWith('Bearer ') ? authToken.substring(7) : authToken;
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : null;

