"use client";

import { useEffect } from "react";

const FLASH_PARAMS = ["added", "saved", "deleted", "folderCreated", "folderSaved", "folderDeleted"];

// Сообщение после действия («Добавлено 5 слов»). Параметр сообщения убирается из адреса,
// чтобы оно не появлялось снова при обновлении страницы; остальные параметры (папка, поиск) остаются.
export function FlashNotice({ message }: { message: string }) {
  useEffect(() => {
    const url = new URL(window.location.href);
    for (const p of FLASH_PARAMS) url.searchParams.delete(p);
    window.history.replaceState(null, "", url.pathname + url.search);
  }, []);

  return (
    <p role="status" className="rounded-xl bg-accent-soft px-4 py-3 text-[15px] font-medium text-ink">
      {message}
    </p>
  );
}
