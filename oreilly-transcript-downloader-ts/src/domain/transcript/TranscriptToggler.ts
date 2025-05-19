import { IToggler } from '../common/IToggler';
import { waitForElement } from '../../infrastructure/DomUtils';

/**
 * Domain service for ensuring the transcript is visible on the video page.
 * Implements IToggler to provide a standardized way to show transcript content.
 */
export class TranscriptToggler implements IToggler {
  /**
   * Constructs a TranscriptToggler.
   */
  constructor() {}

  /**
   * Ensures the transcript content associated with the provided toggleElement is made visible
   * and confirms its visibility by checking for the presence of the content container.
   *
   * @param toggleButton - The HTMLElement that acts as the transcript toggle button.
   * @param transcriptContainerSelector - The CSS selector for the transcript content container
   *                                      (e.g., '[data-testid="transcript-body"]').
   * @returns {Promise<Element>} A promise that resolves with the transcript container element when visible,
   *                            or rejects if it fails to appear.
   * @throws {Error} If the transcript container does not become visible after toggling,
   *                 or if the provided toggleElement is not an HTMLButtonElement.
   */
  async ensureContentVisible(
    toggleButton: HTMLElement,
    transcriptContainerSelector: string,
  ): Promise<Element> {
    if (!(toggleButton instanceof HTMLButtonElement)) {
      throw new Error('[TranscriptToggler] Provided toggleElement is not an HTMLButtonElement.');
    }

    // Log to help with debugging
    console.log('[TranscriptToggler] Received toggle button:', toggleButton);

    const ariaLabel = toggleButton.getAttribute('aria-label');
    console.log('[TranscriptToggler] Button aria-label:', ariaLabel);

    let clicked = false;
    // Different possible states of the button that indicate transcript is hidden
    if (
      ariaLabel === 'Show Transcript' ||
      ariaLabel?.toLowerCase().includes('show') || // Make case-insensitive
      ariaLabel?.toLowerCase().includes('open')
    ) {
      console.log('[TranscriptToggler] Clicking transcript button to show transcript.');
      toggleButton.click();
      clicked = true;
      // Add a small delay for UI transition before checking for the container
      await new Promise((resolve) => setTimeout(resolve, 200)); // UI transition delay
    } else {
      console.log(
        '[TranscriptToggler] Transcript toggle button indicates content may already be visible.',
      );
    }

    // Now, wait for the transcript container to be present
    const transcriptContainer = await waitForElement(transcriptContainerSelector, 5000); // 5s timeout
    if (!transcriptContainer) {
      const actionTaken = clicked
        ? 'after clicking toggle'
        : 'even though toggle indicated visible';
      const errorMessage = `[TranscriptToggler] Transcript container ('${transcriptContainerSelector}') did not appear ${actionTaken}.`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    console.log(
      `[TranscriptToggler] Transcript container ('${transcriptContainerSelector}') is visible.`,
    );
    return transcriptContainer;
  }
}
