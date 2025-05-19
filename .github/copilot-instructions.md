# Copilot Instructions

This project is a browser extension that allows users to download transcripts from videos on the O'Reilly online learning platform. Once a user enables the transcript feature while watching a video, they can easily download the transcript as a text file with the click of a button. The extension also supports downloading all transcripts for a given course.

## Technical Architecture

- Web browser extension built using the Vite plugin web extension
- Follows Domain-Driven Design (DDD) principles
- Tests are colocated with the code they test
- Always refer to `CONTRIBUTING.md` for file placement guidelines

## Core Development Principles

- **SOLID Principles**: Follow single responsibility, open-closed, Liskov substitution, interface segregation, and dependency inversion
- **Clean Code Practices**: Write readable, maintainable, and self-documenting code
- **Test-Driven Development (TDD)**: Write tests before implementing features

## Development Workflow

After making changes, run these commands to ensure quality:

1. `npm run format` - Format the code
2. `npm run test` - Run automated tests
3. `npm run build` - Build the project
4. Always use `npx` when running Vite commands

## Coding Standards

- **Naming Conventions**:
  - Use camelCase for variables and functions (e.g., `transcriptBody`)
  - Use PascalCase for class names
- **Syntax and Style**:
  - Use double quotes for strings
  - Use 2 spaces for indentation
  - Use `function` keyword for top-level functions
  - Use arrow functions for callbacks when appropriate
  - Use TSDoc for documentation
- **Best Practices**:
  - Use `async/await` for asynchronous code
  - Use `const` for immutable variables, `let` for mutable ones
  - Use destructuring where it improves readability
  - Use template literals for string concatenation
  - Follow modern TypeScript and React conventions
  - Use modern JavaScript features (ES6+) where supported
