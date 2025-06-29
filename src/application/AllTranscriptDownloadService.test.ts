import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { AllTranscriptDownloadService } from './AllTranscriptDownloadService';
import { TocExtractor } from '../domain/extraction/TocExtractor';
import { IToggler } from '../domain/common/IToggler';

describe('AllTranscriptDownloadService', () => {
  // Mock dependencies
  let mockTocExtractor: TocExtractor;
  let mockExtractTranscript: (el: HTMLElement) => string;
  let mockFileDownloader: { downloadFile: (filename: string, content: string) => void };
  let mockWaitForElement: (selector: string, timeout?: number) => Promise<Element | null>;
  let mockTranscriptEnsurer: IToggler;

  let mockNavigate: (url: string) => Promise<void>;
  let mockTocEnsurer: {
    ensureContentVisible: (el: HTMLElement, selector: string) => Promise<void>;
  };
  let mockOnError: (error: unknown) => void;
  let mockLogger: any;

  // Ensure 'service' is declared before use
  let service: AllTranscriptDownloadService;

  // Mock HTML Element
  const createMockElement = () => {
    const element = document.createElement('div');
    return element;
  };

  beforeAll(() => {
    // Mock chrome.runtime.sendMessage for PersistentLogger
    global.chrome = {
      runtime: {
        sendMessage: vi.fn(),
      },
    } as any;
  });

  beforeEach(() => {
    // Setup mocks
    mockTocExtractor = { extractItems: vi.fn() } as unknown as TocExtractor;
    // Use a synchronous mock for extractTranscript to match the expected type
    mockExtractTranscript = vi.fn((el: HTMLElement) => 'Test transcript');
    mockFileDownloader = { downloadFile: vi.fn() };
    mockWaitForElement = vi.fn().mockResolvedValue(createMockElement());
    // IToggler mock must return Promise<Element>
    mockTranscriptEnsurer = {
      ensureContentVisible: vi.fn(async (el: HTMLElement, selector: string): Promise<Element> => {
        // Simulate visibility logic
        return el;
      }),
    } as IToggler;
    mockNavigate = vi.fn().mockResolvedValue(undefined);
    mockOnError = vi.fn();
    mockTocEnsurer = { ensureContentVisible: vi.fn().mockResolvedValue(createMockElement()) };
    // Use async mock functions for logger methods
    mockLogger = {
      info: vi.fn(async () => {}),
      warn: vi.fn(async () => {}),
      error: vi.fn(async () => {}),
      debug: vi.fn(async () => {}),
      log: vi.fn(async () => {}),
    };
    // Mock document.title for getSafePageTitle
    Object.defineProperty(document, 'title', {
      value: 'Test Video Title',
      writable: true,
    });
    // Create service instance with mocks
    service = new AllTranscriptDownloadService(
      mockTocExtractor, // TocExtractor
      mockExtractTranscript, // (el: HTMLElement) => string
      mockFileDownloader, // { downloadFile: ... }
      mockWaitForElement, // (selector: string, timeout?: number) => Promise<Element | null>
      mockTranscriptEnsurer, // IToggler (ensureContentVisible returns Promise<Element>)
      vi.fn(async (url: string) => {}), // navigate
      {} as any, // tocEnsurer (mocked as any)
      mockLogger, // PersistentLogger
    );
  });

  describe('downloadSingleTranscript', () => {
    it('should successfully download a transcript', async () => {
      // Act
      await service.downloadSingleTranscript(mockOnError);

      // Assert
      expect(mockWaitForElement).toHaveBeenCalledWith('[data-testid="transcript-toggle"]', 10000);
      expect(mockTranscriptEnsurer.ensureContentVisible).toHaveBeenCalled();
      expect(mockExtractTranscript).toHaveBeenCalled();
      expect(mockFileDownloader.downloadFile).toHaveBeenCalledWith(
        'Test_Video_Title.txt',
        'Test transcript',
      );
      expect(mockOnError).not.toHaveBeenCalled();
    });
  });

  describe('resumeDownloadAllTranscriptsIfNeeded', () => {
    let mockStateRepo: any;
    let mockOnComplete: () => void;
    let mockOnErrorResume: (error: unknown, title: string) => void;
    let extractAndDownloadTranscriptSpy: any;

    beforeEach(() => {
      mockStateRepo = {
        load: vi.fn(),
        save: vi.fn(),
        clear: vi.fn(),
      };
      mockOnComplete = vi.fn();
      mockOnErrorResume = vi.fn();

      // Spy on the private method extractAndDownloadTranscript
      // Default behavior will be set per-test or will call original if not mocked.
      extractAndDownloadTranscriptSpy = vi.spyOn(service as any, 'extractAndDownloadTranscript');

      // Mock window.location.href for navigation
      // @ts-ignore
      delete window.location;
      // @ts-ignore
      window.location = { href: '' };
    });

    it('should process the current transcript and navigate to the next if not completed', async () => {
      const tocItems = [
        { title: 'Video 1', href: 'http://example.com/video1' },
        { title: 'Video 2', href: 'http://example.com/video2' },
      ];
      const currentState = { tocItems, currentIndex: 0 };
      mockStateRepo.load.mockReturnValue(currentState);
      extractAndDownloadTranscriptSpy.mockImplementation(
        async (options: { filename: string; logPrefix: string }) => {
          mockFileDownloader.downloadFile(options.filename, 'Mock transcript content');
          return { success: true };
        },
      );

      vi.useFakeTimers();

      // Start the operation but don't await it immediately
      const resumePromise = service.resumeDownloadAllTranscriptsIfNeeded(
        mockStateRepo,
        mockOnComplete,
        mockOnErrorResume,
      );

      // Advance timers for the internal 1000ms delay in processCurrentTranscript (downloadDelayMs)
      await vi.advanceTimersByTimeAsync(1000);

      // Now, await the main promise
      await resumePromise;

      expect(mockStateRepo.load).toHaveBeenCalledTimes(1);
      expect(extractAndDownloadTranscriptSpy).toHaveBeenCalledWith({
        filename: `${tocItems[0].title}.txt`,
        logPrefix: `[AllTranscriptDownloadService: ${tocItems[0].title}]`,
      });
      expect(mockFileDownloader.downloadFile).toHaveBeenCalledWith(
        `${tocItems[0].title}.txt`,
        'Mock transcript content',
      );
      expect(mockStateRepo.save).toHaveBeenCalledWith({ tocItems, currentIndex: 1 });

      await vi.advanceTimersByTimeAsync(1000); // Advance timer for navigation setTimeout

      expect(window.location.href).toBe(tocItems[1].href); // Check navigation
      expect(mockOnComplete).not.toHaveBeenCalled();
      expect(mockStateRepo.clear).not.toHaveBeenCalled();
      expect(mockOnErrorResume).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should call onComplete and clear state if all transcripts are processed', async () => {
      const tocItems = [{ title: 'Video 1', href: 'http://example.com/video1' }];
      const currentState = { tocItems, currentIndex: 0 }; // Current index is the last item
      mockStateRepo.load.mockReturnValue(currentState);
      extractAndDownloadTranscriptSpy.mockImplementation(
        async (options: { filename: string; logPrefix: string }) => {
          mockFileDownloader.downloadFile(options.filename, 'Mock transcript content');
          return { success: true };
        },
      );

      vi.useFakeTimers();

      // Start the operation
      const resumePromise = service.resumeDownloadAllTranscriptsIfNeeded(
        mockStateRepo,
        mockOnComplete,
        mockOnErrorResume,
      );

      // Advance timers for the internal 1000ms delay in processCurrentTranscript (downloadDelayMs)
      await vi.advanceTimersByTimeAsync(1000);

      // Await the main promise
      await resumePromise;

      expect(mockStateRepo.load).toHaveBeenCalledTimes(1);
      expect(extractAndDownloadTranscriptSpy).toHaveBeenCalledWith({
        filename: `${tocItems[0].title}.txt`,
        logPrefix: `[AllTranscriptDownloadService: ${tocItems[0].title}]`,
      });
      expect(mockFileDownloader.downloadFile).toHaveBeenCalledWith(
        `${tocItems[0].title}.txt`,
        'Mock transcript content',
      );
      expect(mockStateRepo.save).not.toHaveBeenCalled();
      // stateRepo.clear() is called synchronously in this path
      expect(mockStateRepo.clear).toHaveBeenCalledTimes(1);

      // Advance timer for the onComplete setTimeout (500ms)
      await vi.advanceTimersByTimeAsync(500);

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
      expect(window.location.href).toBe('');
      expect(mockOnErrorResume).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should do nothing if no state is found', async () => {
      mockStateRepo.load.mockReturnValue(null);

      await service.resumeDownloadAllTranscriptsIfNeeded(
        mockStateRepo,
        mockOnComplete,
        mockOnErrorResume,
      );

      expect(mockStateRepo.load).toHaveBeenCalledTimes(1);
      // extractAndDownloadTranscriptSpy should not have been called if no state
      expect(extractAndDownloadTranscriptSpy).not.toHaveBeenCalled();
      expect(mockStateRepo.save).not.toHaveBeenCalled();
      expect(mockOnComplete).not.toHaveBeenCalled();
      expect(mockStateRepo.clear).not.toHaveBeenCalled();
      expect(mockOnErrorResume).not.toHaveBeenCalled();
    });

    // Add a test for the 'skipped' case
    it('should handle skipped transcript and navigate to the next', async () => {
      const tocItems = [
        { title: 'Video 1 (skip)', href: 'http://example.com/video1skip' },
        { title: 'Video 2 (next)', href: 'http://example.com/video2next' },
      ];
      const currentState = { tocItems, currentIndex: 0 };
      mockStateRepo.load.mockReturnValue(currentState);
      // Simulate skipped, success: false means downloadFile is not called by extractAndDownloadTranscript
      extractAndDownloadTranscriptSpy.mockResolvedValue({ success: false });

      vi.useFakeTimers();

      await service.resumeDownloadAllTranscriptsIfNeeded(
        mockStateRepo,
        mockOnComplete,
        mockOnErrorResume,
      );

      expect(mockStateRepo.load).toHaveBeenCalledTimes(1);
      expect(extractAndDownloadTranscriptSpy).toHaveBeenCalledWith({
        filename: `${tocItems[0].title}.txt`,
        logPrefix: `[AllTranscriptDownloadService: ${tocItems[0].title}]`,
      });
      expect(mockFileDownloader.downloadFile).not.toHaveBeenCalledWith(
        // Ensure download was not called for skipped
        `${tocItems[0].title}.txt`,
        'Mock transcript content',
      );
      expect(mockStateRepo.save).toHaveBeenCalledWith({ tocItems, currentIndex: 1 }); // Still save and move to next

      await vi.advanceTimersByTimeAsync(1000);

      expect(window.location.href).toBe(tocItems[1].href);
      expect(mockOnComplete).not.toHaveBeenCalled();
      expect(mockOnErrorResume).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    // // Add a test for the 'error' case in processCurrentTranscript
    // it('should clear state and call onError if processCurrentTranscript returns error', async () => {
    //   const tocItems = [{ title: 'Video Error', href: 'http://example.com/videoerror' }];
    //   const currentState = { tocItems, currentIndex: 0 };
    //   mockStateRepo.load.mockReturnValue(currentState);
    //   const testError = new Error('Processing failed');
    //   // Simulate an error during transcript extraction/download
    //   extractAndDownloadTranscriptSpy.mockRejectedValue(testError);

    //   await service.resumeDownloadAllTranscriptsIfNeeded(mockStateRepo, mockOnComplete, mockOnErrorResume);

    //   expect(mockStateRepo.load).toHaveBeenCalledTimes(1);
    //   expect(extractAndDownloadTranscriptSpy).toHaveBeenCalledWith({
    //     filename: `${tocItems[0].title}.txt`,
    //     logPrefix: `[AllTranscriptDownloadService: ${tocItems[0].title}]`,
    //   });
    //   // If processCurrentTranscript catches the error and returns 'error',
    //   // then resumeDownloadAllTranscriptsIfNeeded should call clear once.
    //   expect(mockStateRepo.clear).toHaveBeenCalledTimes(1);
    //   expect(mockOnErrorResume).toHaveBeenCalledWith(new Error('Download stopped.'), tocItems[0].title);
    //   expect(mockStateRepo.save).not.toHaveBeenCalled();
    //   expect(mockOnComplete).not.toHaveBeenCalled();
    // });
  });
});
