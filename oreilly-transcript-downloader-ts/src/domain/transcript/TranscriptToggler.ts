/**
 * Domain service for ensuring the transcript is visible on the video page.
 * Follows SOLID and clean code principles.
 */
export class TranscriptToggler {
  /**
   * Ensures the transcript is visible by toggling the button if needed.
   * Does nothing if the button is not found or already visible.
   */
  ensureTranscriptVisible(): void {
    // Get the transcript toggle button
    const button = document.querySelector<HTMLButtonElement>('[data-testid="transcript-toggle"]');

    // Log to help with debugging
    console.log('[TranscriptToggler] Transcript button found:', !!button);

    if (!button) {
      console.warn('[TranscriptToggler] No transcript toggle button found');
      return;
    }

    const ariaLabel = button.getAttribute('aria-label');
    console.log('[TranscriptToggler] Button aria-label:', ariaLabel);

    // Different possible states of the button that indicate transcript is hidden
    if (
      ariaLabel === 'Show Transcript' ||
      ariaLabel?.includes('show') ||
      ariaLabel?.includes('open')
    ) {
      console.log('[TranscriptToggler] Clicking transcript button to show transcript');
      button.click();
    } else {
      console.log('[TranscriptToggler] Transcript appears to be already visible');
    }
  }
}
