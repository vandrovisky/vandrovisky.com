/** Prebuild: refresh the card pool from the APIs, falling back to the committed seed per game. */
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { FETCHERS } from './fetchers';
import { downloadAndOptimize } from './images';
import { buildPool } from './pool';
import type { Card } from './types';

const ROOT = process.cwd();
const SEED_DIR = join(ROOT, 'cards-seed');
const PUBLIC_DIR = join(ROOT, 'public', 'cards');
const OUT = join(ROOT, 'src', 'data', 'cards.json');

async function readSeed(): Promise<Card[]> {
  try {
    return JSON.parse(await readFile(join(SEED_DIR, 'cards.json'), 'utf8'));
  } catch {
    return [];
  }
}

async function main() {
  const seed = await readSeed();
  const { cards, sources } = await buildPool(FETCHERS, seed);
  console.log('[cards] sources:', sources);

  await mkdir(PUBLIC_DIR, { recursive: true });
  const live = cards.filter((c) => sources[c.game] === 'live');
  const fromSeed = cards.filter((c) => sources[c.game] === 'seed');

  const downloaded = await downloadAndOptimize(live, PUBLIC_DIR);
  const copied: Card[] = [];
  for (const c of fromSeed) {
    const file = c.image?.replace(/^\/cards\//, '');
    if (!file || !existsSync(join(SEED_DIR, 'img', file))) continue;
    await copyFile(join(SEED_DIR, 'img', file), join(PUBLIC_DIR, file));
    copied.push(c);
  }

  const pool = [...downloaded, ...copied].filter((c) => c.image);
  await mkdir(join(ROOT, 'src', 'data'), { recursive: true });
  await writeFile(OUT, JSON.stringify(pool, null, 1));
  console.log(`[cards] ${pool.length} cards (${downloaded.length} live, ${copied.length} seed) → src/data/cards.json`);
  if (pool.length === 0) {
    console.error('[cards] no cards at all: APIs down and no seed. Run `npm run cards:seed`.');
    process.exit(1);
  }
}

main();
