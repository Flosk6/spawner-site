/**
 * The pages of Spawner's docs/ as the site presents them: the sidebar groups,
 * the short labels, the <title> written for search, and a summary for
 * llms.txt. astro.config.mjs builds the sidebar from it and the loader the
 * order, the titles and the /docs/ overview, so this module stays plain
 * data and pure functions, with no import: Node loads it as is.
 */

export interface PageMeta {
  /** Name in the sidebar. */
  label: string;
  /**
   * The <title> of the page, with the words people search for. " | Spawner"
   * is added when it does not name Spawner.
   */
  seoTitle: string;
  /** Replaces the meta description taken from the first paragraph, when that one says too little. */
  description?: string;
  /** What a reader finds on the page, for llms.txt. */
  summary: string;
  /**
   * Below 1, search ranks the page lower (Pagefind's data-pagefind-weight),
   * so that the page that explains a topic comes before the ones that only
   * mention it: the architecture, for contributors, and the changelog.
   */
  searchWeight?: number;
}

/** The page /docs/ itself, which the loader writes. */
export const OVERVIEW = {
  id: 'docs',
  label: 'Overview',
  seoTitle: 'Spawner documentation: self-hosted preview environments',
  description:
    'Install Spawner on your own server, describe a project in .spawner/, then run its preview environments from the dashboard, the CLI or a coding agent.',
} as const;

/** The changelog, /changelog/, from CHANGELOG.md. */
export const CHANGELOG = {
  id: 'changelog',
  label: 'Changelog',
  seoTitle: 'Spawner changelog and release notes',
  description: 'What changed in each release of Spawner, newest first, with the date of each release and its files on GitHub.',
  searchWeight: 0.3,
} as const;

/** The pages of docs/, by file name. A page written later and missing here still appears, under "Other". */
export const PAGES: Record<string, PageMeta> = {
  quickstart: {
    label: 'Quickstart',
    seoTitle: 'Quickstart: your first preview environment with Spawner',
    summary: 'From a fresh install to the first preview environment of a project, step by step.',
  },
  install: {
    label: 'Install',
    seoTitle: 'Install Spawner on a Linux server',
    summary:
      'Requirements (a Linux server dedicated to previews, memory, disk, ports, a wildcard DNS record), the one-command installer and its options, DNS providers for the wildcard certificate, upgrades, removal.',
  },
  concepts: {
    label: 'Concepts',
    seoTitle: 'How Spawner works: environments, URLs, jobs and access',
    description:
      'How Spawner works: projects and sources, environments and their URLs, jobs and statuses, sleep and lifetime, roles and tokens, protected previews, and its limits.',
    summary:
      'Projects and their sources; environments, their URLs, jobs, statuses, sleep, lifetime and limits; accounts, roles, tokens, protected previews and the audit trail; supervision.',
  },
  manifest: {
    label: 'The manifest',
    seoTitle: 'spawner.yaml and compose file reference',
    description:
      'Reference of .spawner/: spawner.yaml (project, URLs, seed, other repositories), the Docker Compose file with its variables and rules, and cheap environments.',
    summary:
      'The two files of .spawner/: spawner.yaml (project, exposures and their URLs, seed, other repositories) and a regular Docker Compose file, its variables and the rules it must follow; how environments stay cheap (shared image layers, databases for previews, memory limits); logs.',
  },
  agents: {
    label: 'Coding agents',
    seoTitle: 'Preview environments for Claude Code, Codex, Cursor',
    description:
      'Give Claude Code, Codex, Cursor or any coding agent a preview environment of its branch, from its worktree: the spawner CLI with JSON output, or its MCP server.',
    summary:
      'Setting up Claude Code, Codex, Cursor or any other agent: the CLI and its login or a token of its own, the instructions spawner init adds to CLAUDE.md or AGENTS.md, the MCP server configuration, several agents at once, and what an agent cannot do.',
  },
  ci: {
    label: 'Pull requests and CI',
    seoTitle: 'Preview environments for pull requests in CI',
    description:
      'A Spawner preview environment for each pull request, from GitHub Actions or GitLab CI: spawner up at each push, its URL in a comment, spawner down when it closes.',
    summary: 'A preview environment for each pull request, from GitHub Actions or GitLab CI.',
  },
  examples: {
    label: 'Examples',
    seoTitle: 'Spawner examples: Node.js, PostgreSQL, Laravel, Next.js, MySQL',
    summary: 'The two example projects, ready to deploy: Node.js with PostgreSQL, and Laravel with Next.js and MySQL.',
  },
  cli: {
    label: 'CLI and MCP server',
    seoTitle: 'Spawner CLI and MCP server reference',
    description:
      'The spawner CLI creates, updates and deletes preview environments from a worktree, runs commands in them and reads their logs, with JSON output and an MCP server.',
    summary:
      'Installing and logging in, how the project and the environment are chosen, the commands (up, logs, exec, status, capacity, url, share, down...), the JSON output and the exit codes, the MCP server, and the section that tells coding agents how to use Spawner.',
  },
  configuration: {
    label: 'Configuration',
    seoTitle: 'Spawner configuration reference: every server setting',
    description:
      'Every setting of a Spawner server, read from the environment of its container: access, application, engine, lifecycle and limits, updates.',
    summary: 'Every environment variable of the server and its default: access, application, engine, lifecycle and limits, updates.',
  },
  security: {
    label: 'Security',
    seoTitle: 'Spawner security: compose policy, isolation and access',
    description:
      'How Spawner treats unreviewed branches: the compose policy, network isolation, access and protected previews, secrets, updates, and what it leaves to you.',
    summary:
      'The trust model, the compose policy (an allowlist), isolation between environments, access and roles, protected previews, secrets, updates, what Spawner does not protect, and how to report a vulnerability.',
  },
  operations: {
    label: 'Operations',
    seoTitle: 'Run a Spawner server: backups, restores, upgrades, monitoring',
    description:
      'Running a Spawner server day to day: where things are, settings, backups and restores, upgrades, disk space, monitoring, accounts and secrets.',
    summary: 'Running a server day to day: where its files are, settings, backups and restores, upgrades, disk space, monitoring, accounts, secrets.',
  },
  troubleshooting: {
    label: 'Troubleshooting',
    seoTitle: 'Troubleshooting Spawner preview environments',
    summary: 'What to check when something goes wrong: the installation, a build, a URL, an environment.',
  },
  architecture: {
    label: 'Architecture',
    seoTitle: 'Spawner architecture: API, engine, dashboard and CLI',
    description:
      'How Spawner is built, for those who read or change its code: the NestJS API and its engine, jobs, routing, the database, the Vue dashboard and the CLI.',
    summary:
      'For contributors: the pieces and the workspace, the API and its routes, the database, the engine (jobs, routing, lifecycle, supervision, updates), the data directory, the dashboard, the CLI, releases.',
    searchWeight: 0.3,
  },
};

