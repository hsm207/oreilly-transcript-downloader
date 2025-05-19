/**
 * @file Domain service for ensuring the Table of Contents (TOC) is visible in the UI.
 *
 * Follows SOLID and DDD principles. Ensures the TOC is visible by toggling the button if needed.
 */

export class TocToggler {
  /**
   * Ensures the Table of Contents (TOC) is visible by toggling the button if needed.
   * Does nothing if the button is not found or already visible.
   */
  ensureTocVisible(): void {
    const button = document.querySelector<HTMLButtonElement>(
      'button[data-testid="table-of-contents-button"]',
    );
    if (!button) return;
    if (button.getAttribute('aria-expanded') !== 'true') {
      button.click();
    }
  }
}
