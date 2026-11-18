export const GAMES = ['pokemon', 'magic', 'onepiece'] as const;
export type Game = (typeof GAMES)[number];

export type Card = {
  id: string;
  game: Game;
  name: string;
  set: string;
  rarity?: string;
  /** Remote image from the API. */
  imageUrl: string;
  /** Local optimized image, e.g. "/cards/magic-<id>.webp", set after download. */
  image?: string;
};
