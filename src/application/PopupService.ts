// Application: PopupService
// Service for handling popup-related application logic.

import { isOReillyVideoPage } from '../domain/content/ContentDetector';
/**
 * Sends a message to the content script of the active tab to initiate download of all chapters as PDFs.
 */
export function requestAllChaptersPdfDownload(): void {
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
      const tabId = tabs[0]?.id;
      if (tabId) {
        chrome.tabs.sendMessage(tabId, { action: 'DOWNLOAD_ALL_CHAPTERS_PDF' });
        console.log('DOWNLOAD_ALL_CHAPTERS_PDF message sent to tab:', tabId);
      } else {
        console.warn('No active tab found to send DOWNLOAD_ALL_CHAPTERS_PDF message.');
      }
    });
  } else {
    console.warn('chrome.tabs API not available for sending message.');
  }
}
/**
 * Sends a message to the content script of the active tab to initiate chapter PDF download.
 */
export function requestChapterPdfDownload(): void {
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
      const tabId = tabs[0]?.id;
      if (tabId) {
        chrome.tabs.sendMessage(tabId, { action: 'DOWNLOAD_CHAPTER_PDF' });
        console.log('DOWNLOAD_CHAPTER_PDF message sent to tab:', tabId);
      } else {
        console.warn('No active tab found to send DOWNLOAD_CHAPTER_PDF message.');
      }
    });
  } else {
    console.warn('chrome.tabs API not available for sending message.');
  }
}

/**
 * Sends a message to the content script of the active tab to initiate download of all transcripts in the module.
 */
export function requestAllTranscriptsDownload(): void {
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
      const tabId = tabs[0]?.id;
      if (tabId) {
        chrome.tabs.sendMessage(tabId, { action: 'DOWNLOAD_ALL_TRANSCRIPTS' });
        console.log('DOWNLOAD_ALL_TRANSCRIPTS message sent to tab:', tabId);
      } else {
        console.warn('No active tab found to send DOWNLOAD_ALL_TRANSCRIPTS message.');
      }
    });
  } else {
    console.warn('chrome.tabs API not available for sending message.');
  }
}

/**
 * Retrieves the current tab's URL and determines if it's an O'Reilly video page.
 * @returns A promise that resolves to an object indicating if the current page is a video page.
 */
export async function getCurrentPageInfo(): Promise<{ isVideoPage: boolean; url: string | null }> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
        const currentTab = tabs && tabs[0];
        if (currentTab && currentTab.url) {
          const url = currentTab.url;
          resolve({ isVideoPage: isOReillyVideoPage(url), url });
        } else {
          resolve({ isVideoPage: false, url: null }); // No URL or tab found
        }
      });
    } else {
      // Fallback for environments where chrome.tabs is not available (e.g., testing)
      console.warn('chrome.tabs API not available. Returning default page info.');
      resolve({ isVideoPage: false, url: null });
    }
  });
}

/**
 * Sends a message to the content script of the active tab to initiate transcript download.
 */
export function requestTranscriptDownload(): void {
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
      const tabId = tabs[0]?.id;
      if (tabId) {
        chrome.tabs.sendMessage(tabId, { action: 'DOWNLOAD_TRANSCRIPT' });
        console.log('DOWNLOAD_TRANSCRIPT message sent to tab:', tabId);
      } else {
        console.warn('No active tab found to send DOWNLOAD_TRANSCRIPT message.');
      }
    });
  } else {
    console.warn('chrome.tabs API not available for sending message.');
  }
}
