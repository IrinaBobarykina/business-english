"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { StubNotice } from "@/components/stub-notice";
import { ErrorBox, Page, buttonPrimary, buttonSecondary } from "@/components/ui";
import type { CheckResult, Verdict } from "@/lib/ai/types";
import { finishTrainingAction, skipPhraseAction, submitAnswerAction } from "../actions";

// Экраны тренировки (US-4): упражнение с подсказками → проверка ответа; ошибка AI; выход с подтверждением.

type Phase =
  | { kind: "question" }
  | { kind: "feedback"; result: CheckResult; answer: string; isLast: boolean }
  | { kind: "ai_error" };

const VERDICT: Record<Verdict, { label: string; className: string }> = {
  correct: { label: "Верно", className: "bg-ok-bg text-ok-ink" },
  unnatural: { label: "Смысл передан, звучит неестественно", className: "bg-warn-bg text-orange-ink" },
  incorrect: { label: "Неверно", className: "bg-bad-bg text-bad-ink" },
};

function ProgressHeader({ current, done, total, onExit }: { current: number; done: number; total: number; onExit: () => void }) {
  return (
    <header className="flex items-center gap-3 px-5 pt-4 pb-2">
      <button
        type="button"
        onClick={onExit}
        aria-label="Завершить тренировку"
        className="-ml-2.5 flex size-11 shrink-0 items-center justify-center rounded-full text-ink hover:bg-white"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      <div
        role="progressbar"
        aria-label="Прогресс тренировки"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"
      >
        <div className="h-1.5 rounded-full bg-accent transition-[width]" style={{ width: `${(done / total) * 100}%` }} />
      </div>
      <span className="text-sm whitespace-nowrap text-muted">
        {current} из {total}
      </span>
    </header>
  );
}

