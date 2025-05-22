import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BookChapterPdfService } from "./BookChapterPdfService";

describe("BookChapterPdfService", () => {
  let logger: any;
  let extractor: any;
  let pdfGenerator: any;
  let service: BookChapterPdfService;

  beforeEach(() => {
    logger = {
      info: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockResolvedValue(undefined),
      warn: vi.fn(),
      debug: vi.fn(),
      log: vi.fn(),
    };
    extractor = {
      extract: vi.fn().mockReturnValue(["element1", "element2"]),
    };
    pdfGenerator = {
      generateAndDownload: vi.fn().mockResolvedValue(undefined),
    };
    service = new BookChapterPdfService(extractor, pdfGenerator, logger);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("extracts chapter and triggers PDF download", async () => {
    // Setup DOM
    const div = document.createElement("div");
    div.id = "book-content";
    document.body.appendChild(div);
    await expect(service.downloadCurrentChapterAsPdf("chapter.pdf")).resolves.toBeUndefined();
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("Extracting chapter content"));
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("Generating PDF"));
    expect(extractor.extract).toHaveBeenCalledWith(div);
    expect(pdfGenerator.generateAndDownload).toHaveBeenCalledWith(["element1", "element2"], "chapter.pdf", logger);
    document.body.removeChild(div);
  });

  it("logs error and throws if #book-content is missing", async () => {
    await expect(service.downloadCurrentChapterAsPdf("fail.pdf")).rejects.toThrow();
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("#book-content not found"));
  });
});
