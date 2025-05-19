import { IToggler } from '../common/IToggler';
import { waitForElement } from '../../infrastructure/DomUtils';

/**
 * Domain service for ensuring the transcript is visible on the video page.
 * Implements IToggler to provide a standardized way to show transcript content.
 */
export class TranscriptToggler implements IToggler {
  /**
   * Default timeout for content to load within the transcript container.
   */
  private static readonly CONTENT_LOAD_TIMEOUT_MS = 10000; // 10 seconds
  /**
   * Default polling interval for checking if content has loaded.
   */
  private static readonly CONTENT_POLL_INTERVAL_MS = 500; // 0.5 seconds
  /**
   * Selector for the loading indicator within the transcript container.
   */
  private static readonly LOADER_SELECTOR = '[data-testid="loader-container"]';

  /**
   * Constructs a TranscriptToggler.
   */
  constructor() {}

  /**
   * Waits for the content within the transcript container to load by checking for the absence of a loader element.
   *
   * @param transcriptContainer - The parent container element where the transcript content is expected.
   * @param loaderSelector - The CSS selector for the loading indicator element.
   * @param timeoutMs - The maximum time in milliseconds to wait for the content to load.
   * @param pollIntervalMs - The interval in milliseconds at which to check for the loader's disappearance.
   * @throws {Error} If the content does not load (loader does not disappear) within the specified timeout.
   * @private
   */
  private async waitForContentToLoad(
    transcriptContainer: Element,
    loaderSelector: string,
    timeoutMs: number,
    pollIntervalMs: number,
  ): Promise<void> {
    let loader = transcriptContainer.querySelector(loaderSelector);

    if (loader) {
      console.log(
        `[TranscriptToggler] Loader ('${loaderSelector}') found. Waiting for content to load...`,
      );
      const startTime = Date.now();

      while (loader) {
        if (Date.now() - startTime > timeoutMs) {
          const errorMessage = `[TranscriptToggler] Content in transcript container did not load within ${timeoutMs / 1000}s (loader '${loaderSelector}' still present).`;
          console.error(errorMessage);
          throw new Error(errorMessage);
        }
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
        loader = transcriptContainer.querySelector(loaderSelector);
      }
      console.log(
        `[TranscriptToggler] Loader ('${loaderSelector}') disappeared. Content is presumed loaded.`,
      );
    } else {
      console.log(
        `[TranscriptToggler] No loader ('${loaderSelector}') found. Content is presumed loaded or was already present.`,
      );
    }
  }

  /**
   * Ensures the transcript content associated with the provided toggleElement is made visible
   * and confirms its visibility by checking for the presence of the content container and its content.
   *
   * @param toggleButton - The HTMLElement that acts as the transcript toggle button.
   * @param transcriptContainerSelector - The CSS selector for the transcript content container
   *                                      (e.g., '[data-testid="transcript-body"]').
   * @returns {Promise<Element>} A promise that resolves with the transcript container element when visible and loaded,
   *                            or rejects if it fails to appear or load.
   * @throws {Error} If the transcript container does not become visible after toggling,
   *                 if the content within the container does not load,
   *                 or if the provided toggleElement is not an HTMLButtonElement.
   */
  async ensureContentVisible(
    toggleButton: HTMLElement,
    transcriptContainerSelector: string,
  ): Promise<Element> {
    if (!(toggleButton instanceof HTMLButtonElement)) {
      throw new Error('[TranscriptToggler] Provided toggleElement is not an HTMLButtonElement.');
    }

    console.log('[TranscriptToggler] Received toggle button:', toggleButton);

    const ariaLabel = toggleButton.getAttribute('aria-label');
    console.log('[TranscriptToggler] Button aria-label:', ariaLabel);

    let clicked = false;
    if (
      ariaLabel === 'Show Transcript' ||
      ariaLabel?.toLowerCase().includes('show') ||
      ariaLabel?.toLowerCase().includes('open')
    ) {
      console.log('[TranscriptToggler] Clicking transcript button to show transcript.');
      toggleButton.click();
      clicked = true;
      await new Promise((resolve) => setTimeout(resolve, 200)); // UI transition delay
    } else {
      console.log(
        '[TranscriptToggler] Transcript toggle button indicates content may already be visible.',
      );
    }

    // Use try-catch to clearly handle the waitForElement promise
    let transcriptContainer: Element | null;
    try {
      transcriptContainer = await waitForElement(transcriptContainerSelector, 5000);
      if (!transcriptContainer) {
        const actionTaken = clicked
          ? 'after clicking toggle'
          : 'even though toggle indicated visible';
        const errorMessage = `[TranscriptToggler] Transcript container ('${transcriptContainerSelector}') did not appear ${actionTaken}.`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
      console.log(
        `[TranscriptToggler] Transcript container ('${transcriptContainerSelector}') found. Checking for content...`,
      );
    } catch (error) {
      // Re-throw original error but make sure it's wrapped properly
      if (error instanceof Error) {
        throw error;
      } else {
        const actionTaken = clicked
          ? 'after clicking toggle'
          : 'even though toggle indicated visible';
        throw new Error(
          `[TranscriptToggler] Failed to find transcript container ${actionTaken}: ${error}`,
        );
      }
    }

    // Wait for the actual content to load by ensuring the loader disappears
    await this.waitForContentToLoad(
      transcriptContainer,
      TranscriptToggler.LOADER_SELECTOR,
      TranscriptToggler.CONTENT_LOAD_TIMEOUT_MS,
      TranscriptToggler.CONTENT_POLL_INTERVAL_MS,
    );

    console.log(
      `[TranscriptToggler] Transcript container ('${transcriptContainerSelector}') and its content are visible.`,
    );
    return transcriptContainer;
  }
}
