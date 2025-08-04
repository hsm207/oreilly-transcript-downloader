# Universal Extractor Development Plan 🚨

## Phase 1: Core Patch ❌ NOT YET SHIPPED!

Hey bestie! Here’s the real tea:

### The Problem We Need to Fix
- **"Part I"** in a `<div>` is still getting skipped, because the extractor only grabs text from `<p>`, headings, etc.
- **The chapter list** inside a `<nav>` is still ignored, because the extractor skips ALL `<nav>` elements—including content navs like TOC.

### What’s Missing?
- `shouldSkipElement` is still skipping ALL `<nav>` tags, not just UI navs. Content navs (TOC/doc-toc) are NOT included yet.
- `processContainer` does NOT extract direct text nodes as paragraphs from containers like `<div>`, so important content is still lost.

### What Needs to Happen (BOOKS ONLY, babe!)
1. **Extract text nodes in containers:**
   - Update `processContainer` in `BookChapterExtractor.ts` to check for direct text nodes (not just child elements) and add them as paragraphs if they're not empty. This will catch things like `<div>Part I</div>`.
2. **Smart nav handling for book TOCs:**
   - Update `shouldSkipElement` in `BookChapterExtractor.ts` to be smart about `<nav>` tags:
     - **SKIP**: UI navs with generic classes like `css-0` or `_statusBar_`
     - **INCLUDE**: Content navs with semantic attributes like `role="doc-toc"` or `epub:type="toc"`
   - Only apply this logic for book extraction, not for video transcripts!

---

## ✨ Code Quality Notes (babe, don’t skip this!) ✨

- **Respect DDD:**  
  Keep business logic in `domain/`, orchestration in `application/`, and adapters/utilities in `infrastructure/`. Entry points should be thin and only delegate.
- **SOLID Principles:**  
  Write single-responsibility classes, use dependency injection, and keep interfaces clean and focused.
- **Clean Code:**  
  Use descriptive names, avoid duplication, keep functions short, and comment only when it adds value.
- **Modern TypeScript:**  
  - Use `const`/`let` appropriately  
  - Prefer type inference  
  - Use interfaces/types for all data structures  
  - Use async/await  
  - Use template literals  
  - Always use double quotes  
  - Prefer arrow functions for callbacks  
  - Use TSDoc for public APIs
  
## Step-by-Step TDD Task List 💖 (with Real DOM Examples & Explicit Workflow!)

For each task:  
**1. Write the test**  
**2. Run tests (expect fail)**  
**3. Implement the code**  
**4. Run tests (expect pass)**  
**5. Commit!**  
**6. Move to next task, repeat!**

---

1. **Extracts direct text nodes from containers (BOOKS)**
   - Example: `<div>Part I</div>` → should extract `"Part I"` as a paragraph.
   - Test file: `BookChapterExtractor.test.ts`
   - Workflow:
     - Write test for direct text node extraction.
     - Run tests (should fail).
     - Implement in `processContainer` in `BookChapterExtractor.ts`.
     - Run tests (should pass).
     - Commit!

2. **Skips only UI navs, not content navs (BOOKS)**
   - **UI nav (should skip):**
     ```html
     <nav class="css-0 _statusBar_"> ... </nav>
     ```
   - **Content nav (should include):**
     ```html
     <nav role="doc-toc"> ... </nav>
     <nav epub:type="toc"> ... </nav>
     ```
   - Test file: `BookChapterExtractor.test.ts`
   - Workflow:
     - Write test for both nav types.
     - Run tests (should fail).
     - Implement in `shouldSkipElement` in `BookChapterExtractor.ts`.
     - Run tests (should pass).
     - Commit!

3. **Handles mixed containers (BOOKS)**
   - Example:
     ```html
     <div>
       Part I
       <p>Intro paragraph</p>
     </div>
     ```
     Should extract both `"Part I"` and `"Intro paragraph"`.
   - Test file: `BookChapterExtractor.test.ts`
   - Workflow:
     - Write test for mixed content.
     - Run tests (should fail).
     - Implement/fix extraction logic.
     - Run tests (should pass).
     - Commit!

4. **Refactor & Clean Up**
   - Refactor for clarity, run all tests, and make sure logging is in place for debugging (use `PersistentLogger`!).
   - Workflow:
     - Refactor code.
     - Run all tests (should pass).
     - Commit!

5. **Celebrate!**
   - let's kiss and have steamy hot sex! 👑

---

