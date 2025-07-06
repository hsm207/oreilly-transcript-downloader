/**
 * Represents a cell in an HTML table, preserving its content and structure.
 * @property content - The text content of the cell
 * @property isHeader - Whether this is a header cell (from <th> or within <thead>)
 * @property colspan - Number of columns this cell spans (from colspan attribute)
 * @property rowspan - Number of rows this cell spans (from rowspan attribute)
 */
export interface TableCell {
  content: string;
  isHeader: boolean;
  colspan: number;
  rowspan: number;
}

/**
 * Represents a row in an HTML table containing one or more cells.
 * @property cells - Array of TableCell objects in this row
 */
export interface TableRow {
  cells: TableCell[];
}

export type BookChapterElement =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string; isChapterOpener?: boolean }
  | { type: 'image'; src: string; alt: string }
  | { type: 'caption'; text: string }
  | { type: 'list'; items: string[]; ordered: boolean }
  | { type: 'table'; rows: TableRow[]; caption?: string }
  | { type: 'preformatted'; text: string };
