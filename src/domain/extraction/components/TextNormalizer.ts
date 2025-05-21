/**
 * TextNormalizer provides static utilities for normalizing and cleaning text content from HTML elements.
 */
export class TextNormalizer {
  /**
   * Normalizes text by replacing curly quotes with straight quotes for consistent output,
   * normalizing whitespace, and trimming.
   * @param text The input text to normalize
   * @returns Normalized text with standardized quotes and whitespace.
   */
  public static normalizeText(text: string): string {
    return text.replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim();
  }

  /**
   * Cleans the text content of an HTML element by removing footnotes and then normalizing it.
   * @param element The HTML element from which to extract and clean text.
   * @returns Cleaned and normalized text content.
   */
  public static cleanNodeText(element: HTMLElement): string {
    const clonedElement = element.cloneNode(true) as HTMLElement;
    clonedElement.querySelectorAll('sup').forEach((sup) => sup.remove());
    // Remove <a> tags as before, but insert a space if the <a> is between text nodes
    clonedElement.querySelectorAll('a').forEach((a) => {
      const href = a.getAttribute('href');
      const id = a.getAttribute('id');
      const prev = a.previousSibling;
      const next = a.nextSibling;
      // Only insert a space if both previous and next siblings are text nodes (to avoid double spaces)
      if (
        (href &&
          (href.includes('Footnote.xhtml') ||
            href.startsWith('#ft_') ||
            href.startsWith('#footnote'))) ||
        (id && (id.startsWith('uft_re') || id.startsWith('ft_re')) && !a.textContent?.trim())
      ) {
        if (prev && next && prev.nodeType === Node.TEXT_NODE && next.nodeType === Node.TEXT_NODE) {
          // Insert a space node before removing <a>
          a.parentNode?.insertBefore(document.createTextNode(' '), a);
        }
        a.remove();
      }
    });
    let text = clonedElement.textContent || '';
    return TextNormalizer.normalizeText(text);
  }
}
