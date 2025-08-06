import browser from 'webextension-polyfill';
import { handleDebugLogMessage } from './application/DebugLogService';


browser.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details);
});

// Store captured .vtt URLs per tab
const vttUrlsPerTab: { [tabId: number]: string[] } = {};



// Listen for .vtt requests and track them by tab
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const tabId = details.tabId;
    // Only process .vtt requests with a valid tab ID
    if (!details.url.includes('.vtt') || tabId == null || tabId === -1) return;

    // Get the array of URLs for this tab, or create it if it doesn't exist
    // This does NOT overwrite or destroy vttUrlsPerTab, just adds to it
    const urls = vttUrlsPerTab[tabId] ?? (vttUrlsPerTab[tabId] = []);

    // Only add new URLs (avoid duplicates)
    if (!urls.includes(details.url)) {
      urls.push(details.url);
      // Log for debugging: this is safe, just tracks new .vtt URLs per tab
      console.log(`Captured .vtt URL for tab ${tabId}: ${details.url}`);
    }
  },
  { urls: ["*://*/*.vtt*"] }
);

// Clean up when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  delete vttUrlsPerTab[tabId];
});




chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'DEBUG_LOG') {
    handleDebugLogMessage(message, sendResponse);
    return true; // Indicates async response
  }
  
  if (message.action === 'FIND_TRANSCRIPT_VTT') {
    // Respond with the raw list of VTT URLs for the sender's tab
    const tabId = sender?.tab?.id;
    const urls = (tabId != null && vttUrlsPerTab[tabId]) ? vttUrlsPerTab[tabId] : [];
    sendResponse({ vttUrls: urls });
    return true; // Indicates async response
  }
  
  // ...other message handlers...
});
