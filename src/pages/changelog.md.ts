import type { APIRoute } from 'astro';
import { docsSource } from '../lib/docs-source';
import { changelogPage } from '../lib/docs-entries';
import { MARKDOWN, pageMarkdown } from '../lib/llms';

/** The changelog in Markdown, /changelog.md next to /changelog/, with the date of each release. */
export const GET: APIRoute = async ({ site }) => {
  const changelog = await changelogPage();
  if (!site || !changelog) {
    throw new Error('/changelog.md needs the site URL (SITE_URL) and CHANGELOG.md');
  }
  return new Response(pageMarkdown(changelog, site, docsSource()), { headers: MARKDOWN });
};
