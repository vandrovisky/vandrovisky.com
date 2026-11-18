import { afterEach, describe, expect, test, vi } from 'vitest';
import scryfall from '../fixtures/scryfall.json';
import tcgdex from '../fixtures/tcgdex.json';
import optcg from '../fixtures/optcg.json';
import { normalizeOptcg, normalizeScryfall, normalizeTcgdex } from '../../scripts/cards/normalize';
import { buildPool, mergeWithSeed } from '../../scripts/cards/pool';
import { downloadAndOptimize } from '../../scripts/cards/images';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Card, Game } from '../../scripts/cards/types';

const isHttp = (u: string) => /^https?:\/\//.test(u);

describe('normalizers', () => {
  test('scryfall: drops the card without image, uses the first face of double-faced cards', () => {
    const cards = normalizeScryfall(scryfall);
    expect(cards).toHaveLength(5);
    expect(cards.every((c) => c.game === 'magic' && isHttp(c.imageUrl) && c.name && c.set)).toBe(true);
    expect(cards.find((c) => c.id === 'no-image')).toBeUndefined();
    const dfc = scryfall.data.find((c) => 'card_faces' in c && !('image_uris' in c))!;
    expect(cards.find((c) => c.id === dfc.id)?.imageUrl).toBe((dfc as any).card_faces[0].image_uris.large);
  });

  test('tcgdex: high-res webp url, drops the card without image', () => {
    const cards = normalizeTcgdex(tcgdex);
    expect(cards).toHaveLength(5);
    expect(cards.every((c) => c.game === 'pokemon' && c.imageUrl.endsWith('/high.webp'))).toBe(true);
  });

  test('optcg: drops the card without image', () => {
    const cards = normalizeOptcg(optcg);
    expect(cards).toHaveLength(5);
    expect(cards.every((c) => c.game === 'onepiece' && isHttp(c.imageUrl))).toBe(true);
  });

  test.each([
    ['scryfall', normalizeScryfall],
    ['tcgdex', normalizeTcgdex],
    ['optcg', normalizeOptcg],
  ])('%s never throws on unexpected json', (_name, fn) => {
    for (const bad of [{}, null, undefined, 42, 'x', [null, 1, {}], { data: 'nope' }]) {
      expect(fn(bad)).toEqual([]);
    }
  });
});

describe('buildPool', () => {
  afterEach(() => vi.useRealTimers());

  const card = (game: Game, i: number): Card => ({ id: `${game}-${i}`, game, name: `n${i}`, set: 's', imageUrl: `https://x/${i}` });
  const many = (game: Game, n: number) => Array.from({ length: n }, (_, i) => card(game, i));
  const seed = [...many('pokemon', 10), ...many('magic', 10), ...many('onepiece', 10)].map((c) => ({ ...c, id: `seed-${c.id}` }));

  test('rejecting or slow APIs fall back to the seed of that game only', async () => {
    vi.useFakeTimers();
    const pending = buildPool(
      {
        pokemon: () => Promise.reject(new Error('down')),
        magic: () => new Promise(() => {}), // never resolves
        onepiece: async () => many('onepiece', 40),
      },
      seed,
      30,
      10_000,
    );
    await vi.advanceTimersByTimeAsync(10_001);
    const { cards, sources } = await pending;
    expect(sources).toEqual({ pokemon: 'seed', magic: 'seed', onepiece: 'live' });
    expect(cards.filter((c) => c.game === 'onepiece')).toHaveLength(30);
    expect(cards.filter((c) => c.game === 'pokemon').every((c) => c.id.startsWith('seed-'))).toBe(true);
  });

  test('an API that returns too few cards counts as down', async () => {
    const { sources } = await buildPool(
      { pokemon: async () => many('pokemon', 2), magic: async () => many('magic', 6), onepiece: async () => [] },
      seed,
    );
    expect(sources).toEqual({ pokemon: 'seed', magic: 'live', onepiece: 'seed' });
  });

  test('live results are capped per game and deduplicated', async () => {
    const dup = [...many('magic', 20), ...many('magic', 20)];
    const { cards } = await buildPool(
      { pokemon: async () => many('pokemon', 50), magic: async () => dup, onepiece: async () => many('onepiece', 7) },
      seed,
      30,
    );
    expect(cards.filter((c) => c.game === 'pokemon')).toHaveLength(30);
    expect(cards.filter((c) => c.game === 'magic')).toHaveLength(20);
    expect(cards.filter((c) => c.game === 'onepiece')).toHaveLength(7);
  });
});

describe('mergeWithSeed (after image downloads)', () => {
  const c = (game: Game, i: number, prefix = ''): Card => ({ id: `${prefix}${game}-${i}`, game, name: 'n', set: 's', imageUrl: 'https://x', image: `/cards/${prefix}${game}-${i}.webp` });
  const seed = (['pokemon', 'magic', 'onepiece'] as Game[]).flatMap((g) => Array.from({ length: 10 }, (_, i) => c(g, i, 'seed-')));

  test('a game whose downloads mostly failed falls back to its seed', () => {
    const downloaded = [...Array.from({ length: 30 }, (_, i) => c('magic', i)), c('pokemon', 1)];
    const { cards, sources } = mergeWithSeed(downloaded, seed);
    expect(sources).toEqual({ pokemon: 'seed', magic: 'live', onepiece: 'seed' });
    expect(cards.filter((x) => x.game === 'pokemon').every((x) => x.id.startsWith('seed-'))).toBe(true);
    expect(cards.filter((x) => x.game === 'magic')).toHaveLength(30);
  });

  test('all downloads failing still yields the full seed', () => {
    const { cards } = mergeWithSeed([], seed);
    expect(cards).toHaveLength(30);
  });
});

describe('downloadAndOptimize', () => {
  afterEach(() => vi.unstubAllGlobals());
  test('a hanging image host is aborted and the card dropped', async () => {
    vi.stubGlobal('fetch', (_url: string, init?: RequestInit) =>
      new Promise((_, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))));
    const dir = mkdtempSync(join(tmpdir(), 'cards-'));
    const started = Date.now();
    const out = await downloadAndOptimize([{ id: 'x', game: 'magic', name: 'n', set: 's', imageUrl: 'https://slow' }], dir, 480, 200);
    expect(out).toEqual([]);
    expect(Date.now() - started).toBeLessThan(2000);
  });
});
