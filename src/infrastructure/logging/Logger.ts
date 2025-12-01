/**
 * Logging Service
 *
 * Centralized logging system that:
 * - Provides structured logging with levels (debug, info, warn, error)
 * - Can be disabled in production
 * - Integrates with toast notifications
 * - Supports optional telemetry (Sentry, LogRocket, etc.)
 * - Provides performance timing utilities
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

export interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: LogContext;
  error?: Error;
}

/**
 * Logger configuration options.
 */
export interface LoggerConfig {
  /** Minimum log level to output. Default: INFO in production, DEBUG in development */
  minLevel?: LogLevel;

  /** Enable console output. Default: true */
  enableConsole?: boolean;

  /** Enable storing logs in memory. Default: false */
  enableHistory?: boolean;

  /** Maximum history size. Default: 100 */
  maxHistorySize?: number;

  /** Optional external logger (e.g., Sentry, LogRocket) */
  externalLogger?: ExternalLogger;
}

export interface ExternalLogger {
  captureException?(error: Error, context?: LogContext): void;
  captureMessage?(message: string, level: string, context?: LogContext): void;
}

/**
 * Centralized logging service.
 */
export class Logger {
  private config: Required<Omit<LoggerConfig, 'externalLogger'>> & { externalLogger?: ExternalLogger };
  private history: LogEntry[] = [];
  private timers: Map<string, number> = new Map();

  constructor(config: LoggerConfig = {}) {
    const isDevelopment = import.meta.env.DEV;

    this.config = {
      minLevel: config.minLevel ?? (isDevelopment ? LogLevel.DEBUG : LogLevel.INFO),
      enableConsole: config.enableConsole ?? true,
      enableHistory: config.enableHistory ?? false,
      maxHistorySize: config.maxHistorySize ?? 100,
      externalLogger: config.externalLogger,
    };
  }

  /**
   * Logs a debug message (development only).
   *
   * @param message - Log message
   * @param context - Optional context data
   *
   * @example
   * ```typescript
   * logger.debug('Training step completed', { epoch: 10, loss: 0.5 });
   * ```
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Logs an informational message.
   *
   * @param message - Log message
   * @param context - Optional context data
   *
   * @example
   * ```typescript
   * logger.info('Dataset loaded', { samples: 200 });
   * ```
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Logs a warning message.
   *
   * @param message - Log message
   * @param context - Optional context data
   *
   * @example
   * ```typescript
   * logger.warn('Training appears stuck', { epoch: 50, loss: 2.5 });
   * ```
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Logs an error message.
   *
   * @param message - Log message
   * @param error - Optional error object
   * @param context - Optional context data
   *
   * @example
   * ```typescript
   * logger.error('Failed to load model', error, { modelId: '123' });
   * ```
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context, error);

    // Send to external error tracking
    if (this.config.externalLogger?.captureException && error) {
      this.config.externalLogger.captureException(error, context);
    } else if (this.config.externalLogger?.captureMessage) {
      this.config.externalLogger.captureMessage(message, 'error', context);
    }
  }

  /**
   * Core logging method.
   *
   * @param level - Log level
   * @param message - Log message
   * @param context - Optional context
   * @param error - Optional error object
   * @returns The log entry
   */
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    // Check if this log level should be output
    if (level < this.config.minLevel) {
      // Still create entry for history even if not logged
      const entry: LogEntry = {
        level,
        message,
        timestamp: Date.now(),
        context,
        error,
      };

      if (this.config.enableHistory) {
        this.addToHistory(entry);
      }

      return entry;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      context,
      error,
    };

    // Console output
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Store in history
    if (this.config.enableHistory) {
      this.addToHistory(entry);
    }

