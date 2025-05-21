import { TextNormalizer } from './TextNormalizer';

import { describe, it, expect } from 'vitest';
import { TextNormalizer } from './TextNormalizer';

describe('TextNormalizer', () => {
  it('normalizes curly quotes and whitespace', () => {
    const input = `“Hello”  ‘world’   test`;
    expect(TextNormalizer.normalizeText(input)).toBe('"Hello" ' + "'world'" + ' test');
  });

  it('trims and collapses whitespace', () => {
    const input = `  foo   bar \n baz  `;
    expect(TextNormalizer.normalizeText(input)).toBe('foo bar baz');
  });

  it('removes footnote <sup> and certain <a> tags', () => {
    const html = document.createElement('div');
    html.innerHTML = `<span>Text<sup>1</sup><a href='#ft_1'></a>more</span>`;
    expect(TextNormalizer.cleanNodeText(html)).toBe('Text more');
  });

  it('returns empty string for empty element', () => {
    const html = document.createElement('div');
    expect(TextNormalizer.cleanNodeText(html)).toBe('');
  });
});
