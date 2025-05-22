/**
 * BookChapterDownloadStateRepository is a persistence adapter (repository) responsible for
 * saving, loading, and clearing the BookChapterDownloadState in localStorage.
 *
 * BookChapterDownloadState is a data structure (interface) that represents the current progress
 * of the "Download All Chapters as PDF" operation, including the list of chapters (tocItems)
 * and the current index being processed.
 *
 * The repository provides a simple API for application services to persist and resume
 * batch download progress, while the state object itself is a plain TypeScript interface.
 */

/**
 * Represents the state of the "Download All Chapters as PDF" operation.
 */
export interface BookChapterDownloadState {
  tocItems: { title: string; href: string }[];
  currentIndex: number;
}

/**
 * Repository for managing the state of the "Download All Chapters as PDF" operation.
 * @public
 */
export class BookChapterDownloadStateRepository {
  private static readonly KEY = 'oreilly_book_chapter_download_state';

  /**
   * Saves the current download state.
   * @param state - The state to save.
   */
  save(state: BookChapterDownloadState): void {
    localStorage.setItem(BookChapterDownloadStateRepository.KEY, JSON.stringify(state));
  }

  /**
   * Loads the current download state.
   * @returns The state, or null if not found or invalid.
   */
  load(): BookChapterDownloadState | null {
    const raw = localStorage.getItem(BookChapterDownloadStateRepository.KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as BookChapterDownloadState;
    } catch {
      return null;
    }
  }

  /**
   * Clears the download state.
   */
  clear(): void {
    localStorage.removeItem(BookChapterDownloadStateRepository.KEY);
  }
}
