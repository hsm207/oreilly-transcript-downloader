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
    // Replace various curly quote characters with straight quotes
    const step1 = text.replace(/[\u201C\u201D\u201E]/g, '"'); // “ ” „ -> "
    const step2 = step1.replace(/[\u2018\u2019\u201A]/g, "'"); // ‘ ’ ‚ -> '
    const normalized = step2.replace(/\s+/g, ' ').trim();
    return normalized;
  }

  /**
   * Normalizes mathematical Unicode characters to ASCII equivalents for better PDF compatibility.
   * Many PDF generators struggle with mathematical Unicode symbols, causing rendering issues.
   * @param text The input text that may contain mathematical symbols
   * @returns Text with mathematical symbols converted to ASCII equivalents
   */
  public static normalizeMathematicalCharacters(text: string): string {
    return text
      .replace(/×/g, 'x') // U+00D7 (multiplication sign) → x
      .replace(/−/g, '-') // U+2212 (mathematical minus sign) → - (hyphen)
      .replace(/÷/g, '/') // U+00F7 (division sign) → /
      .replace(/±/g, '+/-') // U+00B1 (plus-minus sign) → +/-
      .replace(/≤/g, '<=') // U+2264 (less than or equal) → <=
      .replace(/≥/g, '>=') // U+2265 (greater than or equal) → >=
      .replace(/≠/g, '!=') // U+2260 (not equal) → !=
      .replace(/≈/g, '~=') // U+2248 (approximately equal) → ~=
      .replace(/°/g, 'deg'); // U+00B0 (degree symbol) → deg
  }

  /**
   * Strips all emoji characters from text.
   * TODO: Future improvement - explore proper emoji rendering in jsPDF for better user experience.
   * For now, emojis are stripped to prevent garbled characters in PDF output.
   * @param text The input text that may contain emojis
   * @returns Text with all emojis removed
   */
  public static stripEmojis(text: string): string {
    // Comprehensive emoji regex pattern covering all major emoji ranges
    // Includes ZWJ (Zero Width Joiner) and variation selectors
    const emojiRegex =
      /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F170}-\u{1F171}]|[\u{1F17E}-\u{1F17F}]|[\u{1F18E}]|[\u{3030}]|[\u{2B50}]|[\u{2B55}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{3297}]|[\u{3299}]|[\u{303D}]|[\u{00A9}]|[\u{00AE}]|[\u{2122}]|[\u{23F0}-\u{23F3}]|[\u{267E}]|[\u{2692}]|[\u{2694}]|[\u{2695}]|[\u{2696}-\u{2697}]|[\u{2699}]|[\u{269B}-\u{269C}]|[\u{26A0}]|[\u{26B0}-\u{26B1}]|[\u{26C8}]|[\u{26CF}]|[\u{26D1}]|[\u{26D3}]|[\u{26E9}]|[\u{26F0}-\u{26F5}]|[\u{26F7}-\u{26FA}]|[\u{2702}]|[\u{2708}-\u{2709}]|[\u{270C}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{27A1}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F170}-\u{1F171}]|[\u{1F17E}-\u{1F17F}]|[\u{1F18E}]|[\u{1F191}-\u{1F19A}]|[\u{1F1E6}-\u{1F1FF}]|[\u{1F201}-\u{1F202}]|[\u{1F21A}]|[\u{1F22F}]|[\u{1F232}-\u{1F23A}]|[\u{1F250}-\u{1F251}]|[\u{1F300}-\u{1F320}]|[\u{1F330}-\u{1F335}]|[\u{1F337}-\u{1F37C}]|[\u{1F380}-\u{1F393}]|[\u{1F3A0}-\u{1F3C4}]|[\u{1F3C6}-\u{1F3CA}]|[\u{1F3E0}-\u{1F3F0}]|[\u{1F400}-\u{1F43E}]|[\u{1F440}]|[\u{1F442}-\u{1F4F7}]|[\u{1F4F9}-\u{1F4FC}]|[\u{1F500}-\u{1F53C}]|[\u{1F540}-\u{1F543}]|[\u{1F550}-\u{1F567}]|[\u{1F5FB}-\u{1F5FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6C5}]|[\u{1F700}-\u{1F773}]|[\u{1F780}-\u{1F7D8}]|[\u{1F800}-\u{1F80B}]|[\u{1F810}-\u{1F847}]|[\u{1F850}-\u{1F859}]|[\u{1F860}-\u{1F887}]|[\u{1F890}-\u{1F8AD}]|[\u{1F900}-\u{1F90B}]|[\u{1F910}-\u{1F93A}]|[\u{1F93C}-\u{1F93E}]|[\u{1F940}-\u{1F945}]|[\u{1F947}-\u{1F970}]|[\u{1F973}-\u{1F976}]|[\u{1F97A}]|[\u{1F97C}-\u{1F9A2}]|[\u{1F9B0}-\u{1F9B9}]|[\u{1F9C0}-\u{1F9C2}]|[\u{1F9D0}-\u{1F9FF}]|[\u{1FA70}-\u{1FA73}]|[\u{1FA78}-\u{1FA7A}]|[\u{1FA80}-\u{1FA82}]|[\u{1FA90}-\u{1FA95}]|[\u{200D}]|[\u{FE0F}]/gu;

    return text.replace(emojiRegex, '');
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
    // Apply all normalizations: quotes, whitespace, AND mathematical characters for PDF compatibility
    text = TextNormalizer.normalizeText(text);
    text = TextNormalizer.normalizeMathematicalCharacters(text);
    return text;
  }
}
