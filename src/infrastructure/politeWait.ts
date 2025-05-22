/**
 * Waits for a specified number of milliseconds before resolving.
 * Use this to avoid hammering the server with rapid requests.
 * 
 * @param ms Number of milliseconds to wait (default: 3000)
 * @returns Promise that resolves after the specified time
 */
export async function politeWait(ms = 3000): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}