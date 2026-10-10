import { describe, expect, it } from 'vitest';
import { CHECKED, codeSpans, compareJsonLd, CRITERIA, DESCRIPTION, GROUPS, SOURCES, SPAWNER, TITLE } from './compare';

const tools = [SPAWNER, ...GROUPS.flatMap((group) => group.tools)];
const cells = tools.flatMap((tool) => CRITERIA.map((criterion) => tool.cells[criterion.id]));

describe('codeSpans', () => {
  it('splits a cell on its code marks', () => {
    expect(codeSpans('Yes: `spawner up` sends it')).toEqual([
      { code: false, text: 'Yes: ' },
      { code: true, text: 'spawner up' },
      { code: false, text: ' sends it' },
    ]);
  });

  it('keeps a cell without marks whole', () => {
    expect(codeSpans('Apache-2.0')).toEqual([{ code: false, text: 'Apache-2.0' }]);
  });
});

describe('the comparison', () => {
  it('answers every criterion for every tool', () => {
    for (const tool of tools) {
      for (const criterion of CRITERIA) {
        expect(tool.cells[criterion.id]?.trim(), `${tool.name}: ${criterion.id}`).toBeTruthy();
      }
    }
  });

  it('leaves no code mark unclosed', () => {
    for (const cell of cells) {
      expect(cell.split('`').length % 2, cell).toBe(1);
    }
  });

  it('keeps tables narrow enough to read: at most three tools next to Spawner', () => {
    for (const group of GROUPS) {
      expect(group.tools.length).toBeGreaterThan(0);
      expect(group.tools.length).toBeLessThanOrEqual(3);
    }
  });

  it('gives each group a heading id of its own', () => {
    const ids = GROUPS.map((group) => group.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('cites a source for every tool it compares', () => {
    const cited = new Set(SOURCES.map((entry) => entry.tool));
    for (const tool of GROUPS.flatMap((group) => group.tools)) {
      expect(cited.has(tool.name), tool.name).toBe(true);
    }
  });

  it('links to pages of the site with their trailing slash, and to other sites over HTTPS', () => {
    for (const { url } of SOURCES.flatMap((entry) => entry.sources)) {
      if (url.startsWith('/')) {
        expect(url).toMatch(/^\/[a-z0-9/-]*\/(#[a-z0-9-]+)?$/);
      } else {
        expect(new URL(url).protocol).toBe('https:');
      }
    }
  });

  it('keeps to the copy rules: no emoji, no “room”', () => {
    const text = [TITLE, DESCRIPTION, ...cells, ...GROUPS.flatMap((group) => [group.title, group.summary])].join('\n');
    expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
    expect(text).not.toMatch(/\broom\b/i);
  });

  it('fits search results: a short title and a description of 160 characters at most', () => {
    expect(TITLE.length).toBeLessThanOrEqual(65);
    expect(DESCRIPTION.length).toBeGreaterThan(120);
    expect(DESCRIPTION.length).toBeLessThanOrEqual(160);
  });

  it('dates the check with the same day in both forms', () => {
    const date = new Date(`${CHECKED.iso}T12:00:00Z`);
    expect(date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })).toBe(CHECKED.text);
  });
});

describe('compareJsonLd', () => {
  const data = compareJsonLd({ url: 'https://spawner.run/compare/', home: 'https://spawner.run/' });
  const [page, breadcrumbs] = data['@graph'] as Record<string, unknown>[];

  it('describes a web page about the software of the home page', () => {
    expect(page).toMatchObject({
      '@type': 'WebPage',
      '@id': 'https://spawner.run/compare/#webpage',
      url: 'https://spawner.run/compare/',
      isPartOf: { '@id': 'https://spawner.run/#website' },
      about: { '@id': 'https://spawner.run/#software' },
      breadcrumb: { '@id': 'https://spawner.run/compare/#breadcrumb' },
      lastReviewed: CHECKED.iso,
    });
  });

  it('gives the trail from the home page to this one', () => {
    expect(breadcrumbs).toMatchObject({ '@type': 'BreadcrumbList', '@id': 'https://spawner.run/compare/#breadcrumb' });
    const items = breadcrumbs.itemListElement as { position: number; item: string }[];
    expect(items.map((item) => [item.position, item.item])).toEqual([
      [1, 'https://spawner.run/'],
      [2, 'https://spawner.run/compare/'],
    ]);
  });
});
