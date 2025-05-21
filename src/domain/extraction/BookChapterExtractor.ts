/**
 * BookChapterExtractor extracts content (text, images, captions) from the O'Reilly book chapters.
 * Traverses the DOM top-to-bottom using a recursive approach, preserving the exact sequence of elements as they appear.
 * The extractor identifies content based on semantic HTML tags and attributes, rather than fixed class names.
 * 
 * Note: Current implementation has limited handling of footnote markers that appear as standalone
 * characters (like asterisks) in the text rather than as proper HTML elements. These may be
 * inconsistently preserved or removed in the extraction process.
 */
import { BookChapterElement } from '../models/BookChapterElement';
import { PersistentLogger } from '../../infrastructure/logging/PersistentLogger';

export class BookChapterExtractor {
  // TODO: Improve handling of inline footnote markers (like asterisks) that aren't wrapped in HTML elements
  
  /**
   * Normalizes text by replacing curly quotes with straight quotes for consistent output,
   * normalizing whitespace, and trimming.
   * @param text The input text to normalize
   * @returns Normalized text with standardized quotes and whitespace.
   */
  private static normalizeText(text: string): string {
    return text
      .replace(/[“”]/g, '"') // Convert curly double quotes to straight quotes
      .replace(/[‘’]/g, "'") // Convert curly single quotes/apostrophes to straight apostrophes
      .replace(/\s+/g, " ") // Normalize whitespace (replace multiple spaces/newlines with single space)
      .trim();
  }

  /**
   * Cleans the text content of an HTML element by removing footnotes and then normalizing it.
   * @param element The HTML element from which to extract and clean text.
   * @returns Cleaned and normalized text content.
   */
  private static cleanNodeText(element: HTMLElement): string {
    const clonedElement = element.cloneNode(true) as HTMLElement;

    // Remove <sup> elements, commonly used for footnote markers.
    clonedElement.querySelectorAll("sup").forEach((sup) => sup.remove());

    // Remove <a> tags that are likely footnote links or empty anchors for footnotes.
    clonedElement.querySelectorAll("a").forEach((a) => {
      const href = a.getAttribute("href");
      const id = a.getAttribute("id");
      // Check for typical footnote link patterns or empty anchors used by O'Reilly
      if (
        (href &&
          (href.includes("Footnote.xhtml") ||
            href.startsWith("#ft_") ||
            href.startsWith("#footnote"))) ||
        (id && (id.startsWith("uft_re") || id.startsWith("ft_re")) && !a.textContent?.trim())
      ) {
        a.remove();
      }
    });

    // NOTE: Currently, we don't have handling for standalone footnote markers like asterisks (*).
    // These can appear in the text content but aren't wrapped in HTML elements that we can target.
    // A future improvement could identify and remove these markers based on context patterns.
    
    let text = clonedElement.textContent || "";
    return BookChapterExtractor.normalizeText(text);
  }

