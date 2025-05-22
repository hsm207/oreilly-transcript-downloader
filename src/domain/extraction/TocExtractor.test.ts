/**
 * @file Tests for the TocExtractor interface and DefaultTocExtractor implementation.
 */

import { DefaultTocExtractor } from './TocExtractor';
import { TableOfContentsItem } from '../models/TableOfContentsItem';
import { describe, it, beforeEach, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('DefaultTocExtractor', () => {
  let extractor: DefaultTocExtractor;
  beforeEach(() => {
    extractor = new DefaultTocExtractor();
  });

  it('should correctly extract toc from a book content', () => {
    // Read the sample TOC HTML file (book)
    const html = fs.readFileSync(path.join(__dirname, '__testdata__', 'sample-toc-book.html'), 'utf-8');
    const container = document.createElement('div');
    container.innerHTML = html;
    const tocRoot = container.querySelector('ol[data-testid="tocItems"]') as HTMLElement;
    const items: TableOfContentsItem[] = extractor.extractItems(tocRoot);
    expect(items).toEqual([
      {
        title: 'Furry Tales: Adventures in Code',
        href: '/library/view/furry-tales/9780980455236/Text/index.html',
      },
      {
        title: "Pawsword: The Cat's Meow",
        href: '/library/view/furry-tales/9780980455236/Text/pr01.html',
      },
      {
        title: 'Purrface: A Tale of Whiskers',
        href: '/library/view/furry-tales/9780980455236/Text/pr02.html',
      },
      {
        title: '1. The Great Catnip Caper',
        href: '/library/view/furry-tales/9780980455236/Text/ch01.html',
      },
      {
        title: '2. Debugging with Ducklings',
        href: '/library/view/furry-tales/9780980455236/Text/ch02.html',
      },
      {
        title: '3. Squirrels and Semicolons',
        href: '/library/view/furry-tales/9780980455236/Text/ch03.html',
      },
      {
        title: '4. Navigation by Nose',
        href: '/library/view/furry-tales/9780980455236/Text/ch04.html',
      },
      {
        title: '5. Aesthetics of Alpacas',
        href: '/library/view/furry-tales/9780980455236/Text/ch05.html',
      },
      {
        title: '6. Deliverables and Dog Treats',
        href: '/library/view/furry-tales/9780980455236/Text/ch06.html',
      },
      {
        title: 'Index of Adorable Algorithms',
        href: '/library/view/furry-tales/9780980455236/Text/ix01.html',
      },
    ]);
  });

  it('should extract all links from a real TOC HTML file', () => {
    // Read the sample TOC HTML file (video course)
    const html = fs.readFileSync(path.join(__dirname, '__testdata__', 'sample-toc-video-course.html'), 'utf-8');
    const container = document.createElement('div');
    container.innerHTML = html;
    const tocRoot = container.querySelector('ol[data-testid="tocItems"]') as HTMLElement;
    const items: TableOfContentsItem[] = extractor.extractItems(tocRoot);
    expect(items).toEqual([
      {
        title: 'Mr. Whiskers: Purr-gramming Basics - When Cats Write Code',
        href: '/videos/programming-with-pets/1234567890/1234567890-video111222/',
      },
      {
        title: "Rover: Fetch-Driven Development - A Dog's Approach to Testing",
        href: '/videos/programming-with-pets/1234567890/1234567890-video111223/',
      },
      {
        title: 'Hammy the Hamster: Tiny Microservices - Small Solutions for Big Problems',
        href: '/videos/programming-with-pets/1234567890/1234567890-video111224/',
      },
      {
        title:
          'Polly the Parrot: Repeatable Code - When Copying Is Actually Good (Sponsored by Birdseed Labs)',
        href: '/videos/programming-with-pets/1234567890/1234567890-video111225/',
      },
      {
        title: 'Bubbles the Goldfish: Memory Management - A Three-Second Approach to State',
        href: '/videos/programming-with-pets/1234567890/1234567890-video111226/',
      },
    ]);
  });
});
