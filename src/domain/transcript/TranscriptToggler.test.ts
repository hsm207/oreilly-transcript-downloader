import { describe, it, beforeEach, beforeAll, afterAll, expect, vi, afterEach } from 'vitest';
import { TranscriptToggler } from './TranscriptToggler';
import { waitForElement } from '../../infrastructure/DomUtils';

// Mock the DomUtils module to control waitForElement
vi.mock('../../infrastructure/DomUtils', () => ({
  waitForElement: vi.fn(),
}));

// Suppress unhandled promise rejections during error-case tests
beforeAll(() => {
  process.on('unhandledRejection', () => {});
});
afterAll(() => {
  process.removeAllListeners('unhandledRejection');
});

// Mock chrome.runtime.sendMessage for PersistentLogger
beforeAll(() => {
  // Mock chrome.runtime.sendMessage for PersistentLogger
  global.chrome = {
    runtime: {
      sendMessage: vi.fn(),
    },
  } as any;
});

// Constants from TranscriptToggler for testing purposes
const CONTENT_LOAD_TIMEOUT_MS = 10000;
const CONTENT_POLL_INTERVAL_MS = 500;
const LOADER_SELECTOR = '[data-testid="loader-container"]';

/**
 * Unit tests for TranscriptToggler domain service.
 */
