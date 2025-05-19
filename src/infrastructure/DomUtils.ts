/**
 * Infrastructure: DomUtils
 * Utility functions for DOM manipulation and querying.
 */

/**
 * Waits for a DOM element matching the selector to appear in the document.
 * @param selector CSS selector for the element to wait for.
 * @param timeoutMs Maximum time to wait in milliseconds (default: 3000ms)
 * @returns Promise that resolves to the element or null if not found in time.
 */
export async function waitForElement(selector: string, timeoutMs = 3000): Promise<Element | null> {
  const interval = 50;
  let elapsed = 0;
  while (elapsed < timeoutMs) {
    const el = document.querySelector(selector);
    if (el) return el;
    await new Promise((res) => setTimeout(res, interval));
    elapsed += interval;
  }
  return null;
}
