import { downloadFile } from '../domain/download/FileDownloader';
import { findBestEnglishVtt } from '../domain/extraction/LiveEventTranscriptProcessingRules';
import { PersistentLogger } from '../infrastructure/logging/PersistentLogger';

/**
 * LiveEventContentOrchestrator
 *
 * Orchestrates the content-script-side flow for LiveEvent transcript download:
 *   1. Requests the background orchestrator for the list of available transcript VTT URLs for the current tab
 *   2. Selects the best/English VTT file from the list using domain logic
 *   3. Fetches the selected VTT file
 *   4. (Future) Preprocesses the transcript as needed
 *   5. Triggers the download as a .txt file
 *
 * This class is content-script only: it cannot access Chrome APIs like webRequest or tabs, but can access the DOM and trigger downloads.
 *
 * All naming is aligned to the domain term: LiveEventTranscript.
 */
export class LiveEventContentOrchestrator {
  /**
   * @param logger Logger instance for persistent logging
   * @param sendMessageFn Function to send messages to background (usually chrome.runtime.sendMessage)
   * @param fetchFn Function to fetch VTT content (usually global fetch)
   * @param downloadFileFn Function to download files (usually from FileDownloader)
   */
  constructor(
    private readonly logger: PersistentLogger,
    private readonly sendMessageFn: typeof chrome.runtime.sendMessage,
    private readonly fetchFn: typeof fetch,
    private readonly downloadFileFn: typeof downloadFile,
  ) {}

  /**
   * Orchestrates the full LiveEvent transcript download flow for the current tab.
   * Handles messaging, error handling, fetching, and download.
   *
   * @returns Promise<void>
   */
  async downloadLiveEventTranscript(): Promise<void> {
    try {
      await this.logger.info('Starting LiveEvent transcript download flow');

      // 1. Ask background for the list of available transcript VTT URLs
      const response = await this.sendMessageFn({
        action: 'FIND_TRANSCRIPT_VTT',
        tabId: null,
      });

      // Always expect a list of VTT URLs from background (raw data)
      const vttUrls: string[] = response?.vttUrls || [];
      await this.logger.info(
        `Received ${vttUrls.length} VTT URLs from background: ${JSON.stringify(vttUrls)}`,
      );

      if (!vttUrls.length) {
        const errorMessage =
          response?.error ||
          'Failed to find transcript file. Make sure closed captions are enabled.';
        await this.logger.warn(`No VTT URLs found: ${errorMessage}`);
        alert(errorMessage);
        return;
      }

      // 2. Select the best/English VTT file from the list using domain logic
      const bestVttUrls = findBestEnglishVtt(vttUrls);
      if (!bestVttUrls.length) {
        await this.logger.warn('No English transcript file found in available options');
        alert('No English transcript file found in the available options.');
        return;
      }
      const selectedVttUrl = bestVttUrls[0];
      await this.logger.info(`Selected English VTT URL: ${selectedVttUrl}`);

      // 3. Fetch the selected VTT content
      const vttResponse = await this.fetchFn(selectedVttUrl);
      if (!vttResponse.ok) {
        await this.logger.error(`Failed to fetch VTT content, status: ${vttResponse.status}`);
        alert(`Failed to fetch transcript content. Status: ${vttResponse.status}`);
        return;
      }
      const vttContent = await vttResponse.text();
      await this.logger.info(
        `Successfully fetched VTT content, length: ${vttContent.length} characters`,
      );

      // 4. (Future) Preprocess the transcript as needed
      // TODO: Add preprocessing logic here

      // 5. Download the transcript as a .txt file (for now, still .vtt)
      this.downloadFileFn('live-event-transcript.vtt', vttContent);
      await this.logger.info('LiveEvent transcript download completed successfully');
    } catch (error) {
      await this.logger.error(`Error in LiveEvent transcript download: ${error}`);
      console.error('Error in LiveEvent transcript download:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to download transcript: ${errorMessage}`);
    }
  }

  /**
   * Static convenience method for backward compatibility with existing code.
   * Creates an instance with default dependencies and calls downloadLiveEventTranscript.
   */
  static async downloadLiveEventTranscript(): Promise<void> {
    // Always bind fetch to window to avoid Illegal invocation errors in Chrome extensions
    const orchestrator = new LiveEventContentOrchestrator(
      PersistentLogger.instance,
      chrome.runtime.sendMessage,
      window.fetch.bind(window),
      downloadFile,
    );
    return orchestrator.downloadLiveEventTranscript();
  }
}
