/**
 * Repository for managing the persistent state of bulk chapter PDF downloads.
 * Abstracts storage (localStorage)
 */

const KEY = 'oreilly-bulk-chapter-download';
const IN_PROGRESS = 'in-progress';

export class BulkChapterDownloadStateRepository {
  setInProgress = (): void => localStorage.setItem(KEY, IN_PROGRESS);
  clear = (): void => localStorage.removeItem(KEY);
  isInProgress = (): boolean => localStorage.getItem(KEY) === IN_PROGRESS;
}
