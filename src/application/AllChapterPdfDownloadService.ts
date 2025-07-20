import { TocExtractor } from '../domain/extraction/TocExtractor';
import { BookChapterDownloadStateRepository } from '../infrastructure/BookChapterDownloadStateRepository';
import { PersistentLogger } from '../infrastructure/logging/PersistentLogger';
import { BookChapterPdfService } from './BookChapterPdfService';
import { waitForBookContent } from '../infrastructure/waitForBookContent';
import { politeWait } from '../infrastructure/politeWait';

/**
 * Service to orchestrate downloading all chapters as PDFs for a book.
 * Navigates to each chapter, logs progress, generates PDF, and tracks state.
 */
export class AllChapterPdfDownloadService {
  private tocExtractor: TocExtractor;
  private stateRepo: BookChapterDownloadStateRepository;
  private bookChapterPdfService: BookChapterPdfService;
  private logger: PersistentLogger;

  constructor(
    tocExtractor: TocExtractor,
    stateRepo: BookChapterDownloadStateRepository,
    bookChapterPdfService: BookChapterPdfService,
    logger: PersistentLogger = PersistentLogger.instance,
  ) {
    this.tocExtractor = tocExtractor;
    this.stateRepo = stateRepo;
    this.bookChapterPdfService = bookChapterPdfService;
    this.logger = logger;
  }

  /**
   * Starts the bulk chapter download process for all chapters.
   */
  async startDownloadAllChapters(): Promise<void> {
    const tocRoot = document.querySelector('ol[data-testid="tocItems"]') as HTMLElement | null;
    if (!tocRoot) {
      await this.logger.error('TOC root element not found. Cannot start bulk chapter download.');
      return;
    }
    const tocItems = this.tocExtractor.extractItems(tocRoot);
    if (tocItems.length === 0) {
      await this.logger.error('No chapters found in TOC. Cannot start bulk chapter download.');
      return;
    }

    this.stateRepo.save({ isActive: true });
    await this.logger.info('Bulk chapter download started.');
    const nextUrl = new URL(tocItems[0].href, window.location.href).toString();
    await politeWait(1000); // Brief wait before initial navigation
    await this.logger.info(`Navigating to: ${nextUrl}`);
    window.location.href = nextUrl;
  }

  async resumeDownloadIfNeeded(): Promise<void> {
    const state = this.stateRepo.load();
    if (!state || !state.isActive) {
      return; // Not in an active download session
    }

    await this.logger.info('Resuming bulk chapter download.');

    try {
      await waitForBookContent();
    } catch (err) {
      await this.logger.error('Book content did not load in time. Aborting chapter download.');
      // We don't clear state here, to allow for manual retry/navigation.
      return;
    }

    const h1 = document.querySelector('h1');
    const chapterTitle = h1 ? h1.textContent?.trim() || 'chapter' : 'chapter';
    await this.bookChapterPdfService.downloadCurrentChapterAsPdf(`${chapterTitle}.pdf`);
    await this.logger.info(`'${chapterTitle}' PDF download initiated.`);

    const nextLink = document.querySelector('[data-testid="statusBarNext"] a');
    if (nextLink instanceof HTMLAnchorElement) {
      await this.logger.info('Found next chapter link. Navigating...');
      await politeWait();
      window.location.href = nextLink.href;
    } else {
      await this.logger.info('No next chapter link found. Bulk download completed.');
      this.stateRepo.clear();
      alert(
        'All chapters have been processed. Please check the extension logs for any errors or warnings.',
      );
    }
  }
}
