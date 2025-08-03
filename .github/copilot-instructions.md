
# Copilot Instructions for O'Reilly Transcript Downloader

This project is a browser extension for downloading transcripts and chapters from O'Reilly online learning. It uses Vite, React, and follows Domain-Driven Design (DDD) principles. Read these instructions before making changes as an AI coding agent.

## Architecture & Key Patterns

- **Entry Points:**
  - `src/background.ts`: Handles extension events, messaging, and delegates to services.
  - `src/contentScript.ts`: Injected into O'Reilly pages, interacts with DOM, delegates to extraction logic.
  - `src/popup.tsx`: Popup UI, delegates to services in `application/` and `ui/`.
- **Domain Layer:** Pure business logic in `src/domain/` (e.g., transcript extraction, TOC parsing). All tests are colocated.
- **Application Layer:** Orchestrates workflows (e.g., `AllTranscriptDownloadService.ts`).
- **Infrastructure Layer:** Browser/DOM adapters and utilities (e.g., `DomUtils.ts`, repositories for state persistence).
- **UI Layer:** React components for popup/options.
- **Logging:** Use `PersistentLogger` (see `src/infrastructure/logging/PersistentLogger.ts`) for all logs that aid debugging or user support. Always use the correct log level (`info`, `warn`, `error`, `debug`).
- **State Persistence:** Use repositories in `infrastructure/` (e.g., `TranscriptDownloadStateRepository.ts`) for saving progress of batch operations.

## Developer Workflow

- **Build:** `npm run build` (uses Vite, outputs to `dist/`)
- **Test:** `npm run test` (uses Vitest, tests are colocated)
- **Format:** `npm run format` (uses Prettier)
- **Dev Server:** `npm run dev` (for local development)
- **Do not** use `npx` or direct Vite/Vitest commands; always use npm scripts.

## Project Conventions

- **File Placement:** Follow the structure in `CONTRIBUTING.md`. Keep entry points thin; place logic in domain/application layers.
- **Testing:** All tests are colocated with the code they test. Use Vitest. Write tests before features (TDD encouraged).
- **Naming:**
  - camelCase for variables/functions
  - PascalCase for classes/types
- **Style:**
  - Double quotes for strings
  - 2 spaces for indentation
  - Use TSDoc for documentation
  - Use `async/await` for async code
  - Use `const` for immutable, `let` for mutable
  - Use template literals for string building
- **React:** Use function components and hooks. UI logic is in `ui/`.

## Integration Points

- **TOC/Transcript Extraction:**
  - Use `TocExtractor` and `TranscriptExtractor` in `domain/extraction/` for parsing O'Reilly DOM.
  - Use `IToggler` for toggling visibility of content panels.
- **Batch Operations:**
  - Use state repositories for progress (e.g., `TranscriptDownloadStateRepository`).
  - Orchestrate with services in `application/`.

## Examples

- To add a new extraction feature, create logic in `domain/extraction/`, orchestrate in `application/`, and expose via entry points.
- To persist batch download state, use the appropriate repository in `infrastructure/`.
- To add a new UI button, update `ui/Popup.tsx` and connect to a service in `application/`.

Refer to `README.md` and `CONTRIBUTING.md` for more details. When in doubt, keep entry points thin and business logic pure.
