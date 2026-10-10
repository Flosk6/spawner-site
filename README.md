# spawner-site

The website and the documentation of [Spawner](https://github.com/Flosk6/Spawner): preview environments for every branch, on your own server, for your team and its coding agents.

A static site built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build): the home page in `src/pages/index.astro`, the documentation under `/docs/`, the changelog under `/changelog/`.

## Where the documentation comes from

The documentation is written in the Spawner repository, next to the code it describes: `docs/*.md` and `CHANGELOG.md`. This site does not keep a copy. At build time, `scripts/fetch-docs.mjs` downloads those files from the latest release of Spawner (or from `SPAWNER_DOCS_REF`), and `src/lib/docs-loader.ts` turns them into pages:

- `docs/<name>.md` becomes `/docs/<name>/`, `CHANGELOG.md` becomes `/changelog/`, and `/docs/` lists the pages by group;
- the title is the file's `# ` heading, the description its first paragraph, unless `src/lib/docs-pages.ts` gives one;
- `src/lib/docs-pages.ts` also holds the groups of the sidebar, the `<title>` of each page (written for search) and its summary in `llms.txt`; a page it does not list still appears, under "Other", with a warning in the build log;
- links to other files of the repository lead to their page on the site, or to GitHub; GitHub's alerts (`> [!NOTE]`) become asides;
- code blocks wrap, except plain-text blocks laid out in columns or drawn, which keep their lines;
- the date of each page comes from its last commit (`source.json`, written by `fetch-docs`, or git with `SPAWNER_DOCS_DIR`), and the date of each release from GitHub;
- each page is also served in Markdown, `/docs/<name>.md` and `/changelog.md`, listed by `/llms.txt`, with all of them in `/llms-full.txt`;
- a link to a page or a heading that does not exist is reported in the build log.

To change the documentation, change it in the Spawner repository. The other pages are written here: the home page (`src/pages/index.astro`, its questions in `src/data/faq.ts`), the comparison (`src/pages/compare.astro`, its tables and sources in `src/data/compare.ts`) and the legal notice (`src/pages/legal.astro`).

## Develop

Node.js 22.12 or later, and pnpm 10.

```bash
pnpm install
pnpm dev:local                  # with a Spawner checkout in ../spawner: its docs, live
pnpm docs:fetch && pnpm dev     # or with the docs of the latest release
```

| Variable | Use |
|---|---|
| `SITE_URL` | Public address of the site, for canonical URLs, the sitemap and social cards: required to build (`http://localhost:4321` for a local check), optional in development |
| `SPAWNER_DOCS_DIR` | A Spawner checkout to read the docs from, instead of downloading them |
| `SPAWNER_DOCS_REF` | The tag or branch to download the docs from (default: the latest release) |
| `GITHUB_TOKEN` | Lifts the rate limit of GitHub's API when downloading the docs |

## Build and check

```bash
SITE_URL=https://spawner.run pnpm build   # dist/, a static site; the build refuses to run without SITE_URL
pnpm check                                # types
pnpm test                                 # the helpers: Markdown, docs pages, llms.txt, structured data, FAQ, comparison
pnpm links                                # every internal link and anchor of dist/ resolves
pnpm lighthouse                           # Lighthouse on the built site: accessibility and SEO must stay at 100
```

`pnpm images` renders, from `scripts/images/` and with a local Chrome (`CHROME` to point to another one), the social card (`public/og.png`) and the icons: `icon-512.png`, `icon-192.png`, `apple-touch-icon.png` (180 px) and `favicon.ico`. `pnpm images icons` renders the icons only.

## Deploy

The site is served by Cloudflare (Workers static assets, no Worker script): `wrangler.jsonc` points at `dist/`, `public/_headers` sets the security headers and the caching of hashed files, `public/_redirects` the pages that moved. `.github/workflows/deploy.yml` builds the site from the latest release of Spawner and deploys it on every push to `master`, every day, and when Spawner's release workflow asks. Docs merged in Spawner before their release can go online first: set the repository variable `SPAWNER_DOCS_REF` to `master` (or run the deploy by hand with that `docs_ref`), then empty it once the release is out. `pnpm preview:cloudflare` serves `dist/` locally the way Cloudflare does, headers, redirects and trailing slashes included, on http://localhost:8787.

A page of the docs that Spawner renames or removes gets a line in `public/_redirects`, with and without its trailing slash.

## Terminal recordings

The terminal of the home page replays a real session in real time: `src/data/recordings/new-environment.cast`, in asciinema's format, recorded with `python3 scripts/record-terminal.py <session.json> <out.cast>` (a real bash, the command typed key by key; the script's docstring describes `session.json`, and `src/data/recordings/index.ts` how this one was made). The page shows the final screen as text and replays the session when it comes into view (never for readers who asked for less motion), with a button to pause and replay it. The same file can become a GIF for Spawner's README with asciinema's `agg`.

## License

[Apache-2.0](LICENSE), like Spawner.
