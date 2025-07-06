import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import { BookChapterExtractor } from '../domain/extraction/BookChapterExtractor';
import { JSDOM } from 'jsdom';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { BookChapterElement } from '../domain/models/BookChapterElement';
import { PdfGenerator } from './PdfGenerator';
import fs from 'fs';
import path from 'path';
class MockLogger {
  info = vi.fn();
  warn = vi.fn();
  error = vi.fn();
  debug = vi.fn();
  log = vi.fn();
}

/**
 * Extract all text content from a PDF buffer using pdf.js
 * Used to compare generated and expected PDFs by their visible text content.
 */
async function extractPdfText(buffer: Buffer): Promise<string> {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '';
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

describe('PdfGenerator Integration Test', () => {
  const testfilesDir = path.resolve(__dirname, '__testdata__');
  const extractionTestDir = path.resolve(__dirname, '../domain/extraction/__testdata__');
  const PDF_TEST_FIXTURES = {
    simple: {
      inputHtml: null,
      generated: path.resolve(testfilesDir, 'generated-simple-pdf.pdf'),
      fixture: path.resolve(testfilesDir, 'expected-simple-pdf.pdf'),
    },
    table: {
      inputHtml: path.resolve(extractionTestDir, 'tables_input.html'),
      generated: path.resolve(testfilesDir, 'generated-table-pdf.pdf'),
      fixture: path.resolve(testfilesDir, 'expected-table-pdf.pdf'),
    },
    preformatted: {
      inputHtml: path.resolve(extractionTestDir, 'sample-standalone-pre-tag.html'),
      generated: path.resolve(testfilesDir, 'generated-preformatted-pdf.pdf'),
      fixture: path.resolve(testfilesDir, 'expected-preformatted-pdf.pdf'),
    },
  };
  
  afterEach(() => {
    for (const { generated } of Object.values(PDF_TEST_FIXTURES)) {
      if (fs.existsSync(generated)) {
        try {
          fs.unlinkSync(generated);
        } catch (err) {
          // Ignore cleanup errors
        }
      }
    }
  });

  it('should generate PDF matching fixture for simple text content', async () => {
    const elements: BookChapterElement[] = [
      { type: 'paragraph', text: 'This is the first sentence for testing PDF generation.' },
      { type: 'paragraph', text: 'This is the second sentence for testing PDF generation.' },
    ];
    
    if (!fs.existsSync(testfilesDir)) fs.mkdirSync(testfilesDir, { recursive: true });
    
    const logger2 = new MockLogger();
    const pdfGen = new PdfGenerator();
    await pdfGen.generateAndDownload(elements, PDF_TEST_FIXTURES.simple.generated, logger2 as any);
    
    expect(fs.existsSync(PDF_TEST_FIXTURES.simple.generated)).toBe(true);
    const generatedBuffer = fs.readFileSync(PDF_TEST_FIXTURES.simple.generated);
    expect(generatedBuffer.length).toBeGreaterThan(1000);
    expect(fs.existsSync(PDF_TEST_FIXTURES.simple.fixture)).toBe(true);
    const fixtureBuffer = fs.readFileSync(PDF_TEST_FIXTURES.simple.fixture);
    const generatedText = await extractPdfText(generatedBuffer);
    const fixtureText = await extractPdfText(fixtureBuffer);
    expect(generatedText).toBe(fixtureText);
  });

  it('should generate PDF matching fixture for table content', async () => {
    const htmlPath = path.resolve(__dirname, '../domain/extraction/__testdata__/tables_input.html');
    const html = fs.readFileSync(htmlPath, 'utf-8');
    const dom = new JSDOM(html);
    const root = dom.window.document.querySelector('#book-content') as HTMLElement;
    const logger3 = new MockLogger();
    const extractor = new BookChapterExtractor(logger3 as any);
    const elements = extractor.extract(root);
    
    if (!fs.existsSync(testfilesDir)) fs.mkdirSync(testfilesDir, { recursive: true });
    
    const logger4 = new MockLogger();
    const pdfGen = new PdfGenerator();
    await pdfGen.generateAndDownload(elements, PDF_TEST_FIXTURES.table.generated, logger4 as any);
    
    expect(fs.existsSync(PDF_TEST_FIXTURES.table.generated)).toBe(true);
    const generatedBuffer = fs.readFileSync(PDF_TEST_FIXTURES.table.generated);
    expect(generatedBuffer.length).toBeGreaterThan(1000);
    expect(fs.existsSync(PDF_TEST_FIXTURES.table.fixture)).toBe(true);
    const fixtureBuffer = fs.readFileSync(PDF_TEST_FIXTURES.table.fixture);
    const generatedText = await extractPdfText(generatedBuffer);
    const fixtureText = await extractPdfText(fixtureBuffer);
    expect(generatedText).toBe(fixtureText);
  }, 20000);

  it('should generate PDF matching fixture for preformatted content', async () => {
    const html = fs.readFileSync(PDF_TEST_FIXTURES.preformatted.inputHtml, 'utf-8');
    const dom = new JSDOM(html);
    const root = dom.window.document.querySelector('#sbo-rt-content') as HTMLElement;
    const logger = new MockLogger();
    const extractor = new BookChapterExtractor(logger as any);
    const elements = extractor.extract(root);

    if (!fs.existsSync(testfilesDir)) fs.mkdirSync(testfilesDir, { recursive: true });
    
    const logger2 = new MockLogger();
    const pdfGen = new PdfGenerator();
    await pdfGen.generateAndDownload(elements, PDF_TEST_FIXTURES.preformatted.generated, logger2 as any);
    
    expect(fs.existsSync(PDF_TEST_FIXTURES.preformatted.generated)).toBe(true);
    const generatedBuffer = fs.readFileSync(PDF_TEST_FIXTURES.preformatted.generated);
    expect(generatedBuffer.length).toBeGreaterThan(1000);

    expect(fs.existsSync(PDF_TEST_FIXTURES.preformatted.fixture)).toBe(true);
    const fixtureBuffer = fs.readFileSync(PDF_TEST_FIXTURES.preformatted.fixture);
    const generatedText = await extractPdfText(generatedBuffer);
    const fixtureText = await extractPdfText(fixtureBuffer);
    expect(generatedText).toBe(fixtureText);
  });
});
