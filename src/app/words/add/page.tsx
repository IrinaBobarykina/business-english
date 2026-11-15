import { BackLink, ErrorBox, Page } from "@/components/ui";
import { requireSession } from "@/lib/auth";
import { listWords } from "@/lib/words";
import { AddWordsForm } from "./add-words-form";

// Экран «Добавить слова с урока» (US-1).
export default async function AddWordsPage() {
  await requireSession();

  let existingTerms: string[] | null = null;
  try {
    existingTerms = (await listWords()).map((w) => w.term);
  } catch {
    existingTerms = null;
  }

  return (
    <Page>
      <header className="flex flex-col gap-3.5 px-5 pt-5 pb-2">
        <BackLink />
        <h1 className="font-serif text-[28px] leading-tight font-semibold tracking-[-0.01em]">Слова с урока</h1>
      </header>
      {existingTerms ? (
        <AddWordsForm existingTerms={existingTerms} />
      ) : (
        <main className="px-5 pt-2">
          <ErrorBox>Не удалось загрузить список слов. Обновите страницу чуть позже.</ErrorBox>
        </main>
      )}
    </Page>
  );
}
