/**
 * @file Tests for the TocToggler domain service.
 */

import { TocToggler } from './TocToggler';
import { describe, it, beforeEach, expect, vi, afterEach } from 'vitest';
import { waitForElement } from '../../infrastructure/DomUtils'; // Import to allow casting for mock

// Mock the DomUtils module
vi.mock('../../infrastructure/DomUtils', () => ({
  waitForElement: vi.fn(),
}));

// Minimal button HTML for both states
const hiddenButtonHtml = (id = 'toc-button') =>
  `<button id="${id}" aria-expanded="false" data-testid="table-of-contents-button">Toggle TOC</button>`;
const visibleButtonHtml = (id = 'toc-button') =>
  `<button id="${id}" aria-expanded="true" data-testid="table-of-contents-button">Toggle TOC</button>`;

const tocContainerHtml = (id = 'toc-container') => `<ol id="${id}" data-testid="tocItems"></ol>`;

describe('TocToggler', () => {
  let toggler: TocToggler;
  const MOCK_TOC_CONTAINER_SELECTOR = '#toc-container';

  beforeEach(() => {
    document.body.innerHTML = ''; // Clear body for each test
    // Reset mocks before each test if they are not reset globally by Vitest config
    vi.clearAllMocks(); // Ensures waitForElement mock is clean for each test
    toggler = new TocToggler(); // Constructor no longer takes arguments
  });

  afterEach(() => {
    // vi.restoreAllMocks(); // Can be used if vi.clearAllMocks() is not sufficient or if other mocks are involved
  });

  it('should throw an error if toggleElement is not a HTMLButtonElement', async () => {
    const divElement = document.createElement('div');
    await expect(
      toggler.ensureContentVisible(divElement, MOCK_TOC_CONTAINER_SELECTOR),
    ).rejects.toThrow('Provided toggleElement is not a HTMLButtonElement for TocToggler.');
  });

  it('should click the button if TOC is hidden and TOC container appears', async () => {
    document.body.innerHTML = hiddenButtonHtml('test-button');
    const button = document.getElementById('test-button') as HTMLButtonElement;
    const clickSpy = vi.spyOn(button, 'click');

    // Simulate TOC container appearing after click
    const container = document.createElement('ol');
    container.id = 'toc-container';
    container.setAttribute('data-testid', 'tocItems');
    (waitForElement as ReturnType<typeof vi.fn>).mockImplementation(async (selector: string) => {
      if (selector === MOCK_TOC_CONTAINER_SELECTOR) {
        document.body.appendChild(container);
        return container;
      }
      return null;
    });

    const result = await toggler.ensureContentVisible(button, MOCK_TOC_CONTAINER_SELECTOR);

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(waitForElement).toHaveBeenCalledWith(MOCK_TOC_CONTAINER_SELECTOR, 5000);
    expect(result).toBe(container);
  });

  it('should not click the button if TOC is already visible and TOC container is present', async () => {
    document.body.innerHTML = visibleButtonHtml('test-button') + tocContainerHtml('toc-container');
    const button = document.getElementById('test-button') as HTMLButtonElement;
    const clickSpy = vi.spyOn(button, 'click');

    // Simulate TOC container already being present
    const container = document.getElementById('toc-container');
    (waitForElement as ReturnType<typeof vi.fn>).mockResolvedValue(container);

    const result = await toggler.ensureContentVisible(button, MOCK_TOC_CONTAINER_SELECTOR);

    expect(clickSpy).not.toHaveBeenCalled();
    expect(waitForElement).toHaveBeenCalledWith(MOCK_TOC_CONTAINER_SELECTOR, 5000);
    expect(result).toBe(container);
  });

  it('should throw an error if TOC container does not appear after clicking hidden button', async () => {
    document.body.innerHTML = hiddenButtonHtml('test-button');
    const button = document.getElementById('test-button') as HTMLButtonElement;

    // Simulate TOC container NOT appearing
    (waitForElement as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(toggler.ensureContentVisible(button, MOCK_TOC_CONTAINER_SELECTOR)).rejects.toThrow(
      `[TocToggler] TOC container ('${MOCK_TOC_CONTAINER_SELECTOR}') did not appear after toggle action.`,
    );
    expect(waitForElement).toHaveBeenCalledWith(MOCK_TOC_CONTAINER_SELECTOR, 5000);
  });

  it('should throw an error if TOC is already visible but TOC container does not appear (edge case)', async () => {
    document.body.innerHTML = visibleButtonHtml('test-button'); // Button says expanded
    const button = document.getElementById('test-button') as HTMLButtonElement;

    // Simulate TOC container NOT appearing
    (waitForElement as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(toggler.ensureContentVisible(button, MOCK_TOC_CONTAINER_SELECTOR)).rejects.toThrow(
      `[TocToggler] TOC container ('${MOCK_TOC_CONTAINER_SELECTOR}') did not appear after toggle action.`,
    );
    expect(waitForElement).toHaveBeenCalledWith(MOCK_TOC_CONTAINER_SELECTOR, 5000);
  });
});
