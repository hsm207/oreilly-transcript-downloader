import { TocExtractor } from '../domain/extraction/TocExtractor';
import {
  BookChapterDownloadStateRepository,
  BookChapterDownloadState,
} from '../infrastructure/BookChapterDownloadStateRepository';
import { PersistentLogger } from '../infrastructure/logging/PersistentLogger';
import { BookChapterPdfService } from './BookChapterPdfService';

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
    // Find the TOC root element (e.g., ol[data-testid="tocItems"])
    const tocRoot = document.querySelector('ol[data-testid="tocItems"]') as HTMLElement | null;
    if (!tocRoot) {
      await this.logger.error('TOC root element not found. Cannot start bulk chapter download.');
      return;
    }
    const tocItems = this.tocExtractor.extractItems(tocRoot);
    this.stateRepo.save({
      tocItems,
      currentIndex: 0,
    });

    if (tocItems.length > 0) {
      await this.logger.info('Bulk chapter download started.');
      const nextUrl = new URL(tocItems[0].href, window.location.href).toString();
      await this.logger.info(`Navigating to: ${nextUrl}`);
      window.location.href = nextUrl;
    }
  }

  /**
   * Resumes the bulk chapter download process if state exists.
   */
  async resumeDownloadIfNeeded(): Promise<void> {
    const state = this.stateRepo.load();
    if (!state) return;
    await this.logger.info('Resuming bulk chapter download.');

    const { tocItems, currentIndex } = state;
    if (!tocItems || tocItems.length === 0 || currentIndex >= tocItems.length) return;

    const currentItem = tocItems[currentIndex];
    await this.logger.info(`Processing chapter: ${currentItem.title}`);
    await this.bookChapterPdfService.downloadCurrentChapterAsPdf(`${currentItem.title}.pdf`);
    await this.logger.info(`${currentItem.title} PDF download initiated.`);

    if (currentIndex < tocItems.length - 1) {
      // Not last chapter: increment index, save state, and navigate
      this.stateRepo.save({ tocItems, currentIndex: currentIndex + 1 });
      const nextUrl = new URL(tocItems[currentIndex + 1].href, window.location.href).toString();
      await this.logger.info(`Navigating to: ${nextUrl}`);
      window.location.href = nextUrl;
    } else {
      // Last chapter: clear state and log completion
      this.stateRepo.clear();
      await this.logger.info('Bulk chapter download completed.');
    }
  }
}
