import type { APIRoute } from 'astro';
import { CHANGELOG, groupPages, PAGES } from '../lib/docs-pages';
import { docsSource } from '../lib/docs-source';
import { changelogPage, docPages } from '../lib/docs-entries';
import { DEFINITION, keyFacts, markdownUrl, pageName, TEXT, versionSentence } from '../lib/llms';
import { INSTALL_COMMAND, REPO_URL } from '../lib/site';

/** Pages of the docs that answer few questions about Spawner: llms.txt lists them under Optional. */
const OPTIONAL = new Set(['configuration', 'architecture']);

/** The headings of llms.txt for the groups of the sidebar, which are short. */
const SECTIONS: Record<string, string> = {
  Start: 'Getting started',
  Guides: 'Guides',
  Reference: 'Reference',
  Operate: 'Running a server',
  Other: 'Other pages',
};

/**
 * The index of the site for language models (llmstxt.org): what Spawner
 * is, the facts an answer needs, then each page in Markdown with what it
 * covers.
 */
export const GET: APIRoute = async ({ site }) => {
  if (!site) {
    throw new Error('llms.txt needs the site URL (SITE_URL)');
  }
  const source = docsSource();
  const pages = await docPages();
  const byName = new Map(pages.map((page) => [pageName(page), page]));
  const link = (name: string) => {
    const page = byName.get(name);
    return page ? `- [${page.data.title}](${markdownUrl(page, site)}): ${PAGES[name]?.summary ?? page.data.description}` : '';
  };
  const sections = groupPages(byName.keys())
    .map((group) => ({ heading: SECTIONS[group.label], pages: group.pages.filter((name) => !OPTIONAL.has(name)) }))
    .filter((section) => section.heading && section.pages.length)
    .flatMap((section) => [`## ${section.heading}`, '', ...section.pages.map(link), '']);
  const changelog = await changelogPage();

  const lines = [
    '# Spawner',
    '',
    `> ${DEFINITION}`,
    '',
    `${versionSentence(source)} Each page of the documentation is linked here in Markdown; its web page has the same path ending in \`/\` instead of \`.md\` (${new URL('/docs/install/', site).href}).`,
    '',
    'Key facts:',
    '',
    ...keyFacts(INSTALL_COMMAND),
    '',
    ...sections,
    '## Comparison and questions',
    '',
    `- [Spawner and the alternatives](${new URL('/compare/', site).href}): Spawner next to Coolify, Dokploy, Preevy, PullPreview, Vercel, Netlify, Render, Railway, Heroku review apps and Kubernetes platforms, criterion by criterion, and when to choose another tool`,
    `- [Frequently asked questions](${new URL('/#faq', site).href}): short answers to the common questions about Spawner`,
    '',
    '## Optional',
    '',
    ...[...OPTIONAL].map(link).filter(Boolean),
    ...(changelog ? [`- [Changelog](${markdownUrl(changelog, site)}): ${CHANGELOG.description}`] : []),
    `- [Source code](${REPO_URL}): the repository on GitHub, with the examples and the issues`,
    `- [All the documentation in one file](${new URL('/llms-full.txt', site).href}): every page above and the changelog, in Markdown`,
    '',
  ];
  return new Response(lines.join('\n'), { headers: TEXT });
};
