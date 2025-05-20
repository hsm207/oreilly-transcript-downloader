import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BookChapterExtractor } from './BookChapterExtractor';
import { BookChapterElement } from '../models/BookChapterElement';
import * as fs from 'fs';
import * as path from 'path';

// Mock the chrome API for PersistentLogger
vi.mock('../../infrastructure/logging/PersistentLogger', () => ({
  PersistentLogger: {
    getInstance: vi.fn().mockReturnValue({
      debug: vi.fn(),
      log: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

/**
 * Normalizes whitespace in a string.
 * Replaces multiple whitespace characters (including newlines, tabs, etc.) with a single space,
 * and trims leading/trailing whitespace.
 * @param text The string to normalize.
 * @returns The normalized string.
 */
function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

describe('BookChapterExtractor', () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement('div');
    root.id = 'book-content';
  });

  it('should extract chapterOpenerText correctly', () => {
    const chapterBody = document.createElement('div');
    chapterBody.className = 'chapterBody';
    const htmlInput = fs.readFileSync(
      path.resolve(__dirname, '__testdata__/chapterOpenerText_input.html'),
      'utf-8',
    );
    chapterBody.innerHTML = htmlInput;
    root.appendChild(chapterBody);

    const expectedJson = fs.readFileSync(
      path.resolve(__dirname, '__testdata__/chapterOpenerText_expected.json'),
      'utf-8',
    );
    const expectedElements: BookChapterElement[] = JSON.parse(expectedJson);

    const result = BookChapterExtractor.extract(root);

    expect(result.length).toBe(expectedElements.length);
    result.forEach((actualElement, index) => {
      const expectedElement = expectedElements[index];
      expect(actualElement.type).toBe(expectedElement.type);
      if (actualElement.type === 'paragraph' && expectedElement.type === 'paragraph') {
        expect(normalizeWhitespace(actualElement.text)).toBe(normalizeWhitespace(expectedElement.text));
        expect(actualElement.isChapterOpener).toBe(expectedElement.isChapterOpener);
      } else {
        expect(actualElement).toEqual(expectedElement);
      }
    });
  });

  it('should extract paragraphs and images correctly', () => {
    const chapterBody = document.createElement('div');
    chapterBody.className = 'chapterBody';
    const htmlInput = fs.readFileSync(
      path.resolve(__dirname, '__testdata__/paragraphsAndImages_input.html'),
      'utf-8',
    );
    chapterBody.innerHTML = htmlInput;
    root.appendChild(chapterBody);

    const expectedJson = fs.readFileSync(
      path.resolve(__dirname, '__testdata__/paragraphsAndImages_expected.json'),
      'utf-8',
    );
    const expectedElements: BookChapterElement[] = JSON.parse(expectedJson);

    const result = BookChapterExtractor.extract(root);
    expect(result.length).toBe(expectedElements.length);
    expectedElements.forEach((expectedElement, index) => {
      const actualElement = result[index];
      expect(actualElement.type).toBe(expectedElement.type);
      if (actualElement.type === 'image' && expectedElement.type === 'image') {
        expect(actualElement.alt).toBe(expectedElement.alt);
        expect(actualElement.src).toContain(expectedElement.src); // Check if src contains, due to JSDOM prefixing
      } else if (actualElement.type === 'paragraph' && expectedElement.type === 'paragraph') {
        expect(normalizeWhitespace(actualElement.text)).toBe(normalizeWhitespace(expectedElement.text));
        expect(actualElement.isChapterOpener).toBe(expectedElement.isChapterOpener);
      } else if (actualElement.type === 'caption' && expectedElement.type === 'caption') {
        expect(normalizeWhitespace(actualElement.text)).toBe(normalizeWhitespace(expectedElement.text));
      } else {
        // For other types or if one is undefined (which shouldn't happen if lengths match and types match)
        expect(actualElement).toEqual(expectedElement);
      }
    });
  });
});
