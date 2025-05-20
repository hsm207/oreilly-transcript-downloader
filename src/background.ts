import browser from 'webextension-polyfill';
import { handleDebugLogMessage } from './application/DebugLogService';

browser.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'DEBUG_LOG') {
    handleDebugLogMessage(message, sendResponse);
    return true; // Indicates async response
  }
  // ...other message handlers...
});
