import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
import { extract } from 'tar';
import { normalizeWord } from '@plate-game/shared';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'dictionary');
const cacheDir = join(__dirname, '.cache');

const MORPH_IT_URL =
  'https://docs.sslmit.unibo.it/lib/exe/fetch.php?media=resources:morph-it.tgz';
const ENGLISH_URL =
  'https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt';

const SKIP_POS = new Set(['NPR', 'PON', 'SENT', 'SYM', 'INT', 'DET', 'PRE', 'CON', 'AUX', 'PRO', 'NUM']);

const FALLBACK_IT = [
  'casa', 'mare', 'sole', 'luna', 'auto', 'strada', 'curva', 'radice', 'caro', 'corda',
  'cardo', 'crudo', 'drago', 'acido', 'arco', 'carne', 'disco', 'faro', 'lago', 'muro',
  'accordo', 'curvard', 'craccad',
];

const FALLBACK_EN = [
  'card', 'care', 'race', 'dare', 'read', 'dear', 'road', 'cord', 'curd', 'arc', 'car', 'red',
  'cad', 'accord', 'curvard', 'dracena', 'house', 'water', 'light', 'world', 'music', 'plant',
];

async function fetchToFile(url: string, dest: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (!res.ok || !res.body) return false;
    await pipeline(res.body as unknown as NodeJS.ReadableStream, createWriteStream(dest));
    return true;
  } catch {
    return false;
  }
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function parseMorphIt(text: string): string[] {
  const lemmas = new Set<string>();
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split('\t');
    if (parts.length < 3) continue;

    const lemma = parts[1]?.trim().toLowerCase();
    const pos = parts[2]?.trim().split(':')[0] ?? '';

    if (!lemma || SKIP_POS.has(pos)) continue;
    if (!/^[a-zàèéìòóù'-]+$/i.test(lemma)) continue;

    lemmas.add(normalizeWord(lemma, 'it'));
  }
  return [...lemmas];
}

function parseEnglishList(text: string): string[] {
  const words = new Set<string>();
  for (const line of text.split('\n')) {
    const word = line.trim().toLowerCase();
    if (word && /^[a-z]+$/.test(word) && word.length >= 2) {
      words.add(normalizeWord(word, 'en'));
    }
  }
  return [...words];
}

async function buildItalian(): Promise<string[]> {
  try {
    if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });

    const tgzPath = join(cacheDir, 'morph-it.tgz');
    const localTgz = join(__dirname, 'morph-it.tgz');
    const morphPath = join(cacheDir, 'morph-it_048.txt');
    const localMorph = join(__dirname, 'current_version', 'morph-it_048.txt');
    const committedDict = join(outDir, 'it.json');

    if (existsSync(committedDict)) {
      const existing: string[] = JSON.parse(readFileSync(committedDict, 'utf-8'));
      if (existing.length > 1000) {
        console.log(`Using committed Italian dictionary (${existing.length} words)`);
        return existing;
      }
    }

    if (!existsSync(morphPath)) {
      let sourceTgz = tgzPath;
      if (!existsSync(sourceTgz) && existsSync(localTgz)) {
        sourceTgz = localTgz;
      } else if (!existsSync(sourceTgz)) {
        console.log('Downloading Morph-it dictionary…');
        const ok = await fetchToFile(MORPH_IT_URL, tgzPath);
        if (!ok && existsSync(localTgz)) {
          sourceTgz = localTgz;
        } else if (!ok) {
          console.warn('Morph-it download failed');
          if (existsSync(localMorph)) {
            const text = readFileSync(localMorph, 'utf-8');
            const parsed = parseMorphIt(text);
            if (parsed.length > 1000) return parsed.sort();
          }
          return FALLBACK_IT.map((w) => normalizeWord(w, 'it')).sort();
        }
      }

      if (existsSync(sourceTgz)) {
        console.log('Extracting Morph-it dictionary…');
        await extract({ file: sourceTgz, cwd: cacheDir, strip: 0 });
        const extracted = join(cacheDir, 'current_version', 'morph-it_048.txt');
        if (existsSync(extracted)) {
          writeFileSync(morphPath, readFileSync(extracted));
        }
      } else if (existsSync(localMorph)) {
        writeFileSync(morphPath, readFileSync(localMorph));
      }
    }

    if (existsSync(morphPath)) {
      const text = readFileSync(morphPath, 'utf-8');
      const parsed = parseMorphIt(text);
      if (parsed.length > 1000) return parsed.sort();
    }
  } catch (err) {
    console.warn('Italian dictionary build failed:', err);
  }

  console.warn('Using fallback Italian dictionary');
  return FALLBACK_IT.map((w) => normalizeWord(w, 'it')).sort();
}

async function buildEnglish(): Promise<string[]> {
  try {
    console.log('Downloading English dictionary…');
    const text = await fetchText(ENGLISH_URL);
    if (text) {
      const parsed = parseEnglishList(text);
      if (parsed.length > 1000) return parsed.sort();
    }
  } catch (err) {
    console.warn('English dictionary build failed:', err);
  }

  console.warn('Using fallback English dictionary');
  return FALLBACK_EN.map((w) => normalizeWord(w, 'en')).sort();
}

async function main() {
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const [it, en] = await Promise.all([buildItalian(), buildEnglish()]);

  writeFileSync(join(outDir, 'it.json'), JSON.stringify(it));
  writeFileSync(join(outDir, 'en.json'), JSON.stringify(en));

  console.log(`Built dictionaries: IT=${it.length} words, EN=${en.length} words`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
