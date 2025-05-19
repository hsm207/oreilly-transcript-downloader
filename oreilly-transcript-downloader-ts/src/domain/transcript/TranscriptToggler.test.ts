import { describe, it, beforeEach, expect, vi, afterEach } from 'vitest';
import { TranscriptToggler } from './TranscriptToggler';
import { waitForElement } from '../../infrastructure/DomUtils';

// Mock the DomUtils module to control waitForElement
vi.mock('../../infrastructure/DomUtils', () => ({
  waitForElement: vi.fn(),
}));

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

  const createContainer = (id: string) => {
    const div = document.createElement('div');
    div.id = id;
    document.body.appendChild(div);
    return div;
  };

  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks(); // Clear mocks before each test
    toggler = new TranscriptToggler();
  });

  it('should throw an error if toggleElement is not an HTMLButtonElement', async () => {
    const divElement = document.createElement('div');
    await expect(
      toggler.ensureContentVisible(divElement, MOCK_TRANSCRIPT_CONTAINER_SELECTOR),
    ).rejects.toThrow('[TranscriptToggler] Provided toggleElement is not an HTMLButtonElement.');
  });

  it('should click the toggle button if aria-label is "Show Transcript" and container appears', async () => {
    const button = createButton('btn-show', 'Show Transcript');
    const clickSpy = vi.spyOn(button, 'click');
    (waitForElement as ReturnType<typeof vi.fn>).mockImplementation(async (selector) => {
      if (selector === MOCK_TRANSCRIPT_CONTAINER_SELECTOR)
        return createContainer('transcript-body');
      return null;
    });

    await toggler.ensureContentVisible(button, MOCK_TRANSCRIPT_CONTAINER_SELECTOR);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(waitForElement).toHaveBeenCalledWith(MOCK_TRANSCRIPT_CONTAINER_SELECTOR, 5000);
  });

  it('should click the toggle button if aria-label contains "open" and container appears', async () => {
    const button = createButton('btn-open', 'Please open the transcript');
    const clickSpy = vi.spyOn(button, 'click');
    (waitForElement as ReturnType<typeof vi.fn>).mockResolvedValue(
      createContainer('transcript-body'),
    );

    await toggler.ensureContentVisible(button, MOCK_TRANSCRIPT_CONTAINER_SELECTOR);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(waitForElement).toHaveBeenCalledWith(MOCK_TRANSCRIPT_CONTAINER_SELECTOR, 5000);
  });

  it('should not click the toggle button if aria-label is "Hide Transcript" and container is present', async () => {
    const button = createButton('btn-hide', 'Hide Transcript');
    const clickSpy = vi.spyOn(button, 'click');
    (waitForElement as ReturnType<typeof vi.fn>).mockResolvedValue(
      createContainer('transcript-body'),
    );

    await toggler.ensureContentVisible(button, MOCK_TRANSCRIPT_CONTAINER_SELECTOR);
    expect(clickSpy).not.toHaveBeenCalled();
    expect(waitForElement).toHaveBeenCalledWith(MOCK_TRANSCRIPT_CONTAINER_SELECTOR, 5000);
  });

  it('should throw error if container does not appear after clicking button', async () => {
    const button = createButton('btn-show-fail', 'Show Transcript');
    (waitForElement as ReturnType<typeof vi.fn>).mockResolvedValue(null); // Simulate container not found

    await expect(
      toggler.ensureContentVisible(button, MOCK_TRANSCRIPT_CONTAINER_SELECTOR),
    ).rejects.toThrow(
      `[TranscriptToggler] Transcript container ('${MOCK_TRANSCRIPT_CONTAINER_SELECTOR}') did not appear after clicking toggle.`,
    );
    expect(waitForElement).toHaveBeenCalledWith(MOCK_TRANSCRIPT_CONTAINER_SELECTOR, 5000);
  });

  it('should throw error if button indicates visible but container does not appear', async () => {
    const button = createButton('btn-hide-fail', 'Hide Transcript');
    (waitForElement as ReturnType<typeof vi.fn>).mockResolvedValue(null); // Simulate container not found

    await expect(
      toggler.ensureContentVisible(button, MOCK_TRANSCRIPT_CONTAINER_SELECTOR),
    ).rejects.toThrow(
      `[TranscriptToggler] Transcript container ('${MOCK_TRANSCRIPT_CONTAINER_SELECTOR}') did not appear even though toggle indicated visible.`,
    );
    expect(waitForElement).toHaveBeenCalledWith(MOCK_TRANSCRIPT_CONTAINER_SELECTOR, 5000);
  });
});
