import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BookChapterPdfService } from './BookChapterPdfService';
import { PdfGenerator } from '../infrastructure/PdfGenerator';

describe('BookChapterPdfService', () => {
  let loggerInfo: any;
  let loggerError: any;
  let logger: any;
  beforeEach(() => {
    logger = {
      info: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockResolvedValue(undefined),
      warn: vi.fn(),
      debug: vi.fn(),
      log: vi.fn(),
    };
    vi.spyOn(PdfGenerator, 'generateAndDownload').mockResolvedValue(undefined);
    loggerInfo = logger.info;
    loggerError = logger.error;
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
      BookChapterPdfService.downloadCurrentChapterAsPdf('chapter.pdf', logger),
    ).resolves.toBeUndefined();
    expect(loggerInfo).toHaveBeenCalledWith(expect.stringContaining('Extracting chapter content'));
    expect(loggerInfo).toHaveBeenCalledWith(expect.stringContaining('Generating PDF'));
    document.body.removeChild(div);
  });

  it('logs error and throws if #book-content is missing', async () => {
    await expect(
      BookChapterPdfService.downloadCurrentChapterAsPdf('fail.pdf', logger),
    ).rejects.toThrow();
    expect(loggerError).toHaveBeenCalledWith(expect.stringContaining('#book-content not found'));
  });
});
