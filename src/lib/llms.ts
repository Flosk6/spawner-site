import { markdownPath } from './docs-pages';
import { describedRelease, describedVersion, type DocsSource } from './docs-source';
import { formatDate } from './markdown';
import { DESCRIPTION } from './site';

/** What Spawner is, in one sentence: the definition llms.txt and llms-full.txt open with, the site's own. */
export const DEFINITION = DESCRIPTION;

/**
 * The facts an answer about Spawner needs, each checked against the code of
 * the release: license, what the server needs, what a project needs, how
 * agents drive it, what it sends out, and what it does not do.
 */
export function keyFacts(installCommand: string): string[] {
  return [
    '- License and price: free and open source, Apache-2.0. Self-hosted: you run it on a server of your own; there is no hosted service to sign up for.',
    `- Server: one Linux server dedicated to previews, Ubuntu 22.04 or 24.04 or Debian 12, amd64 or arm64; 4 GiB of memory at least, 8 GiB or more advised (memory decides how many environments run at once); 20 GiB of free disk at least; ports 80 and 443; a wildcard DNS record such as \`*.preview.example.com\`. One command installs it, with Docker if needed: \`${installCommand}\`.`,
    '- Projects: any application that runs with Docker Compose. A project adds a `.spawner/` directory to its repository: `spawner.yaml` (its URLs, its seed) and a regular Compose file, checked against a security policy (an allowlist). No Kubernetes, no cloud account.',
    '- Environments: one per branch, created from a pushed branch or from a local worktree with its uncommitted changes. Each has its own Docker network, database, logs and HTTPS URLs, routed by Traefik and protected by default. By default, an environment sleeps after 2 hours without activity and expires 72 hours after its last deploy.',
    '- Coding agents: the `spawner` CLI (`npm install -g spawner-cli`), with `--json` output and stable exit codes, and its MCP server (`spawner mcp`), whose tools are spawner_up, spawner_status, spawner_logs, spawner_exec, spawner_url, spawner_share, spawner_down, spawner_list and spawner_stats. Claude Code, Codex, Cursor and any MCP client work with it.',
    "- No telemetry: the server sends nothing about its use. It asks GitHub for new versions every 6 hours (`SPAWNER_UPDATE_CHECK=false` turns that off), and otherwise reaches only what its work needs: git hosts, image registries, Let's Encrypt and your DNS provider for certificates, GitHub when GitHub login is on.",
    "- Limits: one server per installation, for previews only (no cluster, no production); no environment created by itself when a pull request opens (CI calls `spawner up` instead); no private image registries; no single sign-on beyond GitHub login (no OIDC or SAML), and no permissions per project; environments share the server's kernel, isolated as containers are, and their outbound traffic is filtered only for the cloud's metadata and the server's own services.",
  ];
}

/** Which version the pages describe, and when it was released: "These pages describe Spawner 2.1.0, released 9 October 2026." */
export function versionSentence(source: DocsSource): string {
  const release = describedRelease(source);
  return `These pages describe ${describedVersion(source)}${release ? `, released ${formatDate(release.date)}` : ''}.`;
}

/** A page of the docs collection, as far as its Markdown version needs it. */
export interface PageEntry {
  id: string;
  body?: string;
  data: { title: string };
}

/** The name of a page of docs/ (install), from its entry id (docs/install). */
export function pageName(entry: { id: string }): string {
  return entry.id.replace(/^docs\//, '');
}

/**
 * Makes the site's own links of a Markdown body absolute, inline and in
 * reference definitions, for a reader outside the site.
 */
export function absoluteLinks(markdown: string, site: URL): string {
  return markdown
    .replace(/\]\(\/([^)\s]*)(\s+"[^"]*")?\)/g, (_whole, rest: string, title: string | undefined) => `](${new URL(`/${rest}`, site).href}${title ?? ''})`)
    .replace(/^( {0,3}\[[^\]]+\]:[ \t]*)\/(\S*)/gm, (_whole, start: string, rest: string) => `${start}${new URL(`/${rest}`, site).href}`);
}

/**
 * The Markdown version of a page, served next to it (/docs/install.md):
 * its heading, which version it describes and where its web page is, then
 * its body with absolute links. The body is the one GitHub shows, alerts
 * and all.
 */
export function pageMarkdown(entry: PageEntry, site: URL, source: Pick<DocsSource, 'ref' | 'version'>): string {
  const page = new URL(`/${entry.id}/`, site).href;
  return [
    `# ${entry.data.title}`,
    '',
    `> From the documentation of ${describedVersion(source)}. Web page: ${page}`,
    '',
    absoluteLinks(entry.body ?? '', site).trim(),
    '',
  ].join('\n');
}

/** The absolute URL of the Markdown version of a page. */
export function markdownUrl(entry: { id: string }, site: URL): string {
  const pathname = markdownPath(entry.id);
  return new URL(pathname ?? `/${entry.id}/`, site).href;
}

/** The headers of the text endpoints. */
export const TEXT = { 'Content-Type': 'text/plain; charset=utf-8' };
export const MARKDOWN = { 'Content-Type': 'text/markdown; charset=utf-8' };
