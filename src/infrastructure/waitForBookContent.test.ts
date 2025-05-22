import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { waitForBookContent } from "./waitForBookContent";

describe("waitForBookContent", () => {
  let originalGetElementById: typeof document.getElementById;

  beforeEach(() => {
    originalGetElementById = document.getElementById;
  });

  afterEach(() => {
    // @ts-ignore
    document.getElementById = originalGetElementById;
    document.body.innerHTML = "";
  });

  it("resolves when book content is present and not loading", async () => {
    const div = document.createElement("div");
    div.id = "book-content";
    document.body.appendChild(div);

    await expect(waitForBookContent(500)).resolves.toBe(div);
  });

  it("waits until loading spinner container is gone (realistic DOM from file, async removal)", async () => {
    // Load the spinner DOM from testdata file
    const fs = await import("fs");
    const path = await import("path");
    const html = fs.readFileSync(
      path.resolve(__dirname, "__testdata__", "oreilly-spinner-book-content.html"),
      "utf8"
    );
    document.body.innerHTML = html;
    const bookContent = document.getElementById("book-content");
    // Remove the spinner container after 1 second (simulate async loading)
    setTimeout(() => {
      const spinner = bookContent?.querySelector(".orm-ChapterReader-loadContainer");
      if (spinner && spinner.parentElement) {
        spinner.parentElement.removeChild(spinner);
      }
    }, 1000);
    // Should resolve after spinner is removed, well before 5s timeout
    const start = Date.now();
    await expect(waitForBookContent(5000)).resolves.toBe(bookContent);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(950); // allow for timer drift
    expect(elapsed).toBeLessThan(2000); // should not take too long
  });

  it("rejects if book content never appears", async () => {
    await expect(waitForBookContent(300)).rejects.toThrow("Book content did not load in time.");
  });
});