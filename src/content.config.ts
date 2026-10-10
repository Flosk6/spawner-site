import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';
import { spawnerDocsLoader } from './lib/docs-loader';
import { docsSource } from './lib/docs-source';

export const collections = {
  docs: defineCollection({
    loader: spawnerDocsLoader(docsSource()),
    schema: docsSchema({
      extend: z.object({
        /** The <title> written for search (src/lib/docs-pages.ts); the page keeps its heading. */
        seoTitle: z.string().optional(),
      }),
    }),
  }),
  i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
};
