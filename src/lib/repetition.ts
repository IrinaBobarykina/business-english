// Повторение слов с ошибками (US-5). Чистые функции без доступа к базе — проверяются тестами.
//
// Правила (PRD v0.1, US-5):
// - ошибка — «Неверно», «Неестественно» или слово открыто целиком (2-я подсказка); 1-я подсказка — не ошибка;
// - у «Неверно» вес больше, чем у «Неестественно» и у открытого слова;
// - учитываются последние ответы по слову: если слово стало получаться, его вес снижается.
// Полноценного интервального повторения в v0.1 нет.

export type AttemptForRepetition = {
  word_id: string;
  verdict: "correct" | "unnatural" | "incorrect";
  hints_used: number;
  created_at: string;
};

/** Сколько последних ответов по слову учитывается. */
export const RECENT_ATTEMPTS = 3;
/** Базовый вес слова без ошибок. */
export const BASE_WEIGHT = 1;

/** Вес ошибки одного ответа: «Неверно» — 2, «Неестественно» или открытое слово — 1, верно — 0. */
export function errorWeight(a: Pick<AttemptForRepetition, "verdict" | "hints_used">): number {
  if (a.verdict === "incorrect") return 2;
  if (a.verdict === "unnatural" || a.hints_used >= 2) return 1;
  return 0;
}

export type WordRepetition = {
  /** Вес при выборе слов для сессии: 1 + сумма весов ошибок в последних ответах. */
  weight: number;
  /** Метка «повторить»: последний ответ по слову — с ошибкой. */
  needsRepeat: boolean;
  attempts: number;
  errors: number;
};

/** Статистика по словам. attempts — в любом порядке. */
export function repetitionByWord(attempts: AttemptForRepetition[]): Map<string, WordRepetition> {
  const byWord = new Map<string, AttemptForRepetition[]>();
  for (const a of attempts) {
    const list = byWord.get(a.word_id) ?? [];
    list.push(a);
    byWord.set(a.word_id, list);
  }
  const result = new Map<string, WordRepetition>();
  for (const [wordId, list] of byWord) {
    list.sort((x, y) => y.created_at.localeCompare(x.created_at));
    const recent = list.slice(0, RECENT_ATTEMPTS);
    result.set(wordId, {
      weight: BASE_WEIGHT + recent.reduce((sum, a) => sum + errorWeight(a), 0),
      needsRepeat: errorWeight(list[0]) > 0,
      attempts: list.length,
      errors: list.filter((a) => errorWeight(a) > 0).length,
    });
  }
  return result;
}

/**
 * Слова для фраз сессии с учётом весов.
 * - Если слов не меньше, чем фраз: взвешенная выборка без повторов (слова с ошибками попадают чаще).
 * - Если слов меньше: каждое слово по разу, остальные фразы — взвешенно с повторами
 *   (AI составит для повторяющихся слов фразы в разном контексте).
 * Порядок результата случайный.
 */
export function weightedPick<T extends { id: string }>(
  items: T[],
  weightOf: (item: T) => number,
  count: number,
  random: () => number = Math.random,
): T[] {
  if (items.length === 0 || count <= 0) return [];
  const w = (item: T) => Math.max(0.0001, weightOf(item));

  let picked: T[];
  if (items.length >= count) {
    // Efraimidis–Spirakis: ключ u^(1/w), берём count наибольших.
    picked = items
      .map((item) => ({ item, key: Math.pow(random(), 1 / w(item)) }))
      .sort((a, b) => b.key - a.key)
      .slice(0, count)
      .map((x) => x.item);
  } else {
    picked = [...items];
    const total = items.reduce((s, it) => s + w(it), 0);
    while (picked.length < count) {
      let r = random() * total;
      let chosen = items[items.length - 1];
      for (const it of items) {
        r -= w(it);
        if (r <= 0) {
          chosen = it;
          break;
        }
      }
      picked.push(chosen);
    }
  }

  // Перемешать, чтобы порядок фраз не повторял порядок весов.
  for (let i = picked.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [picked[i], picked[j]] = [picked[j], picked[i]];
  }
  return picked;
}
