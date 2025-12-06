/**
 * Context information for log entries
 */
export interface LogContext {
  component?: string;
  action?: string;
  [key: string]: unknown;
}

/**
 * Port for logging operations
 * Abstracts the logging mechanism (console, remote service, file, etc.)
 */
export interface ILogger {
  /**
   * Logs an informational message
   * @param message - Log message
   * @param context - Additional context information
   */
  info(message: string, context?: LogContext): void;

  /**
   * Logs a warning message
   * @param message - Log message
   * @param context - Additional context information
   */
  warn(message: string, context?: LogContext): void;

  /**
   * Logs an error message
   * @param message - Log message
   * @param error - Error object
   * @param context - Additional context information
   */
  error(message: string, error: Error, context?: LogContext): void;

  /**
   * Logs a debug message (only in development)
   * @param message - Log message
   * @param context - Additional context information
   */
  debug(message: string, context?: LogContext): void;
}
