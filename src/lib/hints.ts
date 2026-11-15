// Подсказки в упражнении (US-4): 1-я — первая буква (у словосочетания — каждого слова), 2-я — слово целиком.

/** «hop on a call» → «h… o… a… c…»; «seasoned» → «s…». */
export function firstLettersHint(term: string): string {
  return term
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${Array.from(word)[0]}…`)
    .join(" ");
}
