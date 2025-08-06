/**
 * Converts a .vtt file string to a clean transcript format:
 *   [timestamp range]: [caption text]
 *   (one per line, no WEBVTT/NOTE/confidence lines, no blank lines)
 *
 * @param vttContent Raw .vtt file content as string
 * @returns Clean transcript string
 */
export function preprocessVttToTranscript(vttContent: string): string {
  if (!vttContent.trim()) return "";
  const lines = vttContent.split(/\r?\n/);
  const result: string[] = [];
  let currentTimestamp: string | null = null;
  let currentText: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === "WEBVTT" || trimmed.startsWith("NOTE")) {
      continue;
    }
    // Timestamp line
    if (/^\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}$/.test(trimmed)) {
      // If we have a previous block, flush it
      if (currentTimestamp && currentText.length) {
        result.push(`${currentTimestamp}: ${currentText.join("\n")}`);
      }
      currentTimestamp = trimmed;
      currentText = [];
    } else if (currentTimestamp) {
      // Caption text line(s)
      currentText.push(trimmed);
    }
  }
  // Flush last block
  if (currentTimestamp && currentText.length) {
    result.push(`${currentTimestamp}: ${currentText.join("\n")}`);
  }
  return result.join("\n");
}
/**
 * Generates a user-friendly transcript filename from a DOM title string.
 * Example: "My Awesome Live Event | O'Reilly" => "My_Awesome_Live_Event_English_transcript.txt"
 *
 * @param domTitle The document.title string from the DOM
 * @returns A sanitized filename for the transcript
 */
export function makeTranscriptFilenameFromTitle(domTitle: string): string {
  // Remove branding/pipe if present (e.g., " | O'Reilly")
  let name = domTitle.split('|')[0].trim();
  // Replace spaces and illegal filename chars with underscores
  name = name.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return `${name}_English_transcript.txt`;
}
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
