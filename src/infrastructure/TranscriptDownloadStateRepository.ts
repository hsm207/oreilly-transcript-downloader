import type { BatchState } from '../application/AllTranscriptDownloadService';

/**
 * Repository for managing the state of the "Download All Transcripts" operation.
 * @public
 */
export class TranscriptDownloadStateRepository {
  private static readonly KEY = 'oreilly_transcript_download_state';

  /**
   * Saves the current download state.
   * @param state - The state to save.
   */
  save(state: BatchState): void {
    localStorage.setItem(TranscriptDownloadStateRepository.KEY, JSON.stringify(state));
  }

  /**
   * Loads the current download state.
   * @returns The state, or null if not found or invalid.
   */
  load(): BatchState | null {
    const raw = localStorage.getItem(TranscriptDownloadStateRepository.KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Clears the download state.
   */
  clear(): void {
    localStorage.removeItem(TranscriptDownloadStateRepository.KEY);
  }
}
