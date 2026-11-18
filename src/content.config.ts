import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const work = defineCollection({
  // id = "<lang>/<file name>", e.g. "en/jmv-play"; the slug is the part after the language.
  loader: glob({ pattern: '**/*.md', base: './src/content/work' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      lang: z.enum(['en', 'pt']),
      role: z.string(),
      stack: z.array(z.string()),
      year: z.number().int(),
      kind: z.enum(['visual', 'technical', 'meta']),
      order: z.number(),
      featured: z.boolean().default(false),
      builtAt: z.string().optional(),
      cover: image().optional(),
      gallery: z.array(image()).optional(),
      // Deliberately no URL field: visual cases are shown through screenshots only.
    }),
});

export const collections = { work };
