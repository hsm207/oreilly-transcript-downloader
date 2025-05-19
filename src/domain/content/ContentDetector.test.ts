import { describe, it, expect } from 'vitest';
import { isOReillyVideoPage, detectContentType } from './ContentDetector';
import { ContentType } from './ContentType';

describe('ContentDetector', () => {
  describe('isOReillyVideoPage', () => {
    it("should return true for an O\\'Reilly video page", () => {
      expect(
        isOReillyVideoPage('https://learning.oreilly.com/videos/some-video-title/1234567890123/'),
      ).toBe(true);
    });

    it("should return false for an O\\'Reilly page that is not a video page", () => {
      expect(
        isOReillyVideoPage('https://learning.oreilly.com/library/view/book-title/12345/'),
      ).toBe(false);
    });

    it("should return false for a non-O\\'Reilly URL", () => {
      expect(isOReillyVideoPage('https://www.google.com')).toBe(false);
    });

    it('should return false for an empty string', () => {
      expect(isOReillyVideoPage('')).toBe(false);
    });
  });

  describe('detectContentType', () => {
    it("should return ContentType.Video for an O\\'Reilly video page", () => {
      expect(
        detectContentType('https://learning.oreilly.com/videos/some-video-title/1234567890123/'),
      ).toBe(ContentType.Video);
    });

    it("should return null for an O\\'Reilly page that is not a video page", () => {
      expect(detectContentType('https://learning.oreilly.com/library/view/book-title/12345/')).toBe(
        null,
      );
    });

    it("should return null for a non-O\\'Reilly URL", () => {
      expect(detectContentType('https://www.google.com')).toBe(null);
    });

    it('should return null for an empty string', () => {
      expect(detectContentType('')).toBe(null);
    });
  });
});
