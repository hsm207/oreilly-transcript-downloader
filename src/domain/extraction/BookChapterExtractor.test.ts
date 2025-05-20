/**
 * Tests for BookChapterExtractor
 */
import { describe, it, expect } from 'vitest';
import { BookChapterExtractor } from './BookChapterExtractor';

function createElementFromHTML(html: string): HTMLElement {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div;
}

describe('BookChapterExtractor', () => {
  it('extracts headings, paragraphs, lists, images, and captions in order', () => {
    const html = `
      <div id=\"book-content\">
        <h1>Chapter Title</h1>
        <p>Intro paragraph.</p>
        <ul><li>Item 1</li><li>Item 2</li></ul>
        <p class=\"fcaption\">Figure 1: Caption</p>
        <img src=\"img1.jpg\" alt=\"desc\" />
        <p>Another paragraph.</p>
      </div>
    `;
    const root = createElementFromHTML(html).firstElementChild as HTMLElement;
    const result = BookChapterExtractor.extract(root);
    // The image src will be resolved to an absolute URL by the browser
    const expectedImgSrc = root.querySelector('img')?.src || 'img1.jpg';
    expect(result).toEqual([
      { type: 'heading', level: 1, text: 'Chapter Title' },
      { type: 'paragraph', text: 'Intro paragraph.' },
      { type: 'list', ordered: false, items: ['Item 1', 'Item 2'] },
      { type: 'caption', text: 'Figure 1: Caption' },
      { type: 'image', src: expectedImgSrc, alt: 'desc' },
      { type: 'paragraph', text: 'Another paragraph.' },
    ]);
  });

  it('handles nested structure and ignores non-element nodes', () => {
    const html = `
      <div id=\"book-content\">
        <section>
          <h2>Section</h2>
          <div><p>Text in div</p></div>
        </section>
      </div>
    `;
    const root = createElementFromHTML(html).firstElementChild as HTMLElement;
    const result = BookChapterExtractor.extract(root);
    expect(result).toEqual([
      { type: 'heading', level: 2, text: 'Section' },
      { type: 'paragraph', text: 'Text in div' },
    ]);
  });
});
