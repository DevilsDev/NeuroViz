/**
 * Toast Notification System
 *
 * Provides a user-friendly alternative to browser alert() dialogs.
 * Toasts are non-blocking and automatically dismiss after a configurable duration.
 */

import { APP_CONFIG } from '../config/app.config';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  type?: ToastType;
  duration?: number;
  dismissible?: boolean;
}

/**
 * Toast container element (created on first toast)
 */
let toastContainer: HTMLDivElement | null = null;

/**
 * Initialize the toast container if it doesn't exist
 */
function ensureToastContainer(): HTMLDivElement {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    toastContainer.setAttribute('role', 'region');
    toastContainer.setAttribute('aria-label', 'Notifications');
    toastContainer.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

/**
 * Shows a toast notification
 *
 * @param message - The message to display
 * @param options - Toast configuration options
 * @returns A function to manually dismiss the toast
 *
 * @example
 * ```typescript
 * showToast('Dataset loaded successfully!', { type: 'success' });
 * showToast('Failed to initialize network', { type: 'error', duration: 8000 });
 * ```
 */
export function showToast(message: string, options: ToastOptions = {}): () => void {
  const {
    type = 'info',
    duration = APP_CONFIG.ui.toastDuration,
    dismissible = true,
  } = options;

  const container = ensureToastContainer();

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');

  // Icon based on type
  const icon = getToastIcon(type);

  // Message content
  const messageSpan = document.createElement('span');
  messageSpan.className = 'toast-message';
  messageSpan.textContent = message;

  toast.appendChild(icon);
  toast.appendChild(messageSpan);

  // Close button if dismissible
  if (dismissible) {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.setAttribute('aria-label', 'Close notification');
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => dismissToast(toast);
    toast.appendChild(closeBtn);
  }

  // Add to container with fade-in animation
  container.appendChild(toast);

  // Trigger reflow for animation
  toast.offsetHeight;
  toast.classList.add('toast-show');

  // Auto-dismiss after duration
  let timeoutId: number | null = null;
  if (duration > 0) {
    timeoutId = window.setTimeout(() => {
      dismissToast(toast);
    }, duration);
  }

  // Return manual dismiss function
  return () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    dismissToast(toast);
  };
}

/**
 * Dismisses a toast with fade-out animation
 */
function dismissToast(toast: HTMLDivElement): void {
  toast.classList.remove('toast-show');
  toast.classList.add('toast-hide');

  // Remove from DOM after animation
  setTimeout(() => {
    toast.remove();

    // Clean up container if empty
    if (toastContainer && toastContainer.children.length === 0) {
      toastContainer.remove();
      toastContainer = null;
    }
  }, APP_CONFIG.ui.toastAnimationDuration);
}

/**
 * Returns an icon element for the toast type
 */
function getToastIcon(type: ToastType): HTMLSpanElement {
  const icon = document.createElement('span');
  icon.className = 'toast-icon';
  icon.setAttribute('aria-hidden', 'true');

  switch (type) {
    case 'success':
      icon.innerHTML = '&#10003;'; // ✓
      break;
    case 'error':
      icon.innerHTML = '&#10006;'; // ✖
      break;
    case 'warning':
      icon.innerHTML = '&#9888;'; // ⚠
      break;
    case 'info':
    default:
      icon.innerHTML = '&#9432;'; // ℹ
      break;
  }

  return icon;
}

/**
 * Convenience methods for specific toast types
 */
export const toast = {
  success: (message: string, options?: Omit<ToastOptions, 'type'>) =>
    showToast(message, { ...options, type: 'success' }),

  error: (message: string, options?: Omit<ToastOptions, 'type'>) =>
    showToast(message, { ...options, type: 'error' }),

  warning: (message: string, options?: Omit<ToastOptions, 'type'>) =>
    showToast(message, { ...options, type: 'warning' }),

  info: (message: string, options?: Omit<ToastOptions, 'type'>) =>
    showToast(message, { ...options, type: 'info' }),
};
