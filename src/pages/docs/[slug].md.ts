import type { APIRoute, GetStaticPaths } from 'astro';
import type { CollectionEntry } from 'astro:content';
import { docsSource } from '../../lib/docs-source';
import { docPages } from '../../lib/docs-entries';
import { MARKDOWN, pageMarkdown, pageName } from '../../lib/llms';

/** One file per page of docs/: /docs/install.md next to /docs/install/. */
export const getStaticPaths = (async () => {
  const pages = await docPages();
  return pages.map((page) => ({ params: { slug: pageName(page) }, props: { page } }));
}) satisfies GetStaticPaths;

/** A page of the documentation in Markdown, for coding agents and language models. */
export const GET: APIRoute<{ page: CollectionEntry<'docs'> }> = ({ props, site }) => {
  if (!site) {
    throw new Error('The Markdown pages need the site URL (SITE_URL)');
  }
  return new Response(pageMarkdown(props.page, site, docsSource()), { headers: MARKDOWN });
};
