import { describe, it, expect, beforeEach } from 'vitest';
import {
  BookChapterDownloadStateRepository,
  BookChapterDownloadState,
} from './BookChapterDownloadStateRepository';

describe('BookChapterDownloadStateRepository', () => {
  let repo: BookChapterDownloadStateRepository;

  beforeEach(() => {
    repo = new BookChapterDownloadStateRepository();
    localStorage.clear();
  });

  it('saves and loads an active state correctly', () => {
    const state: BookChapterDownloadState = {
      isActive: true,
    };
    repo.save(state);
    const loaded = repo.load();
    expect(loaded).toEqual({ isActive: true });
  });

  it('returns null if state is missing', () => {
    expect(repo.load()).toBeNull();
  });

  it('returns null if state is invalid JSON', () => {
    localStorage.setItem('oreilly_book_chapter_download_state', '{not valid json');
    expect(repo.load()).toBeNull();
  });

  it('clears the state', () => {
    const state: BookChapterDownloadState = {
      isActive: true,
    };
    repo.save(state);
    repo.clear();
    expect(repo.load()).toBeNull();
  });

  it('correctly saves and loads an inactive state', () => {
    const state: BookChapterDownloadState = {
      isActive: false,
    };
    repo.save(state);
    const loaded = repo.load();
    expect(loaded).toEqual({ isActive: false });
  });
});
