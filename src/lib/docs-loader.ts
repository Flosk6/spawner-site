import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Loader, LoaderContext } from 'astro/loaders';
import { CHANGELOG, groupPages, OTHER_GROUP, OVERVIEW, orderPages, PAGES, pageLabel, unlistedPages } from './docs-pages';
import { docNames, type DocsSource } from './docs-source';
import { versionSentence } from './llms';
import { addReleaseLines, alertsToAsides, emptyHeaderCells, keepColumns, rewriteLinks, searchWeight, siteTarget, splitDoc, wordCells } from './markdown';
import { REPO_URL } from './site';

interface SourceFile {
  id: string;
  name: string;
  /** Path of the file in the repository: docs/install.md, CHANGELOG.md. */
  repoPath: string;
  file: string;
  /** Directory of the file in the repository, to resolve its relative links. */
  dir: string;
}

interface InternalLink {
  from: string;
  page: string;
  anchor: string;
}

/** The documentation's files are edited on master, whichever version the site describes. */
const EDIT_URL = `${REPO_URL}/edit/master`;

/**
 * Loads the documentation of the Spawner repository into Starlight's docs
 * collection: docs/<name>.md becomes /docs/<name>/, CHANGELOG.md becomes
 * /changelog/, and /docs/ lists the pages by group. The files stay written
 * for GitHub: titles, descriptions, links, dates and release lines are
 * derived here, and a link to a page or a heading that does not exist is
 * reported, as is a page no group of the sidebar lists.
 */
export function spawnerDocsLoader(source: DocsSource): Loader {
  return {
    name: 'spawner-docs',
    async load(context) {
      await sync(context, source);
      if (context.watcher) {
        let running = Promise.resolve();
        context.watcher.add([path.join(source.dir, 'docs'), path.join(source.dir, 'CHANGELOG.md')]);
        context.watcher.on('all', (_event, file) => {
          if (path.resolve(file).startsWith(source.dir + path.sep)) {
            running = running.then(() => sync(context, source)).catch((error: unknown) => context.logger.error(String(error)));
          }
        });
      }
    },
  };
}

/**
 * The path an entry would have in Starlight's own docs folder, where
 * Starlight expects every entry to live. Its date and edit link are given
 * explicitly, since git knows nothing of this path.
 */
function collectionPath(id: string): string {
  return `src/content/docs/${id}.md`;
}

/** Reads every page again and replaces the collection: the overview depends on all of them. */
async function sync(context: LoaderContext, source: DocsSource): Promise<void> {
  const { store, parseData, renderMarkdown, generateDigest, logger } = context;
  const docsDir = path.join(source.dir, 'docs');
  const names = orderPages(docNames(source));
  const pages = new Set(names);
  const files: SourceFile[] = [
    ...names.map((name) => ({ id: `docs/${name}`, name, repoPath: `docs/${name}.md`, file: path.join(docsDir, `${name}.md`), dir: 'docs' })),
    { id: CHANGELOG.id, name: CHANGELOG.id, repoPath: 'CHANGELOG.md', file: path.join(source.dir, 'CHANGELOG.md'), dir: '' },
  ];

  for (const name of unlistedPages(names)) {
    logger.warn(`docs/${name}.md is in no group of the sidebar: it goes under "${OTHER_GROUP}" until src/lib/docs-pages.ts lists it`);
  }

  const links: InternalLink[] = [];
  const anchors = new Map<string, Set<string>>();
  const listed = new Map<string, string>();
  const kept = new Set<string>();

  for (const [index, entry] of files.entries()) {
    const raw = await readFile(entry.file, 'utf8');
    const split = splitDoc(raw, entry.name);
    const { title } = split;
    const meta = entry.dir === 'docs' ? PAGES[entry.name] : CHANGELOG;
    const description = meta?.description ?? split.description;
    const linked = rewriteLinks(split.body, (target, kind) => {
      const resolved = siteTarget(target, { fromDir: entry.dir, ref: source.ref, pages, repoUrl: REPO_URL }, kind);
      const internal = resolved.match(/^\/docs\/([^/#]+)\/(?:#(.+))?$/);
      if (internal) {
        links.push({ from: entry.id, page: internal[1], anchor: internal[2] ?? '' });
      }
      return resolved;
    });
    const content = entry.id === CHANGELOG.id ? addReleaseLines(linked, source.releases) : linked;
    const weight = meta?.searchWeight;
    const markdown = keepColumns(alertsToAsides(weight ? searchWeight(content, weight) : content));
    const rendered = await renderMarkdown(markdown, { fileURL: pathToFileURL(entry.file) });
    anchors.set(entry.name, new Set(rendered.metadata?.headings?.map((heading) => heading.slug) ?? []));
    const modified = source.modified[entry.repoPath];
    const data = await parseData({
      id: entry.id,
      data: {
        title,
        description,
        seoTitle: meta?.seoTitle,
        editUrl: `${EDIT_URL}/${entry.repoPath}`,
        ...(modified ? { lastUpdated: new Date(modified) } : {}),
        sidebar: { order: index + 1, label: entry.dir === 'docs' ? pageLabel(entry.name, title) : CHANGELOG.label },
      },
    });
    const filePath = collectionPath(entry.id);
    store.set({
      id: entry.id,
      data,
      body: content,
      rendered: { ...rendered, html: wordCells(emptyHeaderCells(rendered.html)) },
      filePath,
      digest: generateDigest({ data, content: markdown, filePath }),
    });
    kept.add(entry.id);
    if (entry.dir === 'docs') {
      listed.set(entry.name, `- [${title}](/docs/${entry.name}/): ${description}`);
    }
  }

  const overview = [
    `${versionSentence(source)} They come from the [docs folder](${REPO_URL}/tree/${source.ref}/docs) of its repository. Each page also exists in Markdown, for coding agents and language models: [llms.txt](/llms.txt) lists them.`,
    '',
    ...groupPages(names).flatMap((group) => [`## ${group.label}`, '', ...group.pages.map((name) => listed.get(name) ?? ''), '']),
    'What changed in each version is in [the changelog](/changelog/).',
  ].join('\n');
  const overviewData = await parseData({
    id: OVERVIEW.id,
    data: {
      title: 'Documentation',
      description: OVERVIEW.description,
      seoTitle: OVERVIEW.seoTitle,
      editUrl: false,
      pagefind: false,
      sidebar: { order: 0, label: OVERVIEW.label },
    },
  });
  const overviewPath = collectionPath('docs/index');
  store.set({
    id: OVERVIEW.id,
    data: overviewData,
    body: overview,
    rendered: await renderMarkdown(overview, { fileURL: pathToFileURL(path.join(docsDir, 'index.md')) }),
    filePath: overviewPath,
    digest: generateDigest({ data: overviewData, content: overview, filePath: overviewPath }),
  });
  kept.add(OVERVIEW.id);

  for (const id of store.keys()) {
    if (!kept.has(id)) {
      store.delete(id);
    }
  }

  for (const link of links) {
    const headings = anchors.get(link.page);
    if (!headings) {
      logger.warn(`${link.from} links to /docs/${link.page}/, which does not exist`);
    } else if (link.anchor && !headings.has(link.anchor)) {
      logger.warn(`${link.from} links to /docs/${link.page}/#${link.anchor}, a heading that does not exist`);
    }
  }
}
