import { describe, it, expect } from 'vitest';
import { extractTranscript } from './TranscriptExtractor';
import fs from 'fs';
import path from 'path';

// Helper to create a DOM element for testing
function createTranscriptElement(html: string): HTMLElement {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div;
}

const testDataDir = path.resolve(__dirname, '__testdata__');

describe('extractTranscript', () => {
  it('should extract plain text from a sample transcript DOM (from file)', () => {
    const htmlPath = path.join(testDataDir, 'sample-transcript.html');
    const expectedPath = path.join(testDataDir, 'expected-transcript.txt');
    const transcriptHtml = fs.readFileSync(htmlPath, 'utf-8');
    const expectedText = fs.readFileSync(expectedPath, 'utf-8');
    const root = createTranscriptElement(transcriptHtml);
    const result = extractTranscript(root);
    expect(result).toBe(expectedText);
  });

  it('should throw an error if no transcript line buttons are found', () => {
    // Simulate a transcript body with no buttons
    const html = '<div data-testid="transcript-body"><p>00:01</p><p>Hello world</p></div>';
    const root = createTranscriptElement(html);
    expect(() => extractTranscript(root)).toThrowError(/No transcript line buttons found/);
  });
  // Add more test cases as needed
});
