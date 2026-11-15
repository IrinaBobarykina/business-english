"use client";

import { useState } from "react";
import { buttonSecondary } from "@/components/ui";
import { wordsRu } from "@/lib/plural";
import { deleteFolderAction } from "../actions";

// Удаление папки с подтверждением. Слова из папки не удаляются, а остаются в списке без папки.
export function DeleteFolder({ id, name, wordCount }: { id: string; name: string; wordCount: number }) {
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
    <section aria-label="Удаление папки" className="mt-auto pt-8 pb-7">
      {confirm ? (
        <form
          action={deleteFolderAction.bind(null, id)}
          onSubmit={() => setDeleting(true)}
          className="flex flex-col gap-3 rounded-[14px] border border-line bg-white p-4"
        >
          <p className="text-base leading-normal">
            Удалить папку «{name}»?{" "}
            {wordCount > 0
              ? `${wordsRu(wordCount)} из неё останутся в списке без папки.`
              : "В ней нет слов."}
          </p>
          <div className="flex gap-3">
            <button type="button" onClick={() => setConfirm(false)} disabled={deleting} className={`${buttonSecondary} flex-1`}>
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
          onClick={() => setConfirm(true)}
          className="flex min-h-11 items-center gap-2 text-[15px] font-medium text-warn-ink hover:underline"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
          </svg>
          Удалить папку
        </button>
      )}
    </section>
  );
}
