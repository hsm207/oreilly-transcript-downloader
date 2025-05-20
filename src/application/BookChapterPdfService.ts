import { BookChapterExtractor } from '../domain/extraction/BookChapterExtractor';
import { PdfGenerator } from '../infrastructure/PdfGenerator';
import { PersistentLogger } from '../infrastructure/logging/PersistentLogger';

/**
 * BookChapterPdfService coordinates extraction and PDF generation for book chapters.
 */
export class BookChapterPdfService {
  /**
   * Extracts the current chapter from #book-content and triggers PDF download.
   * @param filename The filename for the PDF
   * @throws Error if #book-content is not found
   */
  static async downloadCurrentChapterAsPdf(filename: string): Promise<void> {
    const logger = PersistentLogger;
    const root = document.getElementById('book-content');
    if (!root) {
      await logger.error('#book-content not found. Cannot generate PDF.');
      throw new Error('#book-content not found');
    }
    await logger.info('Extracting chapter content for PDF...');
    const elements = BookChapterExtractor.extract(root);
    await logger.info(`Extracted ${elements.length} elements. Generating PDF...`);
    await PdfGenerator.generateAndDownload(elements, filename);
  }
}
