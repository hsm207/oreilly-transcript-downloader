const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");
const {
  extractTOCRoot,
  extractModuleLinksFromTOC,
} = require("../src/extractTOC");

describe("extractTOCRoot", () => {
  it("returns the TOC root element if present", () => {
    const html = fs.readFileSync(
      path.join(__dirname, "fixtures", "sample-toc.html"),
      "utf-8",
    );
    const dom = new JSDOM(html);
    const tocRoot = extractTOCRoot(dom.window.document);
    expect(tocRoot).not.toBeNull();
    expect(tocRoot.className).toBe("_tocScrollWrapper_kshag_1");
  });

  it("returns null if TOC is not present", () => {
    const html = "<div><ol></ol></div>";
    const dom = new JSDOM(html);
    const tocRoot = extractTOCRoot(dom.window.document);
    expect(tocRoot).toBeNull();
  });
});

describe("extractModuleLinksFromTOC", () => {
  it("extracts module titles and URLs from the sample TOC", () => {
    const html = fs.readFileSync(
      path.join(__dirname, "fixtures", "sample-toc.html"),
      "utf-8",
    );
    const dom = new JSDOM(html);
    const tocRoot = extractTOCRoot(dom.window.document);
    const modules = extractModuleLinksFromTOC(tocRoot);
    expect(modules).toEqual([
      {
        title: "Mr. Whiskers: Purr-gramming Basics - When Cats Write Code",
        url: "/videos/programming-with-pets/1234567890/1234567890-video111222/",
      },
      {
        title: "Rover: Fetch-Driven Development - A Dog's Approach to Testing",
        url: "/videos/programming-with-pets/1234567890/1234567890-video111223/",
      },
      {
        title:
          "Hammy the Hamster: Tiny Microservices - Small Solutions for Big Problems",
        url: "/videos/programming-with-pets/1234567890/1234567890-video111224/",
      },
      {
        title:
          "Polly the Parrot: Repeatable Code - When Copying Is Actually Good (Sponsored by Birdseed Labs)",
        url: "/videos/programming-with-pets/1234567890/1234567890-video111225/",
      },
      {
        title:
          "Bubbles the Goldfish: Memory Management - A Three-Second Approach to State",
        url: "/videos/programming-with-pets/1234567890/1234567890-video111226/",
      },
    ]);
  });
});
