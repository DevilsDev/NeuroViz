import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ReproducibilityPanel } from '../../../src/presentation/ReproducibilityPanel';
import { MAX_SEED } from '../../../src/core/domain';

describe('ReproducibilityPanel', () => {
  let seed: HTMLInputElement;
  let lock: HTMLInputElement;
  let hint: HTMLElement;
  let panel: ReproducibilityPanel;

  beforeEach(() => {
    document.body.innerHTML = `
      <input id="input-seed" value="42" />
      <input id="input-seed-lock" type="checkbox" />
      <button id="btn-new-seed"></button>
      <p id="repro-hint"></p>`;
    seed = document.getElementById('input-seed') as HTMLInputElement;
    lock = document.getElementById('input-seed-lock') as HTMLInputElement;
    hint = document.getElementById('repro-hint') as HTMLElement;
    panel = ReproducibilityPanel.fromDocument() as ReproducibilityPanel;
  });

  afterEach(() => {
    panel.dispose();
    vi.restoreAllMocks();
  });

  it('draws a new seed for each load while unlocked', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(panel.seedForDataLoad()).toBe(1 + Math.floor(0.5 * MAX_SEED));
    expect(seed.value).toBe(String(1 + Math.floor(0.5 * MAX_SEED)));
  });

  it('keeps the seed while locked', () => {
    lock.checked = true;
    lock.dispatchEvent(new Event('change'));
    expect(panel.seedForDataLoad()).toBe(42);
    expect(panel.seedForDataLoad()).toBe(42);
  });

  it('explains what locking does', () => {
    expect(hint.textContent).toMatch(/new seed is drawn/);
    lock.checked = true;
    lock.dispatchEvent(new Event('change'));
    expect(hint.textContent).toMatch(/Same seed, same run/);
  });

  it('draws a seed on demand and announces the change', () => {
    const onChange = vi.fn();
    seed.addEventListener('change', onChange);
    vi.spyOn(Math, 'random').mockReturnValue(0);
    (document.getElementById('btn-new-seed') as HTMLButtonElement).click();
    expect(seed.value).toBe('1');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('flags an invalid seed and replaces it when one is needed', () => {
    seed.value = 'abc';
    seed.dispatchEvent(new Event('input'));
    expect(seed.getAttribute('aria-invalid')).toBe('true');
    lock.checked = true;
    const used = panel.currentSeed();
    expect(used).toBeGreaterThanOrEqual(1);
    expect(seed.value).toBe(String(used));
    expect(seed.getAttribute('aria-invalid')).toBe('false');
  });
});
