import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Language } from '@plate-game/shared';
import { isOrderedMatch, normalizeWord } from '@plate-game/shared';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class DictionaryService {
  private dictionaries = new Map<Language, Set<string>>();

  load(): void {
    for (const lang of ['it', 'en'] as Language[]) {
      const bundled = join(__dirname, 'dictionary', `${lang}.json`);
      const devPath = join(__dirname, '..', 'dictionary', `${lang}.json`);
      const path = existsSync(bundled) ? bundled : devPath;
      const raw = readFileSync(path, 'utf-8');
      const words: string[] = JSON.parse(raw);
      this.dictionaries.set(lang, new Set(words));
    }
  }

  has(word: string, language: Language): boolean {
    const dict = this.dictionaries.get(language);
    if (!dict) return false;
    return dict.has(normalizeWord(word, language));
  }

  size(language: Language): number {
    return this.dictionaries.get(language)?.size ?? 0;
  }

  findOrderedMatch(plateLetters: string[], language: Language, minLength = 5): string | null {
    const dict = this.dictionaries.get(language);
    if (!dict || plateLetters.length !== 4) return null;

    let shortest: string | null = null;
    for (const word of dict) {
      if (word.length < minLength) continue;
      if (isOrderedMatch(word, plateLetters)) {
        if (!shortest || word.length < shortest.length) {
          shortest = word;
        }
      }
    }
    return shortest;
  }
}

export const dictionaryService = new DictionaryService();
