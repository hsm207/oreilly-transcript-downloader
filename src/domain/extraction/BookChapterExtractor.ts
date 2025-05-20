/**
 * BookChapterExtractor extracts the ordered content (text, images, captions) from the #book-content div.
 * Traverses the DOM top-to-bottom, preserving the sequence of elements.
 */

export type BookChapterElement =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'image'; src: string; alt: string }
  | { type: 'caption'; text: string };

export class BookChapterExtractor {
  /**
   * Extracts the content from the #book-content div in order.
   * @param root The root element (should be the #book-content div)
   * @returns Array of BookChapterElement in DOM order
   */
  static extract(root: HTMLElement): BookChapterElement[] {
    const elements: BookChapterElement[] = [];
    function traverse(node: Element) {
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      // Headings
      if (/^h[1-6]$/i.test(node.tagName)) {
        elements.push({
          type: 'heading',
          level: parseInt(node.tagName[1]),
          text: node.textContent?.trim() || '',
        });
        return;
      }
      // Paragraphs
      if (node.tagName === 'P') {
        // Captions (commonly have class fcaption)
        if (node.classList.contains('fcaption')) {
          elements.push({ type: 'caption', text: node.textContent?.trim() || '' });
        } else {
          elements.push({ type: 'paragraph', text: node.textContent?.trim() || '' });
        }
        return;
      }
      // Lists
      if (node.tagName === 'UL' || node.tagName === 'OL') {
        const items = Array.from(node.children)
          .filter((li) => li.tagName === 'LI')
          .map((li) => li.textContent?.trim() || '');
        elements.push({
          type: 'list',
          ordered: node.tagName === 'OL',
          items,
        });
        return;
      }
      // Images
      if (node.tagName === 'IMG') {
        elements.push({
          type: 'image',
          src: (node as HTMLImageElement).src,
          alt: (node as HTMLImageElement).alt || '',
        });
        return;
      }
      // Traverse children
      for (const child of Array.from(node.children)) {
        traverse(child);
      }
    }
    traverse(root);
    return elements;
  }
}
