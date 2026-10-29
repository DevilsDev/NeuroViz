/**
 * Overfitting-risk card in the Train step. Recomputes whenever a setting that
 * changes model size, data size or regularisation is edited, and when data loads.
 */
import { assessOverfittingRisk, type OverfittingRisk } from '../core/domain';
import { countParameters, outputUnits, parseLayers } from './LayerEditor';

/** Inputs whose changes can move the risk */
const WATCHED_IDS = [
  'input-layers',
  'input-num-classes',
  'input-samples',
  'input-noise',
  'input-val-split',
  'input-l1',
  'input-l2',
  'input-dropout',
] as const;

const LEVEL_LABEL = { low: 'Low', moderate: 'Moderate', high: 'High' } as const;

export interface RiskInputs {
  layers: number[];
  numClasses: number;
  trainingPoints: number;
  noise: number;
  l1: number;
  l2: number;
  dropout: number;
}

export class OverfittingRiskCard {
  private readonly cleanup: Array<() => void> = [];
  private lastKey = '';

  /**
   * @param loadedTrainingPoints - size of the loaded training set, or null
   *   when nothing is loaded (the card then estimates it from the sliders)
   */
  constructor(
    private readonly root: HTMLElement,
    private readonly loadedTrainingPoints: () => number | null
  ) {
    const onChange = (e: Event): void => {
      const id = (e.target as HTMLElement | null)?.id;
      if (id && (WATCHED_IDS as readonly string[]).includes(id)) this.update();
    };
    document.addEventListener('input', onChange);
    document.addEventListener('change', onChange);
    this.cleanup.push(() => {
      document.removeEventListener('input', onChange);
      document.removeEventListener('change', onChange);
    });
    this.update();
  }

  static fromDocument(loadedTrainingPoints: () => number | null): OverfittingRiskCard | null {
    const root = document.getElementById('overfit-risk');
    return root ? new OverfittingRiskCard(root, loadedTrainingPoints) : null;
  }

  dispose(): void {
    this.cleanup.splice(0).forEach((remove) => remove());
  }

  /** Reads the current settings from the page. */
  readInputs(): RiskInputs {
    const value = (id: string): string => (document.getElementById(id) as HTMLInputElement | null)?.value ?? '';
    const num = (id: string, fallback: number): number => {
      const n = parseFloat(value(id));
      return Number.isFinite(n) ? n : fallback;
    };
    const split = num('input-val-split', 20) / 100;
    const loaded = this.loadedTrainingPoints();
    return {
      layers: parseLayers(value('input-layers')),
      numClasses: num('input-num-classes', 2),
      trainingPoints: loaded ?? Math.round(num('input-samples', 200) * (1 - split)),
      noise: num('input-noise', 10) / 100,
      l1: num('input-l1', 0),
      l2: num('input-l2', 0),
      dropout: num('input-dropout', 0),
    };
  }

  update(): void {
    const inputs = this.readInputs();
    const key = JSON.stringify(inputs);
    if (key === this.lastKey) return;
    this.lastKey = key;

    const parameters = countParameters(inputs.layers, outputUnits(inputs.numClasses));
    const risk = assessOverfittingRisk({
      parameters,
      trainingPoints: inputs.trainingPoints,
      noise: inputs.noise,
      l1: inputs.l1,
      l2: inputs.l2,
      dropout: inputs.dropout,
    });
    this.render(risk, parameters, inputs.trainingPoints);
  }

  private render(risk: OverfittingRisk, parameters: number, points: number): void {
    const part = (name: string): HTMLElement | null => this.root.querySelector<HTMLElement>(`[data-risk="${name}"]`);
    this.root.dataset.level = risk.level;

    const badge = part('level');
    if (badge) badge.textContent = LEVEL_LABEL[risk.level];

    const percent = Math.round(risk.score * 100);
    const meter = part('meter');
    if (meter) {
      meter.setAttribute('aria-valuenow', String(percent));
      meter.setAttribute('aria-valuetext', `${LEVEL_LABEL[risk.level]} risk`);
    }
    const fill = part('fill');
    if (fill) fill.style.width = `${percent}%`;

    const numbers = part('numbers');
    if (numbers) {
      numbers.textContent = `${parameters.toLocaleString('en')} parameters · ${points.toLocaleString('en')} training points`;
    }
    const explanation = part('explanation');
    if (explanation) explanation.textContent = risk.explanation;
    const suggestion = part('suggestion');
    if (suggestion) suggestion.textContent = risk.suggestion;
  }
}
