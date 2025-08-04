/**
 * BookChapterExtractor extracts content (text, images, captions, tables) from the O'Reilly book chapters.
 * Traverses the DOM top-to-bottom using a recursive approach, preserving the exact sequence of elements as they appear.
 * The extractor identifies content based on semantic HTML tags and attributes, rather than fixed class names.
 *
 * Content types extracted:
 * - Headings (h1-h6)
 * - Paragraphs and text content
 * - Images with their alt text
 * - Lists (ordered and unordered)
 * - Tables with headers, data cells, and captions
 * - Captions for figures and tables
 *
 * Note: Current implementation has limited handling of footnote markers that appear as standalone
 * characters (like asterisks) in the text rather than as proper HTML elements. These may be
 * inconsistently preserved or removed in the extraction process.
 */
import { BookChapterElement } from '../models/BookChapterElement';

import { PersistentLogger } from '../../infrastructure/logging/PersistentLogger';
import { TableExtractor } from './components/TableExtractor';
import { TextNormalizer } from './components/TextNormalizer';

export class BookChapterExtractor {
  private logger: PersistentLogger;

  constructor(logger: PersistentLogger = PersistentLogger.instance) {
    this.logger = logger;
  }
  // TODO: Improve handling of inline footnote markers (like asterisks) that aren't wrapped in HTML elements

  /**
   * Recursively processes a DOM node and its children to extract BookChapterElements.
   * @param node The DOM node to process.
   * @param elements An array where extracted BookChapterElement objects are collected.
   */
  private processNode(node: Node, elements: BookChapterElement[]): void {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      // Pass to processTextNode but we know it won't do anything with these parameters
      this.processTextNode(node, elements);
      return;
    }

    const htmlElement = node as HTMLElement;
    const tagName = htmlElement.tagName.toLowerCase();
    const classList = htmlElement.classList;

    this.logger.debug(
      `Processing element: ${tagName}${htmlElement.id ? '#' + htmlElement.id : ''}${
        classList && classList.length ? '.' + Array.from(classList).join('.') : ''
      }`,
    );

    if (BookChapterExtractor.shouldSkipElement(tagName)) {
      this.logger.debug(`Skipping non-content element: ${tagName}`);
      return;
    }

    // Special handling for nav elements - check if it's a content nav or UI nav
    if (tagName === 'nav') {
      if (BookChapterExtractor.shouldSkipNavElement(htmlElement)) {
        this.logger.debug(`Skipping UI nav element`);
        return;
      } else {
        this.logger.debug(`Processing content nav element`);
        // Continue processing as a container
      }
    }

    if (this.processHeading(htmlElement, tagName, elements)) return;
    if (this.processParagraphOrCaption(htmlElement, tagName, classList, elements)) return;
    if (this.processPreformatted(htmlElement, tagName, elements)) return;
    if (this.processList(htmlElement, tagName, elements)) return;
    if (this.processTable(htmlElement, tagName, elements)) return;
    if (this.processImage(htmlElement, tagName, elements)) return;
    if (this.processCite(htmlElement, tagName, elements)) return;

