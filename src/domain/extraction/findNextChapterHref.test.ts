import { describe, it, expect } from 'vitest';
import { findNextChapterHref } from './findNextChapterHref';

describe('findNextChapterHref', () => {
  it('returns the href when the next button exists', () => {
    document.body.innerHTML = `
      <div data-testid="statusBarNext">
        <a href="/library/view/book/next-chapter.xhtml">Next</a>
      </div>
    `;
    expect(findNextChapterHref()).toBe('/library/view/book/next-chapter.xhtml');
  });

  it('returns null when the next button does not exist', () => {
    document.body.innerHTML = `
      <div data-testid="statusBarNext"></div>
    `;
    expect(findNextChapterHref()).toBeNull();
  });

  it('returns null if the statusBarNext div is missing', () => {
    document.body.innerHTML = '';
    expect(findNextChapterHref()).toBeNull();
  });
});
