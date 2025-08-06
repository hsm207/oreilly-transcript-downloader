import { pickFirst, makeTranscriptFilenameFromTitle, preprocessVttToTranscript } from './LiveEventTranscriptProcessingRules';
import fs from 'fs';
describe('preprocessVttToTranscript (domain logic)', () => {
  it('converts a real VTT file to the expected transcript output (fixture)', () => {
    const vtt = fs.readFileSync(__dirname + '/__testdata__/sample-preprocess-vtt.vtt', 'utf8');
    const expected = fs.readFileSync(__dirname + '/__testdata__/expected-preprocess-vtt.txt', 'utf8').trim();
    expect(preprocessVttToTranscript(vtt).trim()).toBe(expected);
  });
});

describe('pickFirst (utility)', () => {
  it('returns null for an empty array', () => {
    expect(pickFirst([])).toBeNull();
  });

  it('returns the only item if array has one element', () => {
    expect(pickFirst(['a'])).toBe('a');
  });

  it('returns the first item if array has multiple elements', () => {
    expect(pickFirst(['a', 'b', 'c'])).toBe('a');
  });

  it('composes with findBestEnglishVtt to select the first English VTT', () => {
    const urls = [
      'https://cdn.oreilly.com/transcripts/12345_english.vtt',
      'https://cdn.oreilly.com/transcripts/12345_EN.vtt',
      'https://cdn.oreilly.com/transcripts/12345_ENGLISH.vtt',
    ];
    const englishVtts = findBestEnglishVtt(urls);
    expect(pickFirst(englishVtts)).toBe('https://cdn.oreilly.com/transcripts/12345_english.vtt');
  });
});
import { describe, it, expect } from 'vitest';
import { findBestEnglishVtt } from './LiveEventTranscriptProcessingRules';

describe('findBestEnglishVtt (domain logic)', () => {
  it('returns an empty array if no URLs are provided', () => {
    expect(findBestEnglishVtt([])).toEqual([]);
  });

  it('returns the only .vtt file if it contains EN in the filename', () => {
    const urls = ['https://cdn.oreilly.com/transcripts/12345_EN.vtt'];
    expect(findBestEnglishVtt(urls)).toEqual([urls[0]]);
  });

  it('returns the only .vtt file if it contains English in the filename', () => {
    const urls = ['https://cdn.oreilly.com/transcripts/12345-English.vtt'];
    expect(findBestEnglishVtt(urls)).toEqual([urls[0]]);
  });

  it('returns the English .vtt file if multiple .vtt files are present', () => {
    const urls = [
      'https://cdn.oreilly.com/transcripts/12345_FR.vtt',
      'https://cdn.oreilly.com/transcripts/12345_EN.vtt',
      'https://cdn.oreilly.com/transcripts/12345_DE.vtt',
    ];
    expect(findBestEnglishVtt(urls)).toEqual(['https://cdn.oreilly.com/transcripts/12345_EN.vtt']);
  });

  it('returns all English .vtt files if multiple .vtt files with different cases are present', () => {
    const urls = [
      'https://cdn.oreilly.com/transcripts/12345_fr.vtt',
      'https://cdn.oreilly.com/transcripts/12345_en.vtt',
      'https://cdn.oreilly.com/transcripts/12345_english.vtt',
    ];
    expect(findBestEnglishVtt(urls)).toEqual([
      'https://cdn.oreilly.com/transcripts/12345_en.vtt',
      'https://cdn.oreilly.com/transcripts/12345_english.vtt',
    ]);
  });

  it('returns all English .vtt files if multiple matches are present', () => {
    const urls = [
      'https://cdn.oreilly.com/transcripts/12345_english.vtt',
      'https://cdn.oreilly.com/transcripts/12345_EN.vtt',
      'https://cdn.oreilly.com/transcripts/12345_ENGLISH.vtt',
    ];
    expect(findBestEnglishVtt(urls)).toEqual([
      'https://cdn.oreilly.com/transcripts/12345_english.vtt',
      'https://cdn.oreilly.com/transcripts/12345_EN.vtt',
      'https://cdn.oreilly.com/transcripts/12345_ENGLISH.vtt',
    ]);
  });

  it('returns an empty array if no English .vtt file is found', () => {
    const urls = [
      'https://cdn.oreilly.com/transcripts/12345_FR.vtt',
      'https://cdn.oreilly.com/transcripts/12345_DE.vtt',
    ];
    expect(findBestEnglishVtt(urls)).toEqual([]);
  });
});


describe('makeTranscriptFilenameFromTitle', () => {
  it('removes branding and formats a simple title', () => {
    expect(makeTranscriptFilenameFromTitle("My Awesome Live Event | O'Reilly")).toBe('My_Awesome_Live_Event_English_transcript.txt');
  });

  it('handles titles with special characters', () => {
    expect(makeTranscriptFilenameFromTitle('Data Science: The Next Gen! | O\'Reilly')).toBe('Data_Science_The_Next_Gen_English_transcript.txt');
  });

  it('handles titles with only the event name', () => {
    expect(makeTranscriptFilenameFromTitle('Just The Event Name')).toBe('Just_The_Event_Name_English_transcript.txt');
  });

  it('trims and cleans up leading/trailing underscores', () => {
    expect(makeTranscriptFilenameFromTitle('  Weird   Name  | O\'Reilly')).toBe('Weird_Name_English_transcript.txt');
  });

  it('handles empty or whitespace-only titles', () => {
    expect(makeTranscriptFilenameFromTitle('   | O\'Reilly')).toBe('_English_transcript.txt');
    expect(makeTranscriptFilenameFromTitle('   ')).toBe('_English_transcript.txt');
  });
});