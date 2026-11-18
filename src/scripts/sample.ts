import type { Card } from '../../scripts/cards/types';

function shuffle<T>(items: T[], rand: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** A random hand of `n` distinct cards with at least one card of every game in the pool (when n allows). */
export function sampleCards<T extends Pick<Card, 'id' | 'game'>>(pool: T[], n: number, rand: () => number = Math.random): T[] {
  const shuffled = shuffle(pool, rand);
  const games = [...new Set(shuffled.map((c) => c.game))];
  const hand: T[] = [];
  if (n >= games.length) {
    for (const g of games) hand.push(shuffled.find((c) => c.game === g)!);
  }
  for (const c of shuffled) {
    if (hand.length >= n) break;
    if (!hand.includes(c)) hand.push(c);
  }
  return shuffle(hand, rand);
}
