/**
 * Domain service responsible for detecting when transcript content has fully loaded.
 * Watches for loading indicators to disappear and paragraphs to appear.
 *
 * @remarks
 * Used in both single transcript downloads and batch processing.
 */
export class TranscriptContentLoader {
  /**
   * Waits for transcript content to fully load by checking for loading indicators
   * and confirming actual content is present.
   *
   * @param transcriptElement - The transcript container element
   * @param options - Configuration options for the loading process
   * @returns Promise that resolves to true if content loaded successfully, false if timed out
   */
  async waitForContentToLoad(
    transcriptElement: HTMLElement,
    options: {
      maxRetries?: number;
      retryDelayMs?: number;
      logPrefix?: string;
    } = {},
  ): Promise<boolean> {
    const {
      maxRetries = 40, // 40 * 500ms = 20 seconds default
      retryDelayMs = 500,
      logPrefix = '[TranscriptContentLoader]',
    } = options;

    let contentLoaded = false;
    let retryCount = 0;

    console.log(`${logPrefix} Waiting for content to load...`);

    while (!contentLoaded && retryCount < maxRetries) {
      // Check if skeleton loaders are still present
      const skeletonLoaders = transcriptElement.querySelectorAll('.MuiSkeleton-root');
      const loaderContainer = transcriptElement.querySelector('[data-testid="loader-container"]');

      if (skeletonLoaders.length === 0 && !loaderContainer) {
        // No loaders found, check if there's actual text content
        const paragraphs = transcriptElement.querySelectorAll('p');
        if (paragraphs.length > 0) {
          contentLoaded = true;
          console.log(`${logPrefix} Content loaded (${paragraphs.length} paragraphs found)`);
        }
      }

      if (!contentLoaded) {
        retryCount++;
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }

    if (!contentLoaded) {
      console.warn(
        `${logPrefix} Content did not load within the expected time (${(maxRetries * retryDelayMs) / 1000}s)`,
      );
    }

    return contentLoaded;
  }
}
