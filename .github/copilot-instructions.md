# Copilot Instructions

This project is a browser extension that allows users to download transcripts from videos on the O'''Reilly online learning platform. Once a user enables the transcript feature while watching a video, they can easily download the transcript as a text file with the click of a button. The extension also supports downloading all transcripts for a given course.

## Coding Principles

- Follow SOLID principles.
- Adhere to Clean Code practices.
- Employ Test-Driven Development (TDD).

## Development Workflow

After making any changes, please run the following commands to ensure code quality and functionality:

1.  `npm run format` - To format the code.
2.  `npm run test` - To run automated tests.
3.  `npm run build` - To build the project.

## Coding Standards

- Use camelCase for variable and function names (e.g., `transcriptBody`, `downloadTextFile`).
- Use PascalCase for class names (if any are introduced).
- Use double quotes for strings (e.g., `"downloadTranscript"`).
- Use 2 spaces for indentation.
- Use `function` keyword for top-level functions and consider arrow functions for callbacks where appropriate.
- Use `async/await` for asynchronous code.
- Use `const` for variables that will not be reassigned and `let` for variables that will be reassigned.
- Consider destructuring for objects and arrays where it improves readability.
- Use template literals for strings that involve variable concatenation.
- Use modern JavaScript features (ES6+) where appropriate and supported by the target browser environments for extensions.
