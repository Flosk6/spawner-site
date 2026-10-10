import { describe, expect, it } from 'vitest';
import { docsJsonLd, jsonLdText } from './structured-data';

const page = {
  url: 'https://spawner.run/docs/install/',
  home: 'https://spawner.run/',
  headline: 'Installing Spawner',
  description: 'Spawner runs on one Linux server dedicated to previews.',
  modified: new Date('2026-10-08T15:23:06Z'),
  trail: [
    { name: 'Spawner', url: 'https://spawner.run/' },
    { name: 'Documentation', url: 'https://spawner.run/docs/' },
    { name: 'Installing Spawner', url: 'https://spawner.run/docs/install/' },
  ],
  article: true,
};

describe('docsJsonLd', () => {
  it('describes a page as a TechArticle about the software of the home page', () => {
    const [article, breadcrumbs] = docsJsonLd(page)['@graph'] as Record<string, unknown>[];
    expect(article).toMatchObject({
      '@type': 'TechArticle',
      headline: 'Installing Spawner',
      dateModified: '2026-10-08T15:23:06.000Z',
      inLanguage: 'en',
      isPartOf: { '@id': 'https://spawner.run/#website' },
      about: { '@id': 'https://spawner.run/#software' },
    });
    expect(breadcrumbs).toMatchObject({ '@type': 'BreadcrumbList' });
    expect((breadcrumbs.itemListElement as { position: number; item: string }[]).map((item) => [item.position, item.item])).toEqual([
      [1, 'https://spawner.run/'],
      [2, 'https://spawner.run/docs/'],
      [3, 'https://spawner.run/docs/install/'],
    ]);
  });

  it('leaves out what it does not know, and the article of a list of links', () => {
    const graph = docsJsonLd({ ...page, description: undefined, modified: undefined, article: false })['@graph'] as Record<string, unknown>[];
    expect(graph).toHaveLength(1);
    expect(graph[0]['@type']).toBe('BreadcrumbList');
    const article = (docsJsonLd({ ...page, modified: undefined })['@graph'] as Record<string, unknown>[])[0];
    expect(article).not.toHaveProperty('dateModified');
  });
});

describe('jsonLdText', () => {
  it('cannot close the script element', () => {
    expect(jsonLdText({ headline: '</script><script>alert(1)</script>' })).not.toContain('</script>');
    expect(JSON.parse(jsonLdText({ a: '<b>' }))).toEqual({ a: '<b>' });
  });
});
