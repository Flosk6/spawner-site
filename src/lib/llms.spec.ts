import { describe, expect, it } from 'vitest';
import { absoluteLinks, DEFINITION, keyFacts, markdownUrl, pageMarkdown, pageName, versionSentence } from './llms';

const site = new URL('https://spawner.run');
const release = { tag: 'v2.1.0', date: '2026-10-09T09:00:00Z', url: 'https://github.com/Flosk6/Spawner/releases/tag/v2.1.0' };

describe('versionSentence', () => {
  it('names the release and its date', () => {
    const source = { dir: '/tmp', ref: 'v2.1.0', version: '2.1.0', modified: {}, releases: { '2.1.0': release } };
    expect(versionSentence(source)).toBe('These pages describe Spawner 2.1.0, released 9 October 2026.');
  });

  it('names a branch without a date', () => {
    const source = { dir: '/tmp', ref: 'master', version: '2.1.0', modified: {}, releases: { '2.1.0': release } };
    expect(versionSentence(source)).toBe('These pages describe the master branch of Spawner (2.1.0 and the changes since).');
  });
});

describe('absoluteLinks', () => {
  it('makes the links of the site absolute, and leaves the others', () => {
    expect(absoluteLinks('[CLI](/docs/cli/#exit-codes "Exit") [GitHub](https://github.com/Flosk6/Spawner)\n[ref]: /changelog/', site)).toBe(
      '[CLI](https://spawner.run/docs/cli/#exit-codes "Exit") [GitHub](https://github.com/Flosk6/Spawner)\n[ref]: https://spawner.run/changelog/',
    );
  });
});

describe('pageMarkdown', () => {
  it('gives the heading, the source and the body with absolute links', () => {
    const entry = { id: 'docs/install', body: 'See [the CLI](/docs/cli/).\n', data: { title: 'Installing Spawner' } };
    expect(pageMarkdown(entry, site, { ref: 'v2.1.0', version: '2.1.0' })).toBe(
      '# Installing Spawner\n\n> From the documentation of Spawner 2.1.0. Web page: https://spawner.run/docs/install/\n\nSee [the CLI](https://spawner.run/docs/cli/).\n',
    );
  });
});

describe('markdownUrl and pageName', () => {
  it('lead to the Markdown version of a page', () => {
    expect(markdownUrl({ id: 'docs/cli' }, site)).toBe('https://spawner.run/docs/cli.md');
    expect(markdownUrl({ id: 'changelog' }, site)).toBe('https://spawner.run/changelog.md');
    expect(pageName({ id: 'docs/cli' })).toBe('cli');
  });
});

describe('the summary', () => {
  it('opens with the definition of Spawner and states the requirements', () => {
    expect(DEFINITION.startsWith('Spawner is an open source, self-hosted preview environment manager')).toBe(true);
    const facts = keyFacts('curl -fsSL https://github.com/Flosk6/Spawner/releases/latest/download/install.sh | sudo bash').join('\n');
    expect(facts).toContain('Apache-2.0');
    expect(facts).toContain('4 GiB of memory at least');
    expect(facts).toContain('No Kubernetes');
    expect(facts).toContain('releases/latest/download/install.sh');
  });
});
