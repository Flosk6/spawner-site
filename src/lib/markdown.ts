/**
 * Pure helpers that turn a Markdown file of the Spawner repository into a
 * page of the site. The files are written for GitHub: their title is a
 * `# ` heading and their links point to other files of the repository.
 */

const FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})/;
const FENCE_CLOSE = /^ {0,3}(`{3,}|~{3,})\s*$/;
const LINK = /\]\(([^()\s]+)(\s+"[^"]*")?\)/g;
const REFERENCE = /^( {0,3}\[(?!\^)[^\]]+\]:[ \t]*)(<[^>]*>|\S+)(.*)$/;
const ALERT = /^ {0,3}> ?\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/i;
const QUOTED = /^ {0,3}> ?/;
const VERSION_HEADING = /^## \[?v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)\]?(?=\s|$)/;

/**
 * GitHub's alerts as Starlight's asides: the variant, and the title when
 * GitHub's differs from the variant's own.
 */
const ASIDES: Record<string, string> = {
  NOTE: 'note',
  TIP: 'tip',
  IMPORTANT: 'note[Important]',
  WARNING: 'caution[Warning]',
  CAUTION: 'danger[Caution]',
};

export interface SplitDoc {
  title: string;
  description: string;
  body: string;
}

/**
 * Calls `map` on each line with whether it is inside a fenced code block.
 */
function mapLines(markdown: string, map: (line: string, inFence: boolean) => string): string {
  let fence: string | null = null;
  return markdown
    .split('\n')
    .map((line) => {
      if (fence) {
        const close = line.match(FENCE_CLOSE);
        if (close && close[1][0] === fence[0] && close[1].length >= fence.length) {
          fence = null;
        }
        return map(line, true);
      }
      const open = line.match(FENCE_OPEN);
      if (open) {
        fence = open[1];
        return map(line, true);
      }
      return map(line, false);
    })
    .join('\n');
}

/**
 * Applies `map` to the parts of a line outside inline code spans.
 */
function mapOutsideCode(line: string, map: (text: string) => string): string {
  let out = '';
  let rest = line;
  for (;;) {
    const start = rest.indexOf('`');
    if (start < 0) {
      return out + map(rest);
    }
    const ticks = rest.slice(start).match(/^`+/)?.[0] ?? '`';
    const end = rest.indexOf(ticks, start + ticks.length);
    if (end < 0) {
      return out + map(rest);
    }
    out += map(rest.slice(0, start)) + rest.slice(start, end + ticks.length);
    rest = rest.slice(end + ticks.length);
  }
}

/**
 * The text of some inline Markdown, without links, code marks or emphasis.
 */
export function plainText(markdown: string): string {
  return markdown
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * The first sentences of a text that fit in `max` characters, for a meta
 * description. A first sentence longer than that is cut at a word. A text
 * that starts with code (`spawner` creates...) starts with a capital.
 */
export function shorten(text: string, max = 170): string {
  const sentence = (value: string) => value.replace(/:$/, '.').replace(/^[a-z]/, (letter) => letter.toUpperCase());
  if (text.length <= max) {
    return sentence(text);
  }
  let out = '';
  for (const part of text.split(/(?<=[.!?])\s+/)) {
    const next = out ? `${out} ${part}` : part;
    if (next.length > max) {
      break;
    }
    out = next;
  }
  if (out) {
    return sentence(out);
  }
  const cut = text.slice(0, max - 1);
  return sentence(`${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:]$/, '')}…`);
}

/**
 * Splits a document into its title (the first `# ` heading, removed from
 * the body since the page prints it), its description (the first paragraph)
 * and its body.
 */
export function splitDoc(markdown: string, fallbackTitle: string): SplitDoc {
  let title: string | null = null;
  const body = mapLines(markdown.replace(/\r\n/g, '\n'), (line, inFence) => {
    if (title === null && !inFence && /^# \S/.test(line)) {
      title = plainText(line.slice(2));
      return '\u0000';
    }
    return line;
  })
    .split('\n')
    .filter((line) => line !== '\u0000')
    .join('\n')
    .replace(/^\s+/, '');
  return { title: title ?? fallbackTitle, description: describe(body), body };
}

/**
 * The first paragraph of a body, as plain text short enough for a meta
 * description.
 */
export function describe(body: string, max = 170): string {
  const paragraph: string[] = [];
  let fence = false;
  for (const line of body.split('\n')) {
    if (FENCE_OPEN.test(line)) {
      if (paragraph.length) {
        break;
      }
      fence = !fence;
      continue;
    }
    if (fence) {
      continue;
    }
    const text = line.trim();
    if (!text) {
      if (paragraph.length) {
        break;
      }
      continue;
    }
    if (!paragraph.length && /^(#|>|\||[-*+] |\d+\. )/.test(text)) {
      continue;
    }
    paragraph.push(text);
  }
  return shorten(plainText(paragraph.join(' ')), max);
}

/**
 * Whether the `](` at `end` closes the text of an image (`![alt](src)`)
 * rather than of a link: the `[` that opens that text follows a `!`.
 */
function isImage(text: string, end: number): boolean {
  let depth = 0;
  for (let i = end - 1; i >= 0; i--) {
    if (text[i] === ']') {
      depth++;
    } else if (text[i] === '[') {
      if (depth === 0) {
        return text[i - 1] === '!';
      }
      depth--;
    }
  }
  return false;
}

/** What a link target is: the target of an image is fetched by the browser, not followed. */
export interface LinkKind {
  image: boolean;
}

/**
 * Rewrites the targets of the links and images of a document, inline and
 * in reference definitions (`[id]: target`), outside code blocks and
 * inline code.
 */
export function rewriteLinks(markdown: string, resolve: (target: string, kind: LinkKind) => string): string {
  return mapLines(markdown, (line, inFence) => {
    if (inFence) {
      return line;
    }
    const reference = line.match(REFERENCE);
    if (reference) {
      const [, start, target, rest] = reference;
      const resolved = target.startsWith('<') ? `<${resolve(target.slice(1, -1), { image: false })}>` : resolve(target, { image: false });
      return `${start}${resolved}${rest}`;
    }
    return mapOutsideCode(line, (text) =>
      text.replace(
        LINK,
        (_whole, target: string, title: string | undefined, offset: number) =>
          `](${resolve(target, { image: isImage(text, offset) })}${title ?? ''})`,
      ),
    );
  });
}

export interface TargetContext {
  /** Directory of the document in the repository: "docs", or "" for the root. */
  fromDir: string;
  /** Git ref of the links that leave the site for GitHub. */
  ref: string;
  /** Names of the pages of docs/ the site has. */
  pages: Set<string>;
  repoUrl: string;
}

/**
 * Where a link of a repository file leads on the site: another page of the
 * docs, the changelog, or the file on GitHub. An image of the repository is
 * served from raw.githubusercontent.com, since a GitHub page is not an
 * image. Absolute URLs and anchors of the same page stay as they are.
 */
export function siteTarget(target: string, { fromDir, ref, pages, repoUrl }: TargetContext, kind?: LinkKind): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#') || target.startsWith('/')) {
    return target;
  }
  const hashAt = target.indexOf('#');
  const file = hashAt >= 0 ? target.slice(0, hashAt) : target;
  const anchor = hashAt >= 0 ? target.slice(hashAt) : '';
  const parts: string[] = [];
  for (const part of `${fromDir}/${file}`.split('/')) {
    if (part === '..') {
      parts.pop();
    } else if (part && part !== '.') {
      parts.push(part);
    }
  }
  const repoPath = parts.join('/');
  if (kind?.image) {
    return `${repoUrl.replace('https://github.com/', 'https://raw.githubusercontent.com/')}/${ref}/${repoPath}`;
  }
  const page = repoPath.match(/^docs\/([^/]+)\.md$/);
  if (page && pages.has(page[1])) {
    return `/docs/${page[1]}/${anchor}`;
  }
  if (repoPath === 'CHANGELOG.md') {
    return `/changelog/${anchor}`;
  }
  const view = /\.[a-z0-9]+$/i.test(repoPath) ? 'blob' : 'tree';
  return `${repoUrl}/${view}/${ref}/${repoPath}${anchor}`;
}

/**
 * Turns GitHub's alerts (`> [!NOTE]`, `> [!WARNING]`...) into the
 * `:::note` asides Starlight renders, outside code blocks. GitHub's labels
 * stay: IMPORTANT, WARNING and CAUTION become a note, a caution and a
 * danger aside titled Important, Warning and Caution. Only the rendered page
 * gets them: the Markdown versions keep GitHub's syntax.
 */
