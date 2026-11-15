import "server-only";
import { stubAi } from "./stub";
import type { AiProvider } from "./types";

export type { AiProvider, CheckResult, GeneratedPhrase, TargetWord, Verdict } from "./types";
export { AiUnavailableError } from "./types";

/**
 * Текущий AI-провайдер. Пока провайдер не выбран (ET-15), работает тестовая заглушка.
 * Настоящий провайдер подключается здесь по переменной окружения AI_PROVIDER.
 */
export function getAi(): AiProvider {
  const provider = process.env.AI_PROVIDER?.trim().toLowerCase();
  switch (provider) {
    case undefined:
    case "":
    case "stub":
      return stubAi;
    default:
      console.error(`AI_PROVIDER=${provider} пока не поддерживается, используется заглушка`);
      return stubAi;
  }
}
