"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { UUID } from "@/lib/db";
import {
  DEFAULT_PHRASE_COUNT,
  PHRASE_COUNTS,
  TrainingError,
  answerPhrase,
  finishSession,
  skipPhrase,
  startSession,
  type AnswerOutcome,
  type PhraseCount,
} from "@/lib/training";

// Тренировка (US-4): начало, ответ, пропуск, выход.

export type StartState = { error: string } | undefined;

export async function startTrainingAction(_prev: StartState, formData: FormData): Promise<StartState> {
  await requireSession();
  const folder = String(formData.get("set") ?? "");
  const folderId = UUID.test(folder) ? folder : null;
  const raw = Number(formData.get("count"));
  const count: PhraseCount = (PHRASE_COUNTS as readonly number[]).includes(raw) ? (raw as PhraseCount) : DEFAULT_PHRASE_COUNT;

  let id: string;
  try {
    id = await startSession(folderId, count);
  } catch (e) {
    return { error: e instanceof TrainingError ? e.message : "Не удалось начать тренировку. Попробуйте ещё раз." };
  }
  redirect(`/train/${id}`);
}

export async function submitAnswerAction(
  sessionId: string,
  index: number,
  answer: string,
  hintsUsed: number,
): Promise<AnswerOutcome | { status: "error"; message: string }> {
  await requireSession();
  try {
    return await answerPhrase(sessionId, index, answer.slice(0, 1000), hintsUsed);
  } catch (e) {
    console.error("train: ошибка при сохранении ответа", e);
    return { status: "error", message: "Не удалось сохранить ответ. Проверьте соединение и попробуйте ещё раз." };
  }
}

export async function skipPhraseAction(sessionId: string, index: number): Promise<void> {
  await requireSession();
  await skipPhrase(sessionId, index);
}

export async function finishTrainingAction(sessionId: string): Promise<void> {
  await requireSession();
  await finishSession(sessionId);
  redirect("/");
}
