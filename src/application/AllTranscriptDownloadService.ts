import { TranscriptDownloadStateRepository } from '../infrastructure/TranscriptDownloadStateRepository';
import { TocExtractor } from '../domain/extraction/TocExtractor';
import { TableOfContentsItem } from '../domain/models/TableOfContentsItem';
import { waitForElement } from '../infrastructure/DomUtils';
import { IToggler } from '../domain/common/IToggler'; // Import IToggler

/**
 * Service to orchestrate downloading all transcripts for modules/videos listed in the TOC.
 * Navigates to each module, logs progress, extracts transcript, and downloads it.
 *
 * @remarks
 * - Follows DDD and SOLID principles.
 * - Uses extension context navigation (provided as a dependency).
 */

export class AllTranscriptDownloadService {
  /**
   * Exposes the TOC extractor for use in entry points (e.g., for initial TOC extraction).
   * This is intentionally public for orchestration from content scripts.
   */
  public tocExtractor: TocExtractor;
  private extractTranscript: (el: HTMLElement) => string;
  private fileDownloader: { downloadFile: (filename: string, content: string) => void };
  private waitForElement: (selector: string, timeout?: number) => Promise<Element | null>;
  private transcriptEnsurer: IToggler; // Renamed and type changed
  private navigate: (url: string) => Promise<void>;
  private tocEnsurer: IToggler;

  constructor(
    tocExtractor: TocExtractor,
    extractTranscript: (el: HTMLElement) => string,
    fileDownloader: { downloadFile: (filename: string, content: string) => void },
    waitForElement: (selector: string, timeout?: number) => Promise<Element | null>,
    transcriptEnsurer: IToggler, // Updated parameter name and type
    navigate: (url: string) => Promise<void>,
    tocEnsurer: IToggler,
  ) {
    this.tocExtractor = tocExtractor;
    this.extractTranscript = extractTranscript;
    this.fileDownloader = fileDownloader;
    this.waitForElement = waitForElement;
    this.transcriptEnsurer = transcriptEnsurer; // Updated assignment
    this.navigate = navigate;
    this.tocEnsurer = tocEnsurer;
  }

  /**
   * Handles the orchestration for downloading a single transcript from the current page.
   * This is intended to be called from the content script entry point.
   *
   * @param onError - Callback for error handling.
   * @returns Promise<void>
   */
  async downloadSingleTranscript(onError: (error: unknown) => void): Promise<void> {
    try {
      const result = await this.extractAndDownloadTranscript({
        filename: this.getSafePageTitle() + '.txt',
        logPrefix: '[DOWNLOAD_TRANSCRIPT]',
        onError,
      });
      if (!result.success && result.error) {
        onError(result.error);
      }
    } catch (error) {
      onError(error);
    }
  }

