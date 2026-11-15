import "server-only";
import { AiUnavailableError, getAi, type CheckResult, type GeneratedPhrase, type Verdict } from "@/lib/ai";
import { UUID, db } from "@/lib/db";
import { repetitionByWord, weightedPick, type WordRepetition } from "@/lib/repetition";
import { getWord, listWords, type Word } from "@/lib/words";

// Тренировка «Как сказать на английском?» (US-4): сессия, фразы, проверка и сохранение ответов.
// Вызывается только из серверного кода после requireSession().

export const PHRASE_COUNTS = [5, 10, 15] as const;
export type PhraseCount = (typeof PHRASE_COUNTS)[number];
export const DEFAULT_PHRASE_COUNT: PhraseCount = 10;

export type Session = {
  id: string;
  folder_id: string | null;
  phrase_count: number;
  phrases: GeneratedPhrase[];
  current_index: number;
  started_at: string;
  finished_at: string | null;
};

export type Attempt = {
  word_id: string;
  verdict: Verdict;
  hints_used: number;
  is_error: boolean;
};

const SESSION_COLUMNS = "id, folder_id, phrase_count, phrases, current_index, started_at, finished_at";

export class TrainingError extends Error {}

/** Статистика повторения по всем словам (US-5): вес для выбора и метка «повторить». */
export async function loadRepetition(): Promise<Map<string, WordRepetition>> {
  const { data, error } = await db()
    .from("attempts")
    .select("word_id, verdict, hints_used, created_at")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw new Error(`Не удалось загрузить историю ответов: ${error.message}`);
  return repetitionByWord(data ?? []);
}

/**
 * Слова для фраз сессии (US-4, US-5): слова с ошибками в последних ответах выбираются чаще.
 * Если слов меньше, чем фраз, каждое слово попадает хотя бы раз, остальные фразы — взвешенно с повторами;
 * для повторяющихся слов AI составит фразы в разном рабочем контексте.
 */
export function pickTargets(words: Word[], count: number, repetition: Map<string, WordRepetition>): Word[] {
  return weightedPick(words, (w) => repetition.get(w.id)?.weight ?? 1, count);
}

export function wordsInScope(words: Word[], folderId: string | null): Word[] {
  return folderId ? words.filter((w) => w.folder_id === folderId) : words;
}

/** Создаёт сессию: выбирает слова и получает фразы у AI одним запросом. */
export async function startSession(folderId: string | null, count: PhraseCount): Promise<string> {
  const words = wordsInScope(await listWords(), folderId);
  if (words.length === 0) throw new TrainingError("В выбранном наборе нет слов.");

  const targets = pickTargets(words, count, await loadRepetition());
  let phrases: GeneratedPhrase[];
  try {
    phrases = await getAi().generatePhrases(
      targets.map((w) => ({ id: w.id, term: w.term, translation: w.translation })),
    );
  } catch (e) {
    console.error("training: AI не подготовил фразы", e);
    throw new TrainingError("Не удалось подготовить фразы. Попробуйте ещё раз чуть позже.");
  }
  const known = new Set(words.map((w) => w.id));
  phrases = phrases.filter((p) => known.has(p.word_id) && p.prompt_ru?.trim() && p.reference?.trim());
  if (phrases.length === 0) throw new TrainingError("Не удалось подготовить фразы. Попробуйте ещё раз.");

  const { data, error } = await db()
    .from("training_sessions")
    .insert({ folder_id: folderId, phrase_count: count, phrases, current_index: 0 })
    .select("id");
  if (error || !data?.[0]) throw new TrainingError(`Не удалось начать тренировку: ${error?.message ?? "нет ответа"}`);
  return data[0].id;
}

export async function getSession(id: string): Promise<Session | null> {
  if (!UUID.test(id)) return null;
  const { data, error } = await db().from("training_sessions").select(SESSION_COLUMNS).eq("id", id).limit(1);
  if (error) throw new Error(`Не удалось загрузить тренировку: ${error.message}`);
  return (data?.[0] as Session | undefined) ?? null;
}

