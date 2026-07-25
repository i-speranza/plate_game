import { normalizeLetter, normalizeWord } from './normalize.js';

export function countDistinctPlateLetters(word: string, plateLetters: string[]): number {
  const normalizedWord = normalizeWord(word);
  let count = 0;

  for (const letter of plateLetters) {
    const normalizedLetter = normalizeLetter(letter).toLowerCase();
    if (normalizedWord.includes(normalizedLetter)) {
      count++;
    }
  }

  return count;
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
