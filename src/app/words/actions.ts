"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { UUID } from "@/lib/db";
import { createFolder } from "@/lib/folders";
import {
  MAX_NOTE_LENGTH,
  MAX_TERM_LENGTH,
  MAX_TRANSLATION_LENGTH,
  planAdd,
} from "@/lib/word-parse";
import { DuplicateWordError, addWords, deleteWord, listWords, updateWord } from "@/lib/words";

export type FormState = { error: string } | undefined;

/** Значение поля «Папка» для новой папки; название — в поле newFolder. */
const NEW_FOLDER = "__new__";

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Что-то пошло не так. Попробуйте ещё раз.";
}

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

/** Папка из формы: существующая, новая (создаётся) или без папки. */
async function folderFromForm(formData: FormData): Promise<string | null> {
  const choice = text(formData, "folder");
  if (choice === NEW_FOLDER) return (await createFolder(text(formData, "newFolder"))).id;
  return UUID.test(choice) ? choice : null;
}

/** US-1: добавление слов списком (US-3: в выбранную папку). */
export async function addWordsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession();
  const input = String(formData.get("words") ?? "");

  let added: number;
  let folderId: string | null;
  try {
    const existing = await listWords();
    const plan = planAdd(input, existing.map((w) => w.term));
    if (plan.toAdd.length === 0) {
      if (plan.duplicates.length > 0) return { error: "Все эти слова уже есть в списке." };
      if (plan.tooLong.length > 0) return { error: "Строки слишком длинные: слово — до 200 символов, перевод — до 300." };
      return { error: "Введите хотя бы одно слово." };
    }
    folderId = await folderFromForm(formData);
    added = await addWords(plan.toAdd, folderId);
  } catch (e) {
    return { error: errorMessage(e) };
  }
  redirect(folderId ? `/?folder=${folderId}&added=${added}` : `/?added=${added}`);
}

/** US-2: редактирование слова (US-3: перенос в другую папку). */
export async function updateWordAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession();
  const term = text(formData, "term").replace(/\s+/g, " ");
  const translation = text(formData, "translation").replace(/\s+/g, " ");
  const note = text(formData, "note");

  if (!term) return { error: "Слово не может быть пустым." };
  if (term.length > MAX_TERM_LENGTH) return { error: `Слово — не длиннее ${MAX_TERM_LENGTH} символов.` };
  if (translation.length > MAX_TRANSLATION_LENGTH) return { error: `Перевод — не длиннее ${MAX_TRANSLATION_LENGTH} символов.` };
  if (note.length > MAX_NOTE_LENGTH) return { error: `Заметка — не длиннее ${MAX_NOTE_LENGTH} символов.` };

  try {
    const folderId = await folderFromForm(formData);
    await updateWord(id, { term, translation: translation || null, note: note || null, folder_id: folderId });
  } catch (e) {
    if (e instanceof DuplicateWordError) return { error: e.message };
    return { error: errorMessage(e) };
  }
  redirect("/?saved=1");
}

/** US-2: удаление слова. */
export async function deleteWordAction(id: string): Promise<void> {
  await requireSession();
  await deleteWord(id);
  redirect("/?deleted=1");
}
