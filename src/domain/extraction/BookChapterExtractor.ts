/**
 * BookChapterExtractor extracts the ordered content (text, images, captions) from the #book-content div.
 * Traverses the DOM top-to-bottom, preserving the sequence of elements.
 */
import { PersistentLogger } from '../../infrastructure/logging/PersistentLogger';
import { BookChapterElement } from '../models/BookChapterElement';

export class BookChapterExtractor {
  /**
   * Extracts ordered content from the O'Reilly book chapter DOM structure.
   * @param root The root HTML element (should be #book-content).
   * @returns An array of BookChapterElement in DOM order.
   */
  public static extract(root: HTMLElement): BookChapterElement[] {
    const elements: BookChapterElement[] = [];
    PersistentLogger.info?.('Starting extraction from #book-content');

    // Extract headings
    const chapterHead = root.querySelector('.chapterHead');
    if (chapterHead) {
      const hTags = chapterHead.querySelectorAll('h1, h2, h3, h4, h5, h6');
      hTags.forEach((h) => {
        const level = parseInt(h.tagName[1]);
        const text = h.textContent?.trim() || '';
        if (text) {
          elements.push({ type: 'heading', level, text });
          PersistentLogger.debug?.(`Extracted heading: ${text}`);
        }
      });
    }

    // Extract paragraphs, images, captions
    const chapterBody = root.querySelector('.chapterBody');
    if (chapterBody) {
      const paragraphs = Array.from(chapterBody.querySelectorAll('p'));
      for (const p of paragraphs) {
        const img = p.querySelector('img');
        if (img) {
          elements.push({ type: 'image', src: img.src, alt: img.alt || '' });
          PersistentLogger.debug?.(`Extracted image: ${img.src}`);
        } else if (p.classList.contains('caption') || p.classList.contains('fcaption')) {
          const text = p.textContent?.trim() || '';
          if (text) {
            elements.push({ type: 'caption', text });
            PersistentLogger.debug?.(`Extracted caption: ${text}`);
          }
        } else {
          // Remove footnote markers (e.g., <a><sup>*</sup></a>) but keep their text
          const clonedP = p.cloneNode(true) as HTMLElement;
          clonedP.querySelectorAll('a > sup').forEach((sup) => {
            const supText = sup.textContent || '';
            const parentA = sup.parentElement;
            if (parentA) {
              parentA.replaceWith(supText);
            }
          });
          // Handle chapter opener specifically to join the first letter with the rest
          let text = '';
          if (p.classList.contains('chapterOpenerText')) {
            const firstLettersSpan = clonedP.querySelector('.chapterOpenerFirstLetters');
            const firstLetters = firstLettersSpan?.textContent?.trim() || '';
            if (firstLettersSpan) {
              firstLettersSpan.remove(); // Remove to avoid duplication
            }
            text = (firstLetters + (clonedP.textContent?.trimStart() || '')).trim();
          } else {
            text = clonedP.textContent?.trim() || '';
          }

          if (text) {
            elements.push({ type: 'paragraph', text });
            PersistentLogger.debug?.(`Extracted paragraph: ${text}`);
          }
        }
      }
    } else {
      PersistentLogger.warn?.('No .chapterBody found in #book-content');
    }

    PersistentLogger.info?.(`Extraction complete. Elements: ${elements.length}`);
    return elements;
  }
}
