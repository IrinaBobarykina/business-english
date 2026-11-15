"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

// Поиск по словам (US-2): строка поиска меняет параметр ?q=, список фильтруется на сервере.
export function SearchBox({ initialQuery, folderId }: { initialQuery: string; folderId?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(initialQuery);
  const [, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function onChange(next: string) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const q = next.trim();
      startTransition(() => {
        const params = new URLSearchParams();
        if (folderId) params.set("folder", folderId);
        if (q) params.set("q", q);
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    }, 250);
  }

  return (
    <label className="flex h-12 items-center gap-2.5 rounded-xl border border-line bg-white px-3.5 text-muted focus-within:border-line-strong">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
      <input
        type="search"
        aria-label="Поиск по словам"
        placeholder="Поиск по словам"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 border-0 bg-transparent text-base text-ink outline-none placeholder:text-muted"
      />
    </label>
  );
}
