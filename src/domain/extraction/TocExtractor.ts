/**
 * @file Defines the TocExtractor interface and a default implementation for extracting content links from a TOC.
 */

import { TableOfContentsItem } from '../models/TableOfContentsItem';

/**
 * Interface for extracting TOC items from a TOC root element.
 */
export interface TocExtractor {
  /**
   * Extracts all TOC items (title and href) from the given TOC root element.
   * @param tocRoot - The root element of the TOC (e.g., <ol> or <section>).
   * @returns An array of TOC items.
   */
  extractItems(tocRoot: HTMLElement): TableOfContentsItem[];
}

/**
 * Default implementation of TocExtractor that extracts all <a> links from the TOC root.
 */
export class DefaultTocExtractor implements TocExtractor {
  /**
   * Extracts all TOC items (title and href) from the given TOC root element.
   * @param tocRoot - The root element of the TOC.
   * @returns An array of TOC items.
   */
  extractItems(tocRoot: HTMLElement): TableOfContentsItem[] {
    if (!tocRoot) return [];
    const links = tocRoot.querySelectorAll('a');
    return Array.from(links)
      .map((link) => ({
        title: link.textContent?.replace(/\s+/g, ' ').trim() ?? '',
        href: link.getAttribute('href') ?? '',
      }))
      .filter((item) => item.title && item.href)
      .filter((item) => item.title !== 'Practice Quiz' && item.title !== 'Final Quiz');
  }
}
