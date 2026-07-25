import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, '..', 'dictionary');
const destDir = join(__dirname, '..', 'dist', 'dictionary');

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
  cpSync(src, join(destDir, `${lang}.json`));
}

console.log('Copied dictionaries to dist/dictionary');
