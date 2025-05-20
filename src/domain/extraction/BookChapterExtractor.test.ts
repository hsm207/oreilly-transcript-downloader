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
      <div id="book-content">
        <h1>Chapter Title</h1>
        <p>Intro paragraph.</p>
        <ul><li>Item 1</li><li>Item 2</li></ul>
        <p class="fcaption">Figure 1: Caption for P</p>
        <img src="img1.jpg" alt="desc" />
        <p>Another paragraph.</p>
        <figure>
          <img src="fig_img.jpg" alt="figure image" />
          <figcaption>Figure 2: Caption for Figure</figcaption>
        </figure>
        <p class="centerImageL"><img alt="centered image" src="center_img.jpg"></p>
      </div>
    `;
    const root = createElementFromHTML(html).firstElementChild as HTMLElement;
    const result = BookChapterExtractor.extract(root);
    const expectedImg1Src = (root.querySelector('img[src="img1.jpg"]') as HTMLImageElement)?.src || 'img1.jpg';
    const expectedFigImgSrc = (root.querySelector('img[src="fig_img.jpg"]') as HTMLImageElement)?.src || 'fig_img.jpg';
    const expectedCenterImgSrc = (root.querySelector('img[src="center_img.jpg"]') as HTMLImageElement)?.src || 'center_img.jpg';

    expect(result).toEqual([
      { type: 'heading', level: 1, text: 'Chapter Title' },
      { type: 'paragraph', text: 'Intro paragraph.' },
      { type: 'list', ordered: false, items: ['Item 1', 'Item 2'] },
      { type: 'caption', text: 'Figure 1: Caption for P' },
      { type: 'image', src: expectedImg1Src, alt: 'desc' },
      { type: 'paragraph', text: 'Another paragraph.' },
      { type: 'image', src: expectedFigImgSrc, alt: 'figure image' },
      { type: 'caption', text: 'Figure 2: Caption for Figure' },
      { type: 'image', src: expectedCenterImgSrc, alt: 'centered image' },
    ]);
  });

  it('handles nested structure and ignores non-element nodes', () => {
    const html = `
      <div id="book-content">
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

  it('extracts image from a paragraph with a specific class like centerImageL', () => {
    const html = `
      <div id="book-content">
        <p class="centerImageL"><img alt="A centered image" src="/api/v2/epubs/urn:orm:book:9780061745171/files/images/526.jpg"></p>
      </div>
    `;
    const root = createElementFromHTML(html).firstElementChild as HTMLElement;
    const result = BookChapterExtractor.extract(root);
    const expectedImgSrc = (root.querySelector('img') as HTMLImageElement)?.src;
    expect(result).toEqual([
      { type: 'image', src: expectedImgSrc, alt: 'A centered image' },
    ]);
  });

  it('extracts image and caption from a figure element in correct order', () => {
    const html = `
      <div id="book-content">
        <figure>
          <p>Some text before image in figure</p>
          <img src="figure_image.jpg" alt="Image in figure" />
          <figcaption>Caption for the figure image.</figcaption>
          <p>Some text after caption in figure</p>
        </figure>
      </div>
    `;
    const root = createElementFromHTML(html).firstElementChild as HTMLElement;
    const result = BookChapterExtractor.extract(root);
    const expectedImgSrc = (root.querySelector('img') as HTMLImageElement)?.src;
    expect(result).toEqual([
      { type: 'paragraph', text: 'Some text before image in figure' },
      { type: 'image', src: expectedImgSrc, alt: 'Image in figure' },
      { type: 'caption', text: 'Caption for the figure image.' },
      { type: 'paragraph', text: 'Some text after caption in figure' },
    ]);
  });

  it('handles mixed content within a paragraph including an image', () => {
    const html = `
      <div id="book-content">
        <p>Text before image <img src="inline.jpg" alt="inline image" /> text after image.</p>
      </div>
    `;
    const root = createElementFromHTML(html).firstElementChild as HTMLElement;
    const result = BookChapterExtractor.extract(root);
    const expectedImgSrc = (root.querySelector('img') as HTMLImageElement)?.src;
    expect(result).toEqual([
      { type: 'paragraph', text: 'Text before image' },
      { type: 'image', src: expectedImgSrc, alt: 'inline image' },
      { type: 'paragraph', text: 'text after image.' },
    ]);
  });
});
