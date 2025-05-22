/**
 * PersistentLogger forwards log messages to the background script,
 * including filename, line number, and timestamp.
 *
 * The log format is configurable via PersistentLogger.setFormat(format: string).
 * Supported tokens: {file}, {line}, {time}, {date}, {message}
 * Default: "{file} {line} {time} {date}: {message}"
 */
export class PersistentLogger {
  protected logFormat = '{file} {line} {time} {date}: {message}';
  static instance: PersistentLogger = new PersistentLogger();

  /**
   * Sets the log message format.
   * @param format The format string, e.g. "{file} {line} {time} {date}: {message}"
   */
  setFormat(format: string): void {
    this.logFormat = format;
  }

  /**
   * Sends a formatted log message to the background script.
   * @param message The message to log.
   * @param level The log level: 'log', 'info', 'warn', 'error', 'debug'. Defaults to 'log'.
   */
  async log(
    message: string,
    level: 'log' | 'info' | 'warn' | 'error' | 'debug' = 'log',
  ): Promise<void> {
    const { file, line } = PersistentLogger.getCallerInfo();
    const now = new Date();
    const time = now.toLocaleTimeString('en-GB', { hour12: false }).padStart(8, '0');
    const date = now.toISOString().slice(0, 10);
    const formatted = this.logFormat
      .replace('{file}', file)
      .replace('{line}', line)
      .replace('{time}', time)
      .replace('{date}', date)
      .replace('{message}', message);
    await chrome.runtime.sendMessage({
      type: 'DEBUG_LOG',
      action: 'log',
      payload: formatted,
      level,
    });
  }

  /**
   * Logs an info-level message.
   * @param message The message to log.
   */
  async info(message: string): Promise<void> {
    return this.log(message, 'info');
  }

  /**
   * Logs a warning-level message.
   * @param message The message to log.
   */
  async warn(message: string): Promise<void> {
    return this.log(message, 'warn');
  }

  /**
   * Logs an error-level message.
   * @param message The message to log.
   */
  async error(message: string): Promise<void> {
    return this.log(message, 'error');
  }

  /**
   * Logs a debug-level message.
   * @param message The message to log.
   */
  async debug(message: string): Promise<void> {
    return this.log(message, 'debug');
  }

  /**
   * Extracts caller file and line number from the stack trace.
   */
  private static getCallerInfo(): { file: string; line: string } {
    const err = new Error();
    const stack = err.stack?.split('\n') || [];
    const callerLine = stack[3] || '';
    const match = callerLine.match(/\/([^\/]+):(\d+):\d+\)?$/);
    if (match) {
      return { file: match[1], line: match[2] };
    }
    return { file: 'unknown', line: '0' };
  }
}
