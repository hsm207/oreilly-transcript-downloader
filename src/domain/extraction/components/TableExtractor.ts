import { PersistentLogger } from '../../../infrastructure/logging/PersistentLogger';
import { BookChapterElement } from '../../models/BookChapterElement';
import { TextNormalizer } from './TextNormalizer';

/**
 * TableExtractor handles extraction of table content (caption, headers, data cells) from HTML tables.
 * It is designed to be pure and stateless.
 */
export class TableExtractor {
  private logger: PersistentLogger;

  constructor(logger: PersistentLogger = PersistentLogger.instance) {
    this.logger = logger;
  }
  /**
   * Extracts content from table elements, handling captions, headers, and data cells.
   * @param tableElement The HTML table element to process
   * @returns A BookChapterElement of type 'table'
   */
  public extract(tableElement: HTMLElement): BookChapterElement {
    this.logger?.debug?.('Processing table element');

    // Extract table rows and cells
    const rows: {
      cells: { content: string; isHeader: boolean; colspan: number; rowspan: number }[];
    }[] = [];

    // Check for table caption
    let caption: string | undefined = undefined;
    const captionElem = tableElement.querySelector('caption');
    if (captionElem && captionElem.textContent) {
      caption = TextNormalizer.normalizeText(captionElem.textContent);
      this.logger?.debug?.(`Found table caption: "${caption}"`);
    }

    // Process rows - first handle any rows in <thead> if present
    const theadElement = tableElement.querySelector('thead');
    if (theadElement) {
      const headerRows = theadElement.querySelectorAll('tr');
      headerRows.forEach((row) => {
        const rowData = TableExtractor.processTableRow(row, true);
        if (rowData.cells.length > 0) {
          rows.push(rowData);
        }
      });
    }

    // Process rows in <tbody>
    const tbodyElement = tableElement.querySelector('tbody') || tableElement;
    const bodyRows = tbodyElement.querySelectorAll('tr');
    bodyRows.forEach((row) => {
      // Default isHeader to false for tbody rows
      const rowData = TableExtractor.processTableRow(row, false);
      if (rowData.cells.length > 0) {
        rows.push(rowData);
      }
    });

    if (caption) {
      this.logger?.info?.(`Extracted table with caption and ${rows.length} rows`);
      return { type: 'table', rows, caption };
    } else {
      this.logger?.info?.(`Extracted table with ${rows.length} rows`);
      return { type: 'table', rows };
    }
  }

  /**
   * Process a single table row to extract cell data
   * @param rowElement The TR element to process
   * @param isHeaderRow Whether this row is in a thead element
   * @returns A TableRow object with extracted cells
   */
  private static processTableRow(
    rowElement: HTMLTableRowElement,
    isHeaderRow: boolean,
  ): { cells: { content: string; isHeader: boolean; colspan: number; rowspan: number }[] } {
    const cells: { content: string; isHeader: boolean; colspan: number; rowspan: number }[] = [];
    const cellElements = rowElement.querySelectorAll('th, td');
    cellElements.forEach((cellElem) => {
      const isHeader = cellElem.tagName.toLowerCase() === 'th' || isHeaderRow;
      const colspan = parseInt(cellElem.getAttribute('colspan') || '1', 10);
      const rowspan = parseInt(cellElem.getAttribute('rowspan') || '1', 10);
      const content = TextNormalizer.cleanNodeText(cellElem as HTMLElement);
      cells.push({ content, isHeader, colspan, rowspan });
    });
    return { cells };
  }
}
