import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/config";

// База данных доступна только с сервера: секретный ключ Supabase никогда не уходит в браузер.
// В самой базе включён RLS без политик, поэтому публичный ключ Supabase не даёт доступа к данным.

let client: SupabaseClient | null = null;

/** Клиент Supabase или null, если переменные SUPABASE_URL и SUPABASE_SECRET_KEY не заданы. */
export function getSupabase(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config) return null;
  client ??= createClient(config.url, config.secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}
