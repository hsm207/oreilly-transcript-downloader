/**
 * @file PersistentLogger.test.ts
 * @description Tests for PersistentLogger utility.
 */
import { describe, it, expect, vi } from 'vitest';
import { PersistentLogger } from './PersistentLogger';

declare global {
  // eslint-disable-next-line no-var
  var chrome: any;
}

describe('PersistentLogger', () => {
  beforeEach(() => {
    global.chrome = {
      runtime: {
        sendMessage: vi.fn().mockResolvedValue(undefined),
      },
    };
    PersistentLogger.setFormat('{file} {line} {time} {date}: {message}');
  });

  it('formats and sends log messages to background', async () => {
    const msg = 'Test log message';
    await PersistentLogger.log(msg);
    expect(global.chrome.runtime.sendMessage).toHaveBeenCalled();
    const call = global.chrome.runtime.sendMessage.mock.calls[0][0];
    expect(call.type).toBe('DEBUG_LOG');
    expect(call.action).toBe('log');
    expect(call.payload).toMatch(
      /PersistentLogger\.test\.ts \d+ \d{2}:\d{2}:\d{2} \d{4}-\d{2}-\d{2}: Test log message/,
    );
  });

  it('allows custom log format', async () => {
    PersistentLogger.setFormat('[MSG] {message} @ {file}:{line}');
    await PersistentLogger.log('Custom format!');
    const call = global.chrome.runtime.sendMessage.mock.calls[0][0];
    expect(call.payload).toMatch(/\[MSG\] Custom format! @ PersistentLogger\.test\.ts:\d+/);
  });

  it('returns unknown file/line if stack is missing', async () => {
    // Patch Error.prepareStackTrace to simulate missing stack
    const origPrepare = Error.prepareStackTrace;
    Error.prepareStackTrace = () => undefined;
    const origStack = Object.getOwnPropertyDescriptor(Error.prototype, 'stack');
    Object.defineProperty(Error.prototype, 'stack', {
      get() {
        return undefined;
      },
      configurable: true,
    });
    await PersistentLogger.log('No stack');
    const call = global.chrome.runtime.sendMessage.mock.calls.pop()[0];
    expect(call.payload).toMatch(/unknown 0/);
    // Restore
    if (origStack) Object.defineProperty(Error.prototype, 'stack', origStack);
    Error.prepareStackTrace = origPrepare;
  });
});
