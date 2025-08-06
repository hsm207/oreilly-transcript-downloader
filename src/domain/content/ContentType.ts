// Domain: ContentType
// Enum for all supported O'Reilly content types.

/**
 * Enum representing the type of O'Reilly content detected on a page.
 *
 * To add a new type, add a new value here and update ContentDetector.
 */
export enum ContentType {
  Video = 'video',
  Book = 'book',
  Live = 'live',
  // Add more types as needed!
}
