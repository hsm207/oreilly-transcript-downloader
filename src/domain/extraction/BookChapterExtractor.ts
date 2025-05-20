/**
 * BookChapterExtractor extracts the ordered content (text, images, captions) from the #book-content div.
 * Traverses the DOM top-to-bottom, preserving the sequence of elements.
 */
import { PersistentLogger } from "../../infrastructure/logging/PersistentLogger";

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

    function logExtracted(el: BookChapterElement) {
      PersistentLogger.debug?.(`Extracted: ${JSON.stringify(el)}`);
    }

    function traverse(node: Node) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        // This case should ideally be handled by parent block elements like P, LI, etc.
        // However, if text nodes are directly under a traversed element not otherwise handled,
        // we might capture them as paragraphs. This is a fallback.
        // Consider if direct text node capture is desired or if it indicates a flaw in handling block elements.
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const tagName = element.tagName.toUpperCase();

        switch (tagName) {
          case "H1":
          case "H2":
          case "H3":
          case "H4":
          case "H5":
          case "H6": {
            const headingEl: BookChapterElement = {
              type: "heading",
              level: parseInt(tagName[1]),
              text: element.textContent?.trim() || "",
            };
            elements.push(headingEl);
            logExtracted(headingEl);
            return;
          }
          case "P":
            // Check if this paragraph is acting as a caption (e.g., class "fcaption")
            // This specific class check can remain if it's a reliable pattern for captions in <p>
            if (element.classList.contains("fcaption")) {
              const captionEl: BookChapterElement = { type: "caption", text: element.textContent?.trim() || "" };
              elements.push(captionEl);
              logExtracted(captionEl);
            } else {
              // If not a caption, treat as a paragraph.
              // Iterate through children to correctly handle mixed content like text and inline images.
              let paragraphText = "";
              const childNodes = Array.from(element.childNodes);
              for (let i = 0; i < childNodes.length; i++) {
                const childNode = childNodes[i];
                if (childNode.nodeType === Node.TEXT_NODE) {
                  paragraphText += childNode.textContent;
                } else if (childNode.nodeType === Node.ELEMENT_NODE && (childNode as HTMLElement).tagName.toUpperCase() === "IMG") {
                  // If there's accumulated text, push it as a paragraph first
                  if (paragraphText.trim()) {
                    const paraEl: BookChapterElement = { type: "paragraph", text: paragraphText.trim() };
                    elements.push(paraEl);
                    logExtracted(paraEl);
                    paragraphText = ""; // Reset for next text segment
                  }
                  // Push the image
                  const imgEl: BookChapterElement = {
                    type: "image",
                    src: (childNode as HTMLImageElement).src,
                    alt: (childNode as HTMLImageElement).alt || "",
                  };
                  elements.push(imgEl);
                  logExtracted(imgEl);
                  // If this is the last child, and there was preceding text, it's already pushed.
                  // If there's text after this image within the same <p>, it will be handled in the next iteration.
                } else if (childNode.nodeType === Node.ELEMENT_NODE) {
                  // For other nested elements within P, recursively call traverse.
                  // This might be rare for P but handles unexpected structures.
                  // If there's accumulated text, push it.
                  if (paragraphText.trim()) {
                    const paraEl: BookChapterElement = { type: "paragraph", text: paragraphText.trim() };
                    elements.push(paraEl);
                    logExtracted(paraEl);
                    paragraphText = "";
                  }
                  traverse(childNode);
                }
              }
              // Push any remaining accumulated text
              if (paragraphText.trim()) {
                const paraEl: BookChapterElement = { type: "paragraph", text: paragraphText.trim() };
                elements.push(paraEl);
                logExtracted(paraEl);
              }
            }
            // After processing a P, its children are handled, so return.
            return;
          case "UL":
          case "OL":
            const listEl: BookChapterElement = {
              type: "list",
              ordered: tagName === "OL",
              items: Array.from(element.children)
                .filter((li) => li.tagName.toUpperCase() === "LI")
                .map((li) => li.textContent?.trim() || ""),
            };
            elements.push(listEl);
            logExtracted(listEl);
            // List items are fully processed, so return.
            return;
          case "IMG":
            const imgEl: BookChapterElement = {
              type: "image",
              src: (element as HTMLImageElement).src,
              alt: (element as HTMLImageElement).alt || "",
            };
            elements.push(imgEl);
            logExtracted(imgEl);
            // IMG elements don't have children to traverse in this context.
            return;
          case "FIGURE":
            // For FIGURE, iterate its children to capture IMG and FIGCAPTION in order
            // Other elements within FIGURE will also be traversed.
            break; // Allow fall-through to process children
          case "FIGCAPTION":
            const captionEl: BookChapterElement = { type: "caption", text: element.textContent?.trim() || "" };
            elements.push(captionEl);
            logExtracted(captionEl);
            // FIGCAPTION is a terminal element for extraction purposes.
            return;
          default:
            // For any other tag, or if a tag needs to process its children (like FIGURE or DIV),
            // do nothing here and let the loop below handle children.
            break;
        }
        // Recursively call traverse for child nodes of the current element if not returned above
        Array.from(element.childNodes).forEach(traverse);
      }
    }

    // Start traversal from the children of the root, as root itself is just a container.
    Array.from(root.childNodes).forEach(traverse);
    return elements;
  }
}
