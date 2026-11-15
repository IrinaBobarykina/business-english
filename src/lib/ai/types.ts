// Интерфейс AI-провайдера для тренировки (US-4). Реализации: заглушка (stub.ts) и настоящий LLM (ET-15).
// По PRD (раздел 5): фразы на всю сессию — одним запросом, проверка ответа — отдельным коротким запросом.

export type Verdict = "correct" | "unnatural" | "incorrect";

export type TargetWord = {
  id: string;
  term: string;
  translation: string | null;
};

export type GeneratedPhrase = {
  word_id: string;
  /** Фраза на русском из рабочей среды в IT; естественный перевод использует целевое слово. */
  prompt_ru: string;
  /** Эталонный перевод на английском. */
  reference: string;
};

export type CheckInput = {
  prompt_ru: string;
  term: string;
  reference: string;
  answer: string;
};

export type CheckResult = {
  verdict: Verdict;
  used_target_word: boolean;
  /** Эталон: как сказать естественно. */
  reference: string;
  /** 1–2 альтернативы. */
  alternatives: string[];
  /** Короткое объяснение на русском. */
  explanation: string;
};

export interface AiProvider {
  /** Название для интерфейса и логов. */
  readonly name: string;
  /** Тестовый режим: фразы и проверка без настоящего AI. */
  readonly isStub: boolean;
  /**
   * Фразы для сессии одним запросом. targets может содержать одно слово несколько раз —
   * тогда фразы для него должны быть в разном рабочем контексте (US-4).
   */
  generatePhrases(targets: TargetWord[]): Promise<GeneratedPhrase[]>;
  checkAnswer(input: CheckInput): Promise<CheckResult>;
}

export class AiUnavailableError extends Error {}
