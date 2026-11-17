import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

// URL pública e chave publishable (não-secretas) mantidas como fallback seguro para deploys sem env explícita
const DEFAULT_SUPABASE_URL = 'https://fjtbdoeahdtellzbxpsy.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_3TfAipTG33KDBTbsgzP9oQ_aDipKcny';

function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
  return { supabaseUrl, supabaseAnonKey };
}

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return browserClient;
}

/**
 * Cliente browser singleton (compatível com cookies SSR via @supabase/ssr).
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabaseBrowserClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
