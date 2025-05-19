import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import { TranscriptDownloadStateRepository } from './TranscriptDownloadStateRepository';
import type { BatchState } from '../application/AllTranscriptDownloadService';

describe('TranscriptDownloadStateRepository', () => {
  let repo: TranscriptDownloadStateRepository;
  const key = 'oreilly_transcript_download_state';
  const sampleState: BatchState = {
    tocItems: [
      { title: 'Module 1', href: '/module-1' },
      { title: 'Module 2', href: '/module-2' },
    ],
    currentIndex: 1,
  };

  beforeEach(() => {
    repo = new TranscriptDownloadStateRepository();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('saves and loads state correctly', () => {
    repo.save(sampleState);
    const loaded = repo.load();
    expect(loaded).toEqual(sampleState);
  });

  it('returns null if nothing is saved', () => {
    expect(repo.load()).toBeNull();
  });

  it('returns null if JSON is invalid', () => {
    localStorage.setItem(key, 'not-json');
    expect(repo.load()).toBeNull();
  });

  it('clears state', () => {
    repo.save(sampleState);
    repo.clear();
    expect(repo.load()).toBeNull();
  });
});
