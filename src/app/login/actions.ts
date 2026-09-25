"use server";

import { redirect } from "next/navigation";
import { startSession } from "@/lib/auth";
import { getAuthConfig } from "@/lib/config";
import { clearFailures, getLockout, recordFailure } from "@/lib/pin-throttle";
import { pinMatches } from "@/lib/session";

export type LoginState = { error: string } | undefined;

const FAILURE_DELAY_MS = 800;

function minutesRu(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} минуту`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} минуты`;
  return `${n} минут`;
}

/** Возврат после входа только на страницы этого же приложения. */
function safeNextPath(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/";
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const auth = getAuthConfig();
  if (!auth) return { error: "Вход не настроен. Проверьте переменные окружения APP_PIN и SESSION_SECRET." };

  const lockout = await getLockout();
  if (lockout.locked) {
    return {
      error: `Слишком много неверных попыток. Попробуйте через ${minutesRu(lockout.retryAfterMinutes)}.`,
    };
  }

  const pin = String(formData.get("pin") ?? "").trim();
  if (!pinMatches(pin, auth.pin)) {
    await recordFailure();
    await new Promise((resolve) => setTimeout(resolve, FAILURE_DELAY_MS));
    return { error: "Неверный PIN-код" };
  }

  await clearFailures();
  await startSession(auth);
  redirect(safeNextPath(formData.get("next")));
}
