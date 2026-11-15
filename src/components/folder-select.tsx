"use client";

import { useState } from "react";
import { inputBase } from "@/components/ui";

// Выбор папки (US-3) для форм добавления и редактирования слова.
// Значение "__new__" означает новую папку, её название — в поле newFolder.

export type FolderOption = { id: string; name: string };

export function FolderSelect({
  folders,
  defaultValue = "",
}: {
  folders: FolderOption[];
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="folder" className="text-[15px] font-medium">
        Папка
      </label>
      <div className="relative">
        <select
          id="folder"
          name="folder"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={`${inputBase} h-12 appearance-none pr-10`}
        >
          <option value="">Без папки</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
          <option value="__new__">+ Новая папка</option>
        </select>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-muted">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
      {value === "__new__" && (
        <input
          name="newFolder"
          aria-label="Название новой папки"
          placeholder="Например, Урок 13"
          required
          maxLength={100}
          autoFocus
          className={`${inputBase} h-12`}
        />
      )}
    </div>
  );
}
