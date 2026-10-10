import { describe as group, expect, it } from 'vitest';
import {
  addReleaseLines,
  alertsToAsides,
  describe,
  emptyHeaderCells,
  formatDate,
  keepColumns,
  plainText,
  rewriteLinks,
  searchWeight,
  shorten,
  siteTarget,
  splitDoc,
  wordCells,
} from './markdown';

const context = { fromDir: 'docs', ref: 'v2.0.0', pages: new Set(['cli', 'install']), repoUrl: 'https://github.com/Flosk6/Spawner' };

group('splitDoc', () => {
  it('takes the first heading as the title and removes it from the body', () => {
    const doc = splitDoc('# The `spawner` CLI\n\nIt creates environments.\n\n## Install\n', 'cli');
    expect(doc.title).toBe('The spawner CLI');
    expect(doc.body).toBe('It creates environments.\n\n## Install\n');
    expect(doc.description).toBe('It creates environments.');
  });

  it('ignores a heading inside a code block', () => {
    const doc = splitDoc('```bash\n# a comment\n```\n\n# Install\n\nOne command.', 'install');
    expect(doc.title).toBe('Install');
  });

  it('falls back to the file name without a heading', () => {
    expect(splitDoc('Only text.', 'notes').title).toBe('notes');
  });
});

group('describe', () => {
  it('skips headings and code before the first paragraph, and keeps its text only', () => {
    const body = '## 2.0.0\n\n```bash\nnpm i\n```\n\nA **rewrite**: see [the docs](docs/install.md) and `spawner up`.\n\nMore.';
    expect(describe(body)).toBe('A rewrite: see the docs and spawner up.');
  });

  it('ends a paragraph that introduces a list with a full stop', () => {
    expect(describe('Two files describe a project:\n\n- spawner.yaml')).toBe('Two files describe a project.');
  });

  it('starts with a capital when the paragraph starts with code', () => {
    expect(describe('`spawner` creates environments.')).toBe('Spawner creates environments.');
  });

  it('keeps the second sentence of a paragraph of 161 characters', () => {
    const paragraph =
      'Spawner runs on one Linux server dedicated to previews. One command installs it, with Docker if needed, and prints the link that creates the first admin account.';
    expect(paragraph).toHaveLength(161);
    expect(describe(paragraph)).toBe(paragraph);
  });
});

group('shorten', () => {
  it('keeps whole sentences that fit', () => {
    const text = `${'A'.repeat(90)}. ${'B'.repeat(90)}.`;
    expect(shorten(text, 160)).toBe(`${'A'.repeat(90)}.`);
  });

  it('allows about 170 characters by default', () => {
    const text = `${'a'.repeat(80)}. ${'b'.repeat(86)}. More after.`;
    expect(shorten(text)).toBe(`A${'a'.repeat(79)}. ${'b'.repeat(86)}.`);
  });

  it('does not end a sentence at a version number', () => {
    const text = `Nothing carries over from 1.x: install 2.0 on a fresh server. ${'C'.repeat(120)}.`;
    expect(shorten(text, 100)).toBe('Nothing carries over from 1.x: install 2.0 on a fresh server.');
  });

  it('cuts a single long sentence at a word', () => {
    const cut = shorten(`${'word '.repeat(50)}end.`, 40);
    expect(cut.endsWith('…')).toBe(true);
    expect(cut.length).toBeLessThanOrEqual(40);
  });
});

group('plainText', () => {
  it('removes links, code marks and emphasis', () => {
    expect(plainText('**Bold** [link](x.md) `code` *it*')).toBe('Bold link code it');
  });
});

group('rewriteLinks', () => {
  it('rewrites link targets outside code only', () => {
    const markdown = 'See [the CLI](cli.md) and `[x](cli.md)`.\n\n```md\n[y](cli.md)\n```\n[z](install.md "Install")';
    expect(rewriteLinks(markdown, (target) => `/${target}`)).toBe(
      'See [the CLI](/cli.md) and `[x](cli.md)`.\n\n```md\n[y](cli.md)\n```\n[z](/install.md "Install")',
    );
  });

  it('tells images from links, a badge inside a link included', () => {
    const kinds: string[] = [];
    rewriteLinks('![The dashboard](images/a.png) [![badge](b.svg)](cli.md) [a [nested] text](c.md)', (target, kind) => {
      kinds.push(`${target}:${kind.image ? 'image' : 'link'}`);
      return target;
    });
    expect(kinds).toEqual(['images/a.png:image', 'b.svg:image', 'cli.md:link', 'c.md:link']);
  });

  it('rewrites reference definitions, but not footnotes', () => {
    const markdown = '[cli]: cli.md "The CLI"\n[spaced]: <a file.md>\n[^1]: A footnote.';
    expect(rewriteLinks(markdown, (target) => `/${target}`)).toBe('[cli]: /cli.md "The CLI"\n[spaced]: </a file.md>\n[^1]: A footnote.');
  });
});

group('alertsToAsides', () => {
  it('turns GitHub alerts into Starlight asides, with GitHub labels', () => {
    const markdown = 'Text.\n\n> [!WARNING]\n> Back up first.\n>\n> - one\n\n> [!NOTE]\n> Plain.\n\n> A quote.';
    expect(alertsToAsides(markdown)).toBe('Text.\n\n:::caution[Warning]\nBack up first.\n\n- one\n:::\n\n:::note\nPlain.\n:::\n\n> A quote.');
  });

  it('leaves code blocks alone', () => {
    const markdown = '```md\n> [!TIP]\n> Inside.\n```';
    expect(alertsToAsides(markdown)).toBe(markdown);
  });

  it('closes an alert at the end of the document', () => {
    expect(alertsToAsides('> [!caution]\n> Last.')).toBe(':::danger[Caution]\nLast.\n:::');
  });
});

