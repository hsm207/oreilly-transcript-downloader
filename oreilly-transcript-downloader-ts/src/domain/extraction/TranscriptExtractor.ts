// Domain: TranscriptExtractor
// Extracts transcript lines from a given DOM element containing the transcript.
// input: HTMLElement (root of transcript DOM)
// output: TranscriptLine[] (array of transcript line objects)

import { TranscriptLine } from '../models/TranscriptLine';

const TRANSCRIPT_BODY_SELECTOR = '[data-testid="transcript-body"]';
const TIME_SELECTOR = 'p.MuiTypography-uiBodySmall';
const TEXT_SELECTOR = 'p.MuiTypography-uiBody';

// Added more debug logging to help diagnose extraction issues
export function extractTranscriptLines(transcriptRoot: HTMLElement): TranscriptLine[] {
  // Check if we're starting with the transcript body already or need to find it
  const body =
    TRANSCRIPT_BODY_SELECTOR === '[data-testid="transcript-body"]' &&
    transcriptRoot.getAttribute('data-testid') === 'transcript-body'
      ? transcriptRoot
      : transcriptRoot.querySelector(TRANSCRIPT_BODY_SELECTOR);

  if (!body) {
    console.warn(
      '[extractTranscriptLines] No transcript body found with selector:',
      TRANSCRIPT_BODY_SELECTOR,
    );
    return [];
  }

  console.log(
    '[extractTranscriptLines] Found transcript body, looking for buttons with transcript lines',
  );

  const lines: TranscriptLine[] = [];
  const buttons = body.querySelectorAll('button');
  console.log(`[extractTranscriptLines] Found ${buttons.length} buttons in transcript body`);

  // If no buttons are found, throw an error (page layout likely changed)
  if (buttons.length === 0) {
    throw new Error(
      '[extractTranscriptLines] No transcript line buttons found. The page layout may have changed.',
    );
  } else {
    // Original button extraction logic
    buttons.forEach((btn) => {
      const time = btn.querySelector(TIME_SELECTOR)?.textContent?.trim();
      const text = btn.querySelector(TEXT_SELECTOR)?.textContent?.trim();
      if (time && text) {
        lines.push({ time, text });
      }
    });
  }

  console.log(`[extractTranscriptLines] Extracted ${lines.length} transcript lines`);
  // Log a sample line for debugging
  if (lines.length > 0) {
    console.log('[extractTranscriptLines] Sample line:', JSON.stringify(lines[0]));
  }

  return lines;
}

export function formatTranscript(lines: TranscriptLine[]): string {
  return lines.map((line) => `${line.time}\n${line.text}`).join('\n\n');
}

// For backward compatibility: extract and format in one step
export function extractTranscript(transcriptRoot: HTMLElement): string {
  return formatTranscript(extractTranscriptLines(transcriptRoot));
}
