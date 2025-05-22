import { describe, it, expect, beforeEach } from "vitest";
import { BookChapterDownloadStateRepository, BookChapterDownloadState } from "./BookChapterDownloadStateRepository";

describe("BookChapterDownloadStateRepository", () => {
  let repo: BookChapterDownloadStateRepository;

  beforeEach(() => {
    repo = new BookChapterDownloadStateRepository();
    localStorage.clear();
  });

  it("saves and loads state correctly", () => {
    const state: BookChapterDownloadState = {
      tocItems: [
        { title: "Chapter 1", href: "/chapter1" },
        { title: "Chapter 2", href: "/chapter2" },
      ],
      currentIndex: 1,
    };
    repo.save(state);
    const loaded = repo.load();
    expect(loaded).toEqual(state);
  });

  it("returns null if state is missing", () => {
    expect(repo.load()).toBeNull();
  });

  it("returns null if state is invalid JSON", () => {
    localStorage.setItem("oreilly_book_chapter_download_state", "{not valid json");
    expect(repo.load()).toBeNull();
  });

  it("clears the state", () => {
    const state: BookChapterDownloadState = {
      tocItems: [{ title: "Chapter 1", href: "/chapter1" }],
      currentIndex: 0,
    };
    repo.save(state);
    repo.clear();
    expect(repo.load()).toBeNull();
  });
});
