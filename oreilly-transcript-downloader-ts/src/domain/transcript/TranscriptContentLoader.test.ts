import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TranscriptContentLoader } from './TranscriptContentLoader';

describe('TranscriptContentLoader', () => {
  let loader: TranscriptContentLoader;
  let mockElement: HTMLElement;

  beforeEach(() => {
    // Create a new instance for each test
    loader = new TranscriptContentLoader();

    // Create a mock transcript container
    mockElement = document.createElement('div');

    // Spy on console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Use fake timers for setTimeout control
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.useRealTimers();
  });

  it('should detect when content has loaded', async () => {
    // Set up initial state with loaders
    mockElement.innerHTML = `
      <div class="MuiSkeleton-root"></div>
      <div data-testid="loader-container"></div>
    `;

    // Start the loading check process with a short timeout
    // We need to capture the Promise but not await it yet
    const loadPromise = loader.waitForContentToLoad(mockElement, {
      maxRetries: 3,
      logPrefix: '[TEST]',
    });

    // After first check, content still loading (advance 500ms)
    vi.advanceTimersByTime(500);

    // Update DOM to simulate content loading
    mockElement.innerHTML = `
      <p>First paragraph of content</p>
      <p>Second paragraph of content</p>
    `;

    // Complete all pending promise callbacks
    vi.runAllTimers();

    // Now we can await the Promise that was started earlier
    const result = await loadPromise;
    expect(result).toBe(true);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Content loaded'));
  });

  it('should return false when content does not load within timeout', async () => {
    // Set up state with loaders that never disappear
    mockElement.innerHTML = `
      <div class="MuiSkeleton-root"></div>
      <div data-testid="loader-container"></div>
    `;

    // Start the loading check with a short timeout
    const loadPromise = loader.waitForContentToLoad(mockElement, {
      maxRetries: 2,
      retryDelayMs: 500,
    });

    // Fast-forward through all retry attempts
    await vi.advanceTimersByTimeAsync(1000); // 2 attempts * 500ms

    // Verify timeout behavior
    const result = await loadPromise;
    expect(result).toBe(false);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Content did not load'));
  });

  it('should immediately detect content if already loaded', async () => {
    // Set up state with content already loaded
    mockElement.innerHTML = `
      <p>Content is already here</p>
      <p>No loaders in sight</p>
    `;

    // Start the loading check
    const loadPromise = loader.waitForContentToLoad(mockElement);

    // Fast-forward a tiny bit to let the first check complete
    await vi.advanceTimersByTimeAsync(10);

    // Verify immediate success
    const result = await loadPromise;
    expect(result).toBe(true);
  });

  it('should ignore empty container with no paragraphs', async () => {
    // Set up state with no loaders but also no meaningful content
    mockElement.innerHTML = `
      <div>Empty div with no paragraphs</div>
    `;

    // Start the loading check process with minimal retries
    const loadPromise = loader.waitForContentToLoad(mockElement, { maxRetries: 1 });

    // Fast-forward through the attempt
    await vi.advanceTimersByTimeAsync(500);

    // Verify result
    const result = await loadPromise;
    expect(result).toBe(false);
  });
});
