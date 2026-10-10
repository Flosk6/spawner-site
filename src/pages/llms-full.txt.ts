import type { APIRoute } from 'astro';
import { docsSource } from '../lib/docs-source';
import { changelogPage, docPages } from '../lib/docs-entries';
import { absoluteLinks, DEFINITION, keyFacts, TEXT, versionSentence } from '../lib/llms';
import { INSTALL_COMMAND } from '../lib/site';

/**
 * The whole documentation in one Markdown file, for language models: what
 * Spawner is and its scope, then every page in sidebar order, then the
 * changelog.
 */
export const GET: APIRoute = async ({ site }) => {
  if (!site) {
    throw new Error('llms-full.txt needs the site URL (SITE_URL)');
  }
  const source = docsSource();
  const changelog = await changelogPage();
  const pages = [...(await docPages()), ...(changelog ? [changelog] : [])];
  const header = [
    '# Spawner',
    '',
    `> ${DEFINITION}`,
    '',
    `${versionSentence(source)} This file holds the whole documentation, one page after the other, then the changelog. Key facts:`,
    '',
    ...keyFacts(INSTALL_COMMAND),
    '',
  ].join('\n');
  const sections = pages.map(
    (page) => `# ${page.data.title}\n\nSource: ${new URL(`/${page.id}/`, site).href}\n\n${absoluteLinks(page.body ?? '', site).trim()}\n`,
  );
  return new Response([header, ...sections].join('\n'), { headers: TEXT });
};
