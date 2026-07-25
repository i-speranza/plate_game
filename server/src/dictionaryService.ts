import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Language } from '@plate-game/shared';
import { normalizeWord } from '@plate-game/shared';

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
}

export const dictionaryService = new DictionaryService();
