import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { politeWait } from "./politeWait";

describe("politeWait", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("waits for the default time (3000ms)", async () => {
    const promise = politeWait();
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(3000);
    await promise; // This should now resolve
    expect(vi.getTimerCount()).toBe(0);
  });

  it("waits for the specified time", async () => {
    const promise = politeWait(1500);
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(1500);
    await promise; // Should resolve after 1500ms
    expect(vi.getTimerCount()).toBe(0);
  });
});