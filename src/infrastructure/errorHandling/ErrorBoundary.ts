/**
 * Global Error Boundary
 *
 * Catches and handles uncaught exceptions and unhandled promise rejections.
 * Provides graceful error recovery and user-friendly error messages.
 */

import { logger } from '../logging/Logger';
import { toast } from '../../presentation/toast';

export interface ErrorBoundaryConfig {
  /** Enable user-facing error toasts. Default: true */
  showToasts?: boolean;

  /** Enable automatic error reporting. Default: false */
  enableReporting?: boolean;

  /** Custom error reporter function */
  onError?: (error: Error, context: ErrorContext) => void;

  /** Errors to ignore (e.g., third-party script errors) */
  ignoreErrors?: RegExp[];
}

export interface ErrorContext {
  type: 'error' | 'unhandledRejection';
  message: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  stack?: string;
  timestamp: number;
  [key: string]: unknown; // Index signature for compatibility with LogContext
}

/**
 * Global error boundary for handling uncaught exceptions.
 */
export class ErrorBoundary {
  private config: Required<Omit<ErrorBoundaryConfig, 'onError' | 'ignoreErrors'>> & {
    onError?: (error: Error, context: ErrorContext) => void;
    ignoreErrors?: RegExp[];
  };
  private errorCount = 0;
  private lastErrorTime = 0;
  private readonly ERROR_THROTTLE_MS = 5000; // Don't spam toasts
  private readonly MAX_ERRORS_BEFORE_DISABLE = 10;

  constructor(config: ErrorBoundaryConfig = {}) {
    this.config = {
      showToasts: config.showToasts ?? true,
      enableReporting: config.enableReporting ?? false,
      onError: config.onError,
      ignoreErrors: config.ignoreErrors,
    };
  }

  /**
   * Initializes the global error boundary.
   * Sets up handlers for uncaught exceptions and unhandled rejections.
   */
  init(): void {
    // Handle synchronous errors
    window.addEventListener('error', this.handleError.bind(this));

    // Handle promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));

    logger.info('Global error boundary initialized', {
      component: 'ErrorBoundary',
      action: 'init',
    });
  }

  /**
   * Handles uncaught errors.
   *
   * @param event - Error event
   */
  private handleError(event: ErrorEvent): void {
    const context: ErrorContext = {
      type: 'error',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
      timestamp: Date.now(),
    };

    // Check if we should ignore this error
    if (this.shouldIgnoreError(event.message)) {
      logger.debug('Ignoring error (matches ignore pattern)', context);
      return;
    }

    // Log the error
    logger.error(
      `Uncaught error: ${event.message}`,
      event.error,
      {
        ...context,
        component: 'ErrorBoundary',
      }
    );

    // Report to external service
    if (this.config.enableReporting && this.config.onError) {
      try {
        this.config.onError(event.error, context);
      } catch (reportError) {
        logger.error('Failed to report error', reportError as Error);
      }
    }

    // Show user-friendly message (throttled)
    if (this.config.showToasts && this.shouldShowToast()) {
      this.showErrorToast('An unexpected error occurred');
    }

    // Prevent default browser error handling
    event.preventDefault();
  }

  /**
   * Handles unhandled promise rejections.
   *
   * @param event - Promise rejection event
   */
  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));

    const context: ErrorContext = {
      type: 'unhandledRejection',
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
    };

    // Check if we should ignore this error
    if (this.shouldIgnoreError(error.message)) {
      logger.debug('Ignoring promise rejection (matches ignore pattern)', context);
      return;
    }

    // Log the error
    logger.error(
      `Unhandled promise rejection: ${error.message}`,
      error,
      {
        ...context,
        component: 'ErrorBoundary',
      }
    );

    // Report to external service
    if (this.config.enableReporting && this.config.onError) {
      try {
        this.config.onError(error, context);
      } catch (reportError) {
        logger.error('Failed to report error', reportError as Error);
      }
    }

    // Show user-friendly message (throttled)
    if (this.config.showToasts && this.shouldShowToast()) {
      this.showErrorToast('An operation failed unexpectedly');
    }

    // Prevent default browser error handling
    event.preventDefault();
  }

  /**
   * Checks if an error should be ignored based on ignore patterns.
   *
   * @param message - Error message
   * @returns True if error should be ignored
   */
  private shouldIgnoreError(message: string): boolean {
    if (!this.config.ignoreErrors || this.config.ignoreErrors.length === 0) {
      return false;
    }

    return this.config.ignoreErrors.some(pattern => pattern.test(message));
  }

  /**
   * Determines if we should show an error toast (throttling).
   *
   * @returns True if toast should be shown
   */
  private shouldShowToast(): boolean {
    const now = Date.now();

    // Check if we've hit the error limit
    if (this.errorCount >= this.MAX_ERRORS_BEFORE_DISABLE) {
      logger.warn('Error toast limit reached, disabling toasts', {
        component: 'ErrorBoundary',
        errorCount: this.errorCount,
      });
      return false;
    }

    // Throttle toasts
    if (now - this.lastErrorTime < this.ERROR_THROTTLE_MS) {
      return false;
    }

    this.errorCount++;
    this.lastErrorTime = now;
    return true;
  }

  /**
   * Shows a user-friendly error toast.
   *
   * @param message - Toast message
   */
  private showErrorToast(message: string): void {
    toast.error(message);
  }

  /**
   * Resets the error count (useful for testing or manual reset).
   */
  resetErrorCount(): void {
    this.errorCount = 0;
    this.lastErrorTime = 0;
  }

  /**
   * Gets the current error count.
   *
   * @returns Number of errors handled
   */
  getErrorCount(): number {
    return this.errorCount;
  }

  /**
   * Manually reports an error (useful for try-catch blocks).
   *
   * @param error - Error to report
   * @param additionalContext - Additional context information
   */
  reportError(error: Error, additionalContext?: Record<string, unknown>): void {
    const context: ErrorContext = {
      type: 'error',
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      ...additionalContext,
    };

    logger.error(`Manually reported error: ${error.message}`, error, {
      ...context,
      component: 'ErrorBoundary',
    });

    if (this.config.enableReporting && this.config.onError) {
      try {
        this.config.onError(error, context);
      } catch (reportError) {
        logger.error('Failed to report error', reportError as Error);
      }
    }
  }
}

/**
 * Global error boundary instance.
 */
export const errorBoundary = new ErrorBoundary({
  showToasts: true,
  enableReporting: false, // Enable this when integrating Sentry/LogRocket
  ignoreErrors: [
    // Ignore third-party script errors
    /Script error\./i,
    // Ignore ResizeObserver errors (benign)
    /ResizeObserver loop/i,
  ],
});
