"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export function PinForm({ next, configProblems }: { next: string; configProblems: string[] }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, undefined);
  const notConfigured = configProblems.length > 0;
  const error = state?.error;

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      <div className="flex flex-col gap-2">
        <label htmlFor="pin" className="text-[15px] font-medium">
          PIN-код
        </label>
        <input
          id="pin"
          name="pin"
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="current-password"
          maxLength={12}
          required
          autoFocus
          disabled={notConfigured}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "pin-error" : undefined}
          className="h-14 w-full rounded-xl border border-line-strong bg-white px-4 text-center text-2xl tracking-[0.4em] text-ink placeholder:text-line-strong disabled:opacity-60 aria-[invalid=true]:border-warn-ink"
        />
      </div>

      {(notConfigured || error) && (
        <div
          id="pin-error"
          role="alert"
          className="flex gap-3 rounded-[14px] bg-warn-bg p-4 text-warn-ink"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="mt-px shrink-0"
          >
            <path d="M12 3l9.5 17h-19z" />
            <path d="M12 10v4M12 17.5v.5" />
          </svg>
          {notConfigured ? (
            <div className="flex flex-col gap-1">
              <span className="text-base font-semibold">Вход не настроен</span>
              <span className="text-sm leading-[1.45]">
                {configProblems.join("; ")}. Инструкция — в README репозитория.
              </span>
            </div>
          ) : (
            <span className="text-base font-semibold">{error}</span>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={pending || notConfigured}
        className="flex h-[52px] items-center justify-center rounded-xl bg-accent text-base font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Проверяем…" : "Войти"}
      </button>
    </form>
  );
}
