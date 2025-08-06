import { describe, it, expect } from 'vitest';
import { detectContentType } from './ContentDetector';
import { ContentType } from './ContentType';

describe('detectContentType', () => {
  it("should return ContentType.Video for an O'Reilly video page", () => {
    expect(
      detectContentType('https://learning.oreilly.com/videos/some-video-title/1234567890123/'),
    ).toBe(ContentType.Video);
  });

  it("should return ContentType.Book for an O'Reilly book page", () => {
    expect(detectContentType('https://learning.oreilly.com/library/view/book-title/12345/')).toBe(
      ContentType.Book,
    );
  });

  it("should return ContentType.Live for an O'Reilly live class page", () => {
    expect(
      detectContentType(
        'https://event.on24.com/eventRegistration/console/apollox/mainEvent?eventid=12345',
      ),
    ).toBe(ContentType.Live);
  });

  it("should return null for a non-O'Reilly URL", () => {
    expect(detectContentType('https://www.google.com')).toBe(null);
  });

  it('should return null for an empty string', () => {
    expect(detectContentType('')).toBe(null);
    expect(detectContentType(undefined as any)).toBe(null);
  });

  it('should return ContentType.PracticeQuiz if the Practice Quiz marker element is present in the DOM', () => {
    // Simulate the quiz marker in the DOM
    const quizDiv = document.createElement('div');
    quizDiv.className = 'test-title-text';
    quizDiv.title = 'Practice Quiz';
    quizDiv.textContent = 'Practice Quiz';
    document.body.appendChild(quizDiv);

    // The URL can be anything, since detection will check the DOM
    expect(detectContentType('https://learning.oreilly.com/library/view/book-title/12345/')).toBe(ContentType.PracticeQuiz);

    // Clean up
    document.body.removeChild(quizDiv);
  });
});
