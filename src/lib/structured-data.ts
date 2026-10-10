/**
 * The structured data (schema.org, as JSON-LD) of the pages built from the
 * docs: a TechArticle for each page of docs/ and the changelog, and the
 * breadcrumb trail of every one. They point to the nodes the home page
 * describes, the WebSite (#website) and the SoftwareApplication (#software).
 */

export interface Crumb {
  name: string;
  url: string;
}

export interface DocPage {
  /** The page's absolute URL. */
  url: string;
  /** The home page's absolute URL, which carries #website and #software. */
  home: string;
  /** The heading of the page. */
  headline: string;
  description?: string;
  /** When the page last changed. */
  modified?: Date;
  /** From the home page to this one, both included. */
  trail: Crumb[];
  /** A TechArticle, or only the breadcrumbs (the /docs/ overview, a list of links). */
  article: boolean;
}

/** The JSON-LD graph of a page of the docs. */
export function docsJsonLd(page: DocPage): Record<string, unknown> {
  const graph: Record<string, unknown>[] = [];
  if (page.article) {
    graph.push({
      '@type': 'TechArticle',
      '@id': `${page.url}#article`,
      headline: page.headline,
      ...(page.description ? { description: page.description } : {}),
      url: page.url,
      inLanguage: 'en',
      ...(page.modified ? { dateModified: page.modified.toISOString() } : {}),
      isPartOf: { '@id': `${page.home}#website` },
      about: { '@id': `${page.home}#software` },
      breadcrumb: { '@id': `${page.url}#breadcrumb` },
    });
  }
  graph.push({
    '@type': 'BreadcrumbList',
    '@id': `${page.url}#breadcrumb`,
    itemListElement: page.trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  });
  return { '@context': 'https://schema.org', '@graph': graph };
}

/**
 * JSON for a <script type="application/ld+json">: `<` is escaped, so that
 * no text of a page can close the script element.
 */
export function jsonLdText(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
