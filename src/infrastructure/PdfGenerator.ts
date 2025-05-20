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
  static async generateAndDownload(
    elements: BookChapterElement[],
    filename: string,
  ): Promise<void> {
    try {
      await PersistentLogger.info(`Generating PDF for ${filename}`);
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
              await PersistentLogger.warn(`Failed to load image: ${el.src}`);
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
          // The 'image' case is already handled by the `if (el.type === 'image')`
          // block at the beginning of the loop. This case is redundant and can be removed.
          // case 'image': {
          //   if (typeof window !== 'undefined') {
          //     try {
          //       const imgData = await PdfGenerator.loadImageAsDataUrl(el.src);
          //       // Scale image to fit usableWidth, keep aspect ratio, max height 100mm
          //       const img = new window.Image();
          //       img.src = el.src;
          //       await new Promise((res, rej) => {
          //         img.onload = res;
          //         img.onerror = rej;
          //       });
          //       let imgWidth = img.width;
          //       let imgHeight = img.height;
          //       // Convert px to mm (assuming 96dpi)
          //       const pxToMm = (px: number) => (px * 25.4) / 96;
          //       imgWidth = pxToMm(imgWidth);
          //       imgHeight = pxToMm(imgHeight);
          //       let drawWidth = Math.min(imgWidth, usableWidth);
          //       let drawHeight = imgHeight * (drawWidth / imgWidth);
          //       if (drawHeight > 100) {
          //         drawHeight = 100;
          //         drawWidth = imgWidth * (drawHeight / imgHeight);
          //       }
          //       if (y + drawHeight > pageHeight - bottomMargin) {
          //         doc.addPage();
          //         y = topMargin;
          //       }
          //       doc.addImage(imgData, 'JPEG', leftMargin, y, drawWidth, drawHeight);
          //       y += drawHeight + 2;
          //     } catch (err) {
          //       await PersistentLogger.warn(`Failed to load image: ${el.src}`);
          //     }
          //   }
          //   break;
          // }
        }
      }
      doc.save(filename);
      await PersistentLogger.info(`PDF download triggered: ${filename}`);
    } catch (err) {
      await PersistentLogger.error(
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
}
