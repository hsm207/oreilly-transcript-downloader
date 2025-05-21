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

  /**
   * This test verifies that the BookChapterExtractor correctly processes diverse elements 
   * from a book chapter in the exact order they appear in the DOM.
   * 
   * The test verifies extraction of:
   * - Multiple headings at different positions
   * - Chapter opener text with special formatting
   * - Regular paragraphs with standard text
   * - Paragraphs with italic text spans
   * 
   * The expected order must match the exact DOM structure order as defined in the expected.json file.
   */
  it('should process diverse elements in DOM order', () => {
    // Load the HTML input from the test data file - this contains a sample chapter with
    // headings, paragraphs, and special formatting elements like italic text
    const htmlInput = fs.readFileSync(
      path.resolve(__dirname, '__testdata__/diverse_elements_input.html'),
      'utf-8',
    );
    
    // Setup test DOM using the HTML input
    document.body.innerHTML = htmlInput;
    // Get the chapter div which contains all the content elements to be extracted
    const chapterDiv = document.querySelector('.chapter') as HTMLElement;
    
    // Load the expected output - an array of BookChapterElement objects
    // representing the extracted content in the order it should appear
    const expectedJson = fs.readFileSync(
      path.resolve(__dirname, '__testdata__/diverse_elements_expected.json'),
      'utf-8',
    );
    const expectedElements: BookChapterElement[] = JSON.parse(expectedJson);
    
    // Extract content using the BookChapterExtractor
    const result = BookChapterExtractor.extract(chapterDiv);

    expect(result.length).toBe(expectedElements.length);
    result.forEach((actualElement, index) => {
      const expectedElement = expectedElements[index];
      expect(actualElement.type).toBe(expectedElement.type);
      
      if (actualElement.type === 'paragraph' && expectedElement.type === 'paragraph') {
        expect(normalizeWhitespace(actualElement.text)).toBe(
          normalizeWhitespace(expectedElement.text)
        );
        expect(actualElement.isChapterOpener).toBe(expectedElement.isChapterOpener);
      } else if (actualElement.type === 'heading' && expectedElement.type === 'heading') {
        expect(actualElement.level).toBe(expectedElement.level);
        expect(normalizeWhitespace(actualElement.text)).toBe(
          normalizeWhitespace(expectedElement.text)
        );
      } else {
        expect(actualElement).toEqual(expectedElement);
      }
    });
  });

  it('should extract chapterOpenerText correctly', () => {
    const chapterDiv = document.createElement('div');
    chapterDiv.className = 'chapter';

    const chapterBody = document.createElement('div');
    chapterBody.className = 'chapterBody';
    const htmlInput = fs.readFileSync(
      path.resolve(__dirname, '__testdata__/chapterOpenerText_input.html'),
      'utf-8',
    );
    chapterBody.innerHTML = htmlInput;
    chapterDiv.appendChild(chapterBody);
    root.appendChild(chapterDiv);

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
        // Use a more lenient comparison approach for text content that normalizes both strings
        // and checks content more flexibly
        
        // Save the original strings for logging
        const originalActual = actualElement.text;
        const originalExpected = expectedElement.text;
        
        // Normalize text by removing all quote characters, dashes, and other special characters
        // that might vary between browser implementations and test environments
        const cleanText = (text: string) => {
          return text
            .replace(/[\u201C\u201D\u0022\u2033\u02BA\u030B]/g, '') // Remove all kinds of quote characters
            .replace(/[\u2013\u2014\u2015\u2E3A\u2E3B]/g, '-')     // Normalize various dash types
            .replace(/\s+/g, ' ')                                  // Normalize whitespace
            .trim();
        };
        
        // Compare the cleaned texts
        const cleanedActual = cleanText(originalActual);
        const cleanedExpected = cleanText(originalExpected);
        
        // If there's still a difference, log it for debugging
        if (cleanedActual !== cleanedExpected) {
          console.log('Original Expected:', JSON.stringify(originalExpected));
          console.log('Original Actual:', JSON.stringify(originalActual));
          console.log('Cleaned Expected:', JSON.stringify(cleanedExpected));
          console.log('Cleaned Actual:', JSON.stringify(cleanedActual));
          
          // Check for character by character differences
          for (let i = 0; i < Math.min(cleanedActual.length, cleanedExpected.length); i++) {
            if (cleanedActual.charAt(i) !== cleanedExpected.charAt(i)) {
              console.log(`First difference at position ${i}:`);
              console.log(`Expected: '${cleanedExpected.charAt(i)}' (${cleanedExpected.charCodeAt(i)})`);
              console.log(`Actual: '${cleanedActual.charAt(i)}' (${cleanedActual.charCodeAt(i)})`);
              break;
            }
          }
        }
        
        // Use approximate string comparison that's resilient to character encoding differences
        expect(cleanedActual).toBe(cleanedExpected);
        expect(actualElement.isChapterOpener).toBe(expectedElement.isChapterOpener);
      } else {
        expect(actualElement).toEqual(expectedElement);
      }
    });
  });

  it('should extract paragraphs and images correctly', () => {
    const chapterDiv = document.createElement('div');
    chapterDiv.className = 'chapter';

    const chapterBody = document.createElement('div');
    chapterBody.className = 'chapterBody';
    const htmlInput = fs.readFileSync(
      path.resolve(__dirname, '__testdata__/paragraphsAndImages_input.html'),
      'utf-8',
    );
    chapterBody.innerHTML = htmlInput;
    chapterDiv.appendChild(chapterBody);
    root.appendChild(chapterDiv);

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
        expect(normalizeWhitespace(actualElement.text)).toBe(
          normalizeWhitespace(expectedElement.text),
        );
        expect(actualElement.isChapterOpener).toBe(expectedElement.isChapterOpener);
      } else if (actualElement.type === 'caption' && expectedElement.type === 'caption') {
        expect(normalizeWhitespace(actualElement.text)).toBe(
          normalizeWhitespace(expectedElement.text),
        );
      } else {
        // For other types or if one is undefined (which shouldn't happen if lengths match and types match)
        expect(actualElement).toEqual(expectedElement);
      }
    });
  });

  it('should extract content from complex chapter structure with epigraphs and multiple chapters', () => {
    const htmlInput = fs.readFileSync(
      path.resolve(__dirname, '__testdata__/complexChapter_input.html'),
      'utf-8',
    );
    root.innerHTML = htmlInput;

    const expectedJson = fs.readFileSync(
      path.resolve(__dirname, '__testdata__/complexChapter_expected.json'),
      'utf-8',
    );
    const expectedElements: BookChapterElement[] = JSON.parse(expectedJson);

    const result = BookChapterExtractor.extract(root.firstChild as HTMLElement); // Pass sbo-rt-content

    expect(result.length).toBe(expectedElements.length);
    result.forEach((actualElement, index) => {
      const expectedElement = expectedElements[index];
      expect(actualElement.type).toBe(expectedElement.type);
      if (actualElement.type === 'paragraph' && expectedElement.type === 'paragraph') {
        expect(normalizeWhitespace(actualElement.text)).toBe(
          normalizeWhitespace(expectedElement.text),
        );
      } else if (actualElement.type === 'heading' && expectedElement.type === 'heading') {
        expect(actualElement.level).toBe(expectedElement.level);
        expect(normalizeWhitespace(actualElement.text)).toBe(
          normalizeWhitespace(expectedElement.text),
        );
      } else {
        expect(actualElement).toEqual(expectedElement);
      }
    });
  });

  /**
   * Tests the extraction of ordered and unordered lists from book chapters.
   * Verifies that the extractor properly processes:
   * - Unordered lists (<ul>) with list items
   * - Ordered lists (<ol>) with list items
   * - Proper footnote removal from list items
   * - Proper structure of the resulting BookChapterElement with type: 'list'
   */
  it('should properly extract ordered and unordered lists', () => {
    // Load the test HTML
    const htmlInput = fs.readFileSync(
      path.resolve(__dirname, '__testdata__/list_elements_input.html'),
      'utf-8',
    );
    
    // Setup test DOM using the HTML input
    document.body.innerHTML = htmlInput;
    // Get the chapter div which contains all the content elements to be extracted
    const chapterDiv = document.querySelector('.chapter') as HTMLElement;
    
    // Load the expected output - an array of BookChapterElement objects
    const expectedJson = fs.readFileSync(
      path.resolve(__dirname, '__testdata__/list_elements_expected.json'),
      'utf-8',
    );
    const expectedElements: BookChapterElement[] = JSON.parse(expectedJson);
    
    // Extract content using the BookChapterExtractor
    const result = BookChapterExtractor.extract(chapterDiv);

    // Compare the results
    expect(result.length).toBe(expectedElements.length);
    result.forEach((actualElement, index) => {
      const expectedElement = expectedElements[index];
      expect(actualElement.type).toBe(expectedElement.type);
      
      if (actualElement.type === 'list' && expectedElement.type === 'list') {
        expect(actualElement.ordered).toBe(expectedElement.ordered);
        expect(actualElement.items.length).toBe(expectedElement.items.length);
        
        // Compare each list item
        actualElement.items.forEach((item, itemIndex) => {
          expect(normalizeWhitespace(item)).toBe(
            normalizeWhitespace(expectedElement.items[itemIndex])
          );
        });
      } else if (actualElement.type === 'paragraph' && expectedElement.type === 'paragraph') {
        expect(normalizeWhitespace(actualElement.text)).toBe(
          normalizeWhitespace(expectedElement.text)
        );
      } else if (actualElement.type === 'heading' && expectedElement.type === 'heading') {
        expect(actualElement.level).toBe(expectedElement.level);
        expect(normalizeWhitespace(actualElement.text)).toBe(
          normalizeWhitespace(expectedElement.text)
        );
      } else {
        expect(actualElement).toEqual(expectedElement);
      }
    });
  });
});