    return entry;
  }

  /**
   * Outputs log entry to console.
   */
  private logToConsole(entry: LogEntry): void {
    const prefix = `[${this.getLevelName(entry.level)}]`;
    const timestamp = new Date(entry.timestamp).toISOString();
    const contextStr = entry.context ? JSON.stringify(entry.context) : '';

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.log(`${prefix} ${timestamp} ${entry.message}`, contextStr);
        break;
      case LogLevel.INFO:
        console.log(`${prefix} ${timestamp} ${entry.message}`, contextStr);
        break;
      case LogLevel.WARN:
        console.warn(`${prefix} ${timestamp} ${entry.message}`, contextStr);
        break;
      case LogLevel.ERROR:
        if (entry.error) {
          console.error(`${prefix} ${timestamp} ${entry.message}`, entry.error, contextStr);
        } else {
          console.error(`${prefix} ${timestamp} ${entry.message}`, contextStr);
        }
        break;
    }
  }

  /**
   * Adds entry to history buffer.
   */
  private addToHistory(entry: LogEntry): void {
    this.history.push(entry);

    // Trim history if it exceeds max size
    if (this.history.length > this.config.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * Gets the string name of a log level.
   */
  private getLevelName(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return 'DEBUG';
      case LogLevel.INFO:
        return 'INFO';
      case LogLevel.WARN:
        return 'WARN';
      case LogLevel.ERROR:
        return 'ERROR';
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * Starts a performance timer.
   *
   * @param label - Timer label
   *
   * @example
   * ```typescript
   * logger.time('training');
   * // ... training code ...
   * logger.timeEnd('training');  // Logs: "training: 1234ms"
   * ```
   */
  time(label: string): void {
    this.timers.set(label, performance.now());
  }

  /**
   * Ends a performance timer and logs the duration.
   *
   * @param label - Timer label
   * @returns Duration in milliseconds
   */
  timeEnd(label: string): number | undefined {
    const startTime = this.timers.get(label);
    if (!startTime) {
      this.warn(`Timer "${label}" does not exist`);
      return undefined;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(label);

    this.info(`${label}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  /**
   * Gets the log history.
   *
   * @returns Array of log entries
   */
  getHistory(): LogEntry[] {
    return [...this.history];
  }

  /**
   * Clears the log history.
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Sets the minimum log level.
   *
   * @param level - New minimum log level
   */
  setLevel(level: LogLevel): void {
    this.config.minLevel = level;
  }

  /**
   * Gets the current minimum log level.
   *
   * @returns Current log level
   */
  getLevel(): LogLevel {
    return this.config.minLevel;
  }

  /**
   * Enables or disables console output.
   *
   * @param enabled - Whether to enable console output
   */
  setConsoleEnabled(enabled: boolean): void {
    this.config.enableConsole = enabled;
  }

  /**
   * Checks if a log level would be output.
   *
   * @param level - Log level to check
   * @returns True if the level would be logged
   */
  isLevelEnabled(level: LogLevel): boolean {
    return level >= this.config.minLevel;
  }
}

/**
 * Global logger instance.
 */
export const logger = new Logger({
  enableHistory: true,
  maxHistorySize: 100,
});

/**
 * Creates a logger with a specific context that's included in all log calls.
 *
 * @param baseContext - Context to include in all logs
 * @returns Logger instance
 *
 * @example
 * ```typescript
 * const trainingLogger = createContextLogger({ component: 'TrainingSession' });
 * trainingLogger.info('Started training');  // Includes component: 'TrainingSession'
 * ```
 */
export function createContextLogger(baseContext: LogContext): Logger {
  const contextLogger = new Logger();

  // Override methods to include base context
  const originalDebug = contextLogger.debug.bind(contextLogger);
  const originalInfo = contextLogger.info.bind(contextLogger);
  const originalWarn = contextLogger.warn.bind(contextLogger);
  const originalError = contextLogger.error.bind(contextLogger);

  contextLogger.debug = (message: string, context?: LogContext) => {
    originalDebug(message, { ...baseContext, ...context });
  };

  contextLogger.info = (message: string, context?: LogContext) => {
    originalInfo(message, { ...baseContext, ...context });
  };

  contextLogger.warn = (message: string, context?: LogContext) => {
    originalWarn(message, { ...baseContext, ...context });
  };

  contextLogger.error = (message: string, error?: Error, context?: LogContext) => {
    originalError(message, error, { ...baseContext, ...context });
  };

  return contextLogger;
}
