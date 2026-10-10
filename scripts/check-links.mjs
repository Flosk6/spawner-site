/**
 * Checks every internal link of the built site: each href of every page of
 * dist/ must lead to a file of dist/, and each #fragment to an id of the page
 * it names. The docs loader only sees links inside the docs; this also covers
 * the home page, the 404 page and Starlight's own links. Exits 1 on a miss.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const DIST = path.resolve(process.argv[2] ?? 'dist');

/** Every HTML file under a directory. */
function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const file = path.join(dir, name);
    if (statSync(file).isDirectory()) return htmlFiles(file);
    return file.endsWith('.html') ? [file] : [];
  });
}

/** The file of dist/ a root-relative path is served from, or undefined. */
function target(pathname) {
  const file = path.join(DIST, decodeURIComponent(pathname));
  if (pathname.endsWith('/')) return existsSync(path.join(file, 'index.html')) ? path.join(file, 'index.html') : undefined;
  return existsSync(file) && statSync(file).isFile() ? file : undefined;
}

const ids = new Map();
/** The ids of a page, read once. */
function idsOf(file) {
  if (!ids.has(file)) {
    ids.set(file, new Set([...readFileSync(file, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((match) => match[1])));
  }
  return ids.get(file);
}

const misses = [];
for (const page of htmlFiles(DIST)) {
  const from = `/${path.relative(DIST, page)}`.replace(/index\.html$/, '');
  const html = readFileSync(page, 'utf8');
  for (const [, href] of html.matchAll(/<a\s[^>]*?href="([^"]*)"/g)) {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href) || href === '#' || href === '') continue;
    const url = new URL(href.replaceAll('&amp;', '&'), `https://site.invalid${from}`);
    const file = url.pathname === from ? page : target(url.pathname);
    if (!file) {
      misses.push(`${from} -> ${href}: no such page`);
    } else if (url.hash && file.endsWith('.html') && !idsOf(file).has(decodeURIComponent(url.hash.slice(1)))) {
      misses.push(`${from} -> ${href}: no such anchor`);
    }
  }
}

if (misses.length > 0) {
  console.error(`Broken links in ${DIST}:\n${[...new Set(misses)].map((miss) => `  ${miss}`).join('\n')}`);
  process.exit(1);
}
console.log(`Every internal link of ${DIST} resolves.`);
