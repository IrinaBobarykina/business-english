import { notFound } from "next/navigation";
import { BackLink, Page } from "@/components/ui";
import { requireSession } from "@/lib/auth";
import { getFolder } from "@/lib/folders";
import { wordsRu } from "@/lib/plural";
import { listWords } from "@/lib/words";
import { renameFolderAction } from "../actions";
import { FolderNameForm } from "../folder-name-form";
import { DeleteFolder } from "./delete-folder";

// Папка: переименование и удаление (US-3).
export default async function FolderPage({ params }: PageProps<"/folders/[id]">) {
  await requireSession();
  const { id } = await params;
  const [folder, words] = await Promise.all([getFolder(id), listWords()]);
  if (!folder) notFound();
  const count = words.filter((w) => w.folder_id === folder.id).length;

  return (
    <Page>
      <header className="flex flex-col gap-3.5 px-5 pt-5 pb-2">
        <BackLink href={`/?folder=${folder.id}`}>{folder.name}</BackLink>
        <h1 className="font-serif text-[28px] leading-tight font-semibold tracking-[-0.01em]">Папка</h1>
        <p className="text-sm text-muted">В папке {wordsRu(count)}</p>
      </header>
      <main className="flex flex-1 flex-col px-5 pt-3">
        <FolderNameForm
          action={renameFolderAction.bind(null, folder.id)}
          defaultName={folder.name}
          submitLabel="Сохранить"
        />
        <DeleteFolder id={folder.id} name={folder.name} wordCount={count} />
      </main>
    </Page>
  );
}
