/**
 * BookChapterExtractor extracts content (text, images, captions) from the O'Reilly book chapters.
 * Traverses the DOM top-to-bottom, preserving the exact sequence of elements as they appear.
 * The extractor carefully handles O'Reilly-specific DOM structures, special formatting, and nested elements.
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
      // Process chapter head content
      const chapterHead = chapter.querySelector('.chapterHead');
      const elementsFromHead: BookChapterElement[] = [];
      
      if (chapterHead) {
        // Extract headings and epigraphs from chapterHead
        const headElements = this.extractElementsFromNode(chapterHead as HTMLElement);
        elementsFromHead.push(...headElements);
      }

      // Process chapter body content
      const chapterBody = chapter.querySelector('.chapterBody');
      const elementsFromBody: BookChapterElement[] = [];
      
      if (chapterBody) {
        // Process all child nodes in DOM order
        const bodyElements = this.processChapterBodyElements(chapterBody as HTMLElement);
        elementsFromBody.push(...bodyElements);
      } else {
        PersistentLogger.debug?.('No .chapterBody found in chapter');
      }

      // Add all elements in the correct order
      elements.push(...elementsFromHead, ...elementsFromBody);
    }

    PersistentLogger.info?.(`Extraction complete. Elements: ${elements.length}`);
    return elements;
  }

  /**
   * Extracts elements from the chapter head node in DOM order.
   * @param chapterHead The chapter head element
   * @returns Array of BookChapterElement in DOM order
   */
  private static extractElementsFromNode(node: HTMLElement): BookChapterElement[] {
    const elements: BookChapterElement[] = [];
    
    // Process headings
    const hTags = node.querySelectorAll('h1, h2, h3, h4, h5, h6');
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

    // Process epigraphs
    const epigraph = node.querySelector('.chapterEpigraph');
    if (epigraph) {
      const epigraphTexts = epigraph.querySelectorAll(
        '.chapterEpigraphText, .chapterEpigraphSource'
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
    
    // Process lists within the node
    const lists = node.querySelectorAll('ul, ol');
    lists.forEach((list) => {
      const isOrdered = list.tagName.toLowerCase() === 'ol';
      const listItems = Array.from(list.querySelectorAll('li'));
      
      if (listItems.length > 0) {
        const items = listItems.map(li => {
          // Clone the li to avoid modifying the original
          const clonedLi = li.cloneNode(true) as HTMLElement;
          
          // Remove all footnote references completely
          clonedLi.querySelectorAll('a[id^="ft_"]').forEach(a => a.remove());
          
          // Remove all links that contain superscripts (footnote references)
          clonedLi.querySelectorAll('a').forEach(a => {
            if (a.querySelector('sup')) {
              a.remove();
            }
          });
          
          // Remove any remaining superscripts
          clonedLi.querySelectorAll('sup').forEach(sup => sup.remove());
          
          // Remove any other footnote links
          clonedLi.querySelectorAll('a[href^="#footnote"]').forEach(a => a.remove());
          
          return this.normalizeText(clonedLi.textContent || '');
        }).filter(text => text.length > 0);
        
        elements.push({
          type: 'list',
          items,
          ordered: isOrdered
        });
        
        PersistentLogger.debug?.(`Extracted ${isOrdered ? 'ordered' : 'unordered'} list with ${items.length} items`);
      }
    });

    return elements;
  }

  /**
   * Processes chapter body elements in DOM order.
   * @param chapterBody The chapter body element
   * @returns Array of BookChapterElement in DOM order
   */
  private static processChapterBodyElements(chapterBody: HTMLElement): BookChapterElement[] {
    const elements: BookChapterElement[] = [];
    const childNodes = Array.from(chapterBody.childNodes);

    for (const node of childNodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        
        // Process headings directly in DOM order
        if (el.tagName.toLowerCase().match(/^h[1-6]$/)) {
          const level = parseInt(el.tagName[1]);
          const text = el.textContent?.trim() || '';
          if (text) {
            elements.push({ 
              type: 'heading', 
              level, 
              text: this.normalizeText(text) 
            });
            PersistentLogger.debug?.(`Extracted body heading: ${text}`);
          }
          continue;
        }

        // Process lists (ordered and unordered)
        if (el.tagName.toLowerCase() === 'ul' || el.tagName.toLowerCase() === 'ol') {
          const isOrdered = el.tagName.toLowerCase() === 'ol';
          const listItems = Array.from(el.querySelectorAll('li'));
          
          if (listItems.length > 0) {
            const items = listItems.map(li => {
              // Clone the li to avoid modifying the original
              const clonedLi = li.cloneNode(true) as HTMLElement;
                   // Remove all footnote references completely
          clonedLi.querySelectorAll('a[id^="ft_"]').forEach(a => a.remove());
          
          // Remove all links that contain superscripts (footnote references)
          clonedLi.querySelectorAll('a').forEach(a => {
            if (a.querySelector('sup')) {
              a.remove();
            }
          });
          
          // Remove any remaining superscripts
          clonedLi.querySelectorAll('sup').forEach(sup => sup.remove());
          
          // Remove any other footnote links
          clonedLi.querySelectorAll('a[href^="#footnote"]').forEach(a => a.remove());
              
              return this.normalizeText(clonedLi.textContent || '');
            }).filter(text => text.length > 0);
            
            elements.push({
              type: 'list',
              items,
              ordered: isOrdered
            });
            
            PersistentLogger.debug?.(`Extracted ${isOrdered ? 'ordered' : 'unordered'} list with ${items.length} items`);
          }
          continue;
        }

        // Process paragraphs, images, etc.
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
        }
      }
    }
    
    return elements;
  }
}
