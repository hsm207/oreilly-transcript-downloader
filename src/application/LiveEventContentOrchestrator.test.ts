import { describe, it, vi, expect, beforeEach } from 'vitest';
import { LiveEventContentOrchestrator } from './LiveEventContentOrchestrator';
import * as Rules from '../domain/extraction/LiveEventTranscriptProcessingRules';

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

describe('LiveEventContentOrchestrator (happy path)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('downloads the best English VTT file end-to-end with a user-friendly filename', async () => {
    const vttUrl = 'https://cdn.oreilly.com/transcript/1234_EN.vtt';
      const mockSendMessage = vi.fn().mockResolvedValueOnce({ vttUrls: [vttUrl] });
      // Use a real-ish VTT string so preprocessing produces output
      const vttContent = `WEBVTT\n\n00:00:01.000 --> 00:00:04.000\nHello world!\n\n00:00:05.000 --> 00:00:07.000\nThis is a test.`;
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        text: async () => vttContent,
      } as any);
    const mockDownloadFile = vi.fn();

    // Mock document.title
    const originalTitle = global.document?.title;
    Object.defineProperty(global.document, 'title', {
      value: 'My Awesome Live Event | O\'Reilly',
      configurable: true,
    });

    const orchestrator = new LiveEventContentOrchestrator(
      mockLogger as any,
      mockSendMessage,
      mockFetch as any,
      mockDownloadFile,
    );

    await orchestrator.downloadLiveEventTranscript();

    expect(mockSendMessage).toHaveBeenCalledWith({ action: 'FIND_TRANSCRIPT_VTT', tabId: null });
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Starting LiveEvent transcript download flow'),
    );
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining(vttUrl));
      // The processed transcript should match the expected output
      expect(mockDownloadFile).toHaveBeenCalledWith(
        'My_Awesome_Live_Event_English_transcript.txt',
        [
          '00:00:01.000 --> 00:00:04.000: Hello world!',
          '00:00:05.000 --> 00:00:07.000: This is a test.'
        ].join('\n'),
      );
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('completed successfully as My_Awesome_Live_Event_English_transcript.txt'),
    );

    // Restore document.title
    if (originalTitle !== undefined) {
      Object.defineProperty(global.document, 'title', {
        value: originalTitle,
        configurable: true,
      });
    }
  });
});
