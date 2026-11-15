"use client";

import { useActionState, useState } from "react";
import { ErrorBox, buttonPrimary, buttonSecondary, inputBase } from "@/components/ui";
import { MAX_NOTE_LENGTH, MAX_TERM_LENGTH, MAX_TRANSLATION_LENGTH } from "@/lib/word-parse";
import type { Word } from "@/lib/words";
import { deleteWordAction, updateWordAction, type FormState } from "../actions";

export function EditWordForm({ word }: { word: Word }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateWordAction.bind(null, word.id),
    undefined,
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
    <div className="flex flex-1 flex-col">
      <form action={action} className="flex flex-col gap-[18px] px-5 pt-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="term" className="text-[15px] font-medium">Слово или фраза</label>
          <input
            id="term"
            name="term"
            defaultValue={word.term}
            required
            maxLength={MAX_TERM_LENGTH}
            autoCapitalize="none"
            spellCheck={false}
            className={`${inputBase} h-12`}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="translation" className="text-[15px] font-medium">Перевод</label>
          <input
            id="translation"
            name="translation"
            defaultValue={word.translation ?? ""}
            maxLength={MAX_TRANSLATION_LENGTH}
            placeholder="Необязательно"
            className={`${inputBase} h-12`}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="note" className="text-[15px] font-medium">Заметка</label>
          <textarea
            id="note"
            name="note"
            defaultValue={word.note ?? ""}
            maxLength={MAX_NOTE_LENGTH}
            rows={3}
            placeholder="Например, пример из урока. Необязательно"
            className={`${inputBase} resize-y py-3 leading-normal`}
          />
        </div>

        {state?.error && <ErrorBox>{state.error}</ErrorBox>}

        <button type="submit" disabled={pending} className={buttonPrimary}>
          {pending ? "Сохраняем…" : "Сохранить"}
        </button>
      </form>

      <section aria-label="Удаление слова" className="mt-auto px-5 pt-8 pb-7">
        {confirmDelete ? (
          <form
            action={deleteWordAction.bind(null, word.id)}
            onSubmit={() => setDeleting(true)}
            className="flex flex-col gap-3 rounded-[14px] border border-line bg-white p-4"
          >
            <p className="text-base leading-normal">
              Удалить «{word.term}»? История ответов по этому слову тоже удалится.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className={`${buttonSecondary} flex-1`}
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={deleting}
                className="flex h-[52px] flex-1 items-center justify-center rounded-xl bg-warn-ink px-5 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {deleting ? "Удаляем…" : "Удалить"}
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex min-h-11 items-center gap-2 text-[15px] font-medium text-warn-ink hover:underline"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
            </svg>
            Удалить слово
          </button>
        )}
      </section>
    </div>
  );
}