describe('TranscriptToggler', () => {
  let toggler: TranscriptToggler;
  const MOCK_TRANSCRIPT_CONTAINER_SELECTOR = '#transcript-body';

  const createButton = (id: string, ariaLabel: string): HTMLButtonElement => {
    const btn = document.createElement('button');
    btn.id = id;
    btn.setAttribute('data-testid', 'transcript-toggle');
    btn.setAttribute('aria-label', ariaLabel);
    document.body.appendChild(btn);
    return btn;
  };

  const createMockContainer = (id: string, withLoaderInitially = false) => {
    const div = document.createElement('div');
    div.id = id;
    // Actual loader element for querySelector to find/not find
    if (withLoaderInitially) {
      const loaderElement = document.createElement('div');
      loaderElement.setAttribute('data-testid', 'loader-container');
      div.appendChild(loaderElement);
    }
    document.body.appendChild(div);
    return div;
  };

  beforeEach(() => {
    document.body.innerHTML = ''; // Clear previous DOM elements
    vi.clearAllMocks(); // Clear mocks before each test
    vi.useFakeTimers(); // Use fake timers for controlling setTimeout
    toggler = new TranscriptToggler();
  });

  afterEach(() => {
    vi.restoreAllMocks(); // Restore original implementations
    vi.useRealTimers(); // Restore real timers
    document.body.innerHTML = ''; // Clean up DOM
  });

  it('should throw an error if toggleElement is not an HTMLButtonElement', async () => {
    const divElement = document.createElement('div');

    // Create a variable to hold the caught error
    let capturedError: Error | undefined;

    // Start the method call and immediately attach a catch handler to prevent unhandled rejection
    const promise = toggler
      .ensureContentVisible(divElement, MOCK_TRANSCRIPT_CONTAINER_SELECTOR)
      .catch((e: Error) => {
        capturedError = e;
        // Re-throw to ensure the await below still "fails"
        throw e;
      });

    // Try to await the promise - it should fail
    try {
      await promise;
      expect.fail('Expected function to throw an error');
    } catch (e) {
      // We should already have the error from the .catch() handler
      expect(capturedError).toBeDefined();
      expect(capturedError?.message).toBe(
        '[TranscriptToggler] Provided toggleElement is not an HTMLButtonElement.',
      );
    }
  });

  it('should click the toggle button if aria-label is "Show Transcript" and container appears', async () => {
    const button = createButton('btn-show', 'Show Transcript');
    const clickSpy = vi.spyOn(button, 'click');
    const mockContainer = createMockContainer('transcript-body'); // No loader
    (waitForElement as ReturnType<typeof vi.fn>).mockResolvedValue(mockContainer);

    const resultPromise = toggler.ensureContentVisible(button, MOCK_TRANSCRIPT_CONTAINER_SELECTOR);
    await vi.advanceTimersByTimeAsync(CONTENT_POLL_INTERVAL_MS); // Allow microtasks and short waits to resolve

    const result = await resultPromise;
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(waitForElement).toHaveBeenCalledWith(MOCK_TRANSCRIPT_CONTAINER_SELECTOR, 5000);
    expect(result).toBe(mockContainer);
  });

  it('should click the toggle button if aria-label contains "open" and container appears', async () => {
    const button = createButton('btn-open', 'Please open the transcript');
    const clickSpy = vi.spyOn(button, 'click');
    const mockContainer = createMockContainer('transcript-body'); // No loader
    (waitForElement as ReturnType<typeof vi.fn>).mockResolvedValue(mockContainer);

    const resultPromise = toggler.ensureContentVisible(button, MOCK_TRANSCRIPT_CONTAINER_SELECTOR);
    await vi.advanceTimersByTimeAsync(CONTENT_POLL_INTERVAL_MS);

    const result = await resultPromise;
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(waitForElement).toHaveBeenCalledWith(MOCK_TRANSCRIPT_CONTAINER_SELECTOR, 5000);
    expect(result).toBe(mockContainer);
  });

  it('should not click the toggle button if aria-label is "Hide Transcript" and container is present', async () => {
    const button = createButton('btn-hide', 'Hide Transcript');
    const clickSpy = vi.spyOn(button, 'click');
    const mockContainer = createMockContainer('transcript-body'); // No loader
    (waitForElement as ReturnType<typeof vi.fn>).mockResolvedValue(mockContainer);

    const resultPromise = toggler.ensureContentVisible(button, MOCK_TRANSCRIPT_CONTAINER_SELECTOR);
    await vi.advanceTimersByTimeAsync(CONTENT_POLL_INTERVAL_MS);

    const result = await resultPromise;
    expect(clickSpy).not.toHaveBeenCalled();
    expect(waitForElement).toHaveBeenCalledWith(MOCK_TRANSCRIPT_CONTAINER_SELECTOR, 5000);
    expect(result).toBe(mockContainer);
  });

  it('should throw error if container does not appear after clicking button', async () => {
    const button = createButton('btn-show-fail', 'Show Transcript');
    (waitForElement as ReturnType<typeof vi.fn>).mockResolvedValue(null); // Simulate container not found

    // Create a variable to hold the caught error
    let capturedError: Error | undefined;

    // Start the method call and immediately attach a catch handler to prevent unhandled rejection
    const promise = toggler
      .ensureContentVisible(button, MOCK_TRANSCRIPT_CONTAINER_SELECTOR)
      .catch((e: Error) => {
        capturedError = e;
        // Re-throw to ensure the await below still "fails"
        throw e;
      });

    // Advance timer to resolve the waitForElement promise
    await vi.advanceTimersByTimeAsync(200); // UI transition delay

    // Try to await the promise - it should fail
    try {
      await promise;
      expect.fail('Expected function to throw an error');
    } catch (e) {
      // We should already have the error from the .catch() handler
      expect(capturedError).toBeDefined();
      expect(capturedError?.message).toBe(
        `[TranscriptToggler] Transcript container ('${MOCK_TRANSCRIPT_CONTAINER_SELECTOR}') did not appear after clicking toggle.`,
      );
    }

    expect(waitForElement).toHaveBeenCalledWith(MOCK_TRANSCRIPT_CONTAINER_SELECTOR, 5000);
  });

  it('should throw error if button indicates visible but container does not appear', async () => {
    const button = createButton('btn-hide-fail', 'Hide Transcript');
    (waitForElement as ReturnType<typeof vi.fn>).mockResolvedValue(null); // Simulate container not found

    // Create a variable to hold the caught error
    let capturedError: Error | undefined;

    // Start the method call and immediately attach a catch handler to prevent unhandled rejection
    const promise = toggler
      .ensureContentVisible(button, MOCK_TRANSCRIPT_CONTAINER_SELECTOR)
      .catch((e: Error) => {
        capturedError = e;
        // Re-throw to ensure the await below still "fails"
        throw e;
      });

    // Advance timer to resolve the waitForElement promise
    await vi.advanceTimersByTimeAsync(200);

    // Try to await the promise - it should fail
    try {
      await promise;
      expect.fail('Expected function to throw an error');
    } catch (e) {
      // We should already have the error from the .catch() handler
      expect(capturedError).toBeDefined();
      expect(capturedError?.message).toBe(
        `[TranscriptToggler] Transcript container ('${MOCK_TRANSCRIPT_CONTAINER_SELECTOR}') did not appear even though toggle indicated visible.`,
      );
    }

    expect(waitForElement).toHaveBeenCalledWith(MOCK_TRANSCRIPT_CONTAINER_SELECTOR, 5000);
  });

  describe('waitForContentToLoad logic (tested via ensureContentVisible)', () => {
    let button: HTMLButtonElement;
    let mockContainerElement: HTMLElement;
    let querySelectorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      button = createButton('btn-default', 'Hide Transcript'); // Aria-label that doesn't cause a click
      mockContainerElement = document.createElement('div'); // Create a fresh mock for each sub-test
      // We will spy on querySelector of the specific mockContainerElement instance
      // returned by waitForElement mock.
      (waitForElement as ReturnType<typeof vi.fn>).mockImplementation(async (selector) => {
        if (selector === MOCK_TRANSCRIPT_CONTAINER_SELECTOR) {
          // querySelectorSpy needs to be set up *on this specific element*
          // before it's returned by waitForElement.
          // If the element is created here, the spy must be attached here too.
          // For simplicity, we'll create it outside and mock its querySelector.
          return mockContainerElement;
        }
        return null;
      });
    });

    it('should resolve if loader disappears within timeout', async () => {
      const loaderElement = document.createElement('div');
      loaderElement.setAttribute('data-testid', 'loader-container');

      // Setup spy on the specific mockContainerElement instance
      querySelectorSpy = vi.spyOn(mockContainerElement, 'querySelector');

      // First call finds loader, subsequent calls find nothing
      querySelectorSpy
        .mockReturnValueOnce(loaderElement) // Found on first check
        .mockReturnValueOnce(loaderElement) // Found on second check (after 1st poll)
        .mockReturnValue(null); // Disappears

      const promise = toggler.ensureContentVisible(button, MOCK_TRANSCRIPT_CONTAINER_SELECTOR);

      // Advance time by poll interval twice for the loader to be checked and then disappear
      await vi.advanceTimersByTimeAsync(CONTENT_POLL_INTERVAL_MS); // First poll
      await vi.advanceTimersByTimeAsync(CONTENT_POLL_INTERVAL_MS); // Second poll, loader gone

      await expect(promise).resolves.toBe(mockContainerElement);
      expect(querySelectorSpy).toHaveBeenCalledWith(LOADER_SELECTOR);
      // Expected calls: initial check, 1st poll check, 2nd poll check (finds null)
      expect(querySelectorSpy).toHaveBeenCalledTimes(3);
    });

    it('should throw error if loader does not disappear within timeout', async () => {
      const loaderElement = document.createElement('div');
      loaderElement.setAttribute('data-testid', 'loader-container');
      mockContainerElement.appendChild(loaderElement); // Add loader that will persist

      // querySelector will always find the loader
      querySelectorSpy = vi
        .spyOn(mockContainerElement, 'querySelector')
        .mockReturnValue(loaderElement);

      // Create a variable to hold the caught error
      let capturedError: Error | undefined;

      // Start the method call and immediately attach a catch handler to prevent unhandled rejection
      const promise = toggler
        .ensureContentVisible(button, MOCK_TRANSCRIPT_CONTAINER_SELECTOR)
        .catch((e: Error) => {
          capturedError = e;
          // Re-throw to ensure the await below still "fails"
          throw e;
        });

      // Advance time just beyond the timeout
      await vi.advanceTimersByTimeAsync(CONTENT_LOAD_TIMEOUT_MS + CONTENT_POLL_INTERVAL_MS);

      // Try to await the promise - it should fail
      try {
        await promise;
        expect.fail('Expected function to throw an error');
      } catch (e) {
        // We should already have the error from the .catch() handler
        expect(capturedError).toBeDefined();
        expect(capturedError?.message).toBe(
          `[TranscriptToggler] Content in transcript container did not load within ${CONTENT_LOAD_TIMEOUT_MS / 1000}s (loader '${LOADER_SELECTOR}' still present).`,
        );
      }

      expect(querySelectorSpy).toHaveBeenCalledWith(LOADER_SELECTOR);
      // Check it polled multiple times
      expect(querySelectorSpy.mock.calls.length).toBeGreaterThan(
        CONTENT_LOAD_TIMEOUT_MS / CONTENT_POLL_INTERVAL_MS,
      );
    });

    it('should resolve quickly if no loader is present initially', async () => {
      // querySelector will find no loader
      querySelectorSpy = vi.spyOn(mockContainerElement, 'querySelector').mockReturnValue(null);

      const promise = toggler.ensureContentVisible(button, MOCK_TRANSCRIPT_CONTAINER_SELECTOR);
      // Only need to advance timers enough for the initial check if any async operations are involved
      // before the loader check. In this case, waitForElement is async.
      await vi.advanceTimersByTimeAsync(1); // Minimal advance for promise resolution

      await expect(promise).resolves.toBe(mockContainerElement);
      expect(querySelectorSpy).toHaveBeenCalledWith(LOADER_SELECTOR);
      expect(querySelectorSpy).toHaveBeenCalledTimes(1); // Only one check needed
    });
  });
});
