/**
 * Handles debug log messages in the background script.
 * Prints logs to the background console.
 */
export function handleDebugLogMessage(
  message: { type: string; action: string; payload?: string; level?: string },
  sendResponse: (response: any) => void,
): void {
  if (message.action === 'log' && typeof message.payload === 'string') {
    const level = message.level || 'log';
    // eslint-disable-next-line no-console
    if (level === 'info' && console.info) {
      console.info(`[PersistentLogger] ${message.payload}`);
    } else if (level === 'warn' && console.warn) {
      console.warn(`[PersistentLogger] ${message.payload}`);
    } else if (level === 'error' && console.error) {
      console.error(`[PersistentLogger] ${message.payload}`);
    } else if (level === 'debug' && console.debug) {
      console.debug(`[PersistentLogger] ${message.payload}`);
    } else {
      console.log(`[PersistentLogger] ${message.payload}`);
    }
    sendResponse({ success: true });
  } else {
    sendResponse({ error: 'Unknown action' });
  }
}
