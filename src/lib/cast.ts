/** A terminal session to replay: what was printed, each chunk with the wait before it. */
export interface Recording {
  width: number;
  height: number;
  /** [seconds to wait before the chunk, the chunk], in order. */
  events: [number, string][];
}

/**
 * Reads an asciicast v2 file (the format of asciinema and of
 * scripts/record-terminal.py). Waits longer than `idleLimit` seconds are
 * shortened to it, as asciinema does, so that a build of twenty seconds
 * replays in a few.
 */
export function parseCast(text: string, { idleLimit = 1 }: { idleLimit?: number } = {}): Recording {
  const [headerLine, ...lines] = text.trim().split('\n');
  const header = JSON.parse(headerLine) as { width: number; height: number };
  const events: [number, string][] = [];
  let previous = 0;
  for (const line of lines) {
    const [time, type, data] = JSON.parse(line) as [number, string, string];
    if (type !== 'o') {
      continue;
    }
    events.push([Math.round(Math.min(time - previous, idleLimit) * 1000) / 1000, data]);
    previous = time;
  }
  return { width: header.width, height: header.height, events };
}