/** The groups of the sidebar, in order. The overview opens the first one. */
export const GROUPS: { label: string; pages: string[] }[] = [
  { label: 'Start', pages: ['quickstart', 'install', 'concepts'] },
  { label: 'Guides', pages: ['manifest', 'agents', 'ci', 'examples'] },
  { label: 'Reference', pages: ['cli', 'configuration'] },
  { label: 'Operate', pages: ['security', 'operations', 'troubleshooting'] },
  { label: 'Contribute', pages: ['architecture'] },
];

/** Where the pages no group lists go. */
export const OTHER_GROUP = 'Other';

export interface PageGroup {
  label: string;
  /** File names of docs/, without .md. */
  pages: string[];
}

/**
 * The groups of the pages that exist, in order: the pages no group lists
 * come last, under "Other", and empty groups are left out.
 */
export function groupPages(names: Iterable<string>): PageGroup[] {
  const existing = new Set(names);
  const groups = GROUPS.map((group) => ({ label: group.label, pages: group.pages.filter((name) => existing.has(name)) }));
  const unlisted = unlistedPages(existing);
  if (unlisted.length) {
    groups.push({ label: OTHER_GROUP, pages: unlisted });
  }
  return groups.filter((group) => group.pages.length);
}

/** The pages no group lists, in alphabetical order: they belong in GROUPS and PAGES. */
export function unlistedPages(names: Iterable<string>): string[] {
  const listed = new Set(GROUPS.flatMap((group) => group.pages));
  return [...names].filter((name) => !listed.has(name)).sort();
}

/** The pages in the order of the sidebar, which also orders /docs/, llms.txt and the pagination. */
export function orderPages(names: Iterable<string>): string[] {
  return groupPages(names).flatMap((group) => group.pages);
}

/**
 * The sidebar of Starlight, for the pages that exist: the overview, the
 * groups, then the changelog. A page PAGES does not know goes by its title.
 */
export function docsSidebar(names: Iterable<string>) {
  const groups = groupPages(names).map((group, index) => ({
    label: group.label,
    items: [
      ...(index === 0 ? [{ slug: OVERVIEW.id, label: OVERVIEW.label }] : []),
      ...group.pages.map((name) => (PAGES[name] ? { slug: `docs/${name}`, label: PAGES[name].label } : { slug: `docs/${name}` })),
    ],
  }));
  if (!groups.length) {
    groups.push({ label: GROUPS[0].label, items: [{ slug: OVERVIEW.id, label: OVERVIEW.label }] });
  }
  return [...groups, { label: CHANGELOG.label, link: `/${CHANGELOG.id}/` }];
}

/** The sidebar label of a page of docs/: its own, or its title for a page PAGES does not know. */
export function pageLabel(name: string, title?: string): string {
  return PAGES[name]?.label ?? title ?? name;
}

/**
 * The <title> of a page: its search title, followed by the site's name
 * when it does not name Spawner, or else its heading and the site's name.
 */
export function documentTitle(title: string, seoTitle?: string): string {
  const base = seoTitle || title;
  return /\bSpawner\b/.test(base) ? base : `${base} | Spawner`;
}

/** The Markdown version of a page, for agents and llms.txt: /docs/<name>.md, /changelog.md, or none. */
export function markdownPath(id: string): string | undefined {
  if (id === CHANGELOG.id) {
    return `/${CHANGELOG.id}.md`;
  }
  const page = id.match(/^docs\/([^/]+)$/);
  return page ? `/docs/${page[1]}.md` : undefined;
}
