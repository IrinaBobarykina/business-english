"use client";

import { useActionState, useState } from "react";
import { ErrorBox, buttonPrimary, inputBase } from "@/components/ui";
import type { FolderFormState } from "./actions";

// Форма названия папки: создание и переименование (US-3).
export function FolderNameForm({
  action,
  defaultName = "",
  submitLabel,
}: {
  action: (prev: FolderFormState, formData: FormData) => Promise<FolderFormState>;
  defaultName?: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<FolderFormState, FormData>(action, undefined);
  const [name, setName] = useState(defaultName);

  return (
    <form action={formAction} className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-[15px] font-medium">
          Название папки
        </label>
        <input
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Например, Урок 13 или Созвоны"
          required
          maxLength={100}
          autoFocus
          className={`${inputBase} h-12`}
        />
      </div>
      {state?.error && <ErrorBox>{state.error}</ErrorBox>}
      <button type="submit" disabled={pending || !name.trim()} className={buttonPrimary}>
        {pending ? "Сохраняем…" : submitLabel}
      </button>
    </form>
  );
}
