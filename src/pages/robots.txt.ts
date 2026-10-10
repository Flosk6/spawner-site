import type { APIRoute } from 'astro';

/**
 * The crawling policy, written out: everything is open, to search engines
 * and to AI search and assistants by name, so that a host's default rules
 * (a CDN that blocks AI crawlers) cannot be mistaken for the site's choice.
 */
export const GET: APIRoute = ({ site }) => {
  if (!site) {
    throw new Error('robots.txt needs the site URL (SITE_URL)');
  }
  const lines = [
    '# Every page of this site may be crawled, indexed and quoted, by search',
    '# engines and by AI tools alike. The documentation also exists in Markdown',
    '# for language models: /llms.txt, /llms-full.txt, /docs/<page>.md.',
    '',
    '# Search engines',
    'User-agent: Googlebot',
    'User-agent: Bingbot',
    'Allow: /',
    '',
    '# AI search engines, and assistants that fetch a page a person asked about',
    'User-agent: OAI-SearchBot',
    'User-agent: ChatGPT-User',
    'User-agent: Claude-SearchBot',
    'User-agent: Claude-User',
    'User-agent: PerplexityBot',
    'User-agent: Perplexity-User',
    'Allow: /',
    '',
    '# Crawlers and controls for AI models, so that assistants know Spawner',
    'User-agent: GPTBot',
    'User-agent: ClaudeBot',
    'User-agent: Google-Extended',
    'User-agent: Applebot-Extended',
    'Allow: /',
    '',
    '# Everyone else',
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${new URL('/sitemap-index.xml', site).href}`,
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
