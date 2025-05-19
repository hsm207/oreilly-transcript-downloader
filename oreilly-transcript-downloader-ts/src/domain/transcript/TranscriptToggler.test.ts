import { describe, it, beforeEach, expect, vi } from 'vitest';
import { TranscriptToggler } from './TranscriptToggler';

/**
 * Unit tests for TranscriptToggler domain service.
 */
describe('TranscriptToggler', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should click the toggle button if transcript is hidden', () => {
    document.body.innerHTML = `
      <button data-testid="transcript-toggle" aria-label="Show Transcript"></button>
    `;
    const button = document.querySelector('[data-testid="transcript-toggle"]') as HTMLButtonElement;
    const clickSpy = vi.spyOn(button, 'click');
    const toggler = new TranscriptToggler();
    toggler.ensureTranscriptVisible();
    expect(clickSpy).toHaveBeenCalled();
  });

  it('should not click the toggle button if transcript is already visible', () => {
    document.body.innerHTML = `
      <button data-testid="transcript-toggle" aria-label="Hide Transcript"></button>
    `;
    const button = document.querySelector('[data-testid="transcript-toggle"]') as HTMLButtonElement;
    const clickSpy = vi.spyOn(button, 'click');
    const toggler = new TranscriptToggler();
    toggler.ensureTranscriptVisible();
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('should do nothing if the toggle button is not found', () => {
    const toggler = new TranscriptToggler();
    expect(() => toggler.ensureTranscriptVisible()).not.toThrow();
  });
});
