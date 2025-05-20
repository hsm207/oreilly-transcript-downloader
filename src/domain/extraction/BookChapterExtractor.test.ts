import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BookChapterExtractor } from './BookChapterExtractor';
import { BookChapterElement } from '../models/BookChapterElement';

// Mock the chrome API for PersistentLogger
vi.mock('../../infrastructure/logging/PersistentLogger', () => ({
  PersistentLogger: {
    getInstance: vi.fn().mockReturnValue({
      debug: vi.fn(),
      log: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

describe('BookChapterExtractor', () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement('div');
    root.id = 'book-content';
  });

  it('should extract chapterOpenerText correctly', () => {
    const chapterBody = document.createElement('div');
    chapterBody.className = 'chapterBody';
    chapterBody.innerHTML = `
      <p class=\"chapterOpenerText\"><span class=\"chapterOpenerFirstLetters\"><span class=\"bold\"><span class=\"italic\">I</span></span></span>n the old legend the wise men finally boiled down the history of mortal affairs into the single phrase, “This too will pass.”<a id=\"uft_re228\"></a><a href=\"9780061745171_Footnote.xhtml#uft_228\"><sup>*</sup></a> Confronted with a like challenge to distill the secret of sound investment into three words, we venture the motto, MARGIN OF SAFETY. This is the thread that runs through all the preceding discussion of investment policy—often explicitly, sometimes in a less direct fashion. Let us try now, briefly, to trace that idea in a connected argument.</p>
    `;
    root.appendChild(chapterBody);

    const expectedText =
      'In the old legend the wise men finally boiled down the history of mortal affairs into the single phrase, “This too will pass.”* Confronted with a like challenge to distill the secret of sound investment into three words, we venture the motto, MARGIN OF SAFETY. This is the thread that runs through all the preceding discussion of investment policy—often explicitly, sometimes in a less direct fashion. Let us try now, briefly, to trace that idea in a connected argument.';

    const result = BookChapterExtractor.extract(root);

    expect(result.length).toBe(1);
    expect(result[0].type).toBe('paragraph');
    expect((result[0] as { type: 'paragraph'; text: string }).text).toBe(expectedText);
  });

  it('should extract paragraphs and images correctly', () => {
    const chapterBody = document.createElement('div');
    chapterBody.className = 'chapterBody';
    chapterBody.innerHTML = `
      <p class="paraNoIndent1"><span class="bold">FIGURE 20-1</span></p>
      <p class="paraCenter"><b>The Cost of Loss</b></p>
      <p class="centerImageL"><img alt="526" width="400" height="238" src="/api/v2/epubs/urn:orm:book:9780061745171/files/images/526.jpg"></p>
      <p class="caption"><span class="italic">Imagine that you find a stock that you think can grow at 10% a year even if the market only grows 5% annually. Unfortunately, you are so enthusiastic that you pay too high a price, and the stock loses 50% of its value the first year. Even if the stock then generates double the market’s return, it will take you</span> more than 16 years <span class="italic">to overtake the market—simply because you paid too much, and lost too much, at the outset.</span></p>
    `;
    root.appendChild(chapterBody);

    const result = BookChapterExtractor.extract(root);

    expect(result.length).toBe(4);

    expect(result[0].type).toBe('paragraph');
    expect((result[0] as BookChapterElement & { type: 'paragraph' }).text).toBe('FIGURE 20-1');

    expect(result[1].type).toBe('paragraph');
    expect((result[1] as BookChapterElement & { type: 'paragraph' }).text).toBe('The Cost of Loss');

    expect(result[2].type).toBe('image');
    expect((result[2] as BookChapterElement & { type: 'image' }).alt).toBe('526');
    // JSDOM resolves relative src attributes to "http://localhost/" + src
    // So we check if the src ENDS WITH the expected path.
    expect((result[2] as BookChapterElement & { type: 'image' }).src).toContain(
      '/api/v2/epubs/urn:orm:book:9780061745171/files/images/526.jpg',
    );

    expect(result[3].type).toBe('caption');
    expect((result[3] as BookChapterElement & { type: 'caption' }).text).toBe(
      'Imagine that you find a stock that you think can grow at 10% a year even if the market only grows 5% annually. Unfortunately, you are so enthusiastic that you pay too high a price, and the stock loses 50% of its value the first year. Even if the stock then generates double the market’s return, it will take you more than 16 years to overtake the market—simply because you paid too much, and lost too much, at the outset.',
    );
  });
});
