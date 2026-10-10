import { describe, expect, it } from 'vitest';
import { answerHtml, answerText, faq, faqJsonLd } from './faq';

describe('answerHtml', () => {
  it('turns code and links into HTML', () => {
    expect(answerHtml('Run `spawner up`, then read [the CLI](/docs/cli/).')).toBe('Run <code>spawner up</code>, then read <a href="/docs/cli/">the CLI</a>.');
  });

  it('escapes everything else', () => {
    expect(answerHtml('`a && b` <script> "x"')).toBe('<code>a &amp;&amp; b</code> &lt;script&gt; &quot;x&quot;');
  });
});

describe('answerText', () => {
  it('keeps the words and drops the marks', () => {
    expect(answerText('Run `spawner up`, then read [the CLI](/docs/cli/).')).toBe('Run spawner up, then read the CLI.');
  });
});

describe('faq', () => {
  it('asks six to eight questions', () => {
    expect(faq.length).toBeGreaterThanOrEqual(6);
    expect(faq.length).toBeLessThanOrEqual(8);
  });

  it('links to pages of the site only, with their trailing slash', () => {
    for (const { answer } of faq) {
      for (const [, , href] of answer.matchAll(/\[([^\]]+)\]\(([^)\s]+)\)/g)) {
        expect(href).toMatch(/^\/[a-z0-9/-]*\/(#[a-z0-9-]+)?$/);
      }
    }
  });

  it('leaves no mark unclosed', () => {
    for (const { answer } of faq) {
      expect(answer.split('`').length % 2).toBe(1);
      expect(answerText(answer)).not.toMatch(/[[\]`]/);
    }
  });

  it('gives structured data with the same questions as the page', () => {
    const data = faqJsonLd(faq, 'https://spawner.run/#faq') as { mainEntity: { name: string; acceptedAnswer: { text: string } }[] };
    expect(data.mainEntity.map((item) => item.name)).toEqual(faq.map((item) => item.question));
    expect(data.mainEntity[0].acceptedAnswer.text).toBe(answerText(faq[0].answer));
  });
});
