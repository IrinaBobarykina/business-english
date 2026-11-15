// Разбор списка слов с урока (US-1). Чистые функции без доступа к базе:
// используются и в форме для предварительного подсчёта, и на сервере при сохранении.

export const MAX_TERM_LENGTH = 200;
export const MAX_TRANSLATION_LENGTH = 300;
export const MAX_NOTE_LENGTH = 1000;
export const MAX_LINES = 200;

export type WordEntry = { term: string; translation: string | null };

export type AddPlan = {
  /** Новые слова, которые будут добавлены. */
  toAdd: WordEntry[];
  /** Слова, которые уже есть в списке или повторяются в самом тексте. */
  duplicates: string[];
  /** Строки, которые не поместились в ограничения длины. */
  tooLong: string[];
};

/** Ключ для сравнения слов: без учёта регистра и лишних пробелов (как уникальный индекс в БД). */
export function normalizeTerm(term: string): string {
  return term.trim().replace(/\s+/g, " ").toLowerCase();
}

function cleanSpaces(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

// Маркеры списков из конспекта урока: «- word», «• word», «1. word», «2) word».
const LIST_MARKER = /^(?:[-•*·–—]\s+|\d{1,3}[.)]\s+)/;
// Разделитель перевода: дефис с пробелами вокруг или длинное/среднее тире.
// Дефис без пробелов — часть слова (heads-up, follow-up), его не трогаем.
const SEPARATOR = /\s+-\s+|\s*[–—]\s*/;

/** Одна строка → слово и перевод. Пустая строка → null. */
export function parseLine(line: string): WordEntry | null {
  const text = line.replace(LIST_MARKER, "").trim();
  if (!text) return null;

  const match = SEPARATOR.exec(text);
  if (!match) return { term: cleanSpaces(text), translation: null };

  const term = cleanSpaces(text.slice(0, match.index));
  const translation = cleanSpaces(text.slice(match.index + match[0].length));
  if (!term) return null;
  return { term, translation: translation || null };
}

export function parseWordList(text: string): WordEntry[] {
  return text
    .split(/\r?\n/)
    .slice(0, MAX_LINES)
    .map(parseLine)
    .filter((entry): entry is WordEntry => entry !== null);
}

/** Что из введённого текста будет добавлено с учётом слов, которые уже есть в списке. */
export function planAdd(text: string, existingTerms: Iterable<string>): AddPlan {
  const seen = new Set<string>();
  for (const term of existingTerms) seen.add(normalizeTerm(term));

  const plan: AddPlan = { toAdd: [], duplicates: [], tooLong: [] };
  for (const entry of parseWordList(text)) {
    if (
      entry.term.length > MAX_TERM_LENGTH ||
      (entry.translation?.length ?? 0) > MAX_TRANSLATION_LENGTH
    ) {
      plan.tooLong.push(entry.term.slice(0, 40));
      continue;
    }
    const key = normalizeTerm(entry.term);
    if (seen.has(key)) {
      plan.duplicates.push(entry.term);
      continue;
    }
    seen.add(key);
    plan.toAdd.push(entry);
  }
  return plan;
}
