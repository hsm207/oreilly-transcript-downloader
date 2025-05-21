/**
 * BookChapterExtractor extracts the ordered content (text, images, captions) from the #book-content div.
 * Traverses the DOM top-to-bottom, preserving the sequence of elements.
 */
import { PersistentLogger } from '../../infrastructure/logging/PersistentLogger';
import { BookChapterElement } from '../models/BookChapterElement';

export class BookChapterExtractor {
  /**
   * Normalizes text by replacing curly quotes with straight quotes for consistent output.
   * @param text The input text to normalize
   * @returns Normalized text with standardized quotes
   */
  private static normalizeText(text: string): string {
    return text
      .replace(/[""]/g, '"')  // Convert all curly quotes to straight quotes
      .replace(/['']/g, "'")  // Convert all curly apostrophes to straight apostrophes
      .replace(/\s+/g, ' ')   // Normalize whitespace
      .trim();
  }

  /**
   * Extracts ordered content from the O'Reilly book chapter DOM structure.
   * @param root The root HTML element (should be #book-content or a .chapter div).
   * @returns An array of BookChapterElement in DOM order.
   */
  public static extract(root: HTMLElement): BookChapterElement[] {
    const elements: BookChapterElement[] = [];
    PersistentLogger.info?.('Starting extraction from element');

    const chapters =
      root.id === 'book-content' || root.id === 'sbo-rt-content'
        ? Array.from(root.querySelectorAll('.chapter'))
        : [root];

    for (const chapter of chapters) {
      // Extract headings
      const chapterHead = chapter.querySelector('.chapterHead');
      if (chapterHead) {
        const hTags = chapterHead.querySelectorAll('h1, h2, h3, h4, h5, h6');
        hTags.forEach((h) => {
          const level = parseInt(h.tagName[1]);
          let text = '';
          // Handle cases where chapter title and number might be in separate spans or need combining
          const chapterTitleSpan = h.querySelector('.chapterTitle');

          if (h.classList.contains('chapterNumber') && h.querySelector('.italic')) {
            // Case: <h2 class="chapterNumber"><a href>Chapter X<br><span class="italic">Title</span></a></h2>
            // Don't convert \n to spaces - keep newlines to match expected format
            const aNode = h.querySelector('a');
            if (aNode) {
              text = Array.from(aNode.childNodes)
                .map((node) => node.textContent?.trim())
                .filter(Boolean)
                .join('\n'); // Keep newlines as they are in the expected output
            } else {
              // Fallback if <a> is not present for some reason
              text = Array.from(h.childNodes)
                .map((node) => node.textContent?.trim())
                .filter(Boolean)
                .join('\n'); // Keep newlines as they are in the expected output
            }
          } else if (chapterTitleSpan) {
            // Case: <h2 class="chapterTitle"><a>Title</a></h2>
            text = chapterTitleSpan.textContent?.trim().replace(/\s+/g, ' ') || '';
          } else if (h.classList.contains('chapterNumber')) {
            // Case: <h2 class="chapterNumber">Chapter X</h2> (without italic title part)
            text = h.textContent?.trim().replace(/\s+/g, ' ') || '';
          } else {
            text = h.textContent?.trim().replace(/\s+/g, ' ') || '';
          }

          if (text) {
            // Normalize quotes before adding to elements
            elements.push({ type: 'heading', level, text: this.normalizeText(text) });
            PersistentLogger.debug?.(`Extracted heading: ${text}`);
          }
        });

        // Extract epigraphs
        const epigraph = chapterHead.querySelector('.chapterEpigraph');
        if (epigraph) {
          const epigraphTexts = epigraph.querySelectorAll(
            '.chapterEpigraphText, .chapterEpigraphSource',
          );
          epigraphTexts.forEach((epigraphTextElement) => {
            const text = epigraphTextElement.textContent?.trim() || '';
            if (text) {
              // Normalize quotes before adding to elements
              elements.push({ type: 'paragraph', text: this.normalizeText(text) }); // Treat epigraph lines as paragraphs
              PersistentLogger.debug?.(`Extracted epigraph text: ${text}`);
            }
          });
        }
      }

      // Extract paragraphs, images, captions from chapterBody
      const chapterBody = chapter.querySelector('.chapterBody');
      if (chapterBody) {
        // Handle headings within chapterBody (e.g. <h3 class="chapterHeadA">)
        const bodyHTags = chapterBody.querySelectorAll('h1, h2, h3, h4, h5, h6');
        bodyHTags.forEach((h) => {
          // Ensure this heading is a direct child of chapterBody or within a known structure,
          // and not part of something already processed (like a figure caption's heading, if any)
          if (
            h.parentElement === chapterBody ||
            h.parentElement?.classList.contains('informalfigure')
          ) {
            const level = parseInt(h.tagName[1]);
            const text = h.textContent?.trim() || '';
            if (text) {
              // Normalize quotes before adding to elements
              elements.push({ type: 'heading', level, text: this.normalizeText(text) });
              PersistentLogger.debug?.(`Extracted body heading: ${text}`);
            }
          }
        });

        const childNodes = Array.from(chapterBody.childNodes);
        for (const node of childNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            if (el.tagName.toLowerCase() === 'p') {
              const p = el;
              const img = p.querySelector('img');
              if (img) {
                elements.push({ type: 'image', src: img.src, alt: img.alt || '' });
                PersistentLogger.debug?.(`Extracted image: ${img.src}`);
              } else if (p.classList.contains('caption') || p.classList.contains('fcaption')) {
                const text = p.textContent?.trim() || '';
                if (text) {
                  elements.push({ type: 'caption', text: this.normalizeText(text) });
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

                let paragraphText = '';
                const isOpener = p.classList.contains('chapterOpenerText');

                if (isOpener) {
                  const firstLettersSpan = clonedP.querySelector('.chapterOpenerFirstLetters');
                  const firstLetters = firstLettersSpan?.textContent?.trim() || '';
                  if (firstLettersSpan) {
                    firstLettersSpan.remove(); // Remove to avoid duplication
                  }
                  // Preserve spaces between firstLetters and the rest of the text if they exist.
                  const restOfText = clonedP.textContent || '';
                  paragraphText = firstLetters + restOfText.trimStart();
                } else {
                  paragraphText = clonedP.textContent?.trim() || '';
                }

                if (paragraphText || p.innerHTML.includes('&nbsp;')) {
                  const finalText =
                    p.innerHTML.includes('&nbsp;') && !paragraphText ? '\u00A0' : paragraphText;
                  
                  // Normalize the text by replacing curly quotes with straight quotes
                  const normalizedText = this.normalizeText(finalText);
                  
                  const elementToAdd: BookChapterElement = {
                    type: 'paragraph',
                    text: normalizedText,
                  };
                  if (isOpener) {
                    elementToAdd.isChapterOpener = true;
                  }
                  elements.push(elementToAdd);
                  PersistentLogger.debug?.(`Extracted paragraph: ${normalizedText}`);
                }
              }
            } else if (el.tagName.toLowerCase().match(/^h[1-6]$/) && !el.closest('.chapterHead')) {
              // This is handled by bodyHTags querySelectorAll above, this specific check might be redundant
              // or needs to be more specific if there are headings not caught by the above.
              // For now, we assume bodyHTags handles them.
            }
          }
        }
      } else {
        PersistentLogger.debug?.('No .chapterBody found in chapter');
      }
    }

    PersistentLogger.info?.(`Extraction complete. Elements: ${elements.length}`);
    return elements;
  }
}
