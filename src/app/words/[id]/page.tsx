import { notFound } from "next/navigation";
import { BackLink, Page } from "@/components/ui";
import { requireSession } from "@/lib/auth";
import { listFolders } from "@/lib/folders";
import { getWord } from "@/lib/words";
import { EditWordForm } from "./edit-word-form";

// Экран слова: редактирование и удаление (US-2).
export default async function WordPage({ params }: PageProps<"/words/[id]">) {
  await requireSession();
  const { id } = await params;
  const [word, folders] = await Promise.all([getWord(id), listFolders()]);
  if (!word) notFound();

  const addedAt = new Date(word.created_at).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Madrid",
  });

  return (
    <Page>
      <header className="flex flex-col gap-3.5 px-5 pt-5 pb-2">
        <BackLink />
        <h1 className="font-serif text-[28px] leading-tight font-semibold tracking-[-0.01em] break-words">
          {word.term}
        </h1>
        <p className="text-sm text-muted">Добавлено {addedAt}</p>
      </header>
      <EditWordForm word={word} folders={folders.map(({ id, name }) => ({ id, name }))} />
    </Page>
  );
}
