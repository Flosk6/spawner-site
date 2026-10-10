import { describe, expect, it } from 'vitest';
import { parseCast } from './cast';
import { Screen } from './terminal';

const screenOf = (...chunks: string[]) => {
  const screen = new Screen();
  chunks.forEach((chunk) => screen.write(chunk));
  return screen;
};

describe('Screen', () => {
  it('styles text with colors and weights, and resets them', () => {
    const screen = screenOf('\x1b[1mfeat-login\x1b[22m (blog) is \x1b[32mready\x1b[39m');
    expect(screen.text()).toBe('feat-login (blog) is ready');
    expect(screen.html()).toBe('<span class="b">feat-login</span> (blog) is <span class="c-green">ready</span>');
  });

  it('treats a bare reset like a full one', () => {
    expect(screenOf('\x1b[31m??\x1b[m .spawner/').html()).toBe('<span class="c-red">??</span> .spawner/');
  });

  it('follows carriage returns, line feeds and erasing', () => {
    expect(screenOf('building...\rready\x1b[K\r\nnext').text()).toBe('ready\nnext');
  });

  it('replays the cursor moves of a readline prompt', () => {
    const question = 'Create AGENTS.md with the instructions for coding agents? [Y/n] ';
    const screen = screenOf('$ spawner init\r\n', '\x1b[1G', '\x1b[0J', question, '\x1b[65G', 'y', '\r\r\n', 'Created .spawner/spawner.yaml\r\n');
    expect(screen.text()).toBe(`$ spawner init\n${question}y\nCreated .spawner/spawner.yaml\n`);
  });

  it('keeps an escape sequence cut between two chunks', () => {
    expect(screenOf('\x1b[3', '6mhttp://x\x1b[39m').html()).toBe('<span class="c-cyan">http://x</span>');
  });

  it('marks the prompt and escapes HTML', () => {
    expect(screenOf('$ echo "<b>"').html()).toBe('<span class="prompt">$</span> echo "&lt;b&gt;"');
  });
});

describe('parseCast', () => {
  it('reads the output events and shortens long waits', () => {
    const cast = ['{"version": 2, "width": 92, "height": 30}', '[0.0, "o", "$ "]', '[0.5, "o", "s"]', '[20.5, "o", "ready"]', '[20.6, "i", "x"]'].join('\n');
    expect(parseCast(cast, { idleLimit: 1 })).toEqual({
      width: 92,
      height: 30,
      events: [
        [0, '$ '],
        [0.5, 's'],
        [1, 'ready'],
      ],
    });
  });
});
