import sitemap from '@astrojs/sitemap';
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import { docsSidebar } from './src/lib/docs-pages.ts';
import { docNames, docsSource, pageDates } from './src/lib/docs-source.ts';
import { CHECKED } from './src/data/compare.ts';
import { DESCRIPTION, LEGAL_UPDATED, OG_IMAGE_ALT } from './src/lib/site.ts';

/** The public address of the site: canonical URLs, the sitemap and social cards use it. */
const site = process.env.SITE_URL || 'http://localhost:4321';

/**
 * Refuses to build without SITE_URL, so that a deploy never ships canonical
 * URLs, a sitemap and social cards pointing to localhost. The development
 * server keeps its local default.
 */
const requireSiteUrl = {
  name: 'require-site-url',
  hooks: {
    'astro:config:setup': ({ command }) => {
      if (command === 'build' && !process.env.SITE_URL) {
        throw new Error('SITE_URL is required to build: the https origin the site is served from (http://localhost:4321 for a local check)');
      }
    },
  },
};

/**
 * The documentation the site is built from, or none yet: `astro preview`
 * serves dist/ without it, and the content collection reports a missing
 * source with the command that fixes it.
 */
function readSource() {
  try {
    return docsSource();
  } catch {
    return undefined;
  }
}

const source = readSource();
/** When each page last changed, by path: the sitemap's lastmod. The docs pages from their files, the pages written here from their date. */
const dates = new Map([...(source ? pageDates(source) : []), ['/compare/', CHECKED.iso], ['/legal/', LEGAL_UPDATED.iso]]);

export default defineConfig({
  site,
  trailingSlash: 'always',
  // HTML's whitespace rules rather than Astro 7's default JSX ones, which drop the space between a line of text and a link that starts the next line.
  compressHTML: true,
  integrations: [
    requireSiteUrl,
    // Configured here, Starlight leaves out its own: the pages get the date they last changed.
    sitemap({
      serialize(item) {
        const date = dates.get(new URL(item.url).pathname);
        return date ? { ...item, lastmod: new Date(date).toISOString() } : item;
      },
    }),
    starlight({
      title: 'Spawner',
      description: DESCRIPTION,
      favicon: '/favicon.svg',
      social: [{ icon: 'github', label: 'Spawner on GitHub', href: 'https://github.com/Flosk6/Spawner' }],
      customCss: [
        '@fontsource-variable/overpass',
        '@fontsource-variable/overpass-mono',
        '@fontsource/chakra-petch/latin-700.css',
        './src/styles/tokens.css',
        './src/styles/starlight.css',
      ],
      components: {
        Footer: './src/components/starlight/Footer.astro',
        Head: './src/components/starlight/Head.astro',
        SiteTitle: './src/components/starlight/SiteTitle.astro',
      },
      sidebar: docsSidebar(source ? docNames(source) : []),
      routeMiddleware: './src/routeData.ts',
      // The docs live outside src/content/docs: Starlight's Markdown steps (heading anchors, asides) run on them only when named here.
      markdown: { processedDirs: source ? [source.dir] : [] },
      head: [
        { tag: 'link', attrs: { rel: 'icon', href: '/favicon.ico', sizes: '32x32' } },
        { tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' } },
        { tag: 'link', attrs: { rel: 'manifest', href: '/site.webmanifest' } },
        { tag: 'meta', attrs: { property: 'og:image', content: new URL('/og.png', site).href } },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
        { tag: 'meta', attrs: { property: 'og:image:alt', content: OG_IMAGE_ALT } },
        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
        { tag: 'meta', attrs: { name: 'theme-color', content: '#f6f6f9', media: '(prefers-color-scheme: light)' } },
        { tag: 'meta', attrs: { name: 'theme-color', content: '#0e0d13', media: '(prefers-color-scheme: dark)' } },
      ],
      expressiveCode: {
        defaultProps: {
          frame: 'none',
          // Long commands and messages wrap rather than hide their end. Drawings and columns keep their lines: the loader marks them (keepColumns in src/lib/markdown.ts).
          wrap: true,
        },
        styleOverrides: { focusBorder: 'var(--sp-ring)' },
      },
      lastUpdated: false,
      pagination: true,
      disable404Route: true,
    }),
  ],
});
