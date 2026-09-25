import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthConfig, type AuthConfig } from "@/lib/config";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  isValidSessionToken,
} from "@/lib/session";

// Проверка входа рядом с данными (Data Access Layer). proxy.ts отсекает запросы без сессии заранее,
// но каждая серверная страница, action и API-метод всё равно вызывает requireSession().

export async function hasValidSession(): Promise<boolean> {
  // cookies() читается первым: так страница всегда рендерится на каждый запрос, а не заранее при сборке.
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const auth = getAuthConfig();
  if (!auth) return false;
  return isValidSessionToken(token, auth.sessionSecret, auth.pin);
}

export async function requireSession(): Promise<void> {
  if (!(await hasValidSession())) redirect("/login");
}

export async function startSession(auth: AuthConfig): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, createSessionToken(auth.sessionSecret, auth.pin), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