group('addReleaseLines', () => {
  const releases = { '2.1.0': { date: '2026-10-09T08:12:00Z', url: 'https://github.com/Flosk6/Spawner/releases/tag/v2.1.0' } };

  it('dates each released version under its heading, which keeps its text', () => {
    expect(addReleaseLines('# Changelog\n\n## 2.1.0\n\nA new dashboard.\n\n## Unreleased\n', releases)).toBe(
      '# Changelog\n\n## 2.1.0\n\nReleased 9 October 2026: [release notes and files on GitHub](https://github.com/Flosk6/Spawner/releases/tag/v2.1.0).\n\nA new dashboard.\n\n## Unreleased\n',
    );
  });

  it('skips versions without a release and code blocks', () => {
    const markdown = '## 2.2.0\n\n```md\n## 2.1.0\n```';
    expect(addReleaseLines(markdown, releases)).toBe(markdown);
  });

  it('formats dates in UTC', () => {
    expect(formatDate('2026-10-08T23:30:00Z')).toBe('8 October 2026');
  });
});

group('emptyHeaderCells', () => {
  it('turns empty header cells into plain cells and keeps the others', () => {
    expect(emptyHeaderCells('<thead><tr><th></th><th align="left">Minimum</th><th style="text-align:left"> </th></tr></thead>')).toBe(
      '<thead><tr><td></td><th align="left">Minimum</th><td style="text-align:left"></td></tr></thead>',
    );
  });
});

group('wordCells', () => {
  it('marks a single word of code in the first cell of a row, and nothing else', () => {
    const html =
      '<tr>\n<td><code>--no-wait</code></td>\n<td><code>x</code></td>\n</tr>\n<tr>\n<td><code>port 80 is taken</code></td>\n</tr>\n<tr>\n<td align="left"><code dir="auto">SPAWNER_DOMAIN</code></td>\n</tr>';
    expect(wordCells(html)).toBe(
      '<tr>\n<td><code class="word">--no-wait</code></td>\n<td><code>x</code></td>\n</tr>\n<tr>\n<td><code>port 80 is taken</code></td>\n</tr>\n<tr>\n<td align="left"><code class="word" dir="auto">SPAWNER_<wbr>DOMAIN</code></td>\n</tr>',
    );
  });
});

group('keepColumns', () => {
  it('keeps the lines of plain blocks laid out in columns or drawn', () => {
    const markdown = '```text\n  Dashboard     https://spawner.example.com\n```\n\n- A list:\n\n  ```\n  web\n   |    db\n  ```';
    expect(keepColumns(markdown)).toBe(
      '```text wrap=false\n  Dashboard     https://spawner.example.com\n```\n\n- A list:\n\n  ```text wrap=false\n  web\n   |    db\n  ```',
    );
  });

  it('lets output and other languages wrap', () => {
    const markdown = '```text\nerror: Not enough memory on the server: 2.6 GiB available\n  indented\n```\n\n```yaml\nkey:   value\n```';
    expect(keepColumns(markdown)).toBe(markdown);
  });

  it('looks for the end of a block with its own fence', () => {
    const markdown = '````markdown\n```text\na   b\n```\n````';
    expect(keepColumns(markdown)).toBe(markdown);
  });
});

group('searchWeight', () => {
  it('wraps the document, blank lines kept around the Markdown', () => {
    expect(searchWeight('## Pieces\n\nText.\n', 0.3)).toBe('<div data-pagefind-weight="0.3">\n\n## Pieces\n\nText.\n\n</div>\n');
  });
});

group('siteTarget', () => {
  it('leads a page of the docs to its page on the site', () => {
    expect(siteTarget('cli.md#exit-codes', context)).toBe('/docs/cli/#exit-codes');
    expect(siteTarget('docs/install.md', { ...context, fromDir: '' })).toBe('/docs/install/');
    expect(siteTarget('../CHANGELOG.md', context)).toBe('/changelog/');
  });

  it('leads other files of the repository to GitHub, at the ref', () => {
    expect(siteTarget('../examples/node-postgres', context)).toBe('https://github.com/Flosk6/Spawner/tree/v2.0.0/examples/node-postgres');
    expect(siteTarget('../README.md#development', context)).toBe('https://github.com/Flosk6/Spawner/blob/v2.0.0/README.md#development');
    expect(siteTarget('missing.md', context)).toBe('https://github.com/Flosk6/Spawner/blob/v2.0.0/docs/missing.md');
  });

  it('keeps absolute URLs and anchors', () => {
    expect(siteTarget('https://example.com/a', context)).toBe('https://example.com/a');
    expect(siteTarget('#install', context)).toBe('#install');
  });

  it('serves an image of the repository from raw.githubusercontent.com', () => {
    expect(siteTarget('images/dashboard.png', context, { image: true })).toBe(
      'https://raw.githubusercontent.com/Flosk6/Spawner/v2.0.0/docs/images/dashboard.png',
    );
    expect(siteTarget('https://example.com/a.png', context, { image: true })).toBe('https://example.com/a.png');
  });
});
