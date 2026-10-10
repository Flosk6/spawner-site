/** The repository the product, its documentation and its releases live in. */
export const REPO = 'Flosk6/Spawner';
export const REPO_URL = `https://github.com/${REPO}`;

export const SITE_NAME = 'Spawner';

/**
 * What Spawner is, in the one sentence used wherever a description is needed:
 * the meta description of the home page, its structured data, llms.txt.
 * The README and the npm package say the same.
 */
export const DESCRIPTION =
  'Spawner is an open source, self-hosted preview environment manager: a copy of your app for each git branch, on your own server, with its own URLs, database and logs, for teams and their coding agents.';

/** What the social card (public/og.png, from scripts/images/og.html) says, as its alt text: change both together. */
export const OG_IMAGE_ALT =
  'Spawner: preview environments for every branch, on your own server. Open source and self-hosted, for your team and its coding agents.';

export const INSTALL_COMMAND = `curl -fsSL ${REPO_URL}/releases/latest/download/install.sh | sudo bash`;

/** The CLI and MCP server on npm. */
export const NPM_URL = 'https://www.npmjs.com/package/spawner-cli';

/** The license, as the repository holds it. */
export const LICENSE_URL = `${REPO_URL}/blob/master/LICENSE`;

/** Who publishes Spawner, as its NOTICE file names them. */
export const AUTHOR = { name: 'Flosk6', url: 'https://github.com/Flosk6' };

/** The copyright line of the NOTICE file. */
export const COPYRIGHT = `Copyright 2025-2026 ${AUTHOR.name}`;

/** When the legal notice last changed: the date it prints, and its date in the sitemap. */
export const LEGAL_UPDATED = { iso: '2026-10-09', text: '9 October 2026' };

/**
 * Links of the main navigation, in the header of the home page and of the
 * pages built like it: the site's own sections and pages, and one way into
 * the documentation, which keeps the technical pages (the changelog among
 * them, in its sidebar and in the footer).
 */
export const NAV = [
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Features', href: '/#features' },
  { label: 'Compare', href: '/compare/' },
  { label: 'FAQ', href: '/#faq' },
  { label: 'Docs', href: '/docs/' },
];
