# CLAUDE.md

The website and documentation of Spawner (a self-hosted preview environment manager, repository `Flosk6/Spawner`, usually checked out in `../spawner`). See README.md for the commands.

## Rules

- **No emojis**, in code, comments or copy.
- **The documentation is not written here.** Pages under `/docs/` and `/changelog/` come from `docs/*.md` and `CHANGELOG.md` of the Spawner repository (`src/lib/docs-loader.ts`). Change them there; this repository only changes how they are turned into pages.
- **Accessibility and SEO come first.** `pnpm lighthouse` (Lighthouse CI, also run in CI) must keep accessibility and SEO at 100. Semantic HTML, one `h1` per page, sections labelled by their heading, visible focus, text contrast of 4.5:1 at least, status never told by color alone, sizes in `rem`, `prefers-reduced-motion` respected, pages complete without JavaScript.
- **Copy** in English, plain and specific: real numbers and real outputs of Spawner, no generic claims. Say "capacity" or "how many more fit", never "room".
- **The pages written here** (home, FAQ, comparison, legal notice) state facts of the Spawner release the site describes: check them in Spawner's code when a release changes them. The comparison (`src/data/compare.ts`) is checked again before each release: its date (`CHECKED`), `SPAWNER_VERSION`, a source for every statement about another tool, and "What Spawner does not do" kept the same as Spawner's `docs/concepts.md`.
- **The legal notice stays true**: no cookies, no analytics, nothing loaded from another site. Change `/legal/` before adding anything that breaks one of them.
- **Moved pages**: a page of the docs that Spawner renames or removes gets a line in `public/_redirects`, with and without its trailing slash.

## Design

The dashboard's look, flat: its tokens (`apps/web/src/styles/tokens.css` in Spawner) copied into `src/styles/tokens.css`, a light theme and a dark one, the logo's violet for buttons, links and lines, the dashboard's status tones (ready, building, sleeping). Starlight's colors are in `src/styles/starlight.css`; when the dashboard's tokens change, both files follow.

- **Themes**: `data-theme` on `<html>`, `light` or `dark`, set before paint from the choice stored under `starlight-theme` (the key Starlight's own picker uses, so the landing and the docs share it), or else `prefers-color-scheme`. Every color is a `--sp-*` token defined for both themes, and checked in both: never a raw color in a component.
- **Navigation**: the header (`NAV` in `src/lib/site.ts`) links the site's own sections and pages; `Docs` is the one way into the documentation, which holds the technical pages, the changelog among them (its sidebar and the footer lead there).
- **The terminal** stays dark in both themes (`--sp-term-*`), as terminals are.
- **The dashboard screenshot** exists in both themes (`src/assets/screenshots/`), and the page shows the one of the current theme.
- **Type**: Overpass and Overpass Mono for the text, the wordmark in Chakra Petch 700 next to the dashboard's mark (`src/components/Wordmark.astro`), all self-hosted through Fontsource.

Avoided on purpose, because they make a page look generated: gradients, glows and halos, labels or pills above headings, gradient words in titles, decorative grids, fake browser or terminal windows, blinking cursors, pulsing dots, rows of identical cards, numbered sections that are not a sequence.

## Code

- Astro components with scoped styles; global styles only in `src/styles/`, their rules on elements inside `:where()`, so that a component's styles win whatever order the stylesheets load in.
- HTML's whitespace rules (`compressHTML: true`): a line break between a word and a link is a space, as in any HTML page.
- JSDoc on functions and components; no inline comments unless the logic is unusual.
- Pure helpers in `src/lib/markdown.ts` (no I/O); file and network access in the loader and `scripts/`.
