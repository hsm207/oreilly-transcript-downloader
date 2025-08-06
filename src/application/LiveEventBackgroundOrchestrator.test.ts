import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LiveEventBackgroundOrchestrator } from './LiveEventBackgroundOrchestrator';

const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
};

describe('LiveEventBackgroundOrchestrator (happy path)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('responds with the correct VTT URLs for the current tab', async () => {
    const tabId = 42;
    const vttUrls = ['https://cdn.oreilly.com/transcript/1234_EN.vtt'];
    const getTabsFn = vi.fn().mockResolvedValueOnce([{ id: tabId }]);
    const vttUrlsPerTab = { [tabId]: vttUrls };
    const orchestrator = new LiveEventBackgroundOrchestrator(
      mockLogger as any,
      getTabsFn,
      vttUrlsPerTab,
    );
    const sendResponse = vi.fn();

    await orchestrator.handleFindLiveEventTranscript(sendResponse);

    expect(getTabsFn).toHaveBeenCalledWith({ active: true, currentWindow: true });
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining(JSON.stringify(vttUrls)));
    expect(sendResponse).toHaveBeenCalledWith({ vttUrls });
  });
});
