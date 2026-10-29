/**
 * Right-hand metrics column of the workspace: learning-curve tabs, the epoch
 * progress bar under the plot, and the "What the model is doing" insights.
 */
import type { TrainingState } from '../core/application/ITrainingSession';
import type { Hyperparameters } from '../core/domain';
import {
  ExplainMomentService,
  type DatasetType,
  type MomentExplanation,
} from '../infrastructure/education/ExplainMomentService';

/**
 * Wires the Loss / Accuracy switch on the learning-curve card.
 * @returns teardown that removes the listeners
 */
export function setupCurveTabs(root: ParentNode = document): () => void {
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-curve]'));
  const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-curve-panel]'));

  const show = (curve: string): void => {
    for (const b of buttons) {
      const on = b.dataset.curve === curve;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    }
    for (const p of panels) p.classList.toggle('hidden', p.dataset.curvePanel !== curve);
  };

  const handlers = buttons.map((b) => {
    const handler = (): void => show(b.dataset.curve ?? 'loss');
    b.addEventListener('click', handler);
    return () => b.removeEventListener('click', handler);
  });
  return () => handlers.forEach((remove) => remove());
}

/**
 * "Epoch 62 of 500" label and progress bar under the plot.
 */
export class EpochProgress {
  constructor(
    private readonly label: HTMLElement,
    private readonly fill: HTMLElement
  ) {}

  static fromDocument(): EpochProgress | null {
    const label = document.getElementById('epoch-progress-label');
    const fill = document.getElementById('epoch-progress-fill');
    return label && fill ? new EpochProgress(label, fill) : null;
  }

  update(state: TrainingState): void {
    const { currentEpoch, maxEpochs } = state;
    this.label.textContent = maxEpochs > 0 ? `Epoch ${currentEpoch} of ${maxEpochs}` : `Epoch ${currentEpoch}`;
    const fraction = maxEpochs > 0 ? Math.min(1, currentEpoch / maxEpochs) : 0;
    this.fill.style.width = `${(fraction * 100).toFixed(1)}%`;
  }
}

export interface Insight {
  kind: 'good' | 'info' | 'warning';
  title: string;
  message: string;
}

const KNOWN_DATASETS: readonly DatasetType[] = ['circle', 'xor', 'spiral', 'gaussian', 'custom'];

/**
 * Compares training and validation loss over the recent epochs.
 * Returns null until there is enough validation history to judge.
 */
export function overfittingInsight(state: TrainingState, window = 10): Insight | null {
  const records = state.history.records.filter((r) => r.valLoss !== null && Number.isFinite(r.valLoss));
  if (records.length < window * 2) return null;

  const recent = records.slice(-window);
  const before = records.slice(-window * 2, -window);
  const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;
  const valNow = mean(recent.map((r) => r.valLoss as number));
  const valBefore = mean(before.map((r) => r.valLoss as number));
  const trainNow = mean(recent.map((r) => r.loss));
  const trainBefore = mean(before.map((r) => r.loss));

  if (valNow > valBefore * 1.02 && trainNow < trainBefore) {
    return {
      kind: 'warning',
      title: 'Starting to overfit',
      message: 'Validation loss is rising while training loss keeps falling. Try L2 regularisation, dropout or early stopping.',
    };
  }
  if (valNow - trainNow > 0.15) {
    return {
      kind: 'warning',
      title: 'Large generalisation gap',
      message: `Validation loss is ${(valNow - trainNow).toFixed(2)} above training loss. More data or regularisation usually helps.`,
    };
  }
  return {
    kind: 'good',
    title: 'Generalising well',
    message: 'Validation loss is tracking training loss, so the model is not overfitting.',
  };
}

function momentToInsight(m: MomentExplanation): Insight {
  const kind: Insight['kind'] = m.type === 'warning' || m.type === 'plateau' ? 'warning' : m.type === 'success' ? 'good' : 'info';
  // The explainer's optional tip repeats the message in more words; keep the card short
  return { kind, title: m.title, message: m.message };
}

/**
 * Plain-language notes about the current run, refreshed every few epochs.
 */
export class InsightsPanel {
  private readonly explainer = new ExplainMomentService();
  private lastEpoch = -1;

  constructor(
    private readonly list: HTMLElement,
    private readonly getContext: () => { datasetType: string; config: Hyperparameters | null }
  ) {}

  static fromDocument(getContext: InsightsPanel['getContext']): InsightsPanel | null {
    const list = document.getElementById('insights-list');
    return list ? new InsightsPanel(list, getContext) : null;
  }

  /** Recompute on state changes; during training only every `every` epochs. */
  update(state: TrainingState, every = 5): void {
    const training = state.eventType === 'trainingStep';
    if (training && state.currentEpoch % every !== 0) return;
    if (training && state.currentEpoch === this.lastEpoch) return;
    this.lastEpoch = state.currentEpoch;
    this.render(this.compute(state));
  }

  compute(state: TrainingState): Insight[] {
    if (!state.datasetLoaded) {
      return [{ kind: 'info', title: 'Get started', message: 'Choose a dataset, then press Train to watch the network learn.' }];
    }

    const { datasetType, config } = this.getContext();
    const records = state.history.records;
    const insights: Insight[] = [];

    if (config) {
      const moment = this.explainer.explainMoment({
        datasetType: (KNOWN_DATASETS as readonly string[]).includes(datasetType) ? (datasetType as DatasetType) : 'custom',
        currentEpoch: state.currentEpoch,
        totalEpochs: state.maxEpochs,
        currentLoss: state.currentLoss ?? 0,
        initialLoss: records[0]?.loss ?? state.currentLoss ?? 0,
        lossHistory: records.map((r) => r.loss),
        accuracy: state.currentAccuracy ?? 0,
        architecture: {
          layers: config.layers.map((units) => ({ units, activation: config.activation ?? 'relu' })),
        },
        isTraining: state.isRunning && !state.isPaused,
      });
      insights.push(momentToInsight(moment));
    }

    const fit = overfittingInsight(state);
    if (fit) insights.push(fit);
    return insights;
  }

  private render(insights: Insight[]): void {
    const items = insights.map((insight) => {
      const li = document.createElement('li');
      li.className = `insight insight-${insight.kind}`;
      const title = document.createElement('strong');
      title.textContent = insight.title;
      li.append(title, document.createTextNode(` ${insight.message}`));
      return li;
    });
    this.list.replaceChildren(...items);
  }
}
