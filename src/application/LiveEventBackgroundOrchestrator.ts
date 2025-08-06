import { PersistentLogger } from '../infrastructure/logging/PersistentLogger';

/**
 * LiveEventBackgroundOrchestrator
 *
 * Orchestrates the background-side flow for LiveEvent transcript (VTT) lookup and response.
 *
 * Why not shared with content orchestrator?
 * - Chrome extensions require strict separation: background scripts can access Chrome APIs (webRequest, tabs, etc),
 *   but content scripts cannot. Content scripts can access the DOM and trigger downloads, but not network events.
 * - This orchestrator is responsible for answering content script requests by:
 *   1. Determining the current active tab
 *   2. Looking up all captured .vtt URLs for that tab (populated by the background webRequest listener)
 *   3. Responding to the content script with the raw list of VTT URLs (no business logic here!)
 *
 * The content orchestrator handles all transcript selection and processing logic.
 * All naming is aligned to the domain term: LiveEventTranscript.
 */
export class LiveEventBackgroundOrchestrator {
  /**
   * @param logger Logger instance for persistent logging (PersistentLogger)
   * @param getTabsFn Function to query Chrome tabs (usually chrome.tabs.query)
   * @param vttUrlsPerTab Map of tabId to array of captured .vtt URLs
   */
  constructor(
    private readonly logger: PersistentLogger,
    private readonly getTabsFn: typeof chrome.tabs.query,
    private readonly vttUrlsPerTab: { [tabId: number]: string[] },
  ) {}

  /**
   * Orchestrates the background-side flow for finding and responding with all captured VTT URLs for the current tab.
   * No business logic here—just data retrieval and response.
   *
   * @param sendResponse Callback to send the result (raw vttUrls list or error) back to the content script
   */
  async handleFindLiveEventTranscript(sendResponse: (response: any) => void): Promise<void> {
    try {
      // 1. Get the current active tab
      const tabs = await this.getTabsFn({ active: true, currentWindow: true });
      const currentTab = tabs[0];

      if (!currentTab?.id) {
        sendResponse({ error: 'Could not determine current tab' });
        return;
      }

      // 2. Look up all captured .vtt URLs for this tab
      const capturedUrls = this.vttUrlsPerTab[currentTab.id] || [];
      await this.logger.info(
        `Looking for .vtt URLs for tab ${currentTab.id}, found: ${JSON.stringify(capturedUrls)}`,
      );

      // 3. Return the raw list of VTT URLs (let content orchestrator handle selection)
      sendResponse({ vttUrls: capturedUrls });
    } catch (error) {
      await this.logger.error(`Error in handleFindLiveEventTranscript: ${error}`);
      const errorMessage = error instanceof Error ? error.message : String(error);
      sendResponse({ error: `Failed to find transcript: ${errorMessage}` });
    }
  }
}
