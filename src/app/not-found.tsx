import { BackLink, Page } from "@/components/ui";

export default function NotFound() {
  return (
    <Page>
      <main className="flex flex-col gap-4 px-5 pt-5">
        <BackLink />
        <h1 className="font-serif text-[28px] leading-tight font-semibold">Страница не найдена</h1>
        <p className="text-base leading-normal text-muted">
          Возможно, слово уже удалено или ссылка устарела.
        </p>
      </main>
    </Page>
  );
}
