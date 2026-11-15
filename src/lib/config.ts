// Настройки приложения берутся только из переменных окружения.
// Значения PIN-кода и ключей не хранятся в коде и не попадают в репозиторий (ADR-006).

export type AuthConfig = {
  pin: string;
  sessionSecret: string;
};

export type SupabaseConfig = {
  url: string;
  secretKey: string;
};

const PIN_PATTERN = /^\d{4,12}$/;
const MIN_SESSION_SECRET_LENGTH = 32;

/** Что не так с настройкой входа. Пустой массив — всё настроено. Значения не раскрываются. */
export function getAuthConfigProblems(): string[] {
  const problems: string[] = [];
  const pin = process.env.APP_PIN?.trim();
  const secret = process.env.SESSION_SECRET?.trim();

  if (!pin) problems.push("не задана переменная APP_PIN");
  else if (!PIN_PATTERN.test(pin)) problems.push("APP_PIN должен состоять из 4–12 цифр");

  if (!secret) problems.push("не задана переменная SESSION_SECRET");
  else if (secret.length < MIN_SESSION_SECRET_LENGTH)
    problems.push(`SESSION_SECRET должен быть не короче ${MIN_SESSION_SECRET_LENGTH} символов`);

  return problems;
}

export function getAuthConfig(): AuthConfig | null {
  if (getAuthConfigProblems().length > 0) return null;
  return {
    pin: process.env.APP_PIN!.trim(),
    sessionSecret: process.env.SESSION_SECRET!.trim(),
  };
}

/**
 * Адрес проекта Supabase. Берётся только адрес сайта (https://abcdefgh.supabase.co):
 * если при копировании захватился путь вроде /rest/v1/, он отбрасывается, иначе запросы уходят не туда.
 */
export function normalizeSupabaseUrl(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = normalizeSupabaseUrl(process.env.SUPABASE_URL ?? "");
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !secretKey) return null;
  return { url, secretKey };
}
