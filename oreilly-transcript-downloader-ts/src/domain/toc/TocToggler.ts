import { IToggler } from '../common/IToggler';
import { waitForElement } from '../../infrastructure/DomUtils';

/**
 * @file Domain service for ensuring the Table of Contents (TOC) is visible in the UI.
 *
 * Implements IToggler to provide a standardized way to show TOC content.
 */
export class TocToggler implements IToggler {
  /**
   * Constructs a TocToggler.
   */
  constructor() {}

  /**
   * Ensures the Table of Contents (TOC) is visible by toggling the provided button
   * if needed, and then confirms the TOC content container appears.
   *
   * @param toggleButton - The HTMLButtonElement that toggles the TOC.
   * @param tocContainerSelector - The CSS selector for the TOC content container
   *                               (e.g., 'ol[data-testid="tocItems"]').
   * @returns {Promise<Element>} A promise that resolves with the TOC container element when visible,
   *                            or rejects if it fails to appear.
   * @throws {Error} If the TOC container does not become visible after toggling.
   */
  async ensureContentVisible(
    toggleButton: HTMLElement,
    tocContainerSelector: string,
  ): Promise<Element> {
    if (!(toggleButton instanceof HTMLButtonElement)) {
      throw new Error('Provided toggleElement is not a HTMLButtonElement for TocToggler.');
    }

    const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';

    if (!isExpanded) {
      console.log('[TocToggler] TOC toggle is not expanded, clicking.');
      toggleButton.click();
      // Add a small delay for UI transition before checking for the container
      await new Promise((resolve) => setTimeout(resolve, 200)); // UI transition delay
    } else {
      console.log('[TocToggler] TOC toggle already expanded or state indicates visibility.');
    }

    // Now, wait for the TOC container to be present using the imported waitForElement
    const tocContainer = await waitForElement(tocContainerSelector, 5000); // 5s timeout for TOC container
    if (!tocContainer) {
      const errorMessage = `[TocToggler] TOC container ('${tocContainerSelector}') did not appear after toggle action.`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    console.log(`[TocToggler] TOC container ('${tocContainerSelector}') is visible.`);
    return tocContainer;
  }
}
