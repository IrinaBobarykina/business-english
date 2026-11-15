"use client";

import { useEffect } from "react";

// Сообщение после действия («Добавлено 5 слов»). Параметр из адреса убирается,
// чтобы сообщение не появлялось снова при обновлении страницы.
export function FlashNotice({ message }: { message: string }) {
  useEffect(() => {
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  return (
    <p role="status" className="rounded-xl bg-accent-soft px-4 py-3 text-[15px] font-medium text-ink">
      {message}
    </p>
  );
}