  /**
   * Shared logic for extracting and downloading a transcript from the current page.
   * Used by both single and all transcript download flows.
   *
   * @param options.filename - The filename to use for the downloaded transcript.
   * @param options.logPrefix - Prefix for logging or error context.
   * @param options.onError - Optional error callback.
   */
  private async extractAndDownloadTranscript({
    filename,
    logPrefix,
    onError,
  }: {
    filename: string;
    logPrefix: string;
    onError?: (error: unknown) => void;
  }): Promise<{ success: boolean; error?: string }> {
    const TRANSCRIPT_TOGGLE_BUTTON_SELECTOR = '[data-testid="transcript-toggle"]';
    const TRANSCRIPT_CONTAINER_SELECTOR = '[data-testid="transcript-body"]';
    try {
      const transcriptToggleButton = await this.waitForElement(
        TRANSCRIPT_TOGGLE_BUTTON_SELECTOR,
        10000,
      );
      if (!transcriptToggleButton || !(transcriptToggleButton instanceof HTMLElement)) {
        const err = 'Transcript toggle button not found. This video may not have a transcript.';
        if (onError) onError(err);
        return { success: false, error: err };
      }

      const transcriptBodyElement = await this.transcriptEnsurer.ensureContentVisible(
        transcriptToggleButton,
        TRANSCRIPT_CONTAINER_SELECTOR,
      );
      if (!transcriptBodyElement || !(transcriptBodyElement instanceof HTMLElement)) {
        const err =
          'Transcript body did not appear or is not a valid element. Please try again or check if the video has a transcript.';
        if (onError) onError(err);
        return { success: false, error: err };
      }

      const transcript = this.extractTranscript(transcriptBodyElement);
      if (transcript && transcript.trim().length > 0) {
        this.fileDownloader.downloadFile(filename, transcript);
        return { success: true };
      } else {
        const err = 'No transcript content found on this page.';
        if (onError) onError(err);
        return { success: false, error: err };
      }
    } catch (error) {
      if (onError) onError(error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Returns a sanitized version of the current page title for use as a filename.
   * Replaces invalid filename characters and spaces with underscores.
   */
  private getSafePageTitle(): string {
    const pageTitle = document.title.trim() || 'transcript';
    return pageTitle.replace(/[<>:"/\\|?* ]+/g, '_');
  }

  /**
   * Orchestrates the initial step for all transcript download: extracts TOC items, saves state, and navigates to the first item.
   * This is intended to be called from the content script entry point.
   *
   * @param stateRepo - Repository for managing download state.
   * @param onError - Callback for error handling.
   * @returns Promise<void>
   */
  async startDownloadAllTranscripts(
    stateRepo: TranscriptDownloadStateRepository,
    onError: (error: unknown) => void,
  ): Promise<void> {
    const TOC_TOGGLE_BUTTON_SELECTOR = '[data-testid="table-of-contents-button"]';
    const TOC_CONTAINER_SELECTOR = 'ol[data-testid="tocItems"]';

    try {
      // Find the TOC toggle button
      const tocToggleButtonElement = await this.waitForElement(TOC_TOGGLE_BUTTON_SELECTOR, 5000);
      if (!tocToggleButtonElement || !(tocToggleButtonElement instanceof HTMLElement)) {
        onError(
          `Table of Contents toggle button ('${TOC_TOGGLE_BUTTON_SELECTOR}') not found. Please ensure the TOC panel can be opened.`,
        );
        return;
      }

      const tocRootEl = await this.tocEnsurer.ensureContentVisible(
        tocToggleButtonElement,
        TOC_CONTAINER_SELECTOR,
      );

      if (!tocRootEl || !(tocRootEl instanceof HTMLElement)) {
        onError(
          `Table of Contents container ('${TOC_CONTAINER_SELECTOR}') not found even after attempting to toggle. Please open the TOC manually and try again.`,
        );
        return;
      }

      const tocItems = this.tocExtractor.extractItems(tocRootEl);
      if (!tocItems.length) {
        onError('No modules found in the Table of Contents.');
        return;
      }
      stateRepo.save({ tocItems, currentIndex: 0 });
      if (tocItems[0] && tocItems[0].href) {
        await this.navigate(tocItems[0].href);
      } else {
        onError('First item in Table of Contents has no valid link.');
        stateRepo.clear();
      }
    } catch (error) {
      onError(error);
      stateRepo.clear();
    }
  }

  /**
   * Resumes the "download all transcripts" process if state exists.
   * @param stateRepo - Repository for managing download state.
   * @param onComplete - Callback when all transcripts are processed.
   * @param onError - Callback when an error occurs.
   */
  async resumeDownloadAllTranscriptsIfNeeded(
    stateRepo: TranscriptDownloadStateRepository,
    onComplete: () => void,
    onError: (error: unknown, title: string) => void,
  ): Promise<void> {
    const allDownloadState = stateRepo.load();
    if (!allDownloadState) return;

    const { tocItems, currentIndex } = allDownloadState;
    if (currentIndex >= tocItems.length) {
      stateRepo.clear();
      setTimeout(onComplete, 500);
      return;
    }

    try {
      const result = await this.processCurrentTranscript(allDownloadState, (info) => {
        // eslint-disable-next-line no-console
        console.log(
          `[AllTranscriptDownloadService] Processing: ${info.title} (${info.current}/${info.total})`,
        );
      });

      const nextIndex = currentIndex + 1;
      if ((result === 'done' || result === 'skipped') && nextIndex < tocItems.length) {
        stateRepo.save({ tocItems, currentIndex: nextIndex });
        setTimeout(() => {
          window.location.href = tocItems[nextIndex].href;
        }, 1000);
      } else if (nextIndex >= tocItems.length) {
        stateRepo.clear();
        setTimeout(onComplete, 500);
      }
      if (result === 'error') {
        stateRepo.clear();
        onError(new Error('Download stopped.'), tocItems[currentIndex].title);
      }
    } catch (error) {
      stateRepo.clear();
      onError(error, tocItems[currentIndex].title);
    }
  }

  /**
   * Processes the current transcript in the download-all sequence.
   * Handles navigation, DOM readiness, extraction, download, and error handling for a single item.
   *
   * @param allDownloadState The current state of the download-all process (tocItems and currentIndex).
   * @param onProgress Optional callback for progress updates.
   * @param downloadDelayMs Delay after each download (ms).
   */
  private async processCurrentTranscript(
    allDownloadState: {
      tocItems: { title: string; href: string }[];
      currentIndex: number;
    },
    onProgress?: (info: { current: number; total: number; title: string }) => void,
    downloadDelayMs: number = 1000,
  ): Promise<'done' | 'skipped' | 'error'> {
    const { tocItems, currentIndex } = allDownloadState;
    if (currentIndex >= tocItems.length) {
      return 'done';
    }
    const item = tocItems[currentIndex];
    try {
      if (onProgress)
        onProgress({ current: currentIndex + 1, total: tocItems.length, title: item.title });
      const result = await this.extractAndDownloadTranscript({
        filename: `${item.title}.txt`,
        logPrefix: `[AllTranscriptDownloadService: ${item.title}]`,
      });
      if (!result.success) {
        return 'skipped';
      }
      await new Promise((res) => setTimeout(res, downloadDelayMs));
      return 'done';
    } catch (error) {
      // Error during processing
      return 'error';
    }
  }
}
