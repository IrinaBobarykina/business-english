import Link from "next/link";
import { Page, buttonPrimary, buttonSecondary } from "@/components/ui";
import { sessionAttempts, type Attempt, type Session } from "@/lib/training";
import { listWords } from "@/lib/words";

// Итог сессии (US-4): сколько верно, с подсказкой, с ошибкой; слова, которые вызвали трудности.

function difficultyNote(a: Attempt): string {
  if (a.verdict === "incorrect") return "неверно";
  if (a.verdict === "unnatural") return "звучит неестественно";
  return "открыто слово";
}

export async function Summary({ session }: { session: Session }) {
  const [attempts, words] = await Promise.all([sessionAttempts(session.id), listWords()]);
  const terms = new Map(words.map((w) => [w.id, w.term]));

  const answered = attempts.length;
  const correct = attempts.filter((a) => a.verdict === "correct").length;
  const withHint = attempts.filter((a) => a.hints_used > 0).length;
  const errors = attempts.filter((a) => a.is_error).length;
  const endedEarly = session.current_index < session.phrases.length;

  // Трудные слова: по одному на слово, с самой серьёзной ошибкой.
  const hard = new Map<string, Attempt>();
  const rank = (a: Attempt) => (a.verdict === "incorrect" ? 3 : a.verdict === "unnatural" ? 2 : 1);
  for (const a of attempts.filter((x) => x.is_error && terms.has(x.word_id))) {
    const prev = hard.get(a.word_id);
    if (!prev || rank(a) > rank(prev)) hard.set(a.word_id, a);
  }

  const again = session.folder_id ? `/train?folder=${session.folder_id}` : "/train";

  return (
    <Page>
      <main className="flex flex-1 flex-col gap-6 px-5 pt-14">
        <div className="flex flex-col gap-2">
          <span className="text-[15px] font-medium text-muted">
            {endedEarly ? "Тренировка завершена досрочно" : "Сессия завершена"}
          </span>
          {answered > 0 ? (
            <>
              <h1 className="font-serif text-[44px] leading-none font-semibold tracking-[-0.01em]">
                {correct} из {answered}
              </h1>
              <span className="text-base text-[#3F4450]">
                {answered % 10 === 1 && answered % 100 !== 11 ? "фразы" : "фраз"} переведено верно
              </span>
            </>
          ) : (
            <h1 className="font-serif text-[32px] leading-tight font-semibold">Ответов нет</h1>
          )}
        </div>

        {answered > 0 && (
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1 rounded-[14px] border border-line bg-white px-4 py-3.5">
              <span className="text-2xl font-semibold">{withHint}</span>
              <span className="text-sm text-muted">с подсказкой</span>
            </div>
            <div className="flex flex-col gap-1 rounded-[14px] border border-line bg-white px-4 py-3.5">
              <span className="text-2xl font-semibold">{errors}</span>
              <span className="text-sm text-muted">с ошибкой</span>
            </div>
          </div>
        )}

        {hard.size > 0 && (
          <section aria-labelledby="hard-title" className="flex flex-col gap-2.5">
            <h2 id="hard-title" className="text-base font-semibold">Повторим чаще</h2>
            <p className="text-sm leading-[1.45] text-muted">Эти слова будут чаще попадать в следующие сессии.</p>
            <ul className="flex flex-col">
              {[...hard.values()].map((a) => (
                <li key={a.word_id} className="flex min-h-14 items-center justify-between gap-3 border-b border-line">
                  <span className="text-[17px] font-medium break-words">{terms.get(a.word_id)}</span>
                  <span className="shrink-0 text-sm text-orange-ink">{difficultyNote(a)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <footer className="flex flex-col gap-2.5 px-5 pt-4 pb-7">
        <Link href={again} className={buttonPrimary}>
          Ещё сессия
        </Link>
        <Link href="/" className={buttonSecondary}>
          К моим словам
        </Link>
      </footer>
    </Page>
  );
}
