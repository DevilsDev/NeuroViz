/**
 * Modal dialog helper tests
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { bindModalDialog, isModalDialogOpen, type ModalDialogHandle } from '../../../src/utils/dialog';
import { KeyboardShortcuts } from '../../../src/utils/KeyboardShortcuts';

const flush = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 0));

function press(key: string, opts: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...opts });
  (document.activeElement ?? document.body).dispatchEvent(event);
  return event;
}

describe('bindModalDialog', () => {
  let handle: ModalDialogHandle;
  let opener: HTMLButtonElement;
  let dialog: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = `
      <button id="opener">Open</button>
      <div id="dlg" class="hidden" role="dialog" aria-modal="true">
        <button id="first">First</button>
        <div class="hidden"><button id="in-hidden-tab">Hidden</button></div>
        <input id="middle" />
        <button id="last">Last</button>
      </div>`;
    opener = document.getElementById('opener') as HTMLButtonElement;
    dialog = document.getElementById('dlg')!;
    handle = bindModalDialog(dialog);
  });

  afterEach(() => {
    handle.dispose();
    document.body.innerHTML = '';
  });

  it('moves focus into the dialog on open and restores it on close', () => {
    opener.focus();
    handle.open();
    expect(document.activeElement?.id).toBe('first');
    expect(isModalDialogOpen()).toBe(true);

    handle.close();
    expect(document.activeElement).toBe(opener);
    expect(isModalDialogOpen()).toBe(false);
  });

  it('reacts to external class toggles (e.g. other code removing "hidden")', async () => {
    opener.focus();
    dialog.classList.remove('hidden');
    await flush();
    expect(document.activeElement?.id).toBe('first');

    dialog.classList.add('hidden');
    await flush();
    expect(document.activeElement).toBe(opener);
  });

  it('closes on Escape and calls onClose', () => {
    handle.dispose();
    const onClose = vi.fn();
    handle = bindModalDialog(dialog, { onClose });
    handle.open();
    const event = press('Escape');
    expect(event.defaultPrevented).toBe(true);
    expect(dialog.classList.contains('hidden')).toBe(true);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('traps Tab and Shift+Tab, skipping controls in hidden sections', () => {
    handle.open();
    document.getElementById('last')!.focus();
    press('Tab');
    expect(document.activeElement?.id).toBe('first');

    press('Tab', { shiftKey: true });
    expect(document.activeElement?.id).toBe('last');
  });

  it('does not let the global Escape (pause) shortcut fire while open', () => {
    const onPause = vi.fn();
    const shortcuts = new KeyboardShortcuts({
      onStartPause: vi.fn(), onStep: vi.fn(), onReset: vi.fn(), onPause,
      onToggleFullscreen: vi.fn(), onToggleHelp: vi.fn(),
    });

    handle.open();
    press('Escape');
    expect(onPause).not.toHaveBeenCalled();

    press('Escape');
    expect(onPause).toHaveBeenCalledTimes(1);
    shortcuts.dispose();
  });

  it('uses returnFocusFallback when the opener is now inside a hidden section', () => {
    handle.dispose();
    document.body.insertAdjacentHTML('afterbegin',
      '<button id="menu">Menu</button><div id="dropdown"><button id="item">Item</button></div>');
    handle = bindModalDialog(dialog, { returnFocusFallback: () => document.getElementById('menu') });

    document.getElementById('item')!.focus();
    document.getElementById('dropdown')!.classList.add('hidden');
    handle.open();
    handle.close();
    expect(document.activeElement?.id).toBe('menu');
  });

  it('stops handling keys after dispose', () => {
    handle.open();
    handle.dispose();
    press('Escape');
    expect(dialog.classList.contains('hidden')).toBe(false);
  });
});
