/**
 * Waits for the book content to be fully loaded (not just present, but not showing the loading spinner).
 * Resolves with the book content element or throws if not loaded in time.
 * @param timeoutMs Maximum time to wait in milliseconds (default: 5000ms)
 */
export function waitForBookContent(timeoutMs = 5000): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    const check = () => {
      const bookContent = document.getElementById("book-content");
      const isLoading =
        bookContent &&
        bookContent.querySelector('[data-testid="loadingODot"], .orm-ChapterReader-loadContainer');
      if (bookContent && !isLoading) {
        clearInterval(interval);
        clearTimeout(timeout);
        resolve(bookContent as HTMLElement);
      }
    };

    const interval = setInterval(check, 100);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      reject(new Error("Book content did not load in time."));
    }, timeoutMs);

    check(); // Check immediately in case it's already loaded
  });
}