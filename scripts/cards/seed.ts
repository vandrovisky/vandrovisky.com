/** Manual: refresh the committed seed pool (10 cards per game) in cards-seed/. */
import { rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { FETCHERS } from './fetchers';
import { downloadAndOptimize } from './images';
import { buildPool } from './pool';

const SEED_DIR = join(process.cwd(), 'cards-seed');

async function main() {
  const { cards, sources } = await buildPool(FETCHERS, [], 10);
  if (Object.values(sources).some((s) => s !== 'live')) {
    console.error('[cards:seed] some API is down, seed not updated:', sources);
    process.exit(1);
  }
  await rm(join(SEED_DIR, 'img'), { recursive: true, force: true });
  const saved = await downloadAndOptimize(cards, join(SEED_DIR, 'img'));
  await writeFile(join(SEED_DIR, 'cards.json'), JSON.stringify(saved, null, 1));
  console.log(`[cards:seed] ${saved.length} cards saved to cards-seed/`);
}

main();
