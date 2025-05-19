# Contributing to O'Reilly Transcript Downloader Extension

Welcome! This project is organized for clarity and ease of contribution, especially for those new to browser extension development. Here’s how the codebase is structured and how you can get started.

---

## 📁 Project Structure Overview

```
src/
│
├── background.ts                # Entry point for background logic (event listeners, messaging)
├── popup.ts                     # Entry point for popup UI logic
├── contentScript.ts             # Entry point for content script (runs in O'Reilly pages)
│
├── domain/                      # Core business logic and models
│   ├── content/                 # Content type detection and models
│   ├── extraction/              # Logic for extracting transcripts, TOC, chapters, etc.
│   └── download/                # Logic for downloading files (text, PDF, images)
│
├── application/                 # Orchestration and workflow logic
│
├── infrastructure/              # Browser/DOM utilities and adapters
│
├── ui/                          # UI components for popup/options
│
├── manifest.json                # Browser extension manifest
├── vitest.config.ts             # Vitest test configuration
└── ...
```

---

## 🗂️ Folder and File Responsibilities

- **src/background.ts**  
  Thin entry point for background logic. Handles extension events and delegates to application/domain logic.

- **src/popup.ts**  
  Thin entry point for the popup UI. Handles user interaction and delegates to UI components and services.

- **src/contentScript.ts**  
  Thin entry point injected into O’Reilly pages. Handles DOM interaction and delegates to extraction logic.

- **src/domain/**  
  Pure business logic and models (e.g., transcript extraction, content detection).  
  **Tests are colocated** (e.g., `TranscriptExtractor.test.ts`).

- **src/application/**  
  Services that coordinate domain logic (e.g., downloading all transcripts for a course).  
  **Tests are colocated**.

- **src/infrastructure/**  
  Utilities and adapters for browser APIs and DOM manipulation.  
  **Tests are colocated**.

- **src/ui/**  
  Popup and UI components.  
  **Tests are colocated**.

- **manifest.json**  
  Standard browser extension manifest.

---

## 🧪 Testing

- We use **Vitest** for all testing.
- **Tests are colocated** with the code they test (e.g., `TranscriptExtractor.ts` and `TranscriptExtractor.test.ts` in the same folder).
- Run all tests with:
  ```
  npx vitest
  ```
- Run in watch mode:
  ```
  npx vitest --watch
  ```

---

## 📝 Contribution Guidelines

- **Follow TDD:** Write tests before implementing new features or bug fixes.
- **Keep entry points thin:** Place most logic in domain/application layers.
- **Document your code:** Add comments and docstrings where helpful.
- **Ask questions:** If you’re unsure, open an issue or discussion!

---

Thank you for
