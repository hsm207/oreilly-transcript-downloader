import { describe, it, vi, expect, beforeEach } from "vitest";
import { LiveEventContentOrchestrator } from "./LiveEventContentOrchestrator";

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

describe("LiveEventContentOrchestrator (happy path)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("downloads the best English VTT file end-to-end", async () => {
    const vttUrl = "https://cdn.oreilly.com/transcript/1234_EN.vtt";
    const mockSendMessage = vi.fn().mockResolvedValueOnce({ vttUrls: [vttUrl] });
    const mockFetch = vi.fn().mockResolvedValueOnce({ 
      ok: true, 
      text: () => Promise.resolve("WEBVTT\n...transcript...") 
    });
    const mockDownloadFile = vi.fn();
    
    const orchestrator = new LiveEventContentOrchestrator(
      mockLogger as any,
      mockSendMessage,
      mockFetch as any,
      mockDownloadFile
    );

    await orchestrator.downloadLiveEventTranscript();

    expect(mockSendMessage).toHaveBeenCalledWith({ action: "FIND_TRANSCRIPT_VTT", tabId: null });
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining("Starting LiveEvent transcript download flow"));
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining(vttUrl));
    expect(mockDownloadFile).toHaveBeenCalledWith("live-event-transcript.vtt", expect.stringContaining("WEBVTT"));
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining("completed successfully"));
  });
});
