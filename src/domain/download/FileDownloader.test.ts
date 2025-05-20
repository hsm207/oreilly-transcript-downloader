/**
 * @file FileDownloader.test.ts
 * @description Tests for downloadFile domain logic with logging.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { downloadFile } from './FileDownloader';

vi.mock('../../infrastructure/logging/PersistentLogger', () => ({
  PersistentLogger: {
    log: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('downloadFile', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('logs the download action and triggers file download', async () => {
    const { PersistentLogger } = await import('../../infrastructure/logging/PersistentLogger');
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');
    // Use a real anchor element and only mock click
    const clickSpy = vi.fn();
    const origCreateElement = document.createElement;
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        const a = origCreateElement.call(document, 'a');
        a.click = clickSpy;
        return a;
      }
      return origCreateElement.call(document, tagName);
    });
    // Mock URL.createObjectURL and URL.revokeObjectURL
    const origCreate = URL.createObjectURL;
    const origRevoke = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();
    await downloadFile('test.txt', 'hello world');
    // Wait for setTimeout(…, 0) to run
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(PersistentLogger.log).toHaveBeenCalledWith('Downloading file: test.txt');
    expect(appendSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
    // Restore
    URL.createObjectURL = origCreate;
    URL.revokeObjectURL = origRevoke;
  });
});
