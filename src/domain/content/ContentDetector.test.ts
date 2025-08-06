
import { describe, it, expect } from 'vitest';
import { detectContentType } from './ContentDetector';
import { ContentType } from './ContentType';

describe('detectContentType', () => {
  function makeFixtureDoc(domSetup?: (doc: Document) => void): Document {
    const doc = document.implementation.createHTMLDocument('');
    if (domSetup) domSetup(doc);
    return doc;
  }

  it("should return ContentType.Video for an O'Reilly video page", () => {
    const doc = makeFixtureDoc();
    expect(detectContentType(doc, 'https://learning.oreilly.com/videos/some-video-title/1234567890123/')).toBe(ContentType.Video);
  });

  it("should return ContentType.Book for an O'Reilly book page", () => {
    const doc = makeFixtureDoc();
    expect(detectContentType(doc, 'https://learning.oreilly.com/library/view/book-title/12345/')).toBe(ContentType.Book);
  });

  it("should return ContentType.Live for an O'Reilly live class page", () => {
    const doc = makeFixtureDoc();
    expect(detectContentType(doc, 'https://event.on24.com/eventRegistration/console/apollox/mainEvent?eventid=12345')).toBe(ContentType.Live);
  });

  it("should return null for a non-O'Reilly URL", () => {
    const doc = makeFixtureDoc();
    expect(detectContentType(doc, 'https://www.google.com')).toBe(null);
  });

  it('should return null for an empty string', () => {
    const doc1 = makeFixtureDoc();
    expect(detectContentType(doc1, '')).toBe(null);
    const doc2 = makeFixtureDoc();
    expect(detectContentType(doc2, undefined as any)).toBe(null);
  });

  it('should return ContentType.Quiz if the Practice Quiz marker element is present in the DOM', () => {
    const doc = makeFixtureDoc((doc) => {
      const quizDiv = doc.createElement('div');
      quizDiv.className = 'test-title-text';
      quizDiv.title = 'Practice Quiz';
      quizDiv.textContent = 'Practice Quiz';
      doc.body.appendChild(quizDiv);
    });
    expect(detectContentType(doc, 'https://learning.oreilly.com/library/view/book-title/12345/')).toBe(ContentType.Quiz);
  });

  it('should return ContentType.Quiz if the Final Quiz marker element is present in the DOM', () => {
    const doc = makeFixtureDoc((doc) => {
      const quizDiv = doc.createElement('div');
      quizDiv.className = 'test-title-text';
      quizDiv.title = 'Final Quiz';
      quizDiv.textContent = 'Final Quiz';
      doc.body.appendChild(quizDiv);
    });
    expect(detectContentType(doc, 'https://learning.oreilly.com/library/view/book-title/12345/')).toBe(ContentType.Quiz);
  });
});