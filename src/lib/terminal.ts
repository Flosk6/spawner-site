/**
 * A small terminal emulator: enough of one to replay what a shell and the
 * spawner CLI print (text, colors, carriage returns, line erasing and the
 * cursor moves of readline) and to turn it into HTML. The page renders the
 * final screen at build time and replays the same output in the browser.
 */

const COLORS: Record<number, string> = {
  30: 'gray',
  31: 'red',
  32: 'green',
  33: 'yellow',
  34: 'blue',
  35: 'magenta',
  36: 'cyan',
  37: 'white',
  90: 'gray',
  91: 'red',
  92: 'green',
  93: 'yellow',
  94: 'blue',
  95: 'magenta',
  96: 'cyan',
  97: 'white',
};

const PROMPT = '$ ';

interface Cell {
  char: string;
  style: string;
}

const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export class Screen {
  private lines: Cell[][] = [[]];
  private row = 0;
  private col = 0;
  private bold = false;
  private dim = false;
  private color: string | null = null;
  /** The start of an escape sequence cut at the end of a chunk. */
  private pending = '';

  /** Applies what a program printed, possibly in several chunks. */
  write(data: string): void {
    const text = this.pending + data;
    this.pending = '';
    let i = 0;
    while (i < text.length) {
      const char = text[i];
      if (char === '\x1b') {
        const rest = text.slice(i);
        const csi = rest.match(/^\x1b\[([0-9;?]*)([@-~])/);
        if (csi) {
          this.control(csi[1], csi[2]);
          i += csi[0].length;
          continue;
        }
        const osc = rest.match(/^\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/);
        if (osc) {
          i += osc[0].length;
          continue;
        }
        if (/^\x1b(?:\[[0-9;?]*)?$/.test(rest) || /^\x1b\][^\x07]*$/.test(rest)) {
          this.pending = rest;
          return;
        }
        i += 2;
        continue;
      }
      if (char === '\r') {
        this.col = 0;
      } else if (char === '\n') {
        this.moveTo(this.row + 1);
        this.col = 0;
      } else if (char === '\b') {
        this.col = Math.max(0, this.col - 1);
      } else if (char === '\t') {
        this.put(' ');
      } else if (char >= ' ') {
        this.put(char);
      }
      i += 1;
    }
  }

  /** The screen as HTML: one line per row, styled runs in spans, the prompt marked. */
  html(): string {
    return this.lines
      .map((line) => {
        let html = '';
        let start = 0;
        if (line.slice(0, PROMPT.length).map((cell) => cell.char).join('') === PROMPT && !line[0].style) {
          html = '<span class="prompt">$</span> ';
          start = PROMPT.length;
        }
        let run = '';
        let style: string | null = null;
        const flush = () => {
          if (run) {
            html += style ? `<span class="${style}">${escapeHtml(run)}</span>` : escapeHtml(run);
          }
          run = '';
        };
        for (const cell of line.slice(start)) {
          if (cell.style !== style) {
            flush();
            style = cell.style;
          }
          run += cell.char;
        }
        flush();
        return html;
      })
      .join('\n');
  }

  /** The screen as plain text. */
  text(): string {
    return this.lines.map((line) => line.map((cell) => cell.char).join('')).join('\n');
  }

  private style(): string {
    return [this.bold && 'b', this.dim && 'd', this.color && `c-${this.color}`].filter(Boolean).join(' ');
  }

  private moveTo(row: number): void {
    this.row = Math.max(0, row);
    while (this.lines.length <= this.row) {
      this.lines.push([]);
    }
  }

  private put(char: string): void {
    const line = this.lines[this.row];
    while (line.length < this.col) {
      line.push({ char: ' ', style: '' });
    }
    line[this.col] = { char, style: this.style() };
    this.col += 1;
  }

  private control(params: string, final: string): void {
    const n = Number(params.replace('?', '') || 0);
    const line = this.lines[this.row];
    switch (final) {
      case 'm':
        this.sgr(params === '' ? [0] : params.split(';').map(Number));
        break;
      case 'K':
        if (n === 0) {
          line.length = Math.min(line.length, this.col);
        } else if (n === 2) {
          line.length = 0;
        } else {
          line.splice(0, this.col + 1, ...Array.from({ length: Math.min(this.col + 1, line.length) }, () => ({ char: ' ', style: '' })));
        }
        break;
      case 'J':
        if (n === 2) {
          this.lines = [[]];
          this.row = 0;
          this.col = 0;
        } else {
          line.length = Math.min(line.length, this.col);
          this.lines.length = this.row + 1;
        }
        break;
      case 'G':
        this.col = Math.max(0, (n || 1) - 1);
        break;
      case 'C':
        this.col += n || 1;
        break;
      case 'D':
        this.col = Math.max(0, this.col - (n || 1));
        break;
      case 'A':
        this.moveTo(this.row - (n || 1));
        break;
      case 'B':
        this.moveTo(this.row + (n || 1));
        break;
    }
  }

  private sgr(codes: number[]): void {
    for (let i = 0; i < codes.length; i += 1) {
      const code = codes[i];
      if (code === 0) {
        this.bold = false;
        this.dim = false;
        this.color = null;
      } else if (code === 1) {
        this.bold = true;
      } else if (code === 2) {
        this.dim = true;
      } else if (code === 22) {
        this.bold = false;
        this.dim = false;
      } else if (code === 39) {
        this.color = null;
      } else if (COLORS[code]) {
        this.color = COLORS[code];
      } else if (code === 38) {
        this.color = null;
        i += codes[i + 1] === 2 ? 4 : 2;
      }
    }
  }
}
