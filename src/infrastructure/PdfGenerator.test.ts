import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BookChapterElement } from '../domain/extraction/BookChapterExtractor';
import * as LoggerModule from './logging/PersistentLogger';

describe('PdfGenerator', () => {
  beforeEach(() => {
    vi.spyOn(LoggerModule.PersistentLogger, 'info').mockResolvedValue(undefined);
    vi.spyOn(LoggerModule.PersistentLogger, 'error').mockResolvedValue(undefined);
    vi.spyOn(LoggerModule.PersistentLogger, 'warn').mockResolvedValue(undefined);
    vi.spyOn(LoggerModule.PersistentLogger, 'debug').mockResolvedValue(undefined);
    vi.spyOn(LoggerModule.PersistentLogger, 'log').mockResolvedValue(undefined);
  });
  afterEach(() => {
    vi.resetAllMocks();
    vi.unmock('jspdf');
  });

  it('calls jsPDF and saves a file for simple chapter elements', async () => {
    vi.doMock('jspdf', () => {
      const saveMock = vi.fn();
      const addImageMock = vi.fn();
      // Mock splitTextToSize to just split on newlines or return the string as an array
      const splitTextToSize = (text: string, _width: number) => {
        if (typeof text === 'string') {
          return text.split('\n');
        }
        return [text];
      };
      return {
        jsPDF: vi.fn().mockImplementation(() => ({
          setFontSize: vi.fn(),
          text: vi.fn(),
          addPage: vi.fn(),
          addImage: addImageMock,
          save: saveMock,
          splitTextToSize,
          setTextColor: vi.fn(),
          setFont: vi.fn(),
        })),
      };
    });
    const { PdfGenerator } = await import('./PdfGenerator');
    const elements: BookChapterElement[] = [
      { type: 'heading', level: 1, text: 'Title' },
      { type: 'paragraph', text: 'Hello world.' },
      { type: 'list', ordered: false, items: ['A', 'B'] },
      { type: 'caption', text: 'A caption.' },
    ];
    await PdfGenerator.generateAndDownload(elements, 'test.pdf');
    // Check that info logs were called
    expect(LoggerModule.PersistentLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Generating PDF'),
    );
    expect(LoggerModule.PersistentLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('PDF download triggered'),
    );
  });

  it('logs errors if PDF generation fails', async () => {
    vi.doMock('jspdf', () => ({
      jsPDF: vi.fn().mockImplementation(() => {
        throw new Error('fail');
      }),
    }));
    const { PdfGenerator } = await import('./PdfGenerator');
    const elements: BookChapterElement[] = [{ type: 'heading', level: 1, text: 'Oops' }];
    await expect(PdfGenerator.generateAndDownload(elements, 'fail.pdf')).rejects.toThrow();
    expect(LoggerModule.PersistentLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('PDF generation failed'),
    );
  });
});
