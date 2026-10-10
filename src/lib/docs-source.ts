import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

/** A published release of Spawner. */
export interface Release {
  /** The git tag: v2.1.0. */
  tag: string;
  /** When it was published, ISO 8601. */
  date: string;
  /** Its page on GitHub: notes and files. */
  url: string;
}

/** Where the documentation the site is built from comes from. */
export interface DocsSource {
  /** A Spawner checkout, or the copy written by scripts/fetch-docs.mjs: both hold docs/ and CHANGELOG.md. */
  dir: string;
  /** The git ref links to the repository's code point to. */
  ref: string;
  /** The version of Spawner these pages describe. */
  version: string;
  /**
   * When each file last changed, by its path in the repository
   * (docs/install.md, CHANGELOG.md): the date of the last commit that
   * touched it, ISO 8601. A file missing here has no known date.
   */
  modified: Record<string, string>;
  /** The published releases, by version (2.1.0). */
  releases: Record<string, Release>;
}

/** The Spawner repository on GitHub. */
const REPO_URL = 'https://github.com/Flosk6/Spawner';

let cached: DocsSource | undefined;

/** Whether the docs come from a release tag rather than a branch in progress. */
export function isRelease(source: Pick<DocsSource, 'ref'>): boolean {
  return /^v\d/.test(source.ref);
}

/**
 * What the pages describe, for a sentence such as "These pages describe …":
 * a released version, or a branch. A release bumps the version in master
 * before it tags it, so a branch holds its version plus what came after.
 */
export function describedVersion(source: Pick<DocsSource, 'ref' | 'version'>): string {
  return isRelease(source) ? `Spawner ${source.version}` : `the ${source.ref} branch of Spawner (${source.version} and the changes since)`;
}

/** The release these pages describe, when they come from one and GitHub knows its date. */
export function describedRelease(source: DocsSource): Release | undefined {
  return isRelease(source) ? source.releases[source.version] : undefined;
}

/** The names of the pages of docs/, without .md. */
export function docNames(source: Pick<DocsSource, 'dir'>): string[] {
  return readdirSync(path.join(source.dir, 'docs'))
    .filter((file) => file.endsWith('.md'))
    .map((file) => file.slice(0, -'.md'.length))
    .sort();
}

/**
 * When each page of the site built from the docs last changed, by its path
 * (/docs/install/, /changelog/), for the sitemap. /docs/ lists the pages and
 * names the version: it changes with the newest of them and with the release.
 */
export function pageDates(source: DocsSource): Map<string, string> {
  const dates = new Map<string, string>();
  const overview: string[] = [];
  for (const [file, date] of Object.entries(source.modified)) {
    const page = file.match(/^docs\/([^/]+)\.md$/);
    if (page) {
      dates.set(`/docs/${page[1]}/`, date);
      overview.push(date);
    } else if (file === 'CHANGELOG.md') {
      dates.set('/changelog/', date);
    }
  }
  const release = describedRelease(source);
  if (release) {
    overview.push(release.date);
  }
  const newest = overview.sort((a, b) => Date.parse(b) - Date.parse(a))[0];
  if (newest) {
    dates.set('/docs/', newest);
  }
  return dates;
}

/**
 * The last commit date of each file of docs/ and of CHANGELOG.md, from the
 * output of `git log --format=%x00%cI --name-only`: newest commit first, so
 * the first date a file appears under is its last change.
 */
export function parseGitDates(log: string): Record<string, string> {
  const dates: Record<string, string> = {};
  for (const commit of log.split('\0')) {
    const [date, ...files] = commit.split('\n').map((line) => line.trim());
    if (!date) {
      continue;
    }
    for (const file of files) {
      if (file && !(file in dates)) {
        dates[file] = date;
      }
    }
  }
  return dates;
}

/**
 * The releases of a checkout, from its tags: `git for-each-ref` lines of
 * "<tag> TAB <date>". A tag's date stands in for the date GitHub published
 * the release, which only the API knows (scripts/fetch-docs.mjs).
 */
export function parseGitTags(output: string, repoUrl = REPO_URL): Record<string, Release> {
  const releases: Record<string, Release> = {};
  for (const line of output.split('\n')) {
    const [tag, date] = line.trim().split('\t');
    const version = tag?.match(/^v(\d+\.\d+\.\d+.*)$/)?.[1];
    if (version && date) {
      releases[version] = { tag, date, url: `${repoUrl}/releases/tag/${tag}` };
    }
  }
  return releases;
}

/**
 * Runs git in a checkout, through an argument array and without a shell.
 * Answers an empty string when git or the history is missing (an archive
 * of the sources), since dates are a plus, not a requirement.
 */
function git(dir: string, args: string[]): string {
  try {
    return execFileSync('git', ['-C', dir, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      env: { PATH: process.env.PATH ?? '', HOME: process.env.HOME ?? '', LANG: 'C' },
      maxBuffer: 16 * 1024 * 1024,
    });
  } catch {
    return '';
  }
}

/**
 * Resolves the documentation to build from: the Spawner checkout named by
 * SPAWNER_DOCS_DIR (to write docs and see them on the site at once), or
 * else the copy `pnpm docs:fetch` downloaded from a release.
 *
 * @throws When neither exists, with the command that fixes it
 */
export function docsSource(): DocsSource {
  if (cached) {
    return cached;
  }
  const local = process.env.SPAWNER_DOCS_DIR;
  if (local) {
    const dir = path.resolve(local);
    const pkg = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8')) as { version: string };
    const history = parseGitDates(git(dir, ['log', '--format=%x00%cI', '--name-only', '--', 'docs', 'CHANGELOG.md']));
    cached = {
      dir,
      ref: process.env.SPAWNER_DOCS_REF || 'master',
      version: pkg.version,
      modified: Object.fromEntries(Object.entries(history).filter(([file]) => existsSync(path.join(dir, file)))),
      releases: parseGitTags(git(dir, ['for-each-ref', '--format=%(refname:short)%09%(creatordate:iso-strict)', 'refs/tags'])),
    };
    return cached;
  }
  const dir = path.resolve('.docs-cache');
  const meta = path.join(dir, 'source.json');
  if (!existsSync(meta)) {
    throw new Error(
      'No documentation to build from. Run `pnpm docs:fetch`, or point SPAWNER_DOCS_DIR to a Spawner checkout: SPAWNER_DOCS_DIR=../spawner pnpm dev',
    );
  }
  const { ref, version, modified, releases } = JSON.parse(readFileSync(meta, 'utf8')) as Partial<DocsSource> & { ref: string; version: string };
  cached = { dir, ref, version, modified: modified ?? {}, releases: releases ?? {} };
  return cached;
}
