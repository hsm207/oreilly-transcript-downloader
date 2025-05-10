// tests/extractTranscript.test.js
const {
  extractTranscriptFromDOM,
  getTranscriptBodyElement,
} = require("../src/extractTranscript");
describe("getTranscriptBodyElement", () => {
  it("returns the transcript body element from the DOM", () => {
    const dom = new JSDOM('<div data-testid="transcript-body"></div>');
    // Patch global document for this test
    const originalDocument = global.document;
    global.document = dom.window.document;
    const el = getTranscriptBodyElement();
    expect(el).not.toBeNull();
    expect(el.getAttribute("data-testid")).toBe("transcript-body");
    global.document = originalDocument;
  });

  it("returns null if the element is not found", () => {
    const dom = new JSDOM("<div></div>");
    const originalDocument = global.document;
    global.document = dom.window.document;
    const el = getTranscriptBodyElement();
    expect(el).toBeNull();
    global.document = originalDocument;
  });
});
const { JSDOM } = require("jsdom");

describe("extractTranscriptFromDOM", () => {
  it("returns empty string if transcriptBody is null", () => {
    expect(extractTranscriptFromDOM(null)).toBe("");
  });

  it("returns empty string if no segments found", () => {
    const dom = new JSDOM('<div data-testid="transcript-body"></div>');
    const transcriptBody = dom.window.document.querySelector(
      'div[data-testid="transcript-body"]',
    );
    expect(extractTranscriptFromDOM(transcriptBody)).toBe("");
  });

  it("extracts transcript from valid DOM", () => {
    const html = `
        <div data-testid="transcript-body">
            <button class="css-1twdxea">
                <p>00:01</p>
                <p>Hello world</p>
            </button>
            <button class="css-1twdxea">
                <p>00:05</p>
                <p>Another line</p>
            </button>
        </div>`;
    const dom = new JSDOM(html);
    const transcriptBody = dom.window.document.querySelector(
      'div[data-testid="transcript-body"]',
    );
    const result = extractTranscriptFromDOM(transcriptBody);
    expect(result).toBe("00:01\nHello world\n\n00:05\nAnother line");
  });

  it("skips buttons without both timestamp and text", () => {
    const html = `
        <div data-testid="transcript-body">
            <button class="css-1twdxea">
                <p>00:01</p>
            </button>
            <button class="css-1twdxea">
                <p>00:05</p>
                <p>Valid line</p>
            </button>
        </div>`;
    const dom = new JSDOM(html);
    const transcriptBody = dom.window.document.querySelector(
      'div[data-testid="transcript-body"]',
    );
    const result = extractTranscriptFromDOM(transcriptBody);
    expect(result).toBe("00:05\nValid line");
  });
});
