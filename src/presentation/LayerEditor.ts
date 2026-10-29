/**
 * Visual editor for the hidden layers in the Model step.
 *
 * The comma-separated `#input-layers` field stays the source of truth (the
 * training controller, stale-model detection and undo all read it). The
 * editor renders that value as layer rows with − / + buttons and writes
 * every change back to the field, firing the same events typing would.
 */

export const MAX_LAYERS = 6;
export const MIN_UNITS = 1;
export const MAX_UNITS = 64;
const INPUT_FEATURES = 2;

/** Same rule as the training controller: positive integers, invalid entries dropped. */
export function parseLayers(text: string): number[] {
  return text
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n) && n > 0);
}

/** Output units for a classifier: one sigmoid unit for binary, else one per class. */
export function outputUnits(numClasses: number): number {
  return numClasses === 2 ? 1 : numClasses;
}

/** Trainable weights and biases of a dense network with the given hidden layers. */
export function countParameters(hidden: number[], outputs: number, inputs = INPUT_FEATURES): number {
  const sizes = [inputs, ...hidden, outputs];
  let total = 0;
  for (let i = 1; i < sizes.length; i++) {
    total += (sizes[i - 1] ?? 0) * (sizes[i] ?? 0) + (sizes[i] ?? 0);
  }
  return total;
}

export class LayerEditor {
  private readonly cleanup: Array<() => void> = [];

  constructor(
    private readonly container: HTMLElement,
    private readonly input: HTMLInputElement,
    private readonly numClasses: HTMLSelectElement | null
  ) {
    const onExternalChange = (): void => this.render();
    this.input.addEventListener('input', onExternalChange);
    this.cleanup.push(() => this.input.removeEventListener('input', onExternalChange));
    if (this.numClasses) {
      this.numClasses.addEventListener('change', onExternalChange);
      this.cleanup.push(() => this.numClasses?.removeEventListener('change', onExternalChange));
    }
    this.render();
  }

  static fromDocument(): LayerEditor | null {
    const container = document.getElementById('layer-editor');
    const input = document.getElementById('input-layers') as HTMLInputElement | null;
    if (!container || !input) return null;
    return new LayerEditor(container, input, document.getElementById('input-num-classes') as HTMLSelectElement | null);
  }

  dispose(): void {
    this.cleanup.splice(0).forEach((remove) => remove());
    this.container.replaceChildren();
  }

  private get layers(): number[] {
    return parseLayers(this.input.value);
  }

  private commit(layers: number[]): void {
    // Re-rendering replaces the buttons; remember which one had focus
    const focused = document.activeElement;
    const focusLabel = focused && this.container.contains(focused) ? focused.getAttribute('aria-label') : null;

    this.input.value = layers.join(', ');
    // Same events as typing, so controller listeners (stale badge etc.) react
    this.input.dispatchEvent(new Event('input', { bubbles: true }));
    this.input.dispatchEvent(new Event('change', { bubbles: true }));

    if (focusLabel) {
      const buttons = Array.from(this.container.querySelectorAll<HTMLButtonElement>('button'));
      const target = buttons.find((b) => b.getAttribute('aria-label') === focusLabel && !b.disabled)
        ?? buttons.find((b) => !b.disabled);
      target?.focus();
    }
  }

  private button(label: string, text: string, onClick: () => void, disabled = false): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'layer-btn';
    b.textContent = text;
    b.setAttribute('aria-label', label);
    b.disabled = disabled;
    b.addEventListener('click', onClick);
    return b;
  }

  render(): void {
    const layers = this.layers;
    const outputs = outputUnits(parseInt(this.numClasses?.value ?? '2', 10) || 2);
    const rows: HTMLElement[] = [];

    layers.forEach((units, index) => {
      const name = `layer ${index + 1}`;
      const row = document.createElement('div');
      row.className = 'layer-row';

      const title = document.createElement('span');
      title.className = 'layer-title';
      title.textContent = `Layer ${index + 1}`;

      const count = document.createElement('span');
      count.className = 'layer-units';
      count.textContent = String(units);
      count.setAttribute('aria-label', `${units} neurons in ${name}`);

      const unitsLabel = document.createElement('span');
      unitsLabel.className = 'layer-units-label';
      unitsLabel.textContent = units === 1 ? 'neuron' : 'neurons';

      const update = (value: number): void => {
        const next = [...layers];
        next[index] = Math.max(MIN_UNITS, Math.min(MAX_UNITS, value));
        this.commit(next);
      };

      row.append(
        title,
        this.button(`Fewer neurons in ${name}`, '−', () => update(units - 1), units <= MIN_UNITS),
        count,
        unitsLabel,
        this.button(`More neurons in ${name}`, '+', () => update(units + 1), units >= MAX_UNITS),
        this.button(`Remove ${name}`, '×', () => this.commit(layers.filter((_, i) => i !== index)), layers.length <= 1)
      );
      rows.push(row);
    });

    const add = this.button('Add a hidden layer', '+ Add layer', () => this.commit([...layers, layers[layers.length - 1] ?? 4]), layers.length >= MAX_LAYERS);
    add.className = 'layer-add';

    const summary = document.createElement('p');
    summary.className = 'layer-summary';
    summary.textContent = `${[INPUT_FEATURES, ...layers, outputs].join(' → ')} · ${countParameters(layers, outputs).toLocaleString('en')} parameters`;

    this.container.replaceChildren(...rows, add, summary);
  }
}