    this.processContainer(htmlElement, tagName, classList, elements);
  }

  private static shouldSkipElement(tagName: string): boolean {
    return [
      'script',
      'style',
      'meta',
      'link',
      'head',
      'iframe',
      'noscript',
      'template',
    ].includes(tagName);
  }

  /**
   * Determines if a nav element should be skipped based on its semantic attributes.
   * Content navs (TOC) should be processed, while UI navs should be skipped.
   * @param navElement The nav HTML element to check
   * @returns true if the nav should be skipped, false if it should be processed
   */
  private static shouldSkipNavElement(navElement: HTMLElement): boolean {
    // Check for semantic attributes that indicate content navigation
    const role = navElement.getAttribute('role');
    const epubType = navElement.getAttribute('epub:type');
    
    // Include navs with semantic TOC attributes
    if (role === 'doc-toc' || epubType === 'toc') {
      return false; // Don't skip, this is content
    }
    
    // Check for generic UI nav classes (these should be skipped)
    const classList = navElement.classList;
    const hasGenericUIClasses = 
      classList.contains('css-0') || 
      classList.contains('_statusBar_') ||
      classList.length === 0; // Empty class list might be UI nav
    
    if (hasGenericUIClasses) {
      return true; // Skip UI navs
    }
    
    // Default to skipping if we can't determine the type
    return true;
  }

  private processHeading(
    htmlElement: HTMLElement,
    tagName: string,
    elements: BookChapterElement[],
  ): boolean {
    if (!tagName.match(/^h[1-6]$/)) return false;
    const level = parseInt(tagName.substring(1), 10);
    let text = '';
    if (htmlElement.querySelector('.chapterNumber, .chapterTitle')) {
      const parts: string[] = [];
      htmlElement.childNodes.forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const childText = TextNormalizer.cleanNodeText(child as HTMLElement);
          if (childText) parts.push(childText);
        } else if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
          parts.push(child.textContent.trim());
        }
      });
      text = parts.join(' ');
    } else {
      text = TextNormalizer.cleanNodeText(htmlElement);
    }
    if (text) {
      this.logger.debug(
        `Adding heading level ${level}: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
      );
      elements.push({ type: 'heading', level, text });
    }
    return true;
  }

  private processParagraphOrCaption(
    htmlElement: HTMLElement,
    tagName: string,
    classList: DOMTokenList,
    elements: BookChapterElement[],
  ): boolean {
    if (tagName !== 'p' && tagName !== 'figcaption') return false;

    // Images in paragraph
    const imgElements = htmlElement.querySelectorAll('img');
    if (imgElements.length > 0) {
      for (const imgElem of Array.from(imgElements)) {
        const src = imgElem.getAttribute('src') || '';
        const alt = imgElem.getAttribute('alt') || '';
        if (src) {
          this.logger.debug(`Adding image from paragraph: src="${src}", alt="${alt}"`);
          elements.push({ type: 'image', src, alt });
        }
      }
    }

    if (htmlElement.innerHTML === '&nbsp;' || htmlElement.innerHTML.trim() === '\u00A0') {
      this.logger.debug(`Adding non-breaking space paragraph`);
      elements.push({ type: 'paragraph', text: '\u00A0' });
      return true;
    }

    const text = TextNormalizer.cleanNodeText(htmlElement);
    if (!text) return true;

    const isChapterOpener = classList.contains('chapterOpenerText');
    const isEpigraphText = classList.contains('chapterEpigraphText');
    const isEpigraphSource = classList.contains('chapterEpigraphSource');

    if (classList.contains('caption') || tagName === 'figcaption') {
      this.logger.debug(
        `Adding caption: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
      );
      elements.push({ type: 'caption', text });
    } else if (isEpigraphText || isEpigraphSource) {
      this.logger.debug(
        `Adding epigraph: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
      );
      elements.push({ type: 'paragraph', text });
    } else {
      this.logger.debug(
        `Adding paragraph: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
      );
      if (isChapterOpener) {
        elements.push({ type: 'paragraph', text, isChapterOpener });
      } else {
        elements.push({ type: 'paragraph', text });
      }
    }
    return true;
  }

  private processList(
    htmlElement: HTMLElement,
    tagName: string,
    elements: BookChapterElement[],
  ): boolean {
    if (tagName !== 'ul' && tagName !== 'ol') return false;
    const items: string[] = [];
    for (const childNode of Array.from(htmlElement.childNodes)) {
      if (
        childNode.nodeType === Node.ELEMENT_NODE &&
        (childNode as HTMLElement).tagName.toLowerCase() === 'li'
      ) {
        const itemText = TextNormalizer.cleanNodeText(childNode as HTMLElement);
        if (itemText) items.push(itemText);
      }
    }
    if (items.length > 0) {
      elements.push({ type: 'list', items, ordered: tagName === 'ol' });
    }
    return true;
  }

  private processTable(
    htmlElement: HTMLElement,
    tagName: string,
    elements: BookChapterElement[],
  ): boolean {
    if (tagName !== 'table') return false;
    this.logger.debug(
      `Found table element: ${tagName}${htmlElement.className ? '.' + htmlElement.className.replace(' ', '.') : ''}`,
    );
    const tableExtractor = new TableExtractor(this.logger);
    const tableElement = tableExtractor.extract(htmlElement);
    elements.push(tableElement);
    return true;
  }

  private processImage(
    htmlElement: HTMLElement,
    tagName: string,
    elements: BookChapterElement[],
  ): boolean {
    if (tagName !== 'img') return false;
    const src = htmlElement.getAttribute('src') || '';
    const alt = htmlElement.getAttribute('alt') || '';
    if (src) {
      this.logger.debug(`Adding image: src="${src}", alt="${alt}"`);
      elements.push({ type: 'image', src, alt });
    } else {
      this.logger.debug(`Skipping image with empty src`);
    }
    return true;
  }

  private processCite(
    htmlElement: HTMLElement,
    tagName: string,
    elements: BookChapterElement[],
  ): boolean {
    if (tagName !== 'cite') return false;
    const text = TextNormalizer.cleanNodeText(htmlElement);
    if (text) {
      elements.push({ type: 'paragraph', text });
    }
    return true;
  }

  private processPreformatted(
    htmlElement: HTMLElement,
    tagName: string,
    elements: BookChapterElement[],
  ): boolean {
    if (tagName !== 'pre') return false;
    let text = htmlElement.textContent || '';
    text = TextNormalizer.normalizeText(text);
    // Strip emojis from preformatted text to prevent garbled output in PDF
    text = TextNormalizer.stripEmojis(text);
    if (text) {
      this.logger.debug(
        `Adding preformatted block: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
      );
      elements.push({ type: 'preformatted', text });
    }
    return true;
  }

  private processContainer(
    htmlElement: HTMLElement,
    tagName: string,
    classList: DOMTokenList,
    elements: BookChapterElement[],
  ): void {
    const containerElements = [
      'blockquote',
      'figure',
      'div',
      'section',
      'article',
      'main',
      'body',
      'header',
      'footer',
      'aside',
      'nav', // Allow nav elements to be processed as containers
    ];
    const isSpecialContainer =
      htmlElement.id === 'book-content' ||
      htmlElement.id === 'sbo-rt-content' ||
      classList.contains('chapter') ||
      classList.contains('chapterBody') ||
      classList.contains('chapterHead');

    if (containerElements.includes(tagName) || isSpecialContainer) {
      this.logger.debug(`Processing children of container: ${tagName}`);
      
      // Check for direct text nodes in the container first
      let hasDirectTextContent = false;
      const directTextNodes: string[] = [];
      
      for (const child of Array.from(htmlElement.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
          const textContent = child.textContent?.trim();
          if (textContent) {
            directTextNodes.push(textContent);
            hasDirectTextContent = true;
          }
        }
      }
      
      // If we found direct text content, add it as a paragraph
      if (hasDirectTextContent && directTextNodes.length > 0) {
        const combinedText = directTextNodes.join(' ').trim();
        if (combinedText) {
          this.logger.debug(
            `Adding direct text from container as paragraph: "${combinedText.substring(0, 30)}${combinedText.length > 30 ? '...' : ''}"`,
          );
          elements.push({ type: 'paragraph', text: combinedText });
        }
      }
      
      // Then process child elements normally
      for (const child of Array.from(htmlElement.childNodes)) {
        this.processNode(child, elements);
      }
    }
  }

  /**
   * Processes a text node in the DOM tree.
   * This method is intentionally empty because we don't process text nodes individually.
   * Instead, each text node is processed within its parent element (like paragraph, heading, list item)
   * where it has proper semantic context.
   *
   * For example, when processing a <p> tag, we get all its text content using cleanNodeText(),
   * which combines all text nodes inside it and applies proper formatting.
   *
   * @param node The text node to process
   * @param elements The array of book chapter elements being built
   */
  private processTextNode(_node: Node, _elements: BookChapterElement[]): void {
    // This method is intentionally empty.
    // Text nodes are handled by their parent elements in methods like:
    // - processHeading()
    // - processParagraphOrCaption()
    // - processList()
    // This approach preserves document structure and semantic meaning.
  }

  /**
   * Extracts ordered content from the O'Reilly book chapter DOM structure.
   * @param root The root HTML element (e.g., #book-content, #sbo-rt-content, or a .chapter div).
   * @returns An array of BookChapterElement in DOM order.
   */
  public extract(root: HTMLElement): BookChapterElement[] {
    const elements: BookChapterElement[] = [];
    if (!root || typeof root.querySelectorAll !== 'function') {
      this.logger.warn('BookChapterExtractor.extract called with invalid root element.');
      return elements;
    }

    this.logger.info(
      `Starting extraction from root element: ${root.tagName}${root.id ? '#' + root.id : ''}${root.className ? '.' + root.className.replace(' ', '.') : ''}`,
    );

    this.processNode(root, elements);

    this.logger.info(`Extraction complete. Found ${elements.length} elements.`);
    return elements;
  }
}
