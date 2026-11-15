"use client";

import { useActionState, useMemo, useState } from "react";
import { ErrorBox, buttonPrimary } from "@/components/ui";
import { wordsRu } from "@/lib/plural";
import { MAX_LINES, planAdd } from "@/lib/word-parse";
import { addWordsAction, type FormState } from "../actions";

const PLACEHOLDER = "deliverables — результаты работы\nto circle back — вернуться к теме\nstakeholder";

function listPreview(items: string[], limit = 8): string {
  const shown = items.slice(0, limit).join(", ");
  return items.length > limit ? `${shown} и ещё ${items.length - limit}` : shown;
}

export function AddWordsForm({ existingTerms }: { existingTerms: string[] }) {
  const [text, setText] = useState("");
  const [state, action, pending] = useActionState<FormState, FormData>(addWordsAction, undefined);
  // Тот же расчёт, что и на сервере: что добавится, что уже есть в списке.
  const plan = useMemo(() => planAdd(text, existingTerms), [text, existingTerms]);
  const count = plan.toAdd.length;
  const hasInput = text.trim().length > 0;
  const lineCount = text.split(/\r?\n/).length;

  return (
    <form action={action} className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col gap-[18px] px-5 pt-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="words" className="text-[15px] font-medium">
            Слова и фразы
          </label>
          <span id="words-hint" className="text-sm leading-[1.45] text-muted">
            Одно слово или фраза на строку. Перевод — через тире, по желанию.
          </span>
          <textarea
            id="words"
            name="words"
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={PLACEHOLDER}
            aria-describedby="words-hint words-preview"
            autoFocus
            spellCheck={false}
            autoCapitalize="none"
            className="h-[232px] w-full resize-y rounded-xl border border-line-strong bg-white p-3.5 text-base leading-[1.6] text-ink placeholder:text-muted/60"
          />
        </div>

        {hasInput && (
          <div id="words-preview" aria-live="polite" className="flex flex-col gap-2 rounded-xl bg-accent-soft px-4 py-3.5">
            <span className="text-[15px] font-medium">Будет добавлено: {count}</span>
            {plan.duplicates.length > 0 && (
              <span className="text-sm leading-[1.45] text-[#3F4450]">
                Уже есть в списке и не добавится: {listPreview(plan.duplicates)}
              </span>
            )}
            {plan.tooLong.length > 0 && (
              <span className="text-sm leading-[1.45] text-[#3F4450]">
                Слишком длинные строки не добавятся: {listPreview(plan.tooLong)}
              </span>
            )}
            {lineCount > MAX_LINES && (
              <span className="text-sm leading-[1.45] text-[#3F4450]">
                За один раз добавляется до {MAX_LINES} строк, остальные не попадут в список.
              </span>
            )}
          </div>
        )}

        {state?.error && <ErrorBox>{state.error}</ErrorBox>}
      </main>

      <footer className="sticky bottom-0 bg-paper px-5 pt-4 pb-7">
        <button type="submit" disabled={count === 0 || pending} className={`${buttonPrimary} w-full`}>
          {pending ? "Добавляем…" : count > 0 ? `Добавить ${wordsRu(count)}` : "Добавить слова"}
        </button>
      </footer>
    </form>
  );
}
