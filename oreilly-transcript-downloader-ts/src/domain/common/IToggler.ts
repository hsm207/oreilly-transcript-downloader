/**
 * @interface IToggler
 * Defines the contract for a service that can ensure a togglable piece of content
 * is made visible. The implementing class is responsible for the specific logic
 * of how to "turn on" the content (e.g., clicking a button, changing ARIA states)
 * and confirming its visibility by checking for the presence of its container.
 */
export interface IToggler {
  /**
   * Ensures the content associated with the provided toggleElement is made visible
   * and confirms its visibility by checking for the presence of the content container.
   * This method should ideally check if the content is already visible and only
   * perform an action if it's not.
   *
   * @param toggleElement - The HTMLElement that acts as the toggle (e.g., a button).
   *                        This element is expected to be found by a calling service
   *                        (like a ContentLoader) using a specific selector.
   * @param contentContainerSelector - The CSS selector for the content container
   *                                   that this toggle reveals. The implementing class
   *                                   **must** use this to verify that the content
   *                                   container becomes present/visible after the toggle action.
   * @returns {Promise<void>} A promise that resolves when the content is confirmed to be visible,
   *                          or rejects if it fails to become visible.
   * @throws {Error} If the content container does not become visible after the toggle action
   *                 within a reasonable timeframe.
   */
  ensureContentVisible(toggleElement: HTMLElement, contentContainerSelector: string): Promise<void>;
}