  /**
   * Recursively processes a DOM node and its children to extract BookChapterElements.
   * @param node The DOM node to process.
   * @param elements An array where extracted BookChapterElement objects are collected.
   */
  private static processNode(node: Node, elements: BookChapterElement[]): void {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const htmlElement = node as HTMLElement;
      const tagName = htmlElement.tagName.toLowerCase();
      const classList = htmlElement.classList;
      
      PersistentLogger.debug?.(
        `Processing element: ${tagName}${htmlElement.id ? '#' + htmlElement.id : ''}${
          classList && classList.length ? '.' + Array.from(classList).join('.') : ''
        }`
      );

      // Skip script, style, and other non-content elements
      if (
        [
          "script",
          "style",
          "meta",
          "link",
          "head",
          "iframe",
          "noscript",
          "template",
          "nav", // Navigation elements are usually not part of main content
        ].includes(tagName)
      ) {
        PersistentLogger.debug?.(`Skipping non-content element: ${tagName}`);
        return;
      }

      // Headings (h1-h6)
      if (tagName.match(/^h[1-6]$/)) {
        const level = parseInt(tagName.substring(1), 10);
        
        // Special handling for complex chapter headers with line breaks and quotes
        let text = '';
        if (htmlElement.querySelector('.chapterNumber, .chapterTitle')) {
          // If there's a span for chapter number/title inside, let's combine them with proper spacing
          const parts: string[] = [];
          htmlElement.childNodes.forEach(child => {
            if (child.nodeType === Node.ELEMENT_NODE) {
              const childText = BookChapterExtractor.cleanNodeText(child as HTMLElement);
              if (childText) parts.push(childText);
            } else if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
              parts.push(child.textContent.trim());
            }
          });
          text = parts.join(' ');
        } else {
          // Standard heading - just clean the text
          text = BookChapterExtractor.cleanNodeText(htmlElement);
        }
        
        if (text) {
          PersistentLogger.debug?.(`Adding heading level ${level}: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);
          elements.push({ type: "heading", level, text });
        }
        return; // Processed this node, don't recurse its children for more elements from this heading
      }

      // Paragraphs (p) and figcaptions
      if (tagName === "p" || tagName === "figcaption") {
        // Check if paragraph contains an image
        const imgElements = htmlElement.querySelectorAll('img');
        if (imgElements.length > 0) {
          // Process each image first before processing paragraph text
          for (const imgElem of Array.from(imgElements)) {
            const src = imgElem.getAttribute("src") || "";
            const alt = imgElem.getAttribute("alt") || "";
            if (src) {
              PersistentLogger.debug?.(`Adding image from paragraph: src="${src}", alt="${alt}"`);
              elements.push({ type: "image", src, alt });
            }
          }
        }
        
        // Check for non-breaking space paragraphs first - these need special handling
        // We need to check the original HTML content, not the cleaned text
        if (htmlElement.innerHTML === '&nbsp;' || htmlElement.innerHTML.trim() === '\u00A0') {
          PersistentLogger.debug?.(`Adding non-breaking space paragraph`);
          elements.push({ type: "paragraph", text: "\u00A0" });
        } else {
          // Process normal paragraph text
          const text = BookChapterExtractor.cleanNodeText(htmlElement);
          if (text) {
            // Detect special paragraph types
            const isChapterOpener = classList.contains("chapterOpenerText");
            const isEpigraphText = classList.contains("chapterEpigraphText");
            const isEpigraphSource = classList.contains("chapterEpigraphSource");
            
            // Handle different paragraph types
            if (classList.contains("caption") || tagName === "figcaption") {
              PersistentLogger.debug?.(`Adding caption: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);
              elements.push({ type: "caption", text });
            } else if (isEpigraphText || isEpigraphSource) {
              // Epigraphs are treated as regular paragraphs in the expected output
              PersistentLogger.debug?.(`Adding epigraph: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);
              elements.push({ type: "paragraph", text });
            } else {
              PersistentLogger.debug?.(`Adding paragraph: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);
              // Only include isChapterOpener if it's true, to match the expected structure in the test
              if (isChapterOpener) {
                elements.push({ type: "paragraph", text, isChapterOpener });
              } else {
                elements.push({ type: "paragraph", text });
              }
            }
          }
        }
        return; // Processed
      }

      // Lists (ul, ol)
      if (tagName === "ul" || tagName === "ol") {
        const items: string[] = [];
        // Iterate over direct children <li> elements
        for (const childNode of Array.from(htmlElement.childNodes)) {
          if (childNode.nodeType === Node.ELEMENT_NODE && (childNode as HTMLElement).tagName.toLowerCase() === "li") {
            const itemText = BookChapterExtractor.cleanNodeText(childNode as HTMLElement);
            if (itemText) {
              items.push(itemText);
            }
          }
        }
        if (items.length > 0) {
          elements.push({ type: "list", items, ordered: tagName === "ol" });
        }
        return; // Processed
      }

      // Images (img)
      if (tagName === "img") {
        const src = htmlElement.getAttribute("src") || "";
        const alt = htmlElement.getAttribute("alt") || "";
        // Only add if there's a src, as per original logic for TranscriptLine images
        if (src) {
          PersistentLogger.debug?.(`Adding image: src="${src}", alt="${alt}"`);
          elements.push({ type: "image", src, alt });
        } else {
          PersistentLogger.debug?.(`Skipping image with empty src`);
        }
        return; // Processed
      }

      // Cite elements (often part of blockquotes or for attributions)
      if (tagName === "cite") {
        const text = BookChapterExtractor.cleanNodeText(htmlElement);
        if (text) {
          // Represent cite content as a paragraph
          elements.push({ type: "paragraph", text });
        }
        return; // Processed
      }
      
      // Blockquotes, Figures, Divs, Sections, Articles, Main, Body, Header, Footer, Aside etc.
      // These are container elements, or elements whose children should be processed.
      
      // These content elements are already handled above with specific logic
      // No need to process them again - just for documentation
      
      // Define container elements - these are elements that typically just wrap other content
      const containerElements = ["blockquote", "figure", "div", "section", "article", "main", "body", "header", "footer", "aside"];
      
      // Special containers that we always want to process regardless of tag name
      const isSpecialContainer = 
        htmlElement.id === "book-content" || 
        htmlElement.id === "sbo-rt-content" || 
        classList.contains("chapter") || 
        classList.contains("chapterBody") || 
        classList.contains("chapterHead");
      
      // Only process children if this is a container element or special container
      // This avoids duplicate processing of content
      if (containerElements.includes(tagName) || isSpecialContainer) {
        PersistentLogger.debug?.(`Processing children of container: ${tagName}`);
        for (const child of Array.from(htmlElement.childNodes)) {
          BookChapterExtractor.processNode(child, elements);
        }
      }
      
      // We've handled either:
      // 1. A content element directly (h1-6, p, ul, ol, img, cite) - returned early above
      // 2. A container element (div, section, etc.) and processed its children
      // No need for additional fallthrough processing

    } else if (node.nodeType === Node.TEXT_NODE) {
      // We generally expect meaningful text to be wrapped in block elements (p, h1, li, etc.).
      // cleanNodeText on those parent elements will capture their full text content, including direct text nodes.
      // Processing loose text nodes here might lead to fragmented or unintended "paragraph" elements
      // if they are just whitespace between block elements or insignificant text.
      // Example: <div> <p>Text</p> <!-- loose whitespace text node --> <p>More Text</p> </div>
      // If specific tests show missing text that exists as direct children of major containers and
      // not within standard block elements, this part might need careful adjustment.
      // For now, rely on text extraction from recognized block/content elements.
    }
  }

  /**
   * Extracts ordered content from the O'Reilly book chapter DOM structure.
   * @param root The root HTML element (e.g., #book-content, #sbo-rt-content, or a .chapter div).
   * @returns An array of BookChapterElement in DOM order.
   */
  public static extract(root: HTMLElement): BookChapterElement[] {
    const elements: BookChapterElement[] = [];
    if (!root || typeof root.querySelectorAll !== 'function') {
      PersistentLogger.warn?.("BookChapterExtractor.extract called with invalid root element.");
      return elements;
    }
    
    PersistentLogger.info?.(
      `Starting extraction from root element: ${root.tagName}${root.id ? '#' + root.id : ''}${root.className ? '.' + root.className.replace(' ','.') : ''}`
    );

    BookChapterExtractor.processNode(root, elements);

    PersistentLogger.info?.(`Extraction complete. Found ${elements.length} elements.`);
    return elements;
  }
}
