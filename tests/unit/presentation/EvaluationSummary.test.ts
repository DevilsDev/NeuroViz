import { describe, it, expect, beforeEach } from 'vitest';
import { EvaluationSummary, evaluationVerdict } from '../../../src/presentation/EvaluationSummary';
import type { TrainingState } from '../../../src/core/application/ITrainingSession';
import type { TrainingRecord } from '../../../src/core/domain';

function state(overrides: Partial<TrainingState> = {}): TrainingState {
  return {
    isInitialised: true,
    datasetLoaded: true,
    isRunning: false,
    isPaused: true,
    isProcessing: false,
    currentEpoch: 40,
    currentLoss: null,
    currentAccuracy: null,
    currentValLoss: null,
    currentValAccuracy: null,
    maxEpochs: 0,
    batchSize: 0,
    targetFps: 60,
    validationSplit: 0.2,
    history: { records: [], bestLoss: Infinity, bestEpoch: 0, bestValLoss: Infinity, bestValEpoch: 0, totalTimeMs: 0 },
    ...overrides,
  };
}

/** Validation loss rising while training loss falls. */
function overfitting(): TrainingState {
  const records: TrainingRecord[] = Array.from({ length: 30 }, (_, i) => ({
    epoch: i + 1,
    loss: 0.6 - i * 0.01,
    accuracy: 0.9,
    valLoss: 0.4 + i * 0.01,
    valAccuracy: 0.8,
    timestamp: i,
    learningRate: 0.03,
  }));
  return state({ history: { ...state().history, records } });
}

describe('evaluationVerdict', () => {
  it('grades by accuracy', () => {
    expect(evaluationVerdict(0.95, state()).label).toBe('Good fit');
    expect(evaluationVerdict(0.8, state()).label).toBe('Fair');
    expect(evaluationVerdict(0.6, state()).label).toBe('Underfitting');
  });

  it('reports overfitting ahead of accuracy', () => {
    const verdict = evaluationVerdict(0.99, overfitting());
    expect(verdict.label).toBe('Overfitting');
    expect(verdict.kind).toBe('warning');
  });
});

describe('EvaluationSummary', () => {
  let summary: EvaluationSummary;
  const text = (id: string): string => document.getElementById(id)?.textContent ?? '';
  const root = (): HTMLElement => document.getElementById('eval-summary') as HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = `
      <section id="eval-summary" data-state="empty">
        <p data-eval="scope"></p>
        <div id="eval-accuracy" data-eval="accuracy"></div>
        <div id="acc-detail" data-eval="accuracy-detail"></div>
        <div id="eval-f1" data-eval="f1"></div>
        <div id="verdict-tile" data-eval="verdict-tile"><div id="eval-verdict" data-eval="verdict"></div></div>
        <p id="verdict-detail" data-eval="verdict-detail"></p>
        <table><tbody id="eval-class-rows" data-eval="rows"></tbody></table>
      </section>`;
    summary = EvaluationSummary.fromDocument() as EvaluationSummary;
  });

  it('fills accuracy, F1, verdict and per-class rows', () => {
    const matrix = [
      [45, 5],
      [0, 50],
    ];
    const classes = [
      { precision: 1, recall: 0.9, f1: 0.947 },
      { precision: 0.909, recall: 1, f1: 0.952 },
    ];
    summary.update(matrix, classes, { precision: 0.955, recall: 0.95, f1: 0.95 }, state());

    expect(text('eval-accuracy')).toBe('95.0%');
    expect(text('acc-detail')).toBe('95 of 100 correct');
    expect(text('eval-f1')).toBe('95.0%');
    expect(text('eval-verdict')).toBe('Good fit');
    expect(document.getElementById('verdict-tile')?.dataset.kind).toBe('good');
    expect(root().querySelector('[data-eval="scope"]')?.textContent).toContain('all 100 points');
    expect(root().dataset.state).toBe('ready');

    const rows = Array.from(document.querySelectorAll('#eval-class-rows tr')).map((tr) =>
      Array.from(tr.children).map((c) => c.textContent)
    );
    expect(rows).toEqual([
      ['Class 0', '1.00', '0.90', '0.95', '50'],
      ['Class 1', '0.91', '1.00', '0.95', '50'],
    ]);
  });

  it('handles an empty matrix without dividing by zero', () => {
    summary.update([[0, 0], [0, 0]], [], { precision: 0, recall: 0, f1: 0 }, state());
    expect(text('eval-accuracy')).toBe('0.0%');
  });

  it('clears back to the empty state', () => {
    summary.update([[1, 0], [0, 1]], [], { precision: 1, recall: 1, f1: 1 }, state());
    summary.clear();
    expect(text('eval-accuracy')).toBe('—');
    expect(text('eval-verdict')).toBe('—');
    expect(document.getElementById('verdict-tile')?.hasAttribute('data-kind')).toBe(false);
    expect(document.querySelectorAll('#eval-class-rows tr')).toHaveLength(0);
    expect(root().dataset.state).toBe('empty');
  });
});
