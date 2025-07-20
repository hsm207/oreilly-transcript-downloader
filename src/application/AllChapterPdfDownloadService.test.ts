import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AllChapterPdfDownloadService } from './AllChapterPdfDownloadService';
import * as waitModule from '../infrastructure/waitForBookContent';
import * as politeWaitModule from '../infrastructure/politeWait';
import { BookChapterDownloadStateRepository } from '../infrastructure/BookChapterDownloadStateRepository';
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

  it('startDownloadAllChapters should save active state and navigate to the first chapter', async () => {
    // Arrange
    const tocItems = [{ title: 'Chapter 1', href: '/chapter1' }];
    (mockTocExtractor.extractItems as any).mockReturnValue(tocItems);
    const tocRoot = document.createElement('ol');
    tocRoot.setAttribute('data-testid', 'tocItems');
    document.body.appendChild(tocRoot);

    // Act
    await service.startDownloadAllChapters();

    // Assert
    expect(mockStateRepo.save).toHaveBeenCalledWith({ isActive: true });
    expect(mockLocation.href).toBe('http://initial.com/chapter1');
    document.body.removeChild(tocRoot);
  });

  it('resumeDownloadIfNeeded should do nothing if state is not active', async () => {
    // Arrange
    (mockStateRepo.load as any).mockReturnValue(null);

    // Act
    await service.resumeDownloadIfNeeded();

    // Assert
    expect(mockBookChapterPdfService.downloadCurrentChapterAsPdf).not.toHaveBeenCalled();
  });

  it('resumeDownloadIfNeeded should download, wait, and navigate if a next chapter link exists', async () => {
    // Arrange
    (mockStateRepo.load as any).mockReturnValue({ isActive: true });
    const h1 = document.createElement('h1');
    h1.textContent = 'Current Chapter';
    document.body.appendChild(h1);
    const nextContainer = document.createElement('div');
    nextContainer.setAttribute('data-testid', 'statusBarNext');
    const nextLink = document.createElement('a');
    nextLink.href = 'http://initial.com/next-chapter';
    nextContainer.appendChild(nextLink);
    document.body.appendChild(nextContainer);

    // Act
    await service.resumeDownloadIfNeeded();

    // Assert
    expect(mockBookChapterPdfService.downloadCurrentChapterAsPdf).toHaveBeenCalledWith(
      'Current Chapter.pdf',
    );
    expect(politeWaitSpy).toHaveBeenCalled();
    expect(mockLocation.href).toBe('http://initial.com/next-chapter');
    expect(mockStateRepo.clear).not.toHaveBeenCalled();

    // Cleanup
    document.body.removeChild(h1);
    document.body.removeChild(nextContainer);
  });

  it('resumeDownloadIfNeeded should download and clear state if no next chapter link exists', async () => {
    // Arrange
    (mockStateRepo.load as any).mockReturnValue({ isActive: true });
    const h1 = document.createElement('h1');
    h1.textContent = 'Last Chapter';
    document.body.appendChild(h1);

    // Act
    await service.resumeDownloadIfNeeded();

    // Assert
    expect(mockBookChapterPdfService.downloadCurrentChapterAsPdf).toHaveBeenCalledWith(
      'Last Chapter.pdf',
    );
    expect(politeWaitSpy).not.toHaveBeenCalled();
    expect(mockStateRepo.clear).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith(
      'All chapters have been processed. Please check the extension logs for any errors or warnings.',
    );

    // Cleanup
    document.body.removeChild(h1);
  });

  it('should abort and log error if book content does not load in time', async () => {
    // Arrange: mock state exists and waitForBookContent rejects
    (mockStateRepo.load as any).mockReturnValue({ isActive: true });
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
});
