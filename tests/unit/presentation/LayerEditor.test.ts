import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  LayerEditor,
  parseLayers,
  outputUnits,
  countParameters,
  MAX_LAYERS,
  MAX_UNITS,
} from '../../../src/presentation/LayerEditor';

describe('parseLayers', () => {
  it('reads comma-separated positive integers', () => {
    expect(parseLayers('8, 4')).toEqual([8, 4]);
  });

  it('drops invalid entries', () => {
    expect(parseLayers('8, abc, 0, -2, 3')).toEqual([8, 3]);
    expect(parseLayers('')).toEqual([]);
  });
});

describe('outputUnits', () => {
  it('uses one unit for binary and one per class otherwise', () => {
    expect(outputUnits(2)).toBe(1);
    expect(outputUnits(3)).toBe(3);
  });
});

describe('countParameters', () => {
  it('counts weights and biases of every dense layer', () => {
    // 2→8: 16+8, 8→4: 32+4, 4→1: 4+1
    expect(countParameters([8, 4], 1)).toBe(65);
  });

  it('handles a network with no hidden layers', () => {
    expect(countParameters([], 1)).toBe(3);
  });
});

describe('LayerEditor', () => {
  let container: HTMLDivElement;
  let input: HTMLInputElement;
  let classes: HTMLSelectElement;
  let editor: LayerEditor;

  const button = (label: string): HTMLButtonElement =>
    container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`) as HTMLButtonElement;
  const summary = (): string => container.querySelector('.layer-summary')?.textContent ?? '';

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="layer-editor"></div>
      <input id="input-layers" value="8, 4" />
      <select id="input-num-classes"><option value="2" selected>2</option><option value="3">3</option></select>`;
    container = document.getElementById('layer-editor') as HTMLDivElement;
    input = document.getElementById('input-layers') as HTMLInputElement;
    classes = document.getElementById('input-num-classes') as HTMLSelectElement;
    editor = LayerEditor.fromDocument() as LayerEditor;
  });

  it('renders one row per hidden layer and a summary', () => {
    expect(container.querySelectorAll('.layer-row')).toHaveLength(2);
    expect(summary()).toBe('2 → 8 → 4 → 1 · 65 parameters');
  });

  it('writes changes back to the field and fires input and change', () => {
    const onInput = vi.fn();
    const onChange = vi.fn();
    input.addEventListener('input', onInput);
    input.addEventListener('change', onChange);

    button('More neurons in layer 1').click();

    expect(input.value).toBe('9, 4');
    expect(onInput).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(container.querySelector('.layer-units')?.textContent).toBe('9');
  });

  it('adds a layer copying the last size and removes layers', () => {
    button('Add a hidden layer').click();
    expect(input.value).toBe('8, 4, 4');
    button('Remove layer 1').click();
    expect(input.value).toBe('4, 4');
  });

  it('keeps at least one layer', () => {
    input.value = '5';
    input.dispatchEvent(new Event('input'));
    expect(button('Remove layer 1').disabled).toBe(true);
  });

  it('respects the unit and layer limits', () => {
    input.value = `1, ${MAX_UNITS}`;
    input.dispatchEvent(new Event('input'));
    expect(button('Fewer neurons in layer 1').disabled).toBe(true);
    expect(button('More neurons in layer 2').disabled).toBe(true);

    input.value = Array(MAX_LAYERS).fill(2).join(', ');
    input.dispatchEvent(new Event('input'));
    expect(button('Add a hidden layer').disabled).toBe(true);
  });

  it('re-renders when the field is typed in', () => {
    input.value = '16, 8, 4';
    input.dispatchEvent(new Event('input'));
    expect(container.querySelectorAll('.layer-row')).toHaveLength(3);
  });

  it('updates the output layer when the class count changes', () => {
    classes.value = '3';
    classes.dispatchEvent(new Event('change'));
    expect(summary()).toBe('2 → 8 → 4 → 3 · 75 parameters');
  });

  it('keeps focus on the pressed button after re-rendering', () => {
    button('More neurons in layer 2').focus();
    button('More neurons in layer 2').click();
    expect(document.activeElement?.getAttribute('aria-label')).toBe('More neurons in layer 2');
  });

  it('stops listening after dispose', () => {
    editor.dispose();
    expect(container.children).toHaveLength(0);
    input.value = '3';
    input.dispatchEvent(new Event('input'));
    expect(container.children).toHaveLength(0);
  });
});
