import { BookChapterPdfService } from './application/BookChapterPdfService';
import { TranscriptDownloadStateRepository } from './infrastructure/TranscriptDownloadStateRepository';
import { DefaultTocExtractor } from './domain/extraction/TocExtractor';
import { waitForElement } from './infrastructure/DomUtils';
import { extractTranscript } from './domain/extraction/TranscriptExtractor';
import { downloadFile } from './domain/download/FileDownloader';
import { TranscriptToggler } from './domain/transcript/TranscriptToggler';
import { TocToggler } from './domain/toc/TocToggler';
import { AllTranscriptDownloadService } from './application/AllTranscriptDownloadService';
import { AllChapterPdfDownloadService } from './application/AllChapterPdfDownloadService';
import { BulkChapterDownloadStateRepository } from './infrastructure/BulkChapterDownloadStateRepository';
import { PersistentLogger } from './infrastructure/logging/PersistentLogger';
import { BookChapterExtractor } from './domain/extraction/BookChapterExtractor';
import { PdfGenerator } from './infrastructure/PdfGenerator';
import { LiveEventContentOrchestrator } from './application/LiveEventContentOrchestrator';

// On every page load, check if book chapter download state exists and resume download using the application service
const allChapterPdfDownloadService = new AllChapterPdfDownloadService(
  new DefaultTocExtractor(),
  new BookChapterPdfService(
    new BookChapterExtractor(PersistentLogger.instance),
    new PdfGenerator(),
    PersistentLogger.instance,
  ),
  PersistentLogger.instance,
  new BulkChapterDownloadStateRepository(),
);

allChapterPdfDownloadService.resumeDownloadIfNeeded();

// On every page load, check if transcript download state exists and resume download using the application service
const transcriptDownloadStateRepo = new TranscriptDownloadStateRepository();
const transcriptEnsurerInstance = new TranscriptToggler(PersistentLogger.instance);
const tocEnsurerInstance = new TocToggler();

const allTranscriptDownloadService = new AllTranscriptDownloadService(
  new DefaultTocExtractor(),
  (el) => extractTranscript(el, PersistentLogger.instance),
  { downloadFile },
  waitForElement,
  transcriptEnsurerInstance,
  async (url: string) => {
    window.location.href = url;
  },
  tocEnsurerInstance,
  PersistentLogger.instance,
);

allTranscriptDownloadService.resumeDownloadAllTranscriptsIfNeeded(
  transcriptDownloadStateRepo,
  () =>
    alert(
      'All transcripts processed. Please check the browser console for any warnings or errors regarding skipped items.',
    ),
  (error: unknown, title: string) =>
    alert(
      `An error occurred while processing: ${title}. Download stopped. Check console for details.`,
    ),
);

// Listen for messages from the popup
/**
 * Handles the "Download All Transcripts" action by delegating orchestration to the application service.
 * Keeps the content script thin and delegates workflow to AllTranscriptDownloadService.
 */
async function handleDownloadAllTranscripts() {
  await allTranscriptDownloadService.startDownloadAllTranscripts(
    transcriptDownloadStateRepo,
    (error) => {
      if (typeof error === 'string') {
        alert(error);
      } else {
        console.error('Error initiating batch download:', error);
        alert('Failed to start batch download. Check console for details.');
      }
    },
  );
}

async function handleDownloadTranscript() {
  // This is for regular video courses only
  await allTranscriptDownloadService.downloadSingleTranscript((error) => {
    if (typeof error === 'string') {
      alert(error);
    } else {
      console.error('Error downloading single transcript:', error);
      alert('Failed to download transcript. Check console for details.');
    }
  });
}

async function handleLiveClassTranscriptDownload(): Promise<void> {
  await LiveEventContentOrchestrator.downloadLiveEventTranscript();
}

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.action === 'DOWNLOAD_ALL_TRANSCRIPTS') {
    await handleDownloadAllTranscripts();
    return;
  }
  if (message.action === 'DOWNLOAD_TRANSCRIPT') {
    await handleDownloadTranscript();
    return;
  }
  if (message.action === 'DOWNLOAD_LIVE_EVENT_TRANSCRIPT') {
    await handleLiveClassTranscriptDownload();
    return;
  }
  if (message.action === 'DOWNLOAD_ALL_CHAPTERS_PDF') {
    await allChapterPdfDownloadService.startDownloadAllChapters();
    return;
  }
  if (message.action === 'DOWNLOAD_CHAPTER_PDF') {
    // Use chapter title or fallback
    const bookContent = document.getElementById('book-content');
    let filename = 'chapter.pdf';
    if (bookContent) {
      const h1 = bookContent.querySelector('h1');
      if (h1 && h1.textContent) {
        filename = h1.textContent.trim().replace(/\s+/g, '_') + '.pdf';
      }
      const bookChapterPdfService = new BookChapterPdfService(
        new BookChapterExtractor(PersistentLogger.instance),
        new PdfGenerator(),
        PersistentLogger.instance,
      );
      await bookChapterPdfService.downloadCurrentChapterAsPdf(filename);
    } else {
      alert('No book content found on this page.');
    }
    return;
  }
  return true;
});
