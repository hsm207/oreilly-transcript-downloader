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

  it('should extract all links from a real TOC HTML file', () => {
    // Read the sample TOC HTML file
    const html = fs.readFileSync(path.join(__dirname, '__testdata__', 'sample-toc.html'), 'utf-8');
    // Create a container and set its innerHTML
    const container = document.createElement('div');
    container.innerHTML = html;
    // Find the TOC root (the <ol> with data-testid="tocItems")
    const tocRoot = container.querySelector('ol[data-testid="tocItems"]') as HTMLElement;
    const items: TableOfContentsItem[] = extractor.extractItems(tocRoot);
    // Assert the extracted items
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
