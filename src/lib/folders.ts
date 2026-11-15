import "server-only";
import { UNIQUE_VIOLATION, UUID, db } from "@/lib/db";

// Папки для слов (US-3). Вызывается только из серверного кода после requireSession().

export type Folder = { id: string; name: string; created_at: string };

export const MAX_FOLDER_NAME_LENGTH = 100;

export class FolderNameError extends Error {}

/** Название папки: без лишних пробелов. Ошибка, если пустое или слишком длинное. */
export function cleanFolderName(raw: string): string {
  const name = raw.trim().replace(/\s+/g, " ");
  if (!name) throw new FolderNameError("Введите название папки.");
  if (name.length > MAX_FOLDER_NAME_LENGTH)
    throw new FolderNameError(`Название папки — не длиннее ${MAX_FOLDER_NAME_LENGTH} символов.`);
  return name;
}

const sameName = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** Папки, новые первыми (как в прототипе: «Урок 12, Урок 11, …»). */
export async function listFolders(): Promise<Folder[]> {
  const { data, error } = await db()
    .from("folders")
    .select("id, name, created_at")
    .order("created_at", { ascending: false })
    .order("id", { ascending: true });
  if (error) throw new Error(`Не удалось загрузить папки: ${error.message}`);
  return data ?? [];
}

export async function getFolder(id: string): Promise<Folder | null> {
  if (!UUID.test(id)) return null;
  const { data, error } = await db().from("folders").select("id, name, created_at").eq("id", id).limit(1);
  if (error) throw new Error(`Не удалось загрузить папку: ${error.message}`);
  return data?.[0] ?? null;
}

/**
 * Создаёт папку. Если папка с таким названием уже есть (без учёта регистра), возвращает её:
 * при добавлении слов в «новую» папку с существующим названием слова попадут в неё.
 */
export async function createFolder(rawName: string): Promise<{ id: string; existed: boolean }> {
  const name = cleanFolderName(rawName);
  const existing = (await listFolders()).find((f) => sameName(f.name, name));
  if (existing) return { id: existing.id, existed: true };

  const { data, error } = await db().from("folders").insert({ name }).select("id");
  if (error?.code === UNIQUE_VIOLATION) {
    const again = (await listFolders()).find((f) => sameName(f.name, name));
    if (again) return { id: again.id, existed: true };
  }
  if (error || !data?.[0]) throw new Error(`Не удалось создать папку: ${error?.message ?? "нет ответа"}`);
  return { id: data[0].id, existed: false };
}

export async function renameFolder(id: string, rawName: string): Promise<void> {
  const name = cleanFolderName(rawName);
  if (!UUID.test(id)) throw new Error("Папка не найдена");
  const { error } = await db().from("folders").update({ name }).eq("id", id);
  if (error?.code === UNIQUE_VIOLATION) throw new FolderNameError("Папка с таким названием уже есть.");
  if (error) throw new Error(`Не удалось переименовать папку: ${error.message}`);
}

/** Удаляет папку. Слова остаются в списке без папки (ON DELETE SET NULL в схеме). */
export async function deleteFolder(id: string): Promise<void> {
  if (!UUID.test(id)) return;
  const { error } = await db().from("folders").delete().eq("id", id);
  if (error) throw new Error(`Не удалось удалить папку: ${error.message}`);
}
