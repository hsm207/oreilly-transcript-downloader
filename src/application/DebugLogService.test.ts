/**
 * @file DebugLogService.test.ts
 * @description Tests for handleDebugLogMessage in background script.
 */
import { describe, it, expect, vi } from 'vitest';
import { handleDebugLogMessage } from './DebugLogService';

describe('handleDebugLogMessage', () => {
  it('logs with console.log by default and responds with success', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const sendResponse = vi.fn();
    const message = {
      type: 'DEBUG_LOG',
      action: 'log',
      payload: 'test log payload',
    };
    handleDebugLogMessage(message, sendResponse);
    expect(logSpy).toHaveBeenCalledWith('[PersistentLogger] test log payload');
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
    logSpy.mockRestore();
  });

  it('logs with console.info for info level', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const sendResponse = vi.fn();
    const message = {
      type: 'DEBUG_LOG',
      action: 'log',
      payload: 'info message',
      level: 'info',
    };
    handleDebugLogMessage(message, sendResponse);
    expect(infoSpy).toHaveBeenCalledWith('[PersistentLogger] info message');
    infoSpy.mockRestore();
  });

  it('logs with console.warn for warn level', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const sendResponse = vi.fn();
    const message = {
      type: 'DEBUG_LOG',
      action: 'log',
      payload: 'warn message',
      level: 'warn',
    };
    handleDebugLogMessage(message, sendResponse);
    expect(warnSpy).toHaveBeenCalledWith('[PersistentLogger] warn message');
    warnSpy.mockRestore();
  });

  it('logs with console.error for error level', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const sendResponse = vi.fn();
    const message = {
      type: 'DEBUG_LOG',
      action: 'log',
      payload: 'error message',
      level: 'error',
    };
    handleDebugLogMessage(message, sendResponse);
    expect(errorSpy).toHaveBeenCalledWith('[PersistentLogger] error message');
    errorSpy.mockRestore();
  });

  it('logs with console.debug for debug level', () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const sendResponse = vi.fn();
    const message = {
      type: 'DEBUG_LOG',
      action: 'log',
      payload: 'debug message',
      level: 'debug',
    };
    handleDebugLogMessage(message, sendResponse);
    expect(debugSpy).toHaveBeenCalledWith('[PersistentLogger] debug message');
    debugSpy.mockRestore();
  });

  it('responds with error for unknown action', () => {
    const sendResponse = vi.fn();
    const message = {
      type: 'DEBUG_LOG',
      action: 'unknown',
      payload: 'should not log',
    };
    handleDebugLogMessage(message, sendResponse);
    expect(sendResponse).toHaveBeenCalledWith({ error: 'Unknown action' });
  });
});
