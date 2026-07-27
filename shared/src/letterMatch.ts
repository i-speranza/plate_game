import { normalizeLetter, normalizeWord } from './normalize.js';

export function countDistinctPlateLetters(word: string, plateLetters: string[]): number {
  const normalizedWord = normalizeWord(word);
  const remaining = new Map<string, number>();

  for (const ch of normalizedWord) {
    remaining.set(ch, (remaining.get(ch) ?? 0) + 1);
  }

  let count = 0;
  for (const letter of plateLetters) {
    const normalizedLetter = normalizeLetter(letter).toLowerCase();
    const available = remaining.get(normalizedLetter) ?? 0;
    if (available > 0) {
      count++;
      remaining.set(normalizedLetter, available - 1);
    }
  }

  return count;
}

export function getMatchingPlateIndices(word: string, plateLetters: string[]): boolean[] {
  const normalizedWord = normalizeWord(word);
  const remaining = new Map<string, number>();

  for (const ch of normalizedWord) {
    remaining.set(ch, (remaining.get(ch) ?? 0) + 1);
  }

  return plateLetters.map((letter) => {
    const normalizedLetter = normalizeLetter(letter).toLowerCase();
    const available = remaining.get(normalizedLetter) ?? 0;
    if (available > 0) {
      remaining.set(normalizedLetter, available - 1);
      return true;
    }
    return false;
  });
}

export function isOrderedMatch(word: string, plateLetters: string[]): boolean {
  if (plateLetters.length !== 4) return false;

  const normalizedWord = normalizeWord(word);
  let searchFrom = 0;

  for (const letter of plateLetters) {
    const normalizedLetter = normalizeLetter(letter).toLowerCase();
    const index = normalizedWord.indexOf(normalizedLetter, searchFrom);
    if (index === -1) return false;
    searchFrom = index + 1;
  }

  return true;
}
