import "server-only";
import { getSupabase } from "@/lib/supabase";

// Общее для модулей доступа к данным.

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const UNIQUE_VIOLATION = "23505";
export const FOREIGN_KEY_VIOLATION = "23503";

export function db() {
  const client = getSupabase();
  if (!client) throw new Error("База данных не настроена: нет SUPABASE_URL или SUPABASE_SECRET_KEY");
  return client;
}
