/**
 * ELI5 tooltip manager tests
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ELI5TooltipManager, ELI5_EXPLANATIONS } from '../../../src/presentation/ELI5Tooltips';

describe('ELI5TooltipManager', () => {
  let manager: ELI5TooltipManager;
  const key = Object.keys(ELI5_EXPLANATIONS)[0]!;

  beforeEach(() => {
    document.body.innerHTML = `<button id="target" data-eli5="${key}">?</button>`;
    manager = new ELI5TooltipManager();
  });

  afterEach(() => {
    manager.dispose();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('shows the tooltip on keyboard focus and hides on blur', () => {
    vi.useFakeTimers();
    const target = document.getElementById('target')!;
    target.focus();
    const tooltip = document.getElementById('eli5-tooltip')!;
    expect(tooltip.style.display).toBe('block');
    expect(tooltip.textContent).toContain(ELI5_EXPLANATIONS[key]!.title);

    target.blur();
    vi.advanceTimersByTime(400);
    expect(tooltip.style.display).toBe('none');
    vi.useRealTimers();
  });

  it('removes every document listener it added on dispose', () => {
    manager.dispose();
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    manager = new ELI5TooltipManager();
    manager.dispose();

    expect(add.mock.calls.length).toBeGreaterThan(0);
    for (const [type, handler] of add.mock.calls) {
      expect(remove).toHaveBeenCalledWith(type, handler);
    }
    expect(document.getElementById('eli5-tooltip')).toBeNull();
  });
});
