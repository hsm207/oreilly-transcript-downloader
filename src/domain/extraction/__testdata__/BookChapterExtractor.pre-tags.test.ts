import { describe, it, expect } from 'vitest';
import { BookChapterExtractor } from '../../extraction/BookChapterExtractor';
import { BookChapterElement } from '../../models/BookChapterElement';
import { JSDOM } from 'jsdom';
import * as fs from 'fs';
import * as path from 'path';

class MockLogger {
  debug = () => {};
  info = () => {};
  warn = () => {};
  error = () => {};
  log = () => {};
}

describe('BookChapterExtractor - pre-tags', () => {
  // TODO: Consider updating the extractor so that <pre> tags inside lists are extracted as separate elements, not just merged into the list item text.
  it('should extract a single list element with all text (including <pre> blocks) merged, for complex list structure', () => {
    const html = fs.readFileSync(
      path.resolve(__dirname, 'sample-lists-with-pre-tags.html'),
      'utf-8',
    );
    const dom = new JSDOM(html);
    const root = dom.window.document.getElementById('sbo-rt-content') as HTMLElement;
    const extractor = new BookChapterExtractor(new MockLogger() as any);
    const elements = extractor.extract(root);

    // Load expected result from file
    const expectedJson = fs.readFileSync(
      path.resolve(__dirname, 'list-with-pre-tags_expected.json'),
      'utf-8',
    );
    const expected: BookChapterElement[] = JSON.parse(expectedJson);

    expect(elements.length).toBe(1);
    const el = elements[0];
    const exp = expected[0];
    const elList = el as { type: 'list'; items: string[]; ordered: boolean };
    const expList = exp as { type: 'list'; items: string[]; ordered: boolean };
    expect(elList.items).toEqual(expList.items);
  });

  it('should extract headings, paragraphs, and standalone pre/code blocks as expected', () => {
    const html = fs.readFileSync(
      path.resolve(__dirname, 'sample-standalone-pre-tag.html'),
      'utf-8',
    );
    const dom = new JSDOM(html);
    const root = dom.window.document.getElementById('sbo-rt-content') as HTMLElement;
    const extractor = new BookChapterExtractor(new MockLogger() as any);
    const elements = extractor.extract(root);

    const expectedJson = fs.readFileSync(
      path.resolve(__dirname, 'sample-standalone-pre-tag_expected.json'),
      'utf-8',
    );

    const expected: BookChapterElement[] = JSON.parse(expectedJson);

    expect(elements).toEqual(expected);
  });
});
