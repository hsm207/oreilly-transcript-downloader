import { jsPDF } from 'jspdf';
import { BookChapterElement } from '../domain/models/BookChapterElement';
import { PersistentLogger } from './logging/PersistentLogger';

/**
 * PdfGenerator converts BookChapterElement[] to a PDF and triggers download.
 */
export class PdfGenerator {
  /**
   * Generates a PDF from extracted chapter elements and triggers download.
   * @param elements Ordered chapter elements
   * @param filename Name for the downloaded PDF
   */
  async generateAndDownload(
    elements: BookChapterElement[],
    filename: string,
    logger: PersistentLogger = PersistentLogger.instance,
  ): Promise<void> {
    try {
      await logger.info(`Generating PDF for ${filename}`);
      // Set up jsPDF for A4 size, mm units
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageWidth = 210;
      const pageHeight = 297;
      const leftMargin = 20;
      const rightMargin = 20;
      const topMargin = 20;
      const bottomMargin = 20;
      const usableWidth = pageWidth - leftMargin - rightMargin;
      let y = topMargin;

      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        // Special handling: if image is immediately followed by caption, render together
        if (el.type === 'image') {
          if (typeof window !== 'undefined') {
            try {
              const imgData = await PdfGenerator.loadImageAsDataUrl(el.src);
              // Scale image to fit usableWidth, keep aspect ratio, max height 100mm
              const img = new window.Image();
              img.src = el.src;
              await new Promise((res, rej) => {
                img.onload = res;
                img.onerror = rej;
              });
              let imgWidth = img.width;
              let imgHeight = img.height;
              // Convert px to mm (assuming 96dpi)
              const pxToMm = (px: number) => (px * 25.4) / 96;
              imgWidth = pxToMm(imgWidth);
              imgHeight = pxToMm(imgHeight);
              let drawWidth = Math.min(imgWidth, usableWidth);
              let drawHeight = imgHeight * (drawWidth / imgWidth);
              if (drawHeight > 100) {
                drawHeight = 100;
                drawWidth = imgWidth * (drawHeight / imgHeight);
              }
              if (y + drawHeight > pageHeight - bottomMargin) {
                doc.addPage();
                y = topMargin;
              }
              doc.addImage(imgData, 'JPEG', leftMargin, y, drawWidth, drawHeight);
              y += drawHeight + 2;
              // If next element is a caption, render it right after the image
              const next = elements[i + 1];
              if (next && next.type === 'caption') {
                const fontSize = 10;
                doc.setFontSize(fontSize);
                doc.setTextColor(120);
                doc.setFont('helvetica', 'italic');
                const lines = doc.splitTextToSize(next.text, usableWidth);
                for (const line of lines) {
                  if (y + fontSize > pageHeight - bottomMargin) {
                    doc.addPage();
                    y = topMargin;
                  }
                  doc.text(line, leftMargin, y);
                  y += fontSize + 1;
                }
                doc.setTextColor(0);
                doc.setFont('helvetica', 'normal');
                i++; // Skip the caption in the next iteration
              }
            } catch (err) {
              await logger.warn(`Failed to load image: ${el.src}`);
            }
          }
          continue;
        }
        switch (el.type) {
          case 'heading': {
            const fontSize = 16 + (6 - Math.min(el.level, 6)) * 2;
            doc.setFontSize(fontSize);
            const lines = doc.splitTextToSize(el.text, usableWidth);
            for (const line of lines) {
              if (y + fontSize > pageHeight - bottomMargin) {
                doc.addPage();
                y = topMargin;
              }
              doc.text(line, leftMargin, y);
              y += fontSize + 2;
            }
            break;
          }
          case 'paragraph': {
            const fontSize = 12;
            doc.setFontSize(fontSize);
            const lines = doc.splitTextToSize(el.text, usableWidth);
            for (const line of lines) {
              if (y + fontSize > pageHeight - bottomMargin) {
                doc.addPage();
                y = topMargin;
              }
              doc.text(line, leftMargin, y);
              y += fontSize + 1;
            }
            break;
          }
          case 'list': {
            const fontSize = 12;
            doc.setFontSize(fontSize);
            for (const item of el.items) {
              const bullet = el.ordered ? '•' : '-';
              const lines = doc.splitTextToSize(`${bullet} ${item}`, usableWidth - 5);
              for (const line of lines) {
                if (y + fontSize > pageHeight - bottomMargin) {
                  doc.addPage();
                  y = topMargin;
                }
                doc.text(line, leftMargin + 5, y);
                y += fontSize + 1;
              }
            }
            break;
          }
          case 'caption': {
            // If this caption was already handled after an image, skip
            // (handled by the lookahead logic above)
            const fontSize = 10;
            doc.setFontSize(fontSize);
            doc.setTextColor(120);
            doc.setFont('helvetica', 'italic');
            const lines = doc.splitTextToSize(el.text, usableWidth);
            for (const line of lines) {
              if (y + fontSize > pageHeight - bottomMargin) {
                doc.addPage();
                y = topMargin;
              }
              doc.text(line, leftMargin, y);
              y += fontSize + 1;
            }
            doc.setTextColor(0);
            doc.setFont('helvetica', 'normal');
            break;
          }
          case 'table': {
            y = await PdfGenerator.renderTable(
              doc,
              el,
              leftMargin,
              y,
              usableWidth,
              pageHeight,
              bottomMargin,
              logger,
            );
            break;
          }
        }
      }
      doc.save(filename);
      await logger.info(`PDF download triggered: ${filename}`);
    } catch (err) {
      await logger.error(
        `PDF generation failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err;
    }
  }

  /**
   * Loads an image from a URL and returns a data URL (base64-encoded)
   */
  static loadImageAsDataUrl(src: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = 'Anonymous';
      img.onload = function () {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('No canvas context'));
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg'));
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  /**
   * Renders a table in the PDF
   * @param doc jsPDF document instance
   * @param table Table element to render
   * @param leftMargin Left margin in mm
   * @param y Current y position in mm
   * @param usableWidth Usable width for content in mm
   * @param pageHeight Page height in mm
   * @param bottomMargin Bottom margin in mm
   * @returns New y position after rendering table
   */
  static renderTable(
    doc: any,
    table: {
      rows: { cells: { content: string; isHeader: boolean; colspan: number; rowspan: number }[] }[];
      caption?: string;
    },
    leftMargin: number,
    y: number,
    usableWidth: number,
    pageHeight: number,
    bottomMargin: number,
    logger: PersistentLogger = PersistentLogger.instance,
  ): number {
    logger?.info?.(`Rendering table with ${table.rows.length} rows`);

    // Calculate cell dimensions
    const maxCellsInAnyRow = Math.max(
      ...table.rows.map((row) => {
        let cellCount = 0;
        row.cells.forEach((cell) => {
          cellCount += cell.colspan;
        });
        return cellCount;
      }),
    );

    // Base measurements
    const cellPadding = 2; // mm of padding inside each cell
    const baseRowHeight = 8; // mm base height, will expand based on content
    const borderWidth = 0.2; // mm border width

    // Calculate column widths - try to distribute evenly
    const baseColWidth = usableWidth / maxCellsInAnyRow;

    // If there's a caption, render it first
    if (table.caption) {
      logger?.debug?.(
        `Rendering table caption: ${table.caption.substring(0, 30)}${table.caption.length > 30 ? '...' : ''}`,
      );
      const captionFontSize = 10;
      doc.setFontSize(captionFontSize);
      doc.setTextColor(0); // Black
      doc.setFont('helvetica', 'italic');

      const captionLines = doc.splitTextToSize(table.caption, usableWidth);
      for (const line of captionLines) {
        if (y + captionFontSize > pageHeight - bottomMargin) {
          doc.addPage();
          y = 20; // topMargin
        }
        doc.text(line, leftMargin, y);
        y += captionFontSize + 1;
      }

      // Reset to normal text
      doc.setTextColor(0);
      doc.setFont('helvetica', 'normal');

      y += 2; // Extra space after caption
    }

    // Track cells that span multiple rows to handle rowspan
    const spannedCells: {
      startRow: number;
      startCol: number;
      content: string;
      isHeader: boolean;
      endRow: number;
      colspan: number;
    }[] = [];

    // First pass to determine row heights based on content
    const rowHeights: number[] = [];
    let currentY = y;

    // Store actual rendered positions of cells for second pass
    const cellPositions: { x: number; y: number; width: number; height: number }[][] =
      table.rows.map(() => []);

    // First pass: Calculate positions and heights
    for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex++) {
      const row = table.rows[rowIndex];
      let maxRowHeight = baseRowHeight;
      let currentX = leftMargin;
      let colIndex = 0;

      // Process each cell in the row
      for (let cellIndex = 0; cellIndex < row.cells.length; cellIndex++) {
        const cell = row.cells[cellIndex];

        // Check if we should skip this column due to a previous row's cell with rowspan
        while (
          spannedCells.some(
            (sc) => sc.startRow < rowIndex && rowIndex <= sc.endRow && sc.startCol === colIndex,
          )
        ) {
          // Skip this column as it's covered by a rowspan from previous row
          colIndex++;
        }

        // Calculate cell width based on colspan
        const cellWidth = baseColWidth * cell.colspan;

        // Determine cell content height
        const fontSize = 10;
        doc.setFontSize(fontSize);
        if (cell.isHeader) {
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setFont('helvetica', 'normal');
        }

        const textLines = doc.splitTextToSize(cell.content, cellWidth - cellPadding * 2);
        const textHeight = textLines.length * (fontSize + 1) + cellPadding * 2;

        // Update max height for this row
        maxRowHeight = Math.max(maxRowHeight, textHeight);

        // If this cell spans multiple rows, track it
        if (cell.rowspan > 1) {
          spannedCells.push({
            startRow: rowIndex,
            startCol: colIndex,
            content: cell.content,
            isHeader: cell.isHeader,
            endRow: rowIndex + cell.rowspan - 1,
            colspan: cell.colspan,
          });
        }

        // Store cell position for rendering in second pass
        cellPositions[rowIndex][cellIndex] = {
          x: currentX,
          y: currentY,
          width: cellWidth,
          height: 0, // Will be updated in second pass
        };

        // Advance column index by colspan
        colIndex += cell.colspan;
        // Advance x position
        currentX += cellWidth;
      }

      rowHeights[rowIndex] = maxRowHeight;
      currentY += maxRowHeight;
    }

    // Check if table needs to start on a new page
    if (y + rowHeights.reduce((sum, height) => sum + height, 0) > pageHeight - bottomMargin) {
      logger?.info?.('Table too tall for current page, adding new page');
      doc.addPage();
      y = 20; // topMargin

      // Reset cell positions for new page
      for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex++) {
        const row = table.rows[rowIndex];
        let currentY = y;
        for (let i = 0; i < rowIndex; i++) {
          currentY += rowHeights[i];
        }

        let currentX = leftMargin;
        let colIndex = 0;

        for (let cellIndex = 0; cellIndex < row.cells.length; cellIndex++) {
          // Skip columns that are covered by rowspans
          while (
            spannedCells.some(
              (sc) => sc.startRow < rowIndex && rowIndex <= sc.endRow && sc.startCol === colIndex,
            )
          ) {
            colIndex++;
          }

          const cell = row.cells[cellIndex];
          const cellWidth = baseColWidth * cell.colspan;

          cellPositions[rowIndex][cellIndex] = {
            x: currentX,
            y: currentY,
            width: cellWidth,
            height: 0,
          };

          colIndex += cell.colspan;
          currentX += cellWidth;
        }
      }
    }

    // Second pass: Draw borders and render content
    for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex++) {
      const row = table.rows[rowIndex];
      let currentY = y;
      for (let i = 0; i < rowIndex; i++) {
        currentY += rowHeights[i];
      }

      let colIndex = 0;

      for (let cellIndex = 0; cellIndex < row.cells.length; cellIndex++) {
        // Skip columns that are covered by rowspans
        while (
          spannedCells.some(
            (sc) => sc.startRow < rowIndex && rowIndex <= sc.endRow && sc.startCol === colIndex,
          )
        ) {
          colIndex++;
        }

        const cell = row.cells[cellIndex];
        const pos = cellPositions[rowIndex][cellIndex];

        if (!pos) continue; // Skip if position data is missing

        // Update cell height to use actual row height
        pos.height = rowHeights[rowIndex];

        // If this cell crosses a page boundary, handle it
        if (pos.y + pos.height > pageHeight - bottomMargin) {
          // This shouldn't happen since we check for page breaks before rendering,
          // but just in case, log a warning
          logger?.warn?.(`Cell at row ${rowIndex}, col ${colIndex} crosses page boundary`);
        }

        // Draw cell border
        doc.setLineWidth(borderWidth);
        doc.rect(pos.x, pos.y, pos.width, pos.height);

        // Render cell text
        doc.setFontSize(10);
        if (cell.isHeader) {
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setFont('helvetica', 'normal');
        }

        const textLines = doc.splitTextToSize(cell.content, pos.width - cellPadding * 2);

        // Center text vertically in cell
        const textHeight = textLines.length * (10 + 1);
        const textY = pos.y + cellPadding + (pos.height - textHeight) / 2;

        for (let lineIndex = 0; lineIndex < textLines.length; lineIndex++) {
          doc.text(textLines[lineIndex], pos.x + cellPadding, textY + lineIndex * (10 + 1));
        }

        colIndex += cell.colspan;
      }
    }

    // Return new y position after table
    return y + rowHeights.reduce((sum, height) => sum + height, 0) + 5; // 5mm margin after table
  }
}
