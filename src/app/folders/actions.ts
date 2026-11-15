"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createFolder, deleteFolder, renameFolder } from "@/lib/folders";

// Папки (US-3): создание, переименование, удаление.

export type FolderFormState = { error: string } | undefined;

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Что-то пошло не так. Попробуйте ещё раз.";
}

export async function createFolderAction(_prev: FolderFormState, formData: FormData): Promise<FolderFormState> {
  await requireSession();
  let result: { id: string; existed: boolean };
  try {
    result = await createFolder(String(formData.get("name") ?? ""));
  } catch (e) {
    return { error: errorMessage(e) };
  }
  if (result.existed) return { error: "Папка с таким названием уже есть." };
  redirect(`/?folder=${result.id}&folderCreated=1`);
}

export async function renameFolderAction(
  id: string,
  _prev: FolderFormState,
  formData: FormData,
): Promise<FolderFormState> {
  await requireSession();
  try {
    await renameFolder(id, String(formData.get("name") ?? ""));
  } catch (e) {
    return { error: errorMessage(e) };
  }
  redirect(`/?folder=${id}&folderSaved=1`);
}

export async function deleteFolderAction(id: string): Promise<void> {
  await requireSession();
  await deleteFolder(id);
  redirect("/?folderDeleted=1");
}
