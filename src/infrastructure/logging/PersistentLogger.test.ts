/**
 * @file PersistentLogger.test.ts
 * @description Tests for PersistentLogger utility.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PersistentLogger } from './PersistentLogger';



describe('PersistentLogger', () => {

  let logger: PersistentLogger;
  let originalChrome: any;
  beforeEach(() => {
    // Save the original global.chrome so we can restore it after each test
    originalChrome = global.chrome;
    global.chrome = {
      runtime: {
        sendMessage: vi.fn().mockResolvedValue(undefined),
      },
    };
    logger = new PersistentLogger();
    logger.setFormat('{file} {line} {time} {date}: {message}');
  });

  afterEach(() => {
    // Restore the original global.chrome
    global.chrome = originalChrome;
  });

  it('formats and sends log messages to background', async () => {
    const msg = 'Test log message';
    await logger.log(msg);
    expect(global.chrome.runtime.sendMessage).toHaveBeenCalledTimes(1);
    const call = global.chrome.runtime.sendMessage.mock.calls[0][0];
    expect(call.type).toBe('DEBUG_LOG');
    expect(call.action).toBe('log');
    // Allow for possible variations in file name (e.g., .spec.ts or .test.ts)
    expect(call.payload).toMatch(
      /(PersistentLogger\.(test|spec)\.ts) \d+ \d{2}:\d{2}:\d{2} \d{4}-\d{2}-\d{2}: Test log message/
    );
  });

  it('allows custom log format', async () => {
    logger.setFormat('[MSG] {message} @ {file}:{line}');
    await logger.log('Custom format!');
    const call = global.chrome.runtime.sendMessage.mock.calls[0][0];
    expect(call.payload).toMatch(/\[MSG\] Custom format! @ PersistentLogger\.(test|spec)\.ts:\d+/);
  });

  it('returns unknown file/line if stack is missing', async () => {
    // Patch Error.prepareStackTrace to simulate missing stack
    const origPrepare = Error.prepareStackTrace;
    const origStack = Object.getOwnPropertyDescriptor(Error.prototype, 'stack');
    try {
      Error.prepareStackTrace = () => undefined;
      Object.defineProperty(Error.prototype, 'stack', {
        get() {
          return undefined;
        },
        configurable: true,
      });
      await logger.log('No stack');
      expect(global.chrome.runtime.sendMessage).toHaveBeenCalled();
      const call = global.chrome.runtime.sendMessage.mock.calls[global.chrome.runtime.sendMessage.mock.calls.length - 1][0];
      expect(call.payload).toMatch(/unknown 0/);
    } finally {
      // Restore
      if (origStack) Object.defineProperty(Error.prototype, 'stack', origStack);
      Error.prepareStackTrace = origPrepare;
    }
  });
});
