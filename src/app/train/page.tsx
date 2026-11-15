import { BackLink, Page } from "@/components/ui";
import { StubNotice } from "@/components/stub-notice";
import { getAi } from "@/lib/ai";
import { requireSession } from "@/lib/auth";
import { listFolders } from "@/lib/folders";
import { DEFAULT_PHRASE_COUNT, PHRASE_COUNTS } from "@/lib/training";
import { listWords } from "@/lib/words";
import { SetupForm } from "./setup-form";

// Настройка тренировки «Как сказать на английском?» (US-4): набор слов и число фраз.
export default async function TrainSetupPage({ searchParams }: PageProps<"/train">) {
  await requireSession();
  const { folder } = await searchParams;
  const [words, folders] = await Promise.all([listWords(), listFolders()]);

  const sets = [
    { id: "", name: "Все слова", count: words.length },
    ...folders.map((f) => ({ id: f.id, name: f.name, count: words.filter((w) => w.folder_id === f.id).length })),
  ];
  const defaultSet = sets.find((s) => s.id && s.id === folder && s.count > 0)?.id ?? "";

  return (
    <Page>
      <header className="flex flex-col gap-3.5 px-5 pt-5 pb-2">
        <BackLink href={defaultSet ? `/?folder=${defaultSet}` : "/"} />
        <h1 className="font-serif text-[28px] leading-tight font-semibold tracking-[-0.01em]">
          Как сказать на английском?
        </h1>
        <p className="text-[15px] leading-normal text-muted">
          AI составит рабочие фразы на русском с вашими словами. Переводите их на английский.
        </p>
        {getAi().isStub && <StubNotice />}
      </header>
      <SetupForm sets={sets} defaultSet={defaultSet} counts={[...PHRASE_COUNTS]} defaultCount={DEFAULT_PHRASE_COUNT} />
    </Page>
  );
}
