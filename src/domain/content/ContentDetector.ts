// Domain: ContentDetector
// Logic for detecting content types, specifically O'Reilly video pages.
import { ContentType } from './ContentType';

// Regex to identify O'Reilly video pages
const OREILLY_VIDEO_URL_REGEX = /^https:\/\/learning\.oreilly\.com\/videos\//;
// Regex to identify O'Reilly book pages
const OREILLY_BOOK_URL_REGEX = /^https:\/\/learning\.oreilly\.com\/library\/view\//;
// Regex to identify O'Reilly live class pages (recorded)
const OREILLY_LIVE_URL_REGEX =
  /^https:\/\/event\.on24\.com\/eventRegistration\/console\/apollox\/mainEvent/;

/**
 * Detects the content type of the current page.
 * Add new types by extending the regexes and switch below.
 * @param url The URL of the page to detect content type for.
 * @returns ContentType value if detected, or null.
 */
export function detectContentType(url: string): ContentType | null {
  if (!url) return null;

  // Check for Practice Quiz marker in the DOM
  const quizDiv = document.querySelector('div.test-title-text[title="Practice Quiz"]');
  if (quizDiv && quizDiv.textContent?.trim() === 'Practice Quiz') {
    return ContentType.PracticeQuiz;
  }

  if (OREILLY_VIDEO_URL_REGEX.test(url)) {
    return ContentType.Video;
  }
  if (OREILLY_BOOK_URL_REGEX.test(url)) {
    return ContentType.Book;
  }
  if (OREILLY_LIVE_URL_REGEX.test(url)) {
    return ContentType.Live;
  }
  // Add more types here as needed!
  return null;
}
