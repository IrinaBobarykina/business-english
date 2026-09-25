import { requireSession } from "@/lib/auth";
import { getDbStatus, getDeployInfo, type DbStatus } from "@/lib/health";
import { logout } from "./actions";

// Каркас v0.1 (ET-14): после входа по PIN-коду показывает, что приложение, база и деплой работают.
// Экран «Мои слова» появится в задачах на US-1 и US-2.

function wordsRu(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} слово`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} слова`;
  return `${n} слов`;
}

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

export default async function HomePage() {
  await requireSession();
  const dbText = dbStatusText(await getDbStatus());
  const deploy = getDeployInfo();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">
      <header className="flex items-center justify-between gap-3 px-5 pt-7 pb-3">
        <h1 className="font-serif text-[26px] leading-tight font-semibold tracking-[-0.01em] whitespace-nowrap">
          Business English
        </h1>
        <form action={logout}>
          <button
            type="submit"
            className="flex h-11 items-center rounded-full border border-line-strong px-4 text-[15px] font-medium transition-colors hover:bg-white"
          >
            Выйти
          </button>
        </form>
      </header>

      <main className="flex flex-col gap-7 px-5 pt-8 pb-7">
        <div className="flex flex-col gap-2.5">
          <h2 className="font-serif text-2xl leading-tight font-semibold">Каркас приложения готов</h2>
          <p className="text-base leading-normal text-muted">
            Здесь появится список ваших слов. Следующие шаги — добавление слов с урока, список слов и
            тренировка «Как сказать на английском?».
          </p>
        </div>

        <section aria-labelledby="status-title" className="flex flex-col gap-2">
          <h3 id="status-title" className="text-[15px] font-medium text-muted">
            Состояние
          </h3>
          <ul className="rounded-[14px] border border-line bg-white px-4">
            <StatusRow label="Вход по PIN-коду" ok text="работает" />
            <StatusRow label="База данных" ok={dbText.ok} text={dbText.text} />
            <StatusRow
              label="Деплой"
              ok
              text={deploy.commit ? `${deploy.environment}, версия ${deploy.commit}` : deploy.environment}
            />
          </ul>
        </section>
      </main>
    </div>
  );
}
