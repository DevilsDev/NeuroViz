import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KeyboardShortcuts } from '../../../src/utils/KeyboardShortcuts';

describe('KeyboardShortcuts', () => {
  let callbacks: {
    onStartPause: ReturnType<typeof vi.fn>;
    onStep: ReturnType<typeof vi.fn>;
    onReset: ReturnType<typeof vi.fn>;
    onPause: ReturnType<typeof vi.fn>;
    onToggleFullscreen: ReturnType<typeof vi.fn>;
    onToggleHelp: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    callbacks = {
      onStartPause: vi.fn(),
      onStep: vi.fn(),
      onReset: vi.fn(),
      onPause: vi.fn(),
      onToggleFullscreen: vi.fn(),
      onToggleHelp: vi.fn(),
    };
  });

  it('should call onStartPause when Space is pressed', () => {
    new KeyboardShortcuts(callbacks);

    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    document.body.dispatchEvent(event);

    expect(callbacks.onStartPause).toHaveBeenCalledOnce();
  });

  it('should call onStep when S is pressed', () => {
    new KeyboardShortcuts(callbacks);

    const event = new KeyboardEvent('keydown', { key: 's', bubbles: true, cancelable: true });
    document.body.dispatchEvent(event);

    expect(callbacks.onStep).toHaveBeenCalledOnce();
  });

  it('should call onReset when R is pressed', () => {
    new KeyboardShortcuts(callbacks);

    const event = new KeyboardEvent('keydown', { key: 'r', bubbles: true, cancelable: true });
    document.body.dispatchEvent(event);

    expect(callbacks.onReset).toHaveBeenCalledOnce();
  });

  it('should call onPause when Escape is pressed', () => {
    new KeyboardShortcuts(callbacks);

    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    document.body.dispatchEvent(event);

    expect(callbacks.onPause).toHaveBeenCalledOnce();
  });

  it('should call onToggleFullscreen when F is pressed', () => {
    new KeyboardShortcuts(callbacks);

    const event = new KeyboardEvent('keydown', { key: 'f', bubbles: true, cancelable: true });
    document.body.dispatchEvent(event);

    expect(callbacks.onToggleFullscreen).toHaveBeenCalledOnce();
  });

  it('should call onToggleHelp when ? is pressed', () => {
    new KeyboardShortcuts(callbacks);

    const event = new KeyboardEvent('keydown', { key: '?', bubbles: true, cancelable: true });
    document.body.dispatchEvent(event);

    expect(callbacks.onToggleHelp).toHaveBeenCalledOnce();
  });

  it('should not trigger shortcuts when typing in input field', () => {
    new KeyboardShortcuts(callbacks);

    const input = document.createElement('input');
    document.body.appendChild(input);

    const event = new KeyboardEvent('keydown', { key: 's', bubbles: true });
    Object.defineProperty(event, 'target', { value: input, enumerable: true });
    input.dispatchEvent(event);

    expect(callbacks.onStep).not.toHaveBeenCalled();
  });

  it('should not trigger shortcuts when typing in textarea', () => {
    new KeyboardShortcuts(callbacks);

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    const event = new KeyboardEvent('keydown', { key: 'r', bubbles: true });
    Object.defineProperty(event, 'target', { value: textarea, enumerable: true });
    textarea.dispatchEvent(event);

    expect(callbacks.onReset).not.toHaveBeenCalled();
  });

  it('should allow disabling shortcuts', () => {
    const shortcuts = new KeyboardShortcuts(callbacks);

    shortcuts.disable();

    const event = new KeyboardEvent('keydown', { key: 's' });
    document.dispatchEvent(event);

    expect(callbacks.onStep).not.toHaveBeenCalled();
  });

  it('should allow re-enabling shortcuts', () => {
    const shortcuts = new KeyboardShortcuts(callbacks);

    shortcuts.disable();
    shortcuts.enable();

    const event = new KeyboardEvent('keydown', { key: 's', bubbles: true, cancelable: true });
    document.body.dispatchEvent(event);

    expect(callbacks.onStep).toHaveBeenCalledOnce();
  });

  it('should report enabled state correctly', () => {
    const shortcuts = new KeyboardShortcuts(callbacks);

    expect(shortcuts.isEnabled()).toBe(true);

    shortcuts.disable();
    expect(shortcuts.isEnabled()).toBe(false);

    shortcuts.enable();
    expect(shortcuts.isEnabled()).toBe(true);
  });

  it('should handle uppercase keys', () => {
    new KeyboardShortcuts(callbacks);

    const event = new KeyboardEvent('keydown', { key: 'S', bubbles: true, cancelable: true });
    document.body.dispatchEvent(event);

    expect(callbacks.onStep).toHaveBeenCalledOnce();
  });

  it('should not trigger on contenteditable elements', () => {
    new KeyboardShortcuts(callbacks);

    const div = document.createElement('div');
    div.setAttribute('contenteditable', 'true');
    document.body.appendChild(div);

    const event = new KeyboardEvent('keydown', { key: 's', bubbles: true });
    Object.defineProperty(event, 'target', { value: div, enumerable: true });
    div.dispatchEvent(event);

    expect(callbacks.onStep).not.toHaveBeenCalled();
  });
});
