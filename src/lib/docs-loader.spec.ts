import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { spawnerDocsLoader } from './docs-loader';
import type { DocsSource } from './docs-source';

interface Stored {
  id: string;
  data: Record<string, unknown>;
  body: string;
  rendered: { html: string };
}

let dir: string;
const stored = new Map<string, Stored>();
const warnings: string[] = [];

/** A copy of a Spawner repository's docs: two listed pages, one page no group lists, and a changelog. */
beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'spawner-docs-'));
  await mkdir(path.join(dir, 'docs'));
  await writeFile(path.join(dir, 'docs', 'install.md'), '# Installing Spawner\n\nOne command installs it.\n\n## Before you start\n\nSee [the CLI](cli.md#log-in) and [webhooks](webhooks.md#missing).\n\n| | Minimum |\n|---|---|\n| Memory | 4 GiB |\n');
  await writeFile(path.join(dir, 'docs', 'cli.md'), '# The `spawner` CLI\n\n`spawner` creates environments.\n\n## Log in\n\n> [!NOTE]\n> A note.\n');
  await writeFile(path.join(dir, 'docs', 'webhooks.md'), '# Webhooks\n\nReceiving webhooks.\n');
  await writeFile(path.join(dir, 'CHANGELOG.md'), '# Changelog\n\n## 2.1.0\n\nA new dashboard.\n');

  const source: DocsSource = {
    dir,
    ref: 'v2.1.0',
    version: '2.1.0',
    modified: { 'docs/install.md': '2026-10-08T15:23:06Z' },
    releases: { '2.1.0': { tag: 'v2.1.0', date: '2026-10-09T07:49:20Z', url: 'https://github.com/Flosk6/Spawner/releases/tag/v2.1.0' } },
  };
  const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const context = {
    store: {
      set: (entry: Stored) => stored.set(entry.id, entry),
      keys: () => [...stored.keys()],
      delete: (id: string) => stored.delete(id),
    },
    parseData: async ({ data }: { data: Record<string, unknown> }) => data,
    renderMarkdown: async (markdown: string) => ({
      html: markdown.includes('| |') ? '<table><thead><tr><th></th><th>Minimum</th></tr></thead></table>' : markdown,
      metadata: { headings: [...markdown.matchAll(/^## (.+)$/gm)].map((match) => ({ depth: 2, slug: slug(match[1]), text: match[1] })) },
    }),
    generateDigest: () => 'digest',
    logger: { warn: vi.fn((message: string) => warnings.push(message)), error: vi.fn() },
  };
  await spawnerDocsLoader(source).load(context as never);
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('spawnerDocsLoader', () => {
  it('gives each page its heading, its search title, its description, its source and its date', () => {
    const install = stored.get('docs/install')!;
    expect(install.data).toMatchObject({
      title: 'Installing Spawner',
      seoTitle: 'Install Spawner on a Linux server',
      description: 'One command installs it.',
      editUrl: 'https://github.com/Flosk6/Spawner/edit/master/docs/install.md',
      lastUpdated: new Date('2026-10-08T15:23:06Z'),
      sidebar: { order: 1, label: 'Install' },
    });
    expect(stored.get('docs/cli')!.data).toMatchObject({ description: expect.stringContaining('spawner CLI'), sidebar: { order: 2 } });
    expect(stored.get('docs/cli')!.data).not.toHaveProperty('lastUpdated');
  });

  it('describes from the first paragraph a page the site does not know, and orders it last', () => {
    expect(stored.get('docs/webhooks')!.data).toMatchObject({ title: 'Webhooks', description: 'Receiving webhooks.', sidebar: { order: 3, label: 'Webhooks' } });
    expect(warnings).toContain('docs/webhooks.md is in no group of the sidebar: it goes under "Other" until src/lib/docs-pages.ts lists it');
  });

  it('renders asides and plain cells, and keeps GitHub syntax in the body', () => {
    const cli = stored.get('docs/cli')!;
    expect(cli.rendered.html).toContain(':::note\nA note.\n:::');
    expect(cli.body).toContain('> [!NOTE]');
    expect(stored.get('docs/install')!.rendered.html).toBe('<table><thead><tr><td></td><th>Minimum</th></tr></thead></table>');
  });

  it('dates the releases of the changelog', () => {
    const changelog = stored.get('changelog')!;
    expect(changelog.body).toContain('## 2.1.0\n\nReleased 9 October 2026: [release notes and files on GitHub](https://github.com/Flosk6/Spawner/releases/tag/v2.1.0).');
    expect(changelog.data).toMatchObject({ seoTitle: 'Spawner changelog and release notes', editUrl: 'https://github.com/Flosk6/Spawner/edit/master/CHANGELOG.md' });
    expect(changelog.rendered.html).toContain('data-pagefind-weight="0.3"');
  });

  it('lists the pages by group on /docs/, out of search', () => {
    const overview = stored.get('docs')!;
    expect(overview.body).toContain('These pages describe Spawner 2.1.0, released 9 October 2026.');
    expect(overview.body).toContain('## Start\n\n- [Installing Spawner](/docs/install/): One command installs it.');
    expect(overview.body).toContain('## Reference\n\n- [The spawner CLI](/docs/cli/)');
    expect(overview.body).toContain('## Other\n\n- [Webhooks](/docs/webhooks/)');
    expect(overview.data).toMatchObject({ pagefind: false, editUrl: false, seoTitle: expect.stringContaining('Spawner documentation') });
  });

  it('reports links to headings that do not exist', () => {
    expect(warnings).toContain('docs/install links to /docs/webhooks/#missing, a heading that does not exist');
    expect(warnings.some((warning) => warning.includes('/docs/cli/#log-in'))).toBe(false);
  });
});
