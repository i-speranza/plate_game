import type { Language } from './types.js';

export function stripAccents(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '');
}

export function normalizeWord(word: string, _language?: Language): string {
  return stripAccents(word.trim().toLowerCase());
}

export function normalizeLetter(letter: string): string {
  return stripAccents(letter.trim().toUpperCase());
}

export function isValidManualLetters(letters: string, language: Language, expectedCount: number): boolean {
  if (letters.length !== expectedCount) return false;
  const alphabet = new Set(getAlphabetLetters(language));
  const normalized = stripAccents(letters.toUpperCase());
  return [...normalized].every((ch) => alphabet.has(ch));
}

export function getAlphabetLetters(language: Language): string[] {
  if (language === 'it') {
    return 'ABCDEFGHILMNOPQRSTUVZ'.split('');
  }
  return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
}
