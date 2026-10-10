import { describe, expect, it } from 'vitest';
import { CHANGELOG, docsSidebar, documentTitle, GROUPS, groupPages, markdownPath, OVERVIEW, orderPages, PAGES, unlistedPages } from './docs-pages';

describe('groupPages', () => {
  it('keeps the groups of the pages that exist, in order, and drops empty ones', () => {
    expect(groupPages(['security', 'install', 'cli', 'concepts'])).toEqual([
      { label: 'Start', pages: ['install', 'concepts'] },
      { label: 'Reference', pages: ['cli'] },
      { label: 'Operate', pages: ['security'] },
    ]);
  });

  it('puts a page no group lists under Other, last', () => {
    expect(unlistedPages(['install', 'webhooks', 'api'])).toEqual(['api', 'webhooks']);
    expect(groupPages(['install', 'webhooks']).at(-1)).toEqual({ label: 'Other', pages: ['webhooks'] });
    expect(orderPages(['webhooks', 'architecture', 'install'])).toEqual(['install', 'architecture', 'webhooks']);
  });
});

describe('docsSidebar', () => {
  it('opens with the overview and ends with the changelog', () => {
    const sidebar = docsSidebar(['install', 'webhooks']);
    expect(sidebar[0]).toEqual({
      label: 'Start',
      items: [
        { slug: 'docs', label: 'Overview' },
        { slug: 'docs/install', label: 'Install' },
      ],
    });
    expect(sidebar[1]).toEqual({ label: 'Other', items: [{ slug: 'docs/webhooks' }] });
    expect(sidebar.at(-1)).toEqual({ label: 'Changelog', link: '/changelog/' });
  });

  it('keeps the overview without any page', () => {
    expect(docsSidebar([])[0]).toEqual({ label: 'Start', items: [{ slug: 'docs', label: 'Overview' }] });
  });
});

describe('the page data', () => {
  it('describes every page a group lists, and lists every page it describes', () => {
    const listed = GROUPS.flatMap((group) => group.pages);
    expect(new Set(listed).size).toBe(listed.length);
    expect(listed.sort()).toEqual(Object.keys(PAGES).sort());
  });

  it('keeps titles and descriptions to what search results show', () => {
    for (const meta of [...Object.values(PAGES), OVERVIEW, CHANGELOG]) {
      expect(documentTitle('', meta.seoTitle).length).toBeLessThanOrEqual(65);
      expect(meta.description?.length ?? 0).toBeLessThanOrEqual(170);
    }
  });
});

describe('documentTitle', () => {
  it('adds the site name only when the title does not name Spawner', () => {
    expect(documentTitle('Installing Spawner', 'Install Spawner on a Linux server')).toBe('Install Spawner on a Linux server');
    expect(documentTitle('.spawner/', 'spawner.yaml and compose file reference')).toBe('spawner.yaml and compose file reference | Spawner');
    expect(documentTitle('Webhooks')).toBe('Webhooks | Spawner');
  });
});

describe('markdownPath', () => {
  it('gives the Markdown version of the docs pages and the changelog', () => {
    expect(markdownPath('docs/cli')).toBe('/docs/cli.md');
    expect(markdownPath('changelog')).toBe('/changelog.md');
    expect(markdownPath('docs')).toBeUndefined();
  });
});
