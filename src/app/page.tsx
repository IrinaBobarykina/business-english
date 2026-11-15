import Link from "next/link";
import { BookIcon } from "@/components/book-icon";
import { ErrorBox, Page, PlusIcon, buttonPrimary, buttonSecondary } from "@/components/ui";
import { requireSession } from "@/lib/auth";
import { wordsRu } from "@/lib/plural";
import { listFolders, type Folder } from "@/lib/folders";
import { loadRepetition } from "@/lib/training";
import { listWords, searchWords, type Word } from "@/lib/words";
import { FlashNotice } from "./flash-notice";
import { SearchBox } from "./search-box";

// Экран «Мои слова» (US-2), фильтр по папкам (US-3) и первый вход без слов.

function flashMessage(params: Record<string, string | string[] | undefined>): string | null {
  const added = Number(params.added);
  if (Number.isInteger(added) && added > 0) return `Добавлено ${wordsRu(added)}`;
  if (params.saved) return "Изменения сохранены";
  if (params.deleted) return "Слово удалено";
  if (params.folderCreated) return "Папка создана";
  if (params.folderSaved) return "Папка переименована";
  if (params.folderDeleted) return "Папка удалена, слова из неё остались в списке";
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

function RepeatBadge() {
  return (
    <span className="flex h-[26px] shrink-0 items-center gap-1.5 rounded-full bg-warn-bg px-2.5 text-[13px] font-medium text-orange-ink">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5" />
      </svg>
      повторить
    </span>
  );
}

function WordRow({ word, folderName, needsRepeat }: { word: Word; folderName?: string; needsRepeat?: boolean }) {
  const details = [word.translation, folderName].filter(Boolean).join(" · ");
  return (
    <li className="border-b border-line">
      <Link href={`/words/${word.id}`} className="group flex min-h-16 items-center gap-3 py-2.5">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[17px] font-medium break-words group-hover:text-accent">{word.term}</span>
          {details && <span className="text-sm break-words text-muted">{details}</span>}
        </span>
        {needsRepeat && <RepeatBadge />}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-line-strong">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </Link>
    </li>
  );
}

function FolderChips({ folders, active, query }: { folders: Folder[]; active: Folder | null; query: string }) {
  const href = (folderId?: string) => {
    const p = new URLSearchParams();
    if (folderId) p.set("folder", folderId);
    if (query.trim()) p.set("q", query.trim());
    const qs = p.toString();
    return qs ? `/?${qs}` : "/";
  };
  const chip = "flex h-9 shrink-0 items-center rounded-full border px-3.5 text-sm whitespace-nowrap transition-colors";
  const on = "border-accent bg-accent font-medium text-white";
  const off = "border-line bg-white text-ink hover:border-line-strong";

  return (
    <nav aria-label="Папки" className="-mx-5 overflow-x-auto px-5 [scrollbar-width:none]">
      <ul className="flex gap-2">
        <li>
          <Link href={href()} aria-current={active ? undefined : "page"} className={`${chip} ${active ? off : on}`}>
            Все
          </Link>
        </li>
        {folders.map((f) => (
          <li key={f.id}>
            <Link href={href(f.id)} aria-current={active?.id === f.id ? "page" : undefined} className={`${chip} ${active?.id === f.id ? on : off}`}>
              {f.name}
            </Link>
          </li>
        ))}
        <li>
          <Link
            href="/folders/new"
            aria-label="Новая папка"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-dashed border-[#B9B2A3] text-muted hover:text-ink"
          >
            <PlusIcon />
          </Link>
        </li>
      </ul>
    </nav>
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

  let folders: Folder[] = [];
  try {
    folders = await listFolders();
  } catch {
    folders = [];
  }
  const folderNames = new Map(folders.map((f) => [f.id, f.name]));
  let repetition: Awaited<ReturnType<typeof loadRepetition>> = new Map();
  try {
    repetition = await loadRepetition();
  } catch {
    repetition = new Map();
  }
  const activeFolder = folders.find((f) => f.id === params.folder) ?? null;

  const inScope = activeFolder ? words.filter((w) => w.folder_id === activeFolder.id) : words;
  const shown = searchWords(inScope, query);
  const flash = flashMessage(params);
  const addHref = activeFolder ? `/words/add?folder=${activeFolder.id}` : "/words/add";
  const trainHref = activeFolder ? `/train?folder=${activeFolder.id}` : "/train";

  return (
    <Page>
      <header className="flex flex-col gap-4 px-5 pt-7 pb-3">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="font-serif text-[30px] leading-tight font-semibold tracking-[-0.01em]">Мои слова</h1>
          <span className="text-sm text-muted">{wordsRu(inScope.length)}</span>
        </div>
        {flash && <FlashNotice message={flash} />}
        <SearchBox initialQuery={query} folderId={activeFolder?.id} />
        <FolderChips folders={folders} active={activeFolder} query={query} />
        {activeFolder && (
          <Link
            href={`/folders/${activeFolder.id}`}
            className="flex min-h-11 items-center gap-1.5 self-start text-[15px] font-medium text-accent hover:text-accent-hover"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 20h4L19 9l-4-4L4 16z" />
            </svg>
            Переименовать или удалить папку
          </Link>
        )}
      </header>

      <main className="flex-1 px-5">
        {shown.length > 0 ? (
          <ul aria-label="Список слов">
            {shown.map((word) => (
              <WordRow
                key={word.id}
                word={word}
                folderName={activeFolder ? undefined : (word.folder_id ? folderNames.get(word.folder_id) : undefined)}
                needsRepeat={repetition.get(word.id)?.needsRepeat}
              />
            ))}
          </ul>
        ) : query.trim() ? (
          <p className="py-6 text-base text-muted">Ничего не найдено по запросу «{query.trim()}».</p>
        ) : (
          <p className="py-6 text-base text-muted">В этой папке пока нет слов.</p>
        )}
        <p className="py-6 text-center">
          <Link href="/status" className="text-sm text-muted underline-offset-4 hover:underline">
            Состояние приложения и выход
          </Link>
        </p>
      </main>

      <footer className="sticky bottom-0 flex gap-3 border-t border-line bg-paper px-5 pt-4 pb-7">
        <Link href={addHref} className={`${buttonSecondary} flex-1 px-3`}>
          <PlusIcon />
          Добавить слова
        </Link>
        {inScope.length > 0 ? (
          <Link href={trainHref} className={`${buttonPrimary} flex-1 px-3`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5.5v13l10.5-6.5z" />
            </svg>
            Тренировать
          </Link>
        ) : (
          <span aria-disabled="true" className={`${buttonPrimary} flex-1 cursor-not-allowed px-3 opacity-50`}>
            Тренировать
          </span>
        )}
      </footer>
    </Page>
  );
}