export function alertsToAsides(markdown: string): string {
  const out: string[] = [];
  let aside: string | null = null;
  const close = () => {
    if (aside !== null) {
      out.push(':::');
      aside = null;
    }
  };
  let fence: string | null = null;
  for (const line of markdown.split('\n')) {
    if (aside !== null) {
      if (QUOTED.test(line)) {
        out.push(line.replace(QUOTED, ''));
        continue;
      }
      close();
    }
    if (fence) {
      const end = line.match(FENCE_CLOSE);
      if (end && end[1][0] === fence[0] && end[1].length >= fence.length) {
        fence = null;
      }
      out.push(line);
      continue;
    }
    const open = line.match(FENCE_OPEN);
    if (open) {
      fence = open[1];
      out.push(line);
      continue;
    }
    const alert = line.match(ALERT);
    if (alert) {
      aside = ASIDES[alert[1].toUpperCase()];
      out.push(`:::${aside}`);
      continue;
    }
    out.push(line);
  }
  close();
  return out.join('\n');
}

/** A date as the pages write it: 9 October 2026 (UTC). */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/**
 * Adds, under each version heading of a changelog (`## 2.1.0`), the date of
 * the release and a link to its page on GitHub. The headings stay as they
 * are, and so do their anchors. A version without a published release (a
 * section in progress) gets nothing.
 */
export function addReleaseLines(markdown: string, releases: Record<string, { date: string; url: string }>): string {
  return mapLines(markdown, (line, inFence) => {
    const version = inFence ? undefined : line.match(VERSION_HEADING)?.[1];
    const release = version ? releases[version] : undefined;
    return release ? `${line}\n\nReleased ${formatDate(release.date)}: [release notes and files on GitHub](${release.url}).` : line;
  });
}

/**
 * Turns the header cells a table leaves empty (`| | Minimum | Advised |`)
 * into plain cells: an empty header gives screen readers nothing to
 * announce for its column, and axe reports it.
 */
export function emptyHeaderCells(html: string): string {
  return html.replace(/<th(\s[^>]*)?>\s*<\/th>/g, (_whole, attrs: string | undefined) => `<td${attrs ?? ''}></td>`);
}

/**
 * Marks the code that fills the first cell of a table row when it is a
 * single word, a command, a flag or a variable (`--no-wait`), with the
 * class `word`, so that a wide page keeps it on one line rather than cut it
 * at a hyphen; on a narrow one, it may break after its underscores
 * (`SPAWNER_<wbr>DOMAIN`). A longer piece of code there, a message with
 * spaces, wraps.
 */
export function wordCells(html: string): string {
  return html.replace(
    /(<tr>\s*<td(?:\s[^>]*)?>)<code((?:\s[^>]*)?)>([^<\s]+)<\/code>(<\/td>)/g,
    (_whole, cell: string, attrs: string, word: string, end: string) => `${cell}<code class="word"${attrs}>${word.replace(/_(?=.)/g, '_<wbr>')}</code>${end}`,
  );
}

/** The languages of a plain-text code block: output, a drawing, a DNS record. */
const PLAIN_LANGUAGES = new Set(['', 'text', 'txt', 'plaintext']);

/** A run of two spaces or more between words: columns aligned by hand, or a drawing. */
const ALIGNED = /\S {2,}\S/;

/**
 * Keeps the lines of a plain-text code block as written when its layout
 * depends on them: a drawing, or columns aligned with spaces
 * (`Dashboard     https://...`). Code blocks wrap (astro.config.mjs), so
 * that a long command or error message reads whole; these get Expressive
 * Code's `wrap=false` instead, and scroll when they do not fit. Only the
 * rendered page gets the mark: the Markdown versions keep the files as
 * they are.
 */
export function keepColumns(markdown: string): string {
  const lines = markdown.split('\n');
  for (let start = 0; start < lines.length; start++) {
    const open = lines[start].match(/^(\s*)(`{3,}|~{3,})\s*([^\s`]*)(.*)$/);
    if (!open) {
      continue;
    }
    const [, indent, fence, language, rest] = open;
    let end = start + 1;
    while (end < lines.length) {
      const close = lines[end].match(/^\s*(`{3,}|~{3,})\s*$/);
      if (close && close[1][0] === fence[0] && close[1].length >= fence.length) {
        break;
      }
      end++;
    }
    if (PLAIN_LANGUAGES.has(language) && lines.slice(start + 1, end).some((line) => ALIGNED.test(line))) {
      lines[start] = `${indent}${fence}${language || 'text'}${rest} wrap=false`;
    }
    start = end;
  }
  return lines.join('\n');
}

/**
 * Wraps a document in an element that weighs its words in search
 * (Pagefind's data-pagefind-weight, 1 by default): a weight below 1 lets the
 * pages written for users come first.
 */
export function searchWeight(markdown: string, weight: number): string {
  return `<div data-pagefind-weight="${weight}">\n\n${markdown.trim()}\n\n</div>\n`;
}
