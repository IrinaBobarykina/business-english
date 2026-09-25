import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// Сессия после ввода PIN-кода — подписанная cookie без данных пользователя:
// «<срок действия>.<подпись>». Учётных записей в v0.1 нет (PRD, раздел 5).
// Модуль используется и в proxy.ts, и на сервере, поэтому без "server-only".

export const SESSION_COOKIE = "be_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 дней

// Ключ подписи зависит от PIN-кода: после смены APP_PIN все открытые сессии перестают действовать.
function signingKey(sessionSecret: string, pin: string): Buffer {
  return createHmac("sha256", sessionSecret).update(`pin:${pin}`).digest();
}

function sign(payload: string, sessionSecret: string, pin: string): Buffer {
  return createHmac("sha256", signingKey(sessionSecret, pin))
    .update(`session:v1:${payload}`)
    .digest();
}

export function createSessionToken(sessionSecret: string, pin: string, now = Date.now()): string {
  const expiresAt = String(now + SESSION_MAX_AGE_SECONDS * 1000);
  return `${expiresAt}.${sign(expiresAt, sessionSecret, pin).toString("base64url")}`;
}

export function isValidSessionToken(
  token: string | undefined,
  sessionSecret: string,
  pin: string,
  now = Date.now(),
): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [expiresAt, signature] = parts;
  if (!/^\d{1,16}$/.test(expiresAt) || Number(expiresAt) <= now) return false;

  const expected = sign(expiresAt, sessionSecret, pin);
  const given = Buffer.from(signature, "base64url");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Сравнение PIN-кодов за постоянное время, чтобы по скорости ответа нельзя было подобрать цифры. */
export function pinMatches(input: string, pin: string): boolean {
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(pin).digest();
  return timingSafeEqual(a, b);
}
