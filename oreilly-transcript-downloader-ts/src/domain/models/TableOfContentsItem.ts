// Domain Model: TableOfContentsItem
// Represents a single item in a table of contents (TOC)

/**
 * Represents a single item in a table of contents (TOC), such as a chapter or video.
 */
export interface TableOfContentsItem {
  /** The display title of the TOC item. */
  title: string;
  /** The href (URL) to the content. */
  href: string;
}
