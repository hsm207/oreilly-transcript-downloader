import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AllChapterPdfDownloadService } from './AllChapterPdfDownloadService';
import * as waitModule from '../infrastructure/waitForBookContent';
import * as politeWaitModule from '../infrastructure/politeWait';
import {
  BookChapterDownloadStateRepository,
  BookChapterDownloadState,
} from '../infrastructure/BookChapterDownloadStateRepository';
import { TocExtractor } from '../domain/extraction/TocExtractor';
import { BookChapterPdfService } from './BookChapterPdfService';

vi.mock('./BookChapterPdfService'); // Automatically mock all exports

describe('AllChapterPdfDownloadService', () => {
  let waitForBookContentSpy: ReturnType<typeof vi.spyOn>;
  let politeWaitSpy: ReturnType<typeof vi.spyOn>;
  let service: AllChapterPdfDownloadService;
  let mockTocExtractor: TocExtractor;
  let mockStateRepo: BookChapterDownloadStateRepository;
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
    mockStateRepo = {
      save: vi.fn(),
      load: vi.fn(),
      clear: vi.fn(),
    } as unknown as BookChapterDownloadStateRepository;

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
      mockStateRepo,
      mockBookChapterPdfService,
      mockLogger,
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

  it('should start the bulk chapter download process with polite wait, save initial state, and navigate to first chapter', async () => {
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
    expect(mockStateRepo.save).toHaveBeenCalledWith({
      tocItems,
      currentIndex: 0,
    });
    expect(politeWaitSpy).toHaveBeenCalledWith(1000);
    expect(mockLogger.info).toHaveBeenCalledWith('Bulk chapter download started.');
    expect(mockLogger.info).toHaveBeenCalledWith('Navigating to: http://initial.com/chapter1');
    expect(mockLocation.href).toBe('http://initial.com/chapter1');

    // Clean up
    document.body.removeChild(tocRoot);
  });

  it('should resume bulk chapter download if state exists and wait for book content', async () => {
    // Arrange: mock state exists
    const state: BookChapterDownloadState = {
      tocItems: [{ title: 'Chapter 1', href: '/chapter1' }],
      currentIndex: 0,
    };
    (mockStateRepo.load as any).mockReturnValue(state);
    // Act
    await service.resumeDownloadIfNeeded();
    // Assert
    expect(waitForBookContentSpy).toHaveBeenCalled();
    expect(mockStateRepo.load).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalled();
  });

  it('should do nothing if no state exists on resume', async () => {
    (mockStateRepo.load as any).mockReturnValue(null);
    await service.resumeDownloadIfNeeded();
    expect(mockStateRepo.load).toHaveBeenCalled();
    // Should not call logger or process anything
    expect(mockLogger.info).not.toHaveBeenCalled();
  });

  it('should process the current chapter, download PDF, update state, wait politely and navigate on resume (happy path)', async () => {
    // Ensure waitForBookContent is called and resolves
    waitForBookContentSpy.mockResolvedValue(document.createElement('div'));
    // Arrange: mock state with a chapter to process
    const tocItems = [
      { title: 'Chapter 1', href: '/chapter1' },
      { title: 'Chapter 2', href: '/chapter2' },
    ];
    const initialState: BookChapterDownloadState = {
      tocItems,
      currentIndex: 0,
    };
    (mockStateRepo.load as any).mockReturnValue(initialState);
    mockLocation.href = 'http://initial.com/page'; // Set specific initial URL for this test if needed
    // No need to mock static method; instance method is already mocked in mockBookChapterPdfService

    // Act
    await service.resumeDownloadIfNeeded();
    expect(waitForBookContentSpy).toHaveBeenCalled();
    expect(politeWaitSpy).toHaveBeenCalled(); // Default parameter (3000ms)

    // Assert
    expect(mockBookChapterPdfService.downloadCurrentChapterAsPdf).toHaveBeenCalledWith(
      'Chapter 1.pdf',
    );
    expect(mockStateRepo.save).toHaveBeenCalledWith({
      ...initialState,
      currentIndex: 1, // Incremented index
    });
    expect(mockLogger.info).toHaveBeenCalledWith('Processing chapter: Chapter 1');
    expect(mockLogger.info).toHaveBeenCalledWith('Chapter 1 PDF download initiated.');
    expect(mockLogger.info).toHaveBeenCalledWith('Navigating to: http://initial.com/chapter2');
    expect(mockLocation.href).toBe('http://initial.com/chapter2'); // Assert navigation to the NEXT chapter
  });

  it('should complete the download, clear state, and not navigate when the last chapter is processed (waits for book content)', async () => {
    // Ensure waitForBookContent is called and resolves
    waitForBookContentSpy.mockResolvedValue(document.createElement('div'));
    // Arrange: mock state with the last chapter to process
    const tocItems = [
      { title: 'Chapter 1', href: '/chapter1' },
      { title: 'Chapter 2', href: '/chapter2' },
    ];
    const initialState: BookChapterDownloadState = {
      tocItems,
      currentIndex: 1, // Pointing to the last chapter
    };
    (mockStateRepo.load as any).mockReturnValue(initialState);
    // No need to mock static method; instance method is already mocked in mockBookChapterPdfService
    mockLocation.href = 'http://initial.com/last-chapter-page'; // Set specific initial URL for this test

    // Act
    await service.resumeDownloadIfNeeded();
    expect(waitForBookContentSpy).toHaveBeenCalled();
    // Assert
    expect(mockBookChapterPdfService.downloadCurrentChapterAsPdf).toHaveBeenCalledWith(
      'Chapter 2.pdf',
    );
    expect(mockStateRepo.clear).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith('Processing chapter: Chapter 2');
    expect(mockLogger.info).toHaveBeenCalledWith('Chapter 2 PDF download initiated.');
    expect(mockLogger.info).toHaveBeenCalledWith('Bulk chapter download completed.');
    expect(mockStateRepo.save).not.toHaveBeenCalledWith({
      tocItems,
      currentIndex: 2,
    });
    expect(mockLocation.href).toBe('http://initial.com/last-chapter-page');
  });

  it('should abort and log error if book content does not load in time', async () => {
    // Arrange: mock state exists and waitForBookContent rejects
    const state: BookChapterDownloadState = {
      tocItems: [{ title: 'Chapter 1', href: '/chapter1' }],
      currentIndex: 0,
    };
    (mockStateRepo.load as any).mockReturnValue(state);
    waitForBookContentSpy.mockRejectedValue(new Error('Book content did not load in time.'));
    // Act
    await service.resumeDownloadIfNeeded();
    // Assert
    expect(waitForBookContentSpy).toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Book content did not load in time. Aborting chapter download.',
    );
    // Should not process chapter or navigate
    expect(mockBookChapterPdfService.downloadCurrentChapterAsPdf).not.toHaveBeenCalled();
  });

  it('should display completion alert with appropriate cautious wording when processing the last chapter', async () => {
    // Ensure waitForBookContent is called and resolves
    waitForBookContentSpy.mockResolvedValue(document.createElement('div'));
    // Arrange: mock state with the last chapter to process
    const tocItems = [
      { title: 'Chapter 1', href: '/chapter1' },
      { title: 'Chapter 2', href: '/chapter2' },
    ];
    const initialState: BookChapterDownloadState = {
      tocItems,
      currentIndex: 1, // Pointing to the last chapter
    };
    (mockStateRepo.load as any).mockReturnValue(initialState);

    // Act
    await service.resumeDownloadIfNeeded();

    // Assert
    expect(window.alert).toHaveBeenCalledWith(
      'All chapters have been processed. Please check the extension logs for any errors or warnings.',
    );
  });
});
