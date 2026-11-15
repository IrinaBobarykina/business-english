import "server-only";
import { getSupabase } from "@/lib/supabase";
import { normalizeTerm, type WordEntry } from "@/lib/word-parse";

// Доступ к таблице words (US-1, US-2). Вызывается только из серверного кода после requireSession().

export type Word = {
  id: string;
  term: string;
  translation: string | null;
  note: string | null;
  created_at: string;
};

const WORD_COLUMNS = "id, term, translation, note, created_at";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UNIQUE_VIOLATION = "23505";

export class DuplicateWordError extends Error {}

function db() {
  const client = getSupabase();
  if (!client) throw new Error("База данных не настроена: нет SUPABASE_URL или SUPABASE_SECRET_KEY");
  return client;
}

/** Все слова, новые сверху. Для одного пользователя список небольшой, поиск — на сервере в памяти. */
export async function listWords(): Promise<Word[]> {
  const { data, error } = await db()
    .from("words")
    .select(WORD_COLUMNS)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true });
  if (error) throw new Error(`Не удалось загрузить слова: ${error.message}`);
  return data ?? [];
}

export function searchWords(words: Word[], query: string): Word[] {
  const q = normalizeTerm(query);
  if (!q) return words;
  return words.filter(
    (w) => normalizeTerm(w.term).includes(q) || normalizeTerm(w.translation ?? "").includes(q),
  );
}

export async function getWord(id: string): Promise<Word | null> {
  if (!UUID.test(id)) return null;
  const { data, error } = await db().from("words").select(WORD_COLUMNS).eq("id", id).limit(1);
  if (error) throw new Error(`Не удалось загрузить слово: ${error.message}`);
  return data?.[0] ?? null;
}

/** Добавляет слова; уже существующие пропускает. Возвращает число добавленных. */
export async function addWords(entries: WordEntry[]): Promise<number> {
  if (entries.length === 0) return 0;
  // В одной вставке now() у всех строк одинаковый, и порядок в списке «новые сверху» стал бы случайным.
  // Поэтому время задаётся явно с шагом в 1 мс: слова из одного списка идут в том порядке, в каком их ввели.
  const base = Date.now();
  const rows = entries.map((e, i) => ({
    term: e.term,
    translation: e.translation,
    created_at: new Date(base + (entries.length - 1 - i)).toISOString(),
  }));

  const { error } = await db().from("words").insert(rows);
  if (!error) return rows.length;
  if (error.code !== UNIQUE_VIOLATION) throw new Error(`Не удалось добавить слова: ${error.message}`);

  // Кто-то добавил то же слово между проверкой и сохранением: добавляем по одному, пропуская дубликаты.
  let added = 0;
  for (const row of rows) {
    const res = await db().from("words").insert(row);
    if (!res.error) added++;
    else if (res.error.code !== UNIQUE_VIOLATION) throw new Error(`Не удалось добавить слово: ${res.error.message}`);
  }
  return added;
}

export async function updateWord(
  id: string,
  fields: { term: string; translation: string | null; note: string | null },
): Promise<void> {
  if (!UUID.test(id)) throw new Error("Слово не найдено");
  const { error } = await db().from("words").update(fields).eq("id", id);
  if (error?.code === UNIQUE_VIOLATION) throw new DuplicateWordError("Такое слово уже есть в списке");
  if (error) throw new Error(`Не удалось сохранить слово: ${error.message}`);
}

export async function deleteWord(id: string): Promise<void> {
  if (!UUID.test(id)) return;
  const { error } = await db().from("words").delete().eq("id", id);
  if (error) throw new Error(`Не удалось удалить слово: ${error.message}`);
}
