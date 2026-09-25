import "server-only";
import { getSupabase } from "@/lib/supabase";

// Защита PIN-кода от перебора: после 5 неверных попыток за 15 минут вход временно закрыт.
// Счётчик хранится в таблице pin_failures, потому что на Vercel у сервера нет общей памяти между запросами.
// Если база недоступна, вход не блокируется (PIN-код всё равно проверяется), ошибка пишется в лог.

export const MAX_FAILURES = 5;
export const WINDOW_MINUTES = 15;

export type Lockout = { locked: false } | { locked: true; retryAfterMinutes: number };

function windowStart(now: number): string {
  return new Date(now - WINDOW_MINUTES * 60_000).toISOString();
}

export async function getLockout(now = Date.now()): Promise<Lockout> {
  const db = getSupabase();
  if (!db) return { locked: false };

  const { data, error } = await db
    .from("pin_failures")
    .select("created_at")
    .gte("created_at", windowStart(now))
    .order("created_at", { ascending: true })
    .limit(MAX_FAILURES);

  if (error) {
    console.error("pin-throttle: не удалось прочитать pin_failures", error.message);
    return { locked: false };
  }
  if (!data || data.length < MAX_FAILURES) return { locked: false };

  const unlockAt = new Date(data[0].created_at).getTime() + WINDOW_MINUTES * 60_000;
  return { locked: true, retryAfterMinutes: Math.max(1, Math.ceil((unlockAt - now) / 60_000)) };
}

export async function recordFailure(now = Date.now()): Promise<void> {
  const db = getSupabase();
  if (!db) return;
  const { error } = await db.from("pin_failures").insert({});
  if (error) console.error("pin-throttle: не удалось записать неудачную попытку", error.message);
  // Старые записи больше не нужны.
  await db.from("pin_failures").delete().lt("created_at", new Date(now - 24 * 3_600_000).toISOString());
}

export async function clearFailures(): Promise<void> {
  const db = getSupabase();
  if (!db) return;
  const { error } = await db.from("pin_failures").delete().not("id", "is", null);
  if (error) console.error("pin-throttle: не удалось очистить pin_failures", error.message);
}
