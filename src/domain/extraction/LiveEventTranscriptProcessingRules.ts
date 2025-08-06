/**
 * Returns the first item in an array, or null if empty.
 * Generic utility for composing domain rules.
 */
export function pickFirst<T>(arr: T[]): T | null {
  return arr.length > 0 ? arr[0] : null;
}
/**
 * LiveEvent Transcript Processing Rules
 *
 * Contains all business logic for processing and selecting LiveEvent transcript files.
 * Pure domain logic - no Chrome APIs, no browser dependencies.
 */

/**
 * Finds all English .vtt file(s) from a list of URLs.
 * Returns an array of URLs matching English patterns (empty if not found).
 *
 * @param urls Array of .vtt file URLs (strings)
 * @returns Array of English .vtt file URLs (empty if not found)
 */
export function findBestEnglishVtt(urls: string[]): string[] {
  if (!urls.length) return [];

  // Look for files with English indicators (case-insensitive)
  const englishPatterns = [/en\b/i, /english/i];

  return urls.filter((url) => englishPatterns.some((pattern) => pattern.test(url)));
}
