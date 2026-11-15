/** Русское склонение после числа: plural(5, ["слово", "слова", "слов"]) → «5 слов». */
export function plural(n: number, [one, few, many]: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} ${one}`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} ${few}`;
  return `${n} ${many}`;
}

export const wordsRu = (n: number) => plural(n, ["слово", "слова", "слов"]);
