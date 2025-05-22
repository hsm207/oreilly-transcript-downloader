
/**
 * BookChapterPdfService coordinates extraction and PDF generation for book chapters.
 */
import { BookChapterExtractor } from "../domain/extraction/BookChapterExtractor";
import { PdfGenerator } from "../infrastructure/PdfGenerator";
import { PersistentLogger } from "../infrastructure/logging/PersistentLogger";

export class BookChapterPdfService {
  private extractor: BookChapterExtractor;
  private pdfGenerator: PdfGenerator;
  private logger: PersistentLogger;

  /**
   * @param extractor BookChapterExtractor instance
   * @param pdfGenerator PdfGenerator instance
   * @param logger Logger dependency (defaults to PersistentLogger.instance)
   */
  constructor(
    extractor: BookChapterExtractor,
    pdfGenerator: PdfGenerator,
    logger: PersistentLogger = PersistentLogger.instance
  ) {
    this.extractor = extractor;
    this.pdfGenerator = pdfGenerator;
    this.logger = logger;
  }

  /**
   * Extracts the current chapter from #book-content and triggers PDF download.
   * @param filename The filename for the PDF
   * @throws Error if #book-content is not found
   */
  async downloadCurrentChapterAsPdf(filename: string): Promise<void> {
    const root = document.getElementById("book-content");
    if (!root) {
      await this.logger.error("#book-content not found. Cannot generate PDF.");
      throw new Error("#book-content not found");
    }
    await this.logger.info("Extracting chapter content for PDF...");
    const elements = this.extractor.extract(root);
    await this.logger.info(`Extracted ${elements.length} elements. Generating PDF...`);
    await this.pdfGenerator.generateAndDownload(elements, filename, this.logger);
  }
}