function ExitSheet({
  sessionId,
  answered,
  onCancel,
}: {
  sessionId: string;
  answered: number;
  onCancel: () => void;
}) {
  const continueRef = useRef<HTMLButtonElement>(null);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => continueRef.current?.focus(), []);

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center">
      <div aria-hidden="true" onClick={onCancel} className="absolute inset-0 bg-ink/45" />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-title"
        onKeyDown={(e) => e.key === "Escape" && onCancel()}
        className="relative flex w-full max-w-[480px] flex-col gap-4 rounded-t-3xl bg-white px-5 pt-3 pb-7"
      >
        <div aria-hidden="true" className="h-1 w-10 self-center rounded-full bg-[#D6D0C4]" />
        <h2 id="exit-title" className="font-serif text-2xl font-semibold">Завершить тренировку?</h2>
        <p className="text-base leading-normal text-[#3F4450]">
          {answered > 0
            ? `Ответы на уже пройденные фразы сохранятся и учтутся при повторении. `
            : ""}
          Продолжить эту сессию позже не получится.
        </p>
        <div className="flex flex-col gap-2.5 pt-1">
          <button ref={continueRef} type="button" onClick={onCancel} className={buttonPrimary}>
            Продолжить тренировку
          </button>
          <form action={finishTrainingAction.bind(null, sessionId)} onSubmit={() => setLeaving(true)}>
            <button type="submit" disabled={leaving} className={`${buttonSecondary} w-full`}>
              {leaving ? "Завершаем…" : "Завершить"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

export function TrainingScreen({
  sessionId,
  index,
  total,
  promptRu,
  term,
  firstLetters,
  isStub,
}: {
  sessionId: string;
  index: number;
  total: number;
  promptRu: string;
  term: string;
  firstLetters: string;
  isStub: boolean;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "question" });
  const [hints, setHints] = useState(0);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [exitOpen, setExitOpen] = useState(false);
  const [navigating, startNavigation] = useTransition();

  async function submit(text: string) {
    setBusy(true);
    setProblem(null);
    const outcome = await submitAnswerAction(sessionId, index, text, hints);
    setBusy(false);
    switch (outcome.status) {
      case "checked":
        setPhase({ kind: "feedback", result: outcome.result, answer: text.trim(), isLast: outcome.isLast });
        break;
      case "ai_error":
        setPhase({ kind: "ai_error" });
        break;
      case "stale":
        startNavigation(() => router.refresh());
        break;
      case "error":
        setProblem(outcome.message);
        break;
    }
  }

  async function skip() {
    setBusy(true);
    await skipPhraseAction(sessionId, index);
    startNavigation(() => router.refresh());
  }

  const next = () => startNavigation(() => router.refresh());
  const done = phase.kind === "feedback" ? index + 1 : index;

  return (
    <Page>
      <ProgressHeader current={index + 1} done={done} total={total} onExit={() => setExitOpen(true)} />

      {phase.kind === "feedback" ? (
        <>
          <main className="flex flex-1 flex-col gap-4 px-5 pt-5">
            <p className="font-serif text-[19px] leading-[1.35] text-[#3F4450]">{promptRu}</p>

            <section className="flex flex-col gap-2.5 rounded-[14px] border border-line bg-white p-4">
              <span className="text-[13px] font-medium tracking-[0.06em] text-muted uppercase">Ваш ответ</span>
              <span className="text-[17px] leading-[1.45] break-words">{phase.answer || "Не знаю"}</span>
              <div className="flex flex-col gap-1.5">
                <span
                  className={`inline-flex min-h-7 items-center self-start rounded-full px-2.5 text-sm font-medium ${VERDICT[phase.result.verdict].className}`}
                >
                  {VERDICT[phase.result.verdict].label}
                </span>
                {phase.answer && (
                  <span className="text-sm text-muted">
                    {phase.result.used_target_word ? "Целевое слово использовано" : "Целевое слово не использовано"}
                    {hints > 0 ? ` · подсказка ${hints} из 2` : ""}
                  </span>
                )}
              </div>
            </section>

            <section className="flex flex-col gap-2.5 rounded-[14px] bg-ok-bg p-4">
              <span className="text-[13px] font-medium tracking-[0.06em] text-ok-ink uppercase">Как сказать естественно</span>
              <span className="text-lg leading-[1.4] font-medium break-words text-ok-strong">{phase.result.reference}</span>
              {phase.result.alternatives.length > 0 && (
                <span className="text-[15px] leading-[1.45] text-[#2A4A40]">
                  Ещё варианты: {phase.result.alternatives.join(" · ")}
                </span>
              )}
            </section>

            {phase.result.explanation && (
              <p className="text-[15px] leading-normal text-[#3F4450]">{phase.result.explanation}</p>
            )}
          </main>
          <footer className="sticky bottom-0 bg-paper px-5 pt-4 pb-7">
            <button type="button" onClick={next} disabled={navigating} className={`${buttonPrimary} w-full`} autoFocus>
              {navigating ? "Загружаем…" : phase.isLast ? "Итог тренировки" : "Дальше"}
              {!navigating && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              )}
            </button>
          </footer>
        </>
      ) : (
        <form
          className="flex flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            if (answer.trim()) void submit(answer);
          }}
        >
          <main className="flex flex-1 flex-col gap-5 px-5 pt-7">
            {isStub && <StubNotice />}
            <p className="text-[15px] font-medium text-muted">Как сказать на английском?</p>
            <p className="font-serif text-[27px] leading-[1.3]">{promptRu}</p>

            {phase.kind === "question" && (
              <div className="flex min-h-11 flex-wrap items-center gap-2.5" aria-live="polite">
                {hints >= 1 && (
                  <span className="flex h-9 items-center rounded-[10px] border border-line bg-white px-3.5 text-[17px] font-medium tracking-[0.04em]">
                    {hints >= 2 ? term : firstLetters}
                  </span>
                )}
                {hints < 2 && (
                  <button
                    type="button"
                    onClick={() => setHints((h) => Math.min(2, h + 1))}
                    className="flex h-11 items-center gap-2 rounded-full border border-line-strong px-3.5 text-[15px] font-medium hover:bg-white"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M9 18h6M10 21h4" />
                      <path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" />
                    </svg>
                    {hints === 0 ? "Подсказка" : "Показать слово"}
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="answer" className="text-[15px] font-medium">
                Ваш перевод
              </label>
              <textarea
                id="answer"
                rows={4}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Напишите по-английски"
                autoFocus
                autoCapitalize="sentences"
                spellCheck={false}
                maxLength={1000}
                className="h-[132px] w-full resize-none rounded-xl border border-line-strong bg-white p-3.5 text-[17px] leading-normal text-ink placeholder:text-muted/70"
              />
            </div>

            {phase.kind === "ai_error" && (
              <ErrorBox>
                <span className="block text-base font-semibold">Не удалось проверить ответ</span>
                <span className="block text-sm font-normal">
                  AI не ответил. Ваш перевод на месте — можно попробовать ещё раз. Пропущенная фраза не попадёт в историю.
                </span>
              </ErrorBox>
            )}
            {problem && <ErrorBox>{problem}</ErrorBox>}
          </main>

          <footer className="sticky bottom-0 flex gap-3 bg-paper px-5 pt-4 pb-7">
            {phase.kind === "ai_error" ? (
              <>
                <button type="button" onClick={skip} disabled={busy || navigating} className={`${buttonSecondary} flex-1`}>
                  Пропустить
                </button>
                <button type="submit" disabled={busy || navigating || !answer.trim()} className={`${buttonPrimary} flex-[2]`}>
                  {busy ? "Проверяем…" : "Повторить"}
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => submit("")} disabled={busy || navigating} className={`${buttonSecondary} flex-1`}>
                  Не знаю
                </button>
                <button type="submit" disabled={busy || navigating || !answer.trim()} className={`${buttonPrimary} flex-[2]`}>
                  {busy ? "Проверяем…" : "Проверить"}
                </button>
              </>
            )}
          </footer>
        </form>
      )}

      {exitOpen && <ExitSheet sessionId={sessionId} answered={index} onCancel={() => setExitOpen(false)} />}
    </Page>
  );
}
