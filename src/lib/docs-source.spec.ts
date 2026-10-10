import { describe, expect, it } from 'vitest';
import { describedRelease, describedVersion, isRelease, pageDates, parseGitDates, parseGitTags, type DocsSource } from './docs-source';

const release = { tag: 'v2.1.0', date: '2026-10-09T09:00:00Z', url: 'https://github.com/Flosk6/Spawner/releases/tag/v2.1.0' };

/** A source built from the v2.1.0 release, with these files' dates. */
function source(modified: Record<string, string>, ref = 'v2.1.0'): DocsSource {
  return { dir: '/tmp', ref, version: '2.1.0', modified, releases: { '2.1.0': release } };
}

describe('describedVersion', () => {
  it('names the version of a release', () => {
    const source = { dir: '/tmp', ref: 'v2.0.0', version: '2.0.0' };
    expect(isRelease(source)).toBe(true);
    expect(describedVersion(source)).toBe('Spawner 2.0.0');
  });

  it('does not present a branch as a released version', () => {
    const source = { dir: '/tmp', ref: 'master', version: '2.0.0' };
    expect(isRelease(source)).toBe(false);
    expect(describedVersion(source)).toBe('the master branch of Spawner (2.0.0 and the changes since)');
  });
});

describe('describedRelease', () => {
  it('gives the release of a release build only', () => {
    expect(describedRelease(source({}))).toEqual(release);
    expect(describedRelease(source({}, 'master'))).toBeUndefined();
  });
});

describe('parseGitDates', () => {
  it('keeps the newest date of each file', () => {
    const log = '\u00002026-10-08T17:23:06+02:00\n\ndocs/install.md\nCHANGELOG.md\n\u00002026-10-01T10:00:00+02:00\n\ndocs/install.md\ndocs/cli.md\n';
    expect(parseGitDates(log)).toEqual({
      'docs/install.md': '2026-10-08T17:23:06+02:00',
      'CHANGELOG.md': '2026-10-08T17:23:06+02:00',
      'docs/cli.md': '2026-10-01T10:00:00+02:00',
    });
  });

  it('gives nothing without a history', () => {
    expect(parseGitDates('')).toEqual({});
  });
});

describe('parseGitTags', () => {
  it('reads the version tags and links their release', () => {
    expect(parseGitTags('v2.1.0\t2026-10-09T11:00:00+02:00\nlatest\t2026-10-09T11:00:00+02:00\n')).toEqual({
      '2.1.0': { tag: 'v2.1.0', date: '2026-10-09T11:00:00+02:00', url: 'https://github.com/Flosk6/Spawner/releases/tag/v2.1.0' },
    });
  });
});

describe('pageDates', () => {
  it('dates the pages from their files, and the overview from the newest page or the release', () => {
    const dates = pageDates(source({ 'docs/install.md': '2026-10-08T15:00:00Z', 'docs/cli.md': '2026-10-01T10:00:00Z', 'CHANGELOG.md': '2026-10-09T08:00:00Z' }));
    expect(Object.fromEntries(dates)).toEqual({
      '/docs/install/': '2026-10-08T15:00:00Z',
      '/docs/cli/': '2026-10-01T10:00:00Z',
      '/changelog/': '2026-10-09T08:00:00Z',
      '/docs/': '2026-10-09T09:00:00Z',
    });
  });

  it('dates nothing it does not know', () => {
    expect(pageDates(source({}, 'master')).size).toBe(0);
  });
});