export function isFinished(s: Session): boolean {
  return Boolean(s.finished_at) || s.current_index >= s.phrases.length;
}

/**
 * Переход к следующей фразе. Условие на current_index защищает от двойного нажатия:
 * если фраза уже пройдена (например, ответ отправлен дважды), ничего не меняется.
 */
async function advance(session: Session, index: number): Promise<boolean> {
  const next = index + 1;
  const fields: Record<string, unknown> = { current_index: next };
  if (next >= session.phrases.length) fields.finished_at = new Date().toISOString();
  const { data, error } = await db()
    .from("training_sessions")
    .update(fields)
    .eq("id", session.id)
    .eq("current_index", index)
    .is("finished_at", null)
    .select("id");
  if (error) throw new Error(`Не удалось сохранить прогресс: ${error.message}`);
  return (data?.length ?? 0) > 0;
}

export type AnswerOutcome =
  | { status: "checked"; result: CheckResult; isLast: boolean }
  | { status: "ai_error" }
  | { status: "stale" };

/**
 * Проверяет ответ и сохраняет его в историю. Пустой ответ — «Не знаю»: без вызова AI, оценка «Неверно».
 * Если AI не ответил — ответ не сохраняется (US-4), фраза остаётся текущей.
 */
export async function answerPhrase(
  sessionId: string,
  index: number,
  answer: string,
  hintsUsed: number,
): Promise<AnswerOutcome> {
  const session = await getSession(sessionId);
  if (!session || isFinished(session) || session.current_index !== index) return { status: "stale" };
  const phrase = session.phrases[index];
  const hints = Math.min(2, Math.max(0, Math.trunc(hintsUsed)));
  const text = answer.trim();

  let result: CheckResult;
  if (!text) {
    result = { verdict: "incorrect", used_target_word: false, reference: phrase.reference, alternatives: [], explanation: "" };
  } else {
    try {
      const word = await getWord(phrase.word_id);
      const term = word?.term ?? phrase.reference;
      result = await getAi().checkAnswer({ prompt_ru: phrase.prompt_ru, term, reference: phrase.reference, answer: text });
    } catch (e) {
      if (!(e instanceof AiUnavailableError)) console.error("training: AI не проверил ответ", e);
      return { status: "ai_error" };
    }
  }

  if (!(await advance(session, index))) return { status: "stale" };

  const { error } = await db().from("attempts").insert({
    session_id: session.id,
    word_id: phrase.word_id,
    prompt_ru: phrase.prompt_ru,
    answer: text,
    verdict: result.verdict,
    used_target_word: result.used_target_word,
    hints_used: hints,
    reference: result.reference,
    alternatives: result.alternatives.slice(0, 2),
    explanation: result.explanation || null,
  });
  // Слово могли удалить во время тренировки — тогда ответ просто не попадает в историю.
  if (error && error.code !== "23503") console.error("training: ответ не сохранён", error.message);

  return { status: "checked", result, isLast: index + 1 >= session.phrases.length };
}

/** «Пропустить» после ошибки AI: фраза не попадает в историю. */
export async function skipPhrase(sessionId: string, index: number): Promise<void> {
  const session = await getSession(sessionId);
  if (!session || isFinished(session) || session.current_index !== index) return;
  await advance(session, index);
}

/** Выход посреди тренировки: данные ответы уже сохранены, сессия больше не продолжается. */
export async function finishSession(sessionId: string): Promise<void> {
  if (!UUID.test(sessionId)) return;
  const { error } = await db()
    .from("training_sessions")
    .update({ finished_at: new Date().toISOString() })
    .eq("id", sessionId)
    .is("finished_at", null);
  if (error) throw new Error(`Не удалось завершить тренировку: ${error.message}`);
}

export async function sessionAttempts(sessionId: string): Promise<Attempt[]> {
  const { data, error } = await db()
    .from("attempts")
    .select("word_id, verdict, hints_used, is_error")
    .eq("session_id", sessionId);
  if (error) throw new Error(`Не удалось загрузить ответы: ${error.message}`);
  return (data ?? []) as Attempt[];
}
