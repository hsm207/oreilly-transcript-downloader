/**
 * Utility to find the next chapter's href in the O'Reilly reader DOM.
 * Returns the href string if a next button exists, or null if at the end.
 */
export function findNextChapterHref(): string | null {
  const nextDiv = document.querySelector('div[data-testid="statusBarNext"]');
  if (!nextDiv) return null;
  const nextLink = nextDiv.querySelector('a');
  return nextLink ? nextLink.getAttribute('href') : null;
}
