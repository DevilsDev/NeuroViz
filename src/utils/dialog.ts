/**
 * Accessible modal dialog behaviour for pre-existing markup.
 *
 * NeuroViz modals are plain elements shown/hidden by toggling a `hidden`
 * class from several places (buttons, keyboard shortcuts, controllers). Rather
 * than route every caller through one API, bindModalDialog() watches the
 * element's class attribute and, whenever it becomes visible:
 *  - remembers the previously focused element and moves focus into the dialog,
 *  - traps Tab / Shift+Tab inside the dialog,
 *  - closes on Escape (without letting global shortcuts see the key),
 * and when it is hidden again restores focus to where it was.
 */

const HIDDEN_CLASS = 'hidden';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export interface ModalDialogOptions {
  /** Called after the dialog has been closed via Escape or close(). */
  onClose?: () => void;
  /**
   * Where to return focus if the element that had focus at open time is gone
   * or now hidden (e.g. a menu item inside a dropdown that closed).
   */
  returnFocusFallback?: () => HTMLElement | null;
}

export interface ModalDialogHandle {
  open(): void;
  close(): void;
  isOpen(): boolean;
  /** Stops observing the dialog and removes any active key handling. */
  dispose(): void;
}

/** Stack of currently open dialogs; only the top one handles keys. */
const openStack: HTMLElement[] = [];

function isVisible(el: HTMLElement): boolean {
  return el.isConnected && !el.classList.contains(HIDDEN_CLASS);
}

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    el => !isInsideHiddenSection(el, container)
  );
}

/**
 * True if el sits in a `.hidden` subtree of container (or of the document when
 * container is omitted), e.g. an inactive tab or a closed dropdown.
 */
function isInsideHiddenSection(el: HTMLElement, container?: HTMLElement): boolean {
  for (let node: HTMLElement | null = el; node && node !== container; node = node.parentElement) {
    if (node.classList.contains(HIDDEN_CLASS)) return true;
  }
  return false;
}

function canReceiveFocus(el: HTMLElement | null | undefined): el is HTMLElement {
  return !!el && el.isConnected && !isInsideHiddenSection(el);
}

/**
 * Returns true when any modal dialog bound with bindModalDialog() is open.
 */
export function isModalDialogOpen(): boolean {
  return openStack.length > 0;
}

export function bindModalDialog(dialog: HTMLElement, options: ModalDialogOptions = {}): ModalDialogHandle {
  let active = false;
  let returnFocus: HTMLElement | null = null;

  const onKeydown = (e: KeyboardEvent): void => {
    if (!active || openStack[openStack.length - 1] !== dialog) return;

    if (e.key === 'Escape' || e.key === 'Esc') {
      e.preventDefault();
      e.stopPropagation();
      handle.close();
      return;
    }

    if (e.key === 'Tab') {
      const focusable = getFocusable(dialog);
      if (focusable.length === 0) {
        e.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const current = document.activeElement as HTMLElement | null;
      const inside = current !== null && dialog.contains(current);

      if (e.shiftKey) {
        if (!inside || current === first || current === dialog) {
          e.preventDefault();
          last.focus();
        }
      } else if (!inside || current === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const activate = (): void => {
    if (active) return;
    active = true;
    const current = document.activeElement;
    returnFocus = current instanceof HTMLElement && !dialog.contains(current) ? current : null;
    openStack.push(dialog);
    // Capture phase on window so this runs before document-level shortcut handlers
    window.addEventListener('keydown', onKeydown, true);

    if (!dialog.hasAttribute('tabindex')) dialog.setAttribute('tabindex', '-1');
    const target = getFocusable(dialog)[0] ?? dialog;
    target.focus();
  };

  const deactivate = (): void => {
    if (!active) return;
    active = false;
    window.removeEventListener('keydown', onKeydown, true);
    const index = openStack.lastIndexOf(dialog);
    if (index > -1) openStack.splice(index, 1);

    const saved = returnFocus;
    returnFocus = null;
    const focusTarget = canReceiveFocus(saved) ? saved : options.returnFocusFallback?.();
    if (canReceiveFocus(focusTarget)) {
      focusTarget.focus();
    }
  };

  const sync = (): void => {
    if (isVisible(dialog)) activate();
    else deactivate();
  };

  const observer = new MutationObserver(sync);
  observer.observe(dialog, { attributes: true, attributeFilter: ['class'] });

  const handle: ModalDialogHandle = {
    open(): void {
      dialog.classList.remove(HIDDEN_CLASS);
      sync();
    },
    close(): void {
      const wasOpen = isVisible(dialog);
      dialog.classList.add(HIDDEN_CLASS);
      sync();
      if (wasOpen) options.onClose?.();
    },
    isOpen(): boolean {
      return isVisible(dialog);
    },
    dispose(): void {
      observer.disconnect();
      deactivate();
    },
  };

  // Handle a dialog that is already visible when bound
  sync();
  return handle;
}
