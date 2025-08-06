import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AllChapterPdfDownloadService } from './AllChapterPdfDownloadService';
import * as waitModule from '../infrastructure/waitForBookContent';
import * as politeWaitModule from '../infrastructure/politeWait';
import { BulkChapterDownloadStateRepository } from '../infrastructure/BulkChapterDownloadStateRepository';
import { TocExtractor } from '../domain/extraction/TocExtractor';
import { BookChapterPdfService } from './BookChapterPdfService';

vi.mock('./BookChapterPdfService'); // Automatically mock all exports

describe('AllChapterPdfDownloadService', () => {
  it('should use "null-title.pdf" as the filename if document.title is empty (navigation-based stateless flow)', async () => {
    // Arrange: set up mocks for navigation-based, stateless flow
    Object.defineProperty(document, 'title', { value: '', configurable: true });
    // Create mock bulk state repo that always returns true
    const mockBulkStateRepo = {
      isInProgress: () => true,
      clear: vi.fn(),
      setInProgress: vi.fn(),
    } as any;
    // Create service instance with mocks
    const testService = new AllChapterPdfDownloadService(
      mockTocExtractor,
      mockBookChapterPdfService,
      mockLogger,
      mockBulkStateRepo,
    );
    // waitForBookContent resolves
    waitForBookContentSpy.mockResolvedValue(document.createElement('div'));
    // Act
    await testService.resumeDownloadIfNeeded();
    // Assert
    expect(mockBookChapterPdfService.downloadCurrentChapterAsPdf).toHaveBeenCalledWith(
      'null-title.pdf',
    );
  });
  let waitForBookContentSpy: ReturnType<typeof vi.spyOn>;
  let politeWaitSpy: ReturnType<typeof vi.spyOn>;
  let service: AllChapterPdfDownloadService;
  let mockTocExtractor: TocExtractor;
  let mockBulkStateRepo: BulkChapterDownloadStateRepository;
  let mockBookChapterPdfService: BookChapterPdfService;
  let mockLogger: any;
  let originalLocation: Location;
  let mockLocation: { href: string };
  let originalAlert: typeof window.alert;

  beforeEach(() => {
    // Mock window.alert
    originalAlert = window.alert;
    window.alert = vi.fn();
    // Spy on waitForBookContent and resolve immediately by default
    waitForBookContentSpy = vi
      .spyOn(waitModule, 'waitForBookContent')
      .mockResolvedValue(document.createElement('div')) as unknown as ReturnType<typeof vi.spyOn>;
    // Spy on politeWait and resolve immediately for tests
    politeWaitSpy = vi
      .spyOn(politeWaitModule, 'politeWait')
      .mockResolvedValue(undefined) as unknown as ReturnType<typeof vi.spyOn>;
    vi.clearAllMocks();

    mockTocExtractor = { extractItems: vi.fn() } as unknown as TocExtractor;
    mockBulkStateRepo = {
      setInProgress: vi.fn(),
      clear: vi.fn(),
      isInProgress: vi.fn(),
    } as unknown as BulkChapterDownloadStateRepository;

    mockBookChapterPdfService = {
      downloadCurrentChapterAsPdf: vi.fn().mockResolvedValue(undefined),
    } as unknown as BookChapterPdfService;

    mockLogger = {
      info: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockResolvedValue(undefined),
      warn: vi.fn().mockResolvedValue(undefined),
      debug: vi.fn().mockResolvedValue(undefined),
      log: vi.fn().mockResolvedValue(undefined),
    };

    // Mock window.location for navigation testing
    originalLocation = window.location;
    mockLocation = { href: 'http://initial.com/default-page' };
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
      configurable: true,
    });

    service = new AllChapterPdfDownloadService(
      mockTocExtractor,
      mockBookChapterPdfService,
      mockLogger,
      mockBulkStateRepo,
    );
  });

  afterEach(() => {
    waitForBookContentSpy.mockRestore();
    politeWaitSpy.mockRestore();
    window.alert = originalAlert;
    // Restore original window.location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks(); // Also good practice to restore all mocks
  });

  it('should start the bulk chapter download process, set progress flag, and navigate to first chapter', async () => {
    // Arrange: mock TOC extraction and DOM
    const tocItems = [
      { title: 'Chapter 1', href: '/chapter1' },
      { title: 'Chapter 2', href: '/chapter2' },
    ];
    (mockTocExtractor.extractItems as any).mockReturnValue(tocItems);
    mockLocation.href = 'http://initial.com/default-page';

    // Mock the TOC root element
    const tocRoot = document.createElement('ol');
    tocRoot.setAttribute('data-testid', 'tocItems');
    document.body.appendChild(tocRoot);

    // Act
    await service.startDownloadAllChapters();

    // Assert
    expect(mockTocExtractor.extractItems).toHaveBeenCalledWith(tocRoot);
    expect(mockBulkStateRepo.setInProgress).toHaveBeenCalled();
    expect(politeWaitSpy).toHaveBeenCalledWith(1000);
    expect(mockLogger.info).toHaveBeenCalledWith('Bulk chapter download started.');
    expect(mockLogger.info).toHaveBeenCalledWith('Navigating to: http://initial.com/chapter1');
    expect(mockLocation.href).toBe('http://initial.com/chapter1');

    // Clean up
    document.body.removeChild(tocRoot);
  });

  it('should process chapter and download PDF when bulk download is in progress', async () => {
    // Arrange: bulk download is in progress
    (mockBulkStateRepo.isInProgress as any).mockReturnValue(true);
    waitForBookContentSpy.mockResolvedValue(document.createElement('div'));
    Object.defineProperty(document, 'title', { value: 'Test Chapter', configurable: true });

    // Act
    await service.resumeDownloadIfNeeded();

    // Assert
    expect(waitForBookContentSpy).toHaveBeenCalled();
    expect(mockBookChapterPdfService.downloadCurrentChapterAsPdf).toHaveBeenCalledWith(
      'Test Chapter.pdf',
    );
    expect(mockLogger.info).toHaveBeenCalledWith('Book content loaded. Ready to process chapter.');
  });

  it('should skip Quiz pages (Practice Quiz) and navigate to next chapter', async () => {
    waitForBookContentSpy.mockRejectedValueOnce(new Error('timeout'));
    (mockBulkStateRepo.isInProgress as any).mockReturnValue(true);
    document.body.innerHTML = `
      <div class="test-title-text" title="Practice Quiz">Practice Quiz</div>
      <div data-testid="statusBarNext">
        <a href="/chapter/next">Next Chapter</a>
      </div>
    `;
    (window.location as any).href = 'https://learning.oreilly.com/chapter/practice-quiz';
    const service = new AllChapterPdfDownloadService(
      mockTocExtractor,
      mockBookChapterPdfService,
      mockLogger,
      mockBulkStateRepo,
    );
    await service.resumeDownloadIfNeeded();
    expect(window.location.href).toBe('https://learning.oreilly.com/chapter/next');
    expect(mockLogger.info).toHaveBeenCalledWith('Quiz page detected after content timeout. Skipping to next chapter.');
  });

  it('should skip Quiz pages (Final Quiz) and navigate to next chapter', async () => {
    waitForBookContentSpy.mockRejectedValueOnce(new Error('timeout'));
    (mockBulkStateRepo.isInProgress as any).mockReturnValue(true);
    document.body.innerHTML = `
      <div class="test-title-text" title="Final Quiz">Final Quiz</div>
      <div data-testid="statusBarNext">
        <a href="/chapter/next">Next Chapter</a>
      </div>
    `;
    (window.location as any).href = 'https://learning.oreilly.com/chapter/final-quiz';
    const service = new AllChapterPdfDownloadService(
      mockTocExtractor,
      mockBookChapterPdfService,
      mockLogger,
      mockBulkStateRepo,
    );
    await service.resumeDownloadIfNeeded();
    expect(window.location.href).toBe('https://learning.oreilly.com/chapter/next');
    expect(mockLogger.info).toHaveBeenCalledWith('Quiz page detected after content timeout. Skipping to next chapter.');
  });

  it('should skip resume logic when bulk download is not in progress', async () => {
    // Arrange: bulk download is not in progress
    (mockBulkStateRepo.isInProgress as any).mockReturnValue(false);

    // Act
    await service.resumeDownloadIfNeeded();

    // Assert
    expect(mockBulkStateRepo.isInProgress).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Bulk chapter download not in progress. Skipping resume logic.',
    );
    expect(mockBookChapterPdfService.downloadCurrentChapterAsPdf).not.toHaveBeenCalled();
  });

  it('should abort and log an error if book content does not load in time and the page is not a Quiz', async () => {
    document.body.innerHTML = '';
    (mockBulkStateRepo.isInProgress as any).mockReturnValue(true);
    waitForBookContentSpy.mockRejectedValue(new Error('Book content did not load in time.'));
    await service.resumeDownloadIfNeeded();
    expect(waitForBookContentSpy).toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Book content did not load in time and page is not a Quiz. Aborting chapter download.',
    );
    expect(mockBookChapterPdfService.downloadCurrentChapterAsPdf).not.toHaveBeenCalled();
  });
});
