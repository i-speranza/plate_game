import { cpSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, '..', 'dictionary');
const destDir = join(__dirname, '..', 'dist', 'dictionary');

const MIN_WORDS = { it: 1000, en: 1000 };

if (!existsSync(srcDir)) {
  console.error('Dictionary source directory missing:', srcDir);
  process.exit(1);
}

mkdirSync(destDir, { recursive: true });

for (const lang of ['it', 'en']) {
  const src = join(srcDir, `${lang}.json`);
  if (!existsSync(src)) {
    console.error('Dictionary file missing:', src);
    process.exit(1);
  }

  const words = JSON.parse(readFileSync(src, 'utf-8'));
  if (!Array.isArray(words) || words.length < MIN_WORDS[lang]) {
    console.error(
      `Dictionary ${lang} is too small (${words.length ?? 0} words, need >= ${MIN_WORDS[lang]}).`,
      'Restore the committed dictionary files from server/dictionary/.',
    );
    process.exit(1);
  }

  cpSync(src, join(destDir, `${lang}.json`));
  console.log(`Copied ${lang}.json (${words.length} words)`);
}

console.log('Copied dictionaries to dist/dictionary');
