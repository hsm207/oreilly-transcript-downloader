// --- Imports and Setup ---
// Use pdf.js for extracting text from PDFs in Node
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import { BookChapterExtractor } from '../domain/extraction/BookChapterExtractor';
import { JSDOM } from 'jsdom';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { BookChapterElement } from '../domain/models/BookChapterElement';
import { PdfGenerator } from './PdfGenerator';
import fs from 'fs';
import path from 'path';

// --- Logger Mocking ---
// Mock PersistentLogger so we can verify logging calls without real side effects

// Use a mock logger instance for BookChapterExtractor and PdfGenerator
class MockLogger {
  info = vi.fn();
  warn = vi.fn();
  error = vi.fn();
  debug = vi.fn();
  log = vi.fn();
}

// --- PDF Text Extraction Helper ---
/**
 * Extract all text content from a PDF buffer using pdf.js (Node-friendly, no worker)
 * Used to compare generated and expected PDFs by their visible text content.
 */
async function extractPdfText(buffer: Buffer): Promise<string> {
  pdfjsLib.GlobalWorkerOptions.workerSrc = ''; // Disable worker for Node
  const uint8 = new Uint8Array(buffer);
  const pdf = await pdfjsLib.getDocument({ data: uint8 }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => item.str || '').join(' ') + ' ';
  }
  return text.replace(/\s+/g, ' ').trim();
}

// --- Integration Tests ---
describe('PdfGenerator Integration Test', () => {
  // --- Test file paths ---
  const testfilesDir = path.resolve(__dirname, '__testdata__');
  const PDF_FILES = {
    simple: {
      generated: path.resolve(testfilesDir, 'generated-simple-pdf.pdf'),
      fixture: path.resolve(testfilesDir, 'expected-simple-pdf.pdf'),
    },
    table: {
      generated: path.resolve(testfilesDir, 'generated-table-pdf.pdf'),
      fixture: path.resolve(testfilesDir, 'expected-table-pdf.pdf'),
    },
  };
  // --- Cleanup: Remove generated PDFs after each test ---
  afterEach(() => {
    for (const { generated } of Object.values(PDF_FILES)) {
      if (fs.existsSync(generated)) {
        try {
          fs.unlinkSync(generated);
        } catch (err) {
          // Ignore errors during cleanup
        }
      }
    }
  });

  it('should generate PDF matching fixture for simple text content', async () => {
    // Arrange: Create simple chapter elements
    const elements: BookChapterElement[] = [
      { type: 'paragraph', text: 'This is the first sentence for testing PDF generation.' },
      { type: 'paragraph', text: 'This is the second sentence for testing PDF generation.' },
    ];
    // Ensure test fixture directory exists
    if (!fs.existsSync(testfilesDir)) fs.mkdirSync(testfilesDir, { recursive: true });
    // Act: Generate the PDF
    const logger2 = new MockLogger();
    await PdfGenerator.generateAndDownload(elements, PDF_FILES.simple.generated, logger2 as any);
    expect(fs.existsSync(PDF_FILES.simple.generated)).toBe(true);
    const generatedBuffer = fs.readFileSync(PDF_FILES.simple.generated);
    expect(generatedBuffer.length).toBeGreaterThan(1000);
    expect(fs.existsSync(PDF_FILES.simple.fixture)).toBe(true);
    const fixtureBuffer = fs.readFileSync(PDF_FILES.simple.fixture);
    // Assert: File size and text content match
    const sizeDiffRatio = Math.abs(1 - generatedBuffer.length / fixtureBuffer.length);
    expect(sizeDiffRatio).toBeLessThan(0.1);
    const generatedText = await extractPdfText(generatedBuffer);
    const fixtureText = await extractPdfText(fixtureBuffer);
    expect(generatedText).toBe(fixtureText);
  });

  // Test: Table content PDF generation and comparison
  it('should generate PDF matching fixture for table content', async () => {
    const htmlPath = path.resolve(__dirname, '../domain/extraction/__testdata__/tables_input.html');
    const html = fs.readFileSync(htmlPath, 'utf-8');
    const dom = new JSDOM(html);
    const root = dom.window.document.querySelector('#book-content') as HTMLElement;
    const logger3 = new MockLogger();
    const extractor = new BookChapterExtractor(logger3 as any);
    const elements = extractor.extract(root);
    // Ensure test fixture directory exists
    if (!fs.existsSync(testfilesDir)) fs.mkdirSync(testfilesDir, { recursive: true });
    // Act: Generate the PDF
    const logger4 = new MockLogger();
    await PdfGenerator.generateAndDownload(elements, PDF_FILES.table.generated, logger4 as any);
    // Assert: Logger calls and file existence
    expect(fs.existsSync(PDF_FILES.table.generated)).toBe(true);
    const generatedBuffer = fs.readFileSync(PDF_FILES.table.generated);
    expect(generatedBuffer.length).toBeGreaterThan(1000);
    expect(fs.existsSync(PDF_FILES.table.fixture)).toBe(true);
    const fixtureBuffer = fs.readFileSync(PDF_FILES.table.fixture);
    // Assert: File size and text content match
    const sizeDiffRatio = Math.abs(1 - generatedBuffer.length / fixtureBuffer.length);
    expect(sizeDiffRatio).toBeLessThan(0.1);
    const generatedText = await extractPdfText(generatedBuffer);
    const fixtureText = await extractPdfText(fixtureBuffer);
    expect(generatedText).toBe(fixtureText);
  }, 20000);
});
