// Отметка тестового режима, пока AI не подключён (ET-15).
export function StubNotice() {
  return (
    <p className="rounded-xl border border-dashed border-line-strong px-3.5 py-2.5 text-sm leading-[1.45] text-muted">
      Тестовый режим: AI ещё не подключён, фразы и проверка — заглушка.
    </p>
  );
}
