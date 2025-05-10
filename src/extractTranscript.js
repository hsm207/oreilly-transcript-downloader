// src/extractTranscript.js
// Extracts transcript text from a transcriptBody DOM element

/**
 * Returns the transcript body element from the DOM, or null if not found.
 * @returns {Element|null}
 */
function getTranscriptBodyElement() {
  return document.querySelector('div[data-testid="transcript-body"]');
}

/**
 * Extracts the full transcript from the transcript body element.
 * @param {Element} transcriptBody - The DOM element containing transcript segments.
 * @returns {string} The extracted transcript text.
 */
function extractTranscriptFromDOM(transcriptBody) {
  if (!transcriptBody) return "";
  const segments = transcriptBody.querySelectorAll("button.css-1twdxea");
  if (segments.length === 0) return "";
  let fullTranscript = "";
  segments.forEach((button) => {
    const paragraphs = button.querySelectorAll("p");
    const timestampP = paragraphs[0];
    const textP = paragraphs[1];
    if (timestampP && textP) {
      const timestamp = timestampP.textContent.trim();
      const text = textP.textContent.trim();
      fullTranscript += `${timestamp}\n${text}\n\n`;
    }
  });
  return fullTranscript.trim();
}

// Export for use in content.js and tests
if (typeof module !== "undefined") {
  module.exports = { extractTranscriptFromDOM, getTranscriptBodyElement };
}

// Attach to window for browser usage (content script)
if (typeof window !== "undefined") {
  window.extractTranscriptFromDOM = extractTranscriptFromDOM;
  window.getTranscriptBodyElement = getTranscriptBodyElement;
}
