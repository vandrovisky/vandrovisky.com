import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import type { Card } from './types';

export const imageFile = (c: Card): string => `${c.game}-${c.id.replace(/[^a-z0-9-]/gi, '_')}.webp`;

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

/** Downloads each card image, resizes to `width` and saves WebP into `outDir`. Cards whose download fails are dropped. */
export async function downloadAndOptimize(cards: Card[], outDir: string, width = 480): Promise<Card[]> {
  await mkdir(outDir, { recursive: true });
  const done = await mapLimit(cards, 6, async (c): Promise<Card | null> => {
    try {
      const res = await fetch(c.imageUrl, { headers: { 'User-Agent': 'vandrovisky.com/1.0' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const file = imageFile(c);
      await writeFile(join(outDir, file), await sharp(buf).resize({ width, withoutEnlargement: true }).webp({ quality: 68, effort: 6 }).toBuffer());
      return { ...c, image: `/cards/${file}` };
    } catch (e) {
      console.warn(`[cards] dropped ${c.game}/${c.id}: ${(e as Error).message}`);
      return null;
    }
  });
  return done.filter((c): c is Card => c !== null);
}
