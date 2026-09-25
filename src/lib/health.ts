import "server-only";
import { getSupabase } from "@/lib/supabase";

export type DbStatus =
  | { state: "ok"; wordCount: number }
  | { state: "not_configured" }
  | { state: "no_schema" }
  | { state: "error"; message: string };

/** Проверка подключения к Supabase: таблица words доступна и считается число слов. */
export async function getDbStatus(): Promise<DbStatus> {
  const db = getSupabase();
  if (!db) return { state: "not_configured" };

  try {
    const { count, error } = await db.from("words").select("id", { count: "exact", head: true });
    if (!error) return { state: "ok", wordCount: count ?? 0 };
    // PGRST205 / 42P01 — таблицы нет: SQL-миграция ещё не выполнена.
    if (error.code === "PGRST205" || error.code === "42P01") return { state: "no_schema" };
    return { state: "error", message: error.message || "неизвестная ошибка" };
  } catch (e) {
    return { state: "error", message: e instanceof Error ? e.message : "неизвестная ошибка" };
  }
}

export function getDeployInfo() {
  const env = process.env.VERCEL_ENV;
  const sha = process.env.VERCEL_GIT_COMMIT_SHA;
  return {
    environment:
      env === "production" ? "Production" : env === "preview" ? "Preview" : "Локальный запуск",
    commit: sha ? sha.slice(0, 7) : null,
  };
}
