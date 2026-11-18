/** Prebuild: refresh the card pool from the APIs, falling back to the committed seed per game. */
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { FETCHERS } from './fetchers';
import { downloadAndOptimize } from './images';
import { buildPool, mergeWithSeed } from './pool';
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
  const downloaded = await downloadAndOptimize(live, PUBLIC_DIR);
  // A game whose image downloads failed falls back to its seed too.
  const merged = mergeWithSeed(downloaded, seed);
  console.log('[cards] after downloads:', merged.sources);

  const pool: Card[] = [];
  for (const c of merged.cards) {
    if (merged.sources[c.game] === 'live') {
      pool.push(c);
      continue;
    }
    const file = c.image?.replace(/^\/cards\//, '');
    if (!file || !existsSync(join(SEED_DIR, 'img', file))) continue;
    await copyFile(join(SEED_DIR, 'img', file), join(PUBLIC_DIR, file));
    pool.push(c);
  }

  await mkdir(join(ROOT, 'src', 'data'), { recursive: true });
  await writeFile(OUT, JSON.stringify(pool, null, 1));
  console.log(`[cards] ${pool.length} cards → src/data/cards.json`);
  if (pool.length < 6) {
    console.error('[cards] fewer than 6 cards: APIs down and seed missing. Run `npm run cards:seed`.');
    process.exit(1);
  }
}

main();
