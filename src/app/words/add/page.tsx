import { BackLink, ErrorBox, Page } from "@/components/ui";
import { requireSession } from "@/lib/auth";
import { listFolders, type Folder } from "@/lib/folders";
import { listWords } from "@/lib/words";
import { AddWordsForm } from "./add-words-form";

// Экран «Добавить слова с урока» (US-1), с выбором папки (US-3).
export default async function AddWordsPage({ searchParams }: PageProps<"/words/add">) {
  await requireSession();
  const { folder } = await searchParams;

  let existingTerms: string[] | null = null;
  let folders: Folder[] = [];
  try {
    [existingTerms, folders] = await Promise.all([
      listWords().then((words) => words.map((w) => w.term)),
      listFolders(),
    ]);
  } catch {
    existingTerms = null;
  }
  // Папка по умолчанию — та, из которой пришли на экран (если она есть).
  const defaultFolder = folders.find((f) => f.id === folder)?.id ?? "";

  return (
    <Page>
      <header className="flex flex-col gap-3.5 px-5 pt-5 pb-2">
        <BackLink href={defaultFolder ? `/?folder=${defaultFolder}` : "/"} />
        <h1 className="font-serif text-[28px] leading-tight font-semibold tracking-[-0.01em]">Слова с урока</h1>
      </header>
      {existingTerms ? (
        <AddWordsForm
          existingTerms={existingTerms}
          folders={folders.map(({ id, name }) => ({ id, name }))}
          defaultFolder={defaultFolder}
        />
      ) : (
        <main className="px-5 pt-2">
          <ErrorBox>Не удалось загрузить список слов. Обновите страницу чуть позже.</ErrorBox>
        </main>
      )}
    </Page>
  );
}
