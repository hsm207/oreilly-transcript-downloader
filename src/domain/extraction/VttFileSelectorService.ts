/**
 * Given an array of .vtt file URLs, returns the best English .vtt file (or null if none found).
 * Picks the first file with 'EN' or 'English' (case-insensitive) in the filename.
 */
export function selectEnglishVttFile(urls: string[]): string | null {
  if (!urls || urls.length === 0) return null;
  // Prioritize 'EN' (not part of another word) and 'English', case-insensitive
  const englishRegex = /(?:[._-]|\b)(en|english)(?:[._-]|\b)/i;
  for (const url of urls) {
    if (englishRegex.test(url)) {
      return url;
    }
  }
  return null;
}
