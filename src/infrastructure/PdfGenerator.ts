import { jsPDF } from 'jspdf';
import { BookChapterElement } from '../domain/extraction/BookChapterExtractor';
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
      const doc = new jsPDF();
      let y = 20;
      for (const el of elements) {
        switch (el.type) {
          case 'heading':
            doc.setFontSize(16 + (6 - Math.min(el.level, 6)) * 2);
            doc.text(el.text, 15, y);
            y += 10;
            break;
          case 'paragraph':
            doc.setFontSize(12);
            doc.text(el.text, 15, y);
            y += 8;
            break;
          case 'list':
            doc.setFontSize(12);
            for (const item of el.items) {
              doc.text(`${el.ordered ? '•' : '-'} ${item}`, 20, y);
              y += 7;
            }
            break;
          case 'caption':
            doc.setFontSize(10);
            doc.text(el.text, 15, y);
            y += 7;
            break;
          case 'image':
            // For testability, skip image rendering if running in node
            if (typeof window !== 'undefined') {
              try {
                const imgData = await PdfGenerator.loadImageAsDataUrl(el.src);
                doc.addImage(imgData, 'JPEG', 15, y, 60, 40);
                y += 42;
              } catch (err) {
                await PersistentLogger.warn(`Failed to load image: ${el.src}`);
              }
            }
            break;
        }
        if (y > 270) {
          doc.addPage();
          y = 20;
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
