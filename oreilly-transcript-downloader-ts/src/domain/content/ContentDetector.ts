// Domain: ContentDetector
// Logic for detecting content types, specifically O'Reilly video pages.
import { ContentType } from './ContentType';

// Regex to identify O'Reilly video pages
const OREILLY_VIDEO_URL_REGEX = /^https:\/\/learning\.oreilly\.com\/videos\//;

/**
 * Checks if the given URL is an O'Reilly video page.
 * @param url The URL to check.
 * @returns True if the URL is an O'Reilly video page, false otherwise.
 */
export function isOReillyVideoPage(url: string): boolean {
  if (!url) {
    return false;
  }
  return OREILLY_VIDEO_URL_REGEX.test(url);
}

/**
 * Detects the content type of the current page.
 * For now, it only specifically identifies O'Reilly video pages.
 * @param url The URL of the page to detect content type for.
 * @returns ContentType.Video if it's an O'Reilly video page, or null.
 */
export function detectContentType(url: string): ContentType | null {
  if (isOReillyVideoPage(url)) {
    return ContentType.Video;
  }
  return null;
}
