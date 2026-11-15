import { BackLink, Page } from "@/components/ui";
import { requireSession } from "@/lib/auth";
import { createFolderAction } from "../actions";
import { FolderNameForm } from "../folder-name-form";

// Новая папка (US-3).
export default async function NewFolderPage() {
  await requireSession();
  return (
    <Page>
      <header className="flex flex-col gap-3.5 px-5 pt-5 pb-2">
        <BackLink />
        <h1 className="font-serif text-[28px] leading-tight font-semibold tracking-[-0.01em]">Новая папка</h1>
      </header>
      <main className="px-5 pt-3">
        <FolderNameForm action={createFolderAction} submitLabel="Создать папку" />
      </main>
    </Page>
  );
}
