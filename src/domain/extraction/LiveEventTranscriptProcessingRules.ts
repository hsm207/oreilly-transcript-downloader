/**
 * LiveEvent Transcript Processing Rules
 * 
 * Contains all business logic for processing and selecting LiveEvent transcript files.
 * Pure domain logic - no Chrome APIs, no browser dependencies.
 */

/**
 * Selects the best English .vtt file from a list of URLs.
 * Returns the first URL that matches English patterns, or null if none found.
 *
 * @param urls Array of .vtt file URLs
 * @returns The best English .vtt URL, or null if not found
 */
export function selectEnglishVttFile(urls: string[]): string | null {
  if (!urls.length) return null;
  
  // Look for files with English indicators (case-insensitive)
  const englishPatterns = [/en\b/i, /english/i];
  
  for (const url of urls) {
    if (englishPatterns.some(pattern => pattern.test(url))) {
      return url;
    }
  }
  
  return null;
}

/**
 * Finds the best English .vtt file(s) from a list of URLs.
 * Returns an array for consistency with list-based APIs.
 * 
 * @param urls Array of .vtt file URLs (strings)
 * @returns Array of best/English .vtt file URLs (empty if not found)
 */
export function findBestEnglishVtt(urls: string[]): string[] {
  const best = selectEnglishVttFile(urls);
  return best ? [best] : [];
}
