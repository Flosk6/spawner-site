/**
 * Downloads the documentation the site is built from: docs/*.md and
 * CHANGELOG.md of the Spawner repository, at its latest release or at
 * SPAWNER_DOCS_REF (a tag or a branch), into .docs-cache/, with what the
 * pages print about them: the date each file last changed (the commits
 * API) and the date and page of each release. Does nothing when
 * SPAWNER_DOCS_DIR points to a local checkout, which src/lib/docs-source.ts
 * reads with git. GITHUB_TOKEN, when set, lifts the rate limit of GitHub's
 * API (60 requests an hour without it; a fetch makes about 15).
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const REPO = 'Flosk6/Spawner';
const CACHE = path.resolve('.docs-cache');

if (process.env.SPAWNER_DOCS_DIR) {
  console.log(`Documentation from the checkout in ${process.env.SPAWNER_DOCS_DIR}`);
  process.exit(0);
}

const apiHeaders = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'spawner-site',
  'X-GitHub-Api-Version': '2022-11-28',
  ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
};

/** An answer of GitHub that is not a success, with its status. */
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/**
 * Why GitHub refused a request, in words that say what to do: a rate
 * limit (with the time it resets, and GITHUB_TOKEN when it is not set),
 * or the status and the message GitHub gave.
 */
async function refusal(response, what) {
  const remaining = response.headers.get('x-ratelimit-remaining');
  const reset = Number(response.headers.get('x-ratelimit-reset'));
  if ((response.status === 403 || response.status === 429) && (remaining === '0' || response.headers.has('retry-after'))) {
    const when = reset ? ` until ${new Date(reset * 1000).toISOString()}` : '';
    const hint = process.env.GITHUB_TOKEN ? '' : ': set GITHUB_TOKEN to a GitHub token (no scope needed) to raise the limit';
    return new HttpError(response.status, `GitHub's API rate limit is reached${when}${hint}`);
  }
  const body = await response.text().catch(() => '');
  const message = body.match(/"message"\s*:\s*"([^"]*)"/)?.[1];
  return new HttpError(response.status, `GitHub answered ${response.status} for ${what}${message ? `: ${message}` : ''}`);
}

/**
 * Fetches a URL, once more after two seconds when the network fails or
 * GitHub answers 5xx. Other refusals (404, rate limits) are final.
 */
async function request(url, headers, what) {
  for (let attempt = 1; ; attempt++) {
    let response;
    try {
      response = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) });
    } catch (error) {
      if (attempt === 1) {
        await sleep(2000);
        continue;
      }
      const cause = error instanceof Error ? (error.cause?.code ?? error.cause?.message ?? error.message) : String(error);
      throw new Error(`Could not reach ${new URL(url).host} for ${what} (${cause}): check the network`);
    }
    if (response.ok) {
      return response;
    }
    if (response.status >= 500 && attempt === 1) {
      await sleep(2000);
      continue;
    }
    throw await refusal(response, what);
  }
}

/** A JSON answer of the repository's API: `pathname` starts after /repos/<owner>/<name>. */
async function api(pathname) {
  const response = await request(`https://api.github.com/repos/${REPO}${pathname}`, apiHeaders, pathname);
  return response.json();
}

/** A file of the repository at a ref, from raw.githubusercontent.com (outside the API's rate limit). */
async function raw(ref, file) {
  const response = await request(`https://raw.githubusercontent.com/${REPO}/${ref}/${file}`, { 'User-Agent': 'spawner-site' }, `${file} at ${ref}`);
  return response.text();
}

/** The date of the last commit that changed a file at a ref, ISO 8601, or undefined for a file without history. */
async function lastChange(ref, file) {
  const commits = await api(`/commits?path=${encodeURIComponent(file)}&sha=${encodeURIComponent(ref)}&per_page=1`);
  return commits[0]?.commit?.committer?.date;
}

/** The published releases, by version: tag, publication date, page on GitHub. */
async function releases() {
  const list = await api('/releases?per_page=100');
  const byVersion = {};
  for (const release of list) {
    if (!release.draft && release.published_at && /^v\d/.test(release.tag_name)) {
      byVersion[release.tag_name.slice(1)] = { tag: release.tag_name, date: release.published_at, url: release.html_url };
    }
  }
  return byVersion;
}

try {
  const ref = process.env.SPAWNER_DOCS_REF || (await api('/releases/latest')).tag_name;
  const listing = await api(`/contents/docs?ref=${encodeURIComponent(ref)}`).catch((error) => {
    if (error instanceof HttpError && error.status === 404) {
      throw new Error(`${REPO} has no docs/ at ${ref}: set SPAWNER_DOCS_REF to a ref that has it (master, or a release from 2.0.0 on)`);
    }
    throw error;
  });
  const names = listing.filter((item) => item.type === 'file' && item.name.endsWith('.md')).map((item) => item.name);
  const { version } = JSON.parse(await raw(ref, 'package.json'));
  const files = [...names.map((name) => `docs/${name}`), 'CHANGELOG.md'];

  const contents = {};
  const modified = {};
  for (const file of files) {
    contents[file] = await raw(ref, file);
    const date = await lastChange(ref, file);
    if (date) {
      modified[file] = date;
    }
  }
  const published = await releases();

  await rm(CACHE, { recursive: true, force: true });
  await mkdir(path.join(CACHE, 'docs'), { recursive: true });
  for (const [file, text] of Object.entries(contents)) {
    await writeFile(path.join(CACHE, file), text);
  }
  await writeFile(
    path.join(CACHE, 'source.json'),
    `${JSON.stringify({ repo: REPO, ref, version, fetchedAt: new Date().toISOString(), modified, releases: published }, null, 2)}\n`,
  );
  console.log(`Documentation of ${REPO} at ${ref} (Spawner ${version}): ${names.length} pages, ${Object.keys(published).length} releases`);
} catch (error) {
  console.error(`Could not fetch the documentation: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}
