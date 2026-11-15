import { normalizeTerm } from "@/lib/word-parse";
import { AiUnavailableError, type AiProvider, type CheckResult } from "./types";

// Заглушка AI до выбора провайдера (ET-15). Позволяет пройти весь сценарий тренировки:
// - фраза — шаблон с переводом слова, эталон — само слово;
// - ответ засчитывается как «Верно», если в нём есть целевое слово;
//   если слова нет, но ответ из нескольких слов — «Неестественно», иначе — «Неверно»;
// - ответ со словами «ошибка ai» имитирует сбой AI, чтобы проверить экран ошибки.

export const SIMULATE_ERROR_PHRASE = "ошибка ai";

export const stubAi: AiProvider = {
  name: "Тестовая заглушка",
  isStub: true,

  async generatePhrases(targets) {
    const seen = new Map<string, number>();
    return targets.map((w) => {
      const n = (seen.get(w.id) ?? 0) + 1;
      seen.set(w.id, n);
      const variant = n > 1 ? ` (вариант ${n})` : "";
      const prompt_ru = w.translation
        ? `Тестовая фраза: скажите по-английски «${w.translation}»${variant}`
        : `Тестовая фраза: составьте рабочую фразу со словом «${w.term}»${variant}`;
      return { word_id: w.id, prompt_ru, reference: w.term };
    });
  },

  async checkAnswer({ term, reference, answer }): Promise<CheckResult> {
    const normalized = normalizeTerm(answer);
    if (normalized.includes(SIMULATE_ERROR_PHRASE)) {
      throw new AiUnavailableError("Тестовый сбой AI");
    }
    const used = normalized.includes(normalizeTerm(term));
    const verdict = used ? "correct" : normalized.split(" ").length > 1 ? "unnatural" : "incorrect";
    return {
      verdict,
      used_target_word: used,
      reference,
      alternatives: [],
      explanation:
        "Тестовый режим: проверка без AI. Ответ засчитывается, если в нём есть целевое слово.",
    };
  },
};
