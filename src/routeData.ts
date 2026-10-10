import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { CHANGELOG, documentTitle, markdownPath, OVERVIEW } from './lib/docs-pages';
import { docsJsonLd, jsonLdText, type Crumb } from './lib/structured-data';

/** The text of a <title>: Starlight prints it as HTML. */
function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Starlight's route data, made for search: each page's <title> and
 * og:title carry the words people search for (src/lib/docs-pages.ts) while
 * the page keeps its heading; og:locale is a full locale; the Markdown
 * version of the page is announced; the page gets its date and its
 * structured data (a TechArticle and its breadcrumbs).
 */
export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;
  const { entry } = route;
  const site = context.site ?? new URL(context.url.origin);
  const title = documentTitle(entry.data.title, entry.data.seoTitle);

  for (const tag of route.head) {
    if (tag.tag === 'title') {
      tag.content = escapeHtml(title);
    } else if (tag.tag === 'meta' && tag.attrs?.property === 'og:title') {
      tag.attrs.content = title;
    } else if (tag.tag === 'meta' && tag.attrs?.property === 'og:locale') {
      tag.attrs.content = 'en_US';
    }
  }

  const markdown = markdownPath(entry.id);
  if (markdown) {
    route.head.push({ tag: 'link', attrs: { rel: 'alternate', type: 'text/markdown', href: markdown, title: 'This page in Markdown' }, content: '' });
  }
  if (route.lastUpdated) {
    route.head.push({ tag: 'meta', attrs: { property: 'article:modified_time', content: route.lastUpdated.toISOString() }, content: '' });
  }

  const home = new URL('/', site).href;
  const url = new URL(context.url.pathname, site).href;
  const trail: Crumb[] = [{ name: 'Spawner', url: home }];
  if (entry.id === CHANGELOG.id) {
    trail.push({ name: CHANGELOG.label, url });
  } else {
    trail.push({ name: 'Documentation', url: new URL(`/${OVERVIEW.id}/`, site).href });
    if (entry.id !== OVERVIEW.id) {
      trail.push({ name: entry.data.title, url });
    }
  }
  const data = docsJsonLd({
    url,
    home,
    headline: entry.data.title,
    description: entry.data.description,
    modified: route.lastUpdated,
    trail,
    article: entry.id !== OVERVIEW.id,
  });
  route.head.push({ tag: 'script', attrs: { type: 'application/ld+json' }, content: jsonLdText(data) });
});
