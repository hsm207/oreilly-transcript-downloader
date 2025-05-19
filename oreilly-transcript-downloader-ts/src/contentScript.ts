// Content Script: Listens for transcript download requests and triggers extraction and download
import { TranscriptDownloadStateRepository } from './infrastructure/TranscriptDownloadStateRepository';
import { DefaultTocExtractor } from './domain/extraction/TocExtractor';
import { waitForElement } from './infrastructure/DomUtils';
import { extractTranscript } from './domain/extraction/TranscriptExtractor';
import { downloadFile } from './domain/download/FileDownloader';
import { TranscriptToggler } from './domain/transcript/TranscriptToggler'; // Implements IToggler for ensuring transcript panel visibility
import { TranscriptContentLoader } from './domain/transcript/TranscriptContentLoader'; // As per user attachment
import { TocToggler } from './domain/toc/TocToggler'; // For the TOC panel, implements IToggler

import { AllTranscriptDownloadService } from './application/AllTranscriptDownloadService';

// On every page load, check if transcript download state exists and resume download using the application service
const transcriptDownloadStateRepo = new TranscriptDownloadStateRepository();

// Instantiate services for the TRANSCRIPT PANEL
// TranscriptToggler implements IToggler and is used to ensure the transcript panel is visible.
const transcriptEnsurerInstance = new TranscriptToggler(); // IToggler for the transcript panel
const transcriptContentLoaderInstance = new TranscriptContentLoader(); // No constructor args as per user file

// Instantiate services for the TABLE OF CONTENTS (TOC)
const tocEnsurerInstance = new TocToggler(); // This is the IToggler for the TOC

const allTranscriptDownloadService = new AllTranscriptDownloadService(
  new DefaultTocExtractor(),
  extractTranscript,
  { downloadFile },
  waitForElement,
  transcriptEnsurerInstance, // IToggler for ensuring transcript panel visibility
  transcriptContentLoaderInstance, // For loading content in transcript panel
  async (url: string) => {
    window.location.href = url;
  },
  tocEnsurerInstance, // IToggler for the TOC panel
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
  await allTranscriptDownloadService.downloadSingleTranscript((error) => {
    if (typeof error === 'string') {
      alert(error);
    } else {
      console.error('Error downloading single transcript:', error);
      alert('Failed to download transcript. Check console for details.');
    }
  });
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
  return true;
});
