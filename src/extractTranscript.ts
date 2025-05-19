// src/extractTranscript.ts
// Extracts transcript text from a transcriptBody DOM element (TypeScript version)

/**
 * Returns the transcript body element from the DOM, or null if not found.
 */
export function getTranscriptBodyElement(): Element | null {
  return document.querySelector("div[data-testid='transcript-body']");
}

/**
 * Extracts the full transcript from the transcript body element.
 * @param transcriptBody - The DOM element containing transcript segments.
 * @returns The extracted transcript text.
 */
export function extractTranscriptFromDOM(transcriptBody: Element | null): string {
  if (!transcriptBody) {
    return "";
  }
  const segments = transcriptBody.querySelectorAll<HTMLButtonElement>("button.css-1twdxea");
  if (segments.length === 0) {
    return "";
  }
  let fullTranscript = "";
  segments.forEach((button) => {
    const paragraphs = button.querySelectorAll<HTMLParagraphElement>("p");
    const [timestampP, textP] = paragraphs;
    if (timestampP && textP) {
      const timestamp = timestampP.textContent?.trim() ?? "";
      const text = textP.textContent?.trim() ?? "";
      fullTranscript += `${timestamp}\n${text}\n\n`;
    }
  });
  return fullTranscript.trim();
}
