import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OverfittingRiskCard } from '../../../src/presentation/OverfittingRiskCard';

describe('OverfittingRiskCard', () => {
  let card: OverfittingRiskCard;
  let loaded: number | null;
  const part = (name: string): HTMLElement =>
    document.querySelector(`[data-risk="${name}"]`) as HTMLElement;
  const root = (): HTMLElement => document.getElementById('overfit-risk') as HTMLElement;
  const set = (id: string, value: string): void => {
    const el = document.getElementById(id) as HTMLInputElement;
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };

  beforeEach(() => {
    loaded = null;
    document.body.innerHTML = `
      <input id="input-layers" value="8, 4" />
      <select id="input-num-classes"><option value="2" selected>2</option><option value="3">3</option></select>
      <input id="input-samples" value="200" />
      <input id="input-noise" value="10" />
      <select id="input-val-split"><option value="20" selected>20</option><option value="50">50</option></select>
      <input id="input-l1" value="0" />
      <input id="input-l2" value="0" />
      <select id="input-dropout"><option value="0" selected>0</option><option value="0.2">0.2</option></select>
      <section id="overfit-risk">
        <span data-risk="level"></span>
        <div data-risk="meter"><span data-risk="fill"></span></div>
        <p data-risk="numbers"></p>
        <p data-risk="explanation"></p>
        <p data-risk="suggestion"></p>
      </section>`;
    card = OverfittingRiskCard.fromDocument(() => loaded) as OverfittingRiskCard;
  });

  afterEach(() => card.dispose());

  it('estimates the training set from the sliders before data loads', () => {
    // 2→8→4→1 = 65 parameters; 200 samples with 20% held out = 160
    expect(part('numbers').textContent).toBe('65 parameters · 160 training points');
    expect(root().dataset.level).toBe('low');
    expect(part('level').textContent).toBe('Low');
  });

  it('uses the loaded training set when there is one', () => {
    loaded = 40;
    card.update();
    expect(part('numbers').textContent).toBe('65 parameters · 40 training points');
    expect(root().dataset.level).toBe('moderate');
  });

  it('reacts to a bigger network', () => {
    set('input-layers', '32, 16');
    expect(root().dataset.level).toBe('high');
    expect(part('suggestion').textContent).toMatch(/L2/);
    expect(part('meter').getAttribute('aria-valuetext')).toBe('High risk');
    expect(part('fill').style.width).not.toBe('0%');
  });

  it('reacts to regularisation being switched on', () => {
    set('input-layers', '32, 16');
    const dropout = document.getElementById('input-dropout') as HTMLSelectElement;
    dropout.value = '0.2';
    dropout.dispatchEvent(new Event('change', { bubbles: true }));
    expect(root().dataset.level).toBe('moderate');
  });

  it('ignores unrelated inputs and stops listening after dispose', () => {
    card.dispose();
    set('input-layers', '64, 64');
    expect(root().dataset.level).toBe('low');
  });
});
