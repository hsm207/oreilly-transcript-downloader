// tests/extractTranscript.test.js
const {
  extractTranscriptFromDOM,
  getTranscriptBodyElement,
} = require("../src/extractTranscript");
describe("getTranscriptBodyElement", () => {
  let originalDocument;

  beforeEach(() => {
    originalDocument = global.document;
  });

  afterEach(() => {
    global.document = originalDocument;
  });

  it("returns the transcript body element from the DOM", () => {
    const dom = new JSDOM('<div data-testid="transcript-body"></div>');
    global.document = dom.window.document;
    const el = getTranscriptBodyElement();
    expect(el).not.toBeNull();
    expect(el.getAttribute("data-testid")).toBe("transcript-body");
  });

  it("returns null if the element is not found", () => {
    const dom = new JSDOM("<div></div>");
    global.document = dom.window.document;
    const el = getTranscriptBodyElement();
    expect(el).toBeNull();
  });
});

const fs = require("fs");
const path = require("path");
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

  it("extracts transcript from real sample.html and matches expected output", () => {
    const html = fs.readFileSync(
      path.join(__dirname, "fixtures", "sample.html"),
      "utf-8",
    );
    const dom = new JSDOM(html);
    const transcriptBody = dom.window.document.querySelector(
      'div[data-testid="transcript-body"]',
    );
    const result = extractTranscriptFromDOM(transcriptBody);
    const expected = fs.readFileSync(
      path.join(__dirname, "fixtures", "expected-transcript.txt"),
      "utf-8",
    );
    expect(result).toBe(expected.trim());
  });
});
