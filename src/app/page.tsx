import Link from "next/link";
import { BookIcon } from "@/components/book-icon";
import { ErrorBox, Page, PlusIcon, buttonPrimary } from "@/components/ui";
import { requireSession } from "@/lib/auth";
import { wordsRu } from "@/lib/plural";
import { listWords, searchWords, type Word } from "@/lib/words";
import { FlashNotice } from "./flash-notice";
import { SearchBox } from "./search-box";

// Экран «Мои слова» (US-2) и первый вход без слов.

function flashMessage(params: Record<string, string | string[] | undefined>): string | null {
  const added = Number(params.added);
  if (Number.isInteger(added) && added > 0) return `Добавлено ${wordsRu(added)}`;
  if (params.saved) return "Изменения сохранены";
  if (params.deleted) return "Слово удалено";
  return null;
}

function EmptyState() {
  const steps = [
    "После урока добавьте новые слова и фразы",
    "AI составит с ними фразы на русском, как на работе",
    "Переводите на английский — трудные слова будут возвращаться чаще",
  ];
  return (
    <Page>
      <header className="px-5 pt-7 pb-3">
        <h1 className="font-serif text-[30px] leading-tight font-semibold tracking-[-0.01em]">Мои слова</h1>
      </header>
      <main className="flex flex-1 flex-col gap-7 px-5 pt-6">
        <div className="flex size-[88px] items-center justify-center rounded-3xl bg-accent-soft text-accent">
          <BookIcon />
        </div>
        <div className="flex flex-col gap-2.5">
          <h2 className="font-serif text-2xl leading-tight font-semibold">Здесь будут слова с ваших уроков</h2>
          <p className="text-base leading-normal text-muted">
            Тренажёр помогает перевести новые слова в активный словарь через рабочие фразы.
          </p>
        </div>
        <ol className="flex flex-col gap-4">
          {steps.map((step, i) => (
            <li key={step} className="flex items-start gap-3.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-white text-sm font-semibold">
                {i + 1}
              </span>
              <span className="pt-0.5 text-base leading-[1.45]">{step}</span>
            </li>
          ))}
        </ol>
      </main>
      <footer className="px-5 pt-4 pb-7">
        <Link href="/words/add" className={buttonPrimary}>
          <PlusIcon />
          Добавить слова с урока
        </Link>
      </footer>
    </Page>
  );
}

function WordRow({ word }: { word: Word }) {
  return (
    <li className="border-b border-line">
      <Link href={`/words/${word.id}`} className="group flex min-h-16 items-center gap-3 py-2.5">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[17px] font-medium break-words group-hover:text-accent">{word.term}</span>
          {word.translation && <span className="text-sm break-words text-muted">{word.translation}</span>}
        </span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-line-strong">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </Link>
    </li>
  );
}

export default async function WordsPage({ searchParams }: PageProps<"/">) {
  await requireSession();
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";

  let words: Word[];
  try {
    words = await listWords();
  } catch (e) {
    return (
      <Page>
        <main className="flex flex-col gap-5 px-5 pt-7">
          <h1 className="font-serif text-[30px] leading-tight font-semibold">Мои слова</h1>
          <ErrorBox>
            {e instanceof Error ? e.message : "Не удалось загрузить слова."}{" "}
            <Link href="/status" className="underline">Проверить состояние приложения</Link>
          </ErrorBox>
        </main>
      </Page>
    );
  }

  if (words.length === 0) return <EmptyState />;

  const shown = searchWords(words, query);
  const flash = flashMessage(params);

  return (
    <Page>
      <header className="flex flex-col gap-4 px-5 pt-7 pb-3">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="font-serif text-[30px] leading-tight font-semibold tracking-[-0.01em]">Мои слова</h1>
          <span className="text-sm text-muted">{wordsRu(words.length)}</span>
        </div>
        {flash && <FlashNotice message={flash} />}
        <SearchBox initialQuery={query} />
      </header>

      <main className="flex-1 px-5">
        {shown.length > 0 ? (
          <ul aria-label="Список слов">
            {shown.map((word) => (
              <WordRow key={word.id} word={word} />
            ))}
          </ul>
        ) : (
          <p className="py-6 text-base text-muted">Ничего не найдено по запросу «{query.trim()}».</p>
        )}
        <p className="py-6 text-center">
          <Link href="/status" className="text-sm text-muted underline-offset-4 hover:underline">
            Состояние приложения и выход
          </Link>
        </p>
      </main>

      <footer className="sticky bottom-0 border-t border-line bg-paper px-5 pt-4 pb-7">
        <Link href="/words/add" className={buttonPrimary}>
          <PlusIcon />
          Добавить слова
        </Link>
      </footer>
    </Page>
  );
}
