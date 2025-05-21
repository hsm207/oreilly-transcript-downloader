import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BookChapterPdfService } from './BookChapterPdfService';
import { BookChapterExtractor } from '../domain/extraction/BookChapterExtractor';
import { PdfGenerator } from '../infrastructure/PdfGenerator';
import { PersistentLogger } from '../infrastructure/logging/PersistentLogger';

describe('BookChapterPdfService', () => {
  let extractSpy: any;
  let pdfSpy: any;
  let loggerInfo: any;
  let loggerError: any;
  beforeEach(() => {
    extractSpy = vi.spyOn(BookChapterExtractor, 'extract').mockReturnValue([
      { type: 'heading', level: 1, text: 'Title' },
      { type: 'paragraph', text: 'Hello world.' },
    ]);
    pdfSpy = vi.spyOn(PdfGenerator, 'generateAndDownload').mockResolvedValue(undefined);
    loggerInfo = vi.spyOn(PersistentLogger, 'info').mockResolvedValue(undefined);
    loggerError = vi.spyOn(PersistentLogger, 'error').mockResolvedValue(undefined);
  });
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('extracts chapter and triggers PDF download', async () => {
    // Setup DOM
    const div = document.createElement('div');
    div.id = 'book-content';
    document.body.appendChild(div);
    await expect(
      BookChapterPdfService.downloadCurrentChapterAsPdf('chapter.pdf'),
    ).resolves.toBeUndefined();
    expect(loggerInfo).toHaveBeenCalledWith(expect.stringContaining('Extracting chapter content'));
    expect(loggerInfo).toHaveBeenCalledWith(expect.stringContaining('Generating PDF'));
    document.body.removeChild(div);
  });

  it('logs error and throws if #book-content is missing', async () => {
    await expect(BookChapterPdfService.downloadCurrentChapterAsPdf('fail.pdf')).rejects.toThrow();
    expect(loggerError).toHaveBeenCalledWith(expect.stringContaining('#book-content not found'));
  });
});
