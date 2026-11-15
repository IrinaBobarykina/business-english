import { requireSession } from "@/lib/auth";
import { getDbStatus, getDeployInfo, type DbStatus } from "@/lib/health";
import { BackLink, Page } from "@/components/ui";
import { wordsRu } from "@/lib/plural";
import { logout } from "../actions";

// Состояние приложения (ET-14): вход, подключение к базе, версия деплоя. Здесь же — выход.

function dbStatusText(status: DbStatus): { ok: boolean; text: string } {
  switch (status.state) {
    case "ok":
      return { ok: true, text: `подключена, в базе ${wordsRu(status.wordCount)}` };
    case "not_configured":
      return { ok: false, text: "не настроена: нет SUPABASE_URL или SUPABASE_SECRET_KEY" };
    case "no_schema":
      return { ok: false, text: "подключена, но таблиц нет: выполните SQL-миграцию" };
    case "error":
      return { ok: false, text: `ошибка подключения: ${status.message}` };
  }
}

function StatusRow({ label, ok, text }: { label: string; ok: boolean; text: string }) {
  return (
    <li className="flex items-start gap-3 border-b border-line py-3.5 last:border-b-0">
      <span
        aria-hidden="true"
        className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${
          ok ? "bg-accent-soft text-accent" : "bg-warn-bg text-warn-ink"
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          {ok ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <path d="M12 7v6M12 17v.5" />}
        </svg>
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-base font-medium">{label}</span>
        <span className="text-sm leading-[1.45] break-words text-muted">
          <span className="sr-only">{ok ? "Работает: " : "Требует внимания: "}</span>
          {text}
        </span>
      </div>
    </li>
  );
}

export default async function StatusPage() {
  await requireSession();
  const dbText = dbStatusText(await getDbStatus());
  const deploy = getDeployInfo();

  return (
    <Page>
      <header className="flex flex-col gap-3.5 px-5 pt-5 pb-2">
        <BackLink />
        <h1 className="font-serif text-[28px] leading-tight font-semibold tracking-[-0.01em]">Состояние приложения</h1>
      </header>

      <main className="flex flex-1 flex-col gap-7 px-5 pt-4 pb-7">
        <ul aria-label="Состояние" className="rounded-[14px] border border-line bg-white px-4">
          <StatusRow label="Вход по PIN-коду" ok text="работает" />
          <StatusRow label="База данных" ok={dbText.ok} text={dbText.text} />
          <StatusRow
            label="Деплой"
            ok
            text={deploy.commit ? `${deploy.environment}, версия ${deploy.commit}` : deploy.environment}
          />
        </ul>

        <form action={logout} className="mt-auto">
          <button
            type="submit"
            className="flex h-[52px] w-full items-center justify-center rounded-xl border border-line-strong bg-white text-base font-medium transition-colors hover:border-ink/40"
          >
            Выйти
          </button>
        </form>
      </main>
    </Page>
  );
}
