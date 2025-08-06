import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as PopupService from './PopupService';
import { ContentType } from '../domain/content/ContentType';

// Mock chrome.tabs API
declare global {
  // eslint-disable-next-line no-var
  var chrome: any;
}

describe('PopupService', () => {
  let originalChrome: any;

  beforeEach(() => {
    originalChrome = globalThis.chrome;
    globalThis.chrome = {
      tabs: {
        query: vi.fn((query, cb) =>
          cb([{ id: 123, url: 'https://learning.oreilly.com/videos/1234/' }]),
        ),
        sendMessage: vi.fn(),
      },
    };
  });

  afterEach(() => {
    globalThis.chrome = originalChrome;
    vi.clearAllMocks();
  });

  it('requestAllTranscriptsDownload sends the correct message', () => {
    PopupService.requestAllTranscriptsDownload();
    expect(globalThis.chrome.tabs.sendMessage).toHaveBeenCalledWith(123, {
      action: 'DOWNLOAD_ALL_TRANSCRIPTS',
    });
  });

  it('requestTranscriptDownload sends the correct message', () => {
    PopupService.requestTranscriptDownload();
    expect(globalThis.chrome.tabs.sendMessage).toHaveBeenCalledWith(123, {
      action: 'DOWNLOAD_TRANSCRIPT',
    });
  });

  it('getCurrentPageInfo resolves with contentType Video for OReilly video URL', async () => {
    const result = await PopupService.getCurrentPageInfo();
    expect(result).toEqual({
      contentType: ContentType.Video,
      url: 'https://learning.oreilly.com/videos/1234/',
    });
  });

  it('getCurrentPageInfo resolves with contentType null if no tab', async () => {
    globalThis.chrome.tabs.query = vi.fn((query, cb) => cb([]));
    const result = await PopupService.getCurrentPageInfo();
    expect(result).toEqual({ contentType: null, url: null });
  });
});
