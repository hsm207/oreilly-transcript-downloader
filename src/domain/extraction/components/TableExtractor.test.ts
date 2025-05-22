import { TableExtractor } from "./TableExtractor";
import { PersistentLogger } from "../../../infrastructure/logging/PersistentLogger";
import { describe, it, expect, afterEach } from "vitest";

describe('TableExtractor', () => {

  afterEach(() => {
    // No global mocks to clear in the instance-based approach
  });

  function createTable(html: string): HTMLElement {
    const div = document.createElement('div');
    div.innerHTML = html.trim();
    return div.querySelector('table') as HTMLElement;
  }

  // Mock logger instance with no-op methods
  class MockLogger extends PersistentLogger {
    setFormat(format: string): void {}
    async log(message: string, level: string = "log"): Promise<void> {}
    async info(message: string): Promise<void> {}
    async warn(message: string): Promise<void> {}
    async error(message: string): Promise<void> {}
    async debug(message: string): Promise<void> {}
  }

  it("extracts a simple table with header and body", () => {
    const table = createTable(`
      <table>
        <caption>Sample Table</caption>
        <thead>
          <tr><th>Header 1</th><th>Header 2</th></tr>
        </thead>
        <tbody>
          <tr><td>Cell 1</td><td>Cell 2</td></tr>
          <tr><td>Cell 3</td><td>Cell 4</td></tr>
        </tbody>
      </table>
    `);
    const extractor = new TableExtractor(new MockLogger());
    const result = extractor.extract(table);
    expect(result.type).toBe('table');
    expect((result as any).caption).toBe('Sample Table');
    expect((result as any).rows.length).toBe(3);
    expect((result as any).rows[0].cells[0].content).toBe('Header 1');
    expect((result as any).rows[0].cells[0].isHeader).toBe(true);
    expect((result as any).rows[1].cells[0].content).toBe('Cell 1');
    expect((result as any).rows[1].cells[0].isHeader).toBe(false);
  });

  it("extracts a table without caption", () => {
    const table = createTable(`
      <table>
        <tr><td>A</td><td>B</td></tr>
      </table>
    `);
    const extractor = new TableExtractor(new MockLogger());
    const result = extractor.extract(table);
    expect(result.type).toBe('table');
    expect((result as any).caption).toBeUndefined();
    expect((result as any).rows.length).toBe(1);
    expect((result as any).rows[0].cells[0].content).toBe('A');
  });

  it("handles colspan and rowspan", () => {
    const table = createTable(`
      <table>
        <tr><th colspan='2'>Header</th></tr>
        <tr><td rowspan='2'>A</td><td>B</td></tr>
        <tr><td>C</td></tr>
      </table>
    `);
    const extractor = new TableExtractor(new MockLogger());
    const result = extractor.extract(table);
    expect((result as any).rows[0].cells[0].colspan).toBe(2);
    expect((result as any).rows[1].cells[0].rowspan).toBe(2);
  });

  it("returns empty rows for empty table", () => {
    const table = createTable(`<table></table>`);
    const extractor = new TableExtractor(new MockLogger());
    const result = extractor.extract(table);
    expect(result.type).toBe('table');
    expect((result as any).rows.length).toBe(0);
  });
});
