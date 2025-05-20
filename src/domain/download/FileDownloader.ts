// Domain: FileDownloader
import { PersistentLogger } from '../../infrastructure/logging/PersistentLogger';

/**
 * Downloads a file and logs the action.
 * @param filename The name of the file to download.
 * @param content The content of the file.
 */
export async function downloadFile(filename: string, content: string) {
  await PersistentLogger.log(`Downloading file: ${filename}`);
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}
