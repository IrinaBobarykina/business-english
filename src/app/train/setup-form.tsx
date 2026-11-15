"use client";

import { useActionState, useState } from "react";
import { ErrorBox, buttonPrimary } from "@/components/ui";
import { startTrainingAction, type StartState } from "./actions";

type WordSet = { id: string; name: string; count: number };

export function SetupForm({
  sets,
  defaultSet,
  counts,
  defaultCount,
}: {
  sets: WordSet[];
  defaultSet: string;
  counts: number[];
  defaultCount: number;
}) {
  const [state, action, pending] = useActionState<StartState, FormData>(startTrainingAction, undefined);
  const [set, setSet] = useState(defaultSet);
  const [count, setCount] = useState(defaultCount);
  const selected = sets.find((s) => s.id === set);
  const canStart = (selected?.count ?? 0) > 0;

  return (
    <form action={action} className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col gap-6 px-5 pt-4">
        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-2.5 text-[15px] font-medium">Какие слова</legend>
          {sets.map((s) => {
            const on = s.id === set;
            return (
              <label
                key={s.id || "all"}
                className={`flex h-[52px] cursor-pointer items-center justify-between gap-3 rounded-xl px-4 text-base has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${
                  on ? "border-2 border-accent bg-accent-soft" : "border border-line bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="set"
                  value={s.id}
                  checked={on}
                  disabled={s.count === 0}
                  onChange={() => setSet(s.id)}
                  className="sr-only"
                />
                <span className="truncate font-medium">{s.name}</span>
                <span className="shrink-0 text-sm text-muted">{s.count}</span>
              </label>
            );
          })}
        </fieldset>

        <fieldset className="flex flex-col">
          <legend className="mb-2.5 text-[15px] font-medium">Сколько фраз</legend>
          <div className="grid grid-cols-3 gap-2">
            {counts.map((n) => {
              const on = n === count;
              return (
                <label
                  key={n}
                  className={`flex h-12 cursor-pointer items-center justify-center rounded-xl border text-base font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${
                    on ? "border-accent bg-accent text-white" : "border-line bg-white text-ink"
                  }`}
                >
                  <input type="radio" name="count" value={n} checked={on} onChange={() => setCount(n)} className="sr-only" />
                  {n}
                </label>
              );
            })}
          </div>
        </fieldset>

        {selected && selected.count > 0 && selected.count < count && (
          <p className="text-sm leading-[1.45] text-muted">
            Слов меньше, чем фраз: некоторые слова встретятся несколько раз в разном рабочем контексте.
          </p>
        )}
        {state?.error && <ErrorBox>{state.error}</ErrorBox>}
      </main>

      <footer className="sticky bottom-0 bg-paper px-5 pt-4 pb-7">
        <button type="submit" disabled={!canStart || pending} className={`${buttonPrimary} w-full`}>
          {pending ? (
            "Готовим фразы…"
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5.5v13l10.5-6.5z" />
              </svg>
              Начать
            </>
          )}
        </button>
      </footer>
    </form>
  );
}
