import { TocExtractor } from '../domain/extraction/TocExtractor';
import { findNextChapterHref } from '../domain/extraction/findNextChapterHref';
import { PersistentLogger } from '../infrastructure/logging/PersistentLogger';
import { BulkChapterDownloadStateRepository } from '../infrastructure/BulkChapterDownloadStateRepository';
import { BookChapterPdfService } from './BookChapterPdfService';
import { waitForBookContent } from '../infrastructure/waitForBookContent';
import { politeWait } from '../infrastructure/politeWait';
import { detectContentType } from '../domain/content/ContentDetector';
import { ContentType } from '../domain/content/ContentType';

/**
 * Service to orchestrate downloading all chapters as PDFs for a book.
 * Navigates to each chapter, logs progress, generates PDF, and tracks state.
 */
export class AllChapterPdfDownloadService {
  private tocExtractor: TocExtractor;
  private bookChapterPdfService: BookChapterPdfService;
  private logger: PersistentLogger;
  protected bulkStateRepo: BulkChapterDownloadStateRepository;

  constructor(
    tocExtractor: TocExtractor,
    bookChapterPdfService: BookChapterPdfService,
    logger: PersistentLogger = PersistentLogger.instance,
    bulkStateRepo: BulkChapterDownloadStateRepository = new BulkChapterDownloadStateRepository(),
  ) {
    this.tocExtractor = tocExtractor;
    this.bookChapterPdfService = bookChapterPdfService;
    this.logger = logger;
    this.bulkStateRepo = bulkStateRepo;
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
    // Find the first real chapter/item link (skip "Part"/non-chapter headers)
    const tocItems = this.tocExtractor.extractItems(tocRoot);
    if (!tocItems.length) {
      await this.logger.error('No chapters found in TOC.');
      return;
    }
    // Set bulk download flag using repository
    this.bulkStateRepo.setInProgress();
    await this.logger.info('Bulk chapter download started.');
    const firstUrl = new URL(tocItems[0].href, window.location.href).toString();
    await politeWait(1000); // Brief wait before initial navigation
    await this.logger.info(`Navigating to: ${firstUrl}`);
    window.location.href = firstUrl;
  }

  /**
   * Resumes the bulk chapter download process if state exists.
   */
  async resumeDownloadIfNeeded(): Promise<void> {
    // Only proceed if bulk download flag is set
    if (!this.bulkStateRepo.isInProgress()) {
      await this.logger.info('Bulk chapter download not in progress. Skipping resume logic.');
      return;
    }


    // Wait for book content to be fully loaded before proceeding
    try {
      await waitForBookContent();
      await this.logger.info('Book content loaded. Ready to process chapter.');
    } catch (err) {
      // If book content fails to load, check if this is a Quiz page (Practice or Final)
      const contentType = detectContentType(document, window.location.href);
      if (contentType === ContentType.Quiz) {
        await this.logger.info('Quiz page detected after content timeout. Skipping to next chapter.');
        // Skip this page and move to the next chapter
        const nextHref = findNextChapterHref();
        if (nextHref) {
          await this.logger.info(`Next chapter detected. Preparing to navigate to: ${nextHref}`);
          await politeWait(); // Default 3 second wait before navigating to next chapter
          const nextUrl = new URL(nextHref, window.location.href).toString();
          await this.logger.info(`Navigating to next chapter: ${nextUrl}`);
          window.location.href = nextUrl;
        } else {
          await this.logger.info('No next chapter found. Bulk chapter download completed.');
          // Clear the bulk download flag using repository
          this.bulkStateRepo.clear();
          alert(
            'All chapters have been processed. Please check the extension logs for any errors or warnings.',
          );
        }
        return;
      } else {
        await this.logger.error('Book content did not load in time and page is not a Quiz. Aborting chapter download.');
        return;
      }
    }

    // Use the document's title as the filename (or fallback)
    const title = document.title && document.title.trim() ? document.title : 'null-title';
    await this.logger.info(
      `Starting PDF download for chapter: "${title}" (URL: ${window.location.href})`,
    );
    await this.bookChapterPdfService.downloadCurrentChapterAsPdf(`${title}.pdf`);
    await this.logger.info(`PDF download initiated for: "${title}"`);

    // Find the next chapter link using the utility
    const nextHref = findNextChapterHref();
    if (nextHref) {
      await this.logger.info(`Next chapter detected. Preparing to navigate to: ${nextHref}`);
      await politeWait(); // Default 3 second wait before navigating to next chapter
      const nextUrl = new URL(nextHref, window.location.href).toString();
      await this.logger.info(`Navigating to next chapter: ${nextUrl}`);
      window.location.href = nextUrl;
    } else {
      await this.logger.info('No next chapter found. Bulk chapter download completed.');
      // Clear the bulk download flag using repository
      this.bulkStateRepo.clear();
      alert(
        'All chapters have been processed. Please check the extension logs for any errors or warnings.',
      );
    }
  }
}
