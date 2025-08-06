import { describe, it, expect } from 'vitest';
import { selectEnglishVttFile } from './VttFileSelectorService';

describe('VttFileSelectorService', () => {
  it('returns null if no URLs are provided', () => {
    expect(selectEnglishVttFile([])).toBeNull();
  });

  it('returns the only .vtt file if it contains EN in the filename', () => {
    const urls = [
      'https://cdn.oreilly.com/transcripts/12345_EN.vtt'
    ];
    expect(selectEnglishVttFile(urls)).toBe(urls[0]);
  });

  it('returns the only .vtt file if it contains English in the filename', () => {
    const urls = [
      'https://cdn.oreilly.com/transcripts/12345-English.vtt'
    ];
    expect(selectEnglishVttFile(urls)).toBe(urls[0]);
  });

  it('returns the English .vtt file if multiple .vtt files are present', () => {
    const urls = [
      'https://cdn.oreilly.com/transcripts/12345_FR.vtt',
      'https://cdn.oreilly.com/transcripts/12345_EN.vtt',
      'https://cdn.oreilly.com/transcripts/12345_DE.vtt'
    ];
    expect(selectEnglishVttFile(urls)).toBe('https://cdn.oreilly.com/transcripts/12345_EN.vtt');
  });

  it('returns the English .vtt file if multiple .vtt files with different cases are present', () => {
    const urls = [
      'https://cdn.oreilly.com/transcripts/12345_fr.vtt',
      'https://cdn.oreilly.com/transcripts/12345_en.vtt',
      'https://cdn.oreilly.com/transcripts/12345_english.vtt'
    ];
    expect(selectEnglishVttFile(urls)).toBe('https://cdn.oreilly.com/transcripts/12345_en.vtt');
  });

  it('returns the first English .vtt file if multiple matches are present', () => {
    const urls = [
      'https://cdn.oreilly.com/transcripts/12345_english.vtt',
      'https://cdn.oreilly.com/transcripts/12345_EN.vtt'
    ];
    expect(selectEnglishVttFile(urls)).toBe('https://cdn.oreilly.com/transcripts/12345_english.vtt');
  });

  it('returns null if no English .vtt file is found', () => {
    const urls = [
      'https://cdn.oreilly.com/transcripts/12345_FR.vtt',
      'https://cdn.oreilly.com/transcripts/12345_DE.vtt'
    ];
    expect(selectEnglishVttFile(urls)).toBeNull();
  });
});
