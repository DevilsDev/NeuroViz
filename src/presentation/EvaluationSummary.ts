/**
 * "How well does it classify?" summary at the top of the Evaluate step:
 * accuracy, macro F1, a plain-language verdict and per-class metrics.
 * Fed by MetricsController with the confusion matrix it already computes.
 */
import type { TrainingState } from '../core/application/ITrainingSession';
import { overfittingInsight } from './MetricsPanel';

export interface ClassScores {
  precision: number;
  recall: number;
  f1: number;
}

export interface Verdict {
  label: string;
  kind: 'good' | 'info' | 'warning';
  detail: string;
}

/** Plain-language judgement of the current fit. */
export function evaluationVerdict(accuracy: number, state: TrainingState): Verdict {
  const fit = overfittingInsight(state);
  if (fit?.kind === 'warning') {
    return { label: 'Overfitting', kind: 'warning', detail: fit.message };
  }
  if (accuracy >= 0.9) {
    return { label: 'Good fit', kind: 'good', detail: 'The boundary separates the classes well.' };
  }
  if (accuracy >= 0.75) {
    return { label: 'Fair', kind: 'info', detail: 'Most points are right. More epochs or a larger network may help.' };
  }
  return {
    label: 'Underfitting',
    kind: 'warning',
    detail: 'The model is too simple or has not trained long enough for this data.',
  };
}

const pct = (v: number): string => `${(v * 100).toFixed(1)}%`;

export class EvaluationSummary {
  constructor(private readonly root: HTMLElement) {}

  static fromDocument(): EvaluationSummary | null {
    const root = document.getElementById('eval-summary');
    return root ? new EvaluationSummary(root) : null;
  }

  private part(name: string): HTMLElement | null {
    return this.root.querySelector<HTMLElement>(`[data-eval="${name}"]`);
  }

  update(matrix: number[][], classScores: ClassScores[], macro: ClassScores, state: TrainingState): void {
    const support = matrix.map((row) => row.reduce((a, b) => a + b, 0));
    const total = support.reduce((a, b) => a + b, 0);
    const correct = matrix.reduce((sum, row, i) => sum + (row[i] ?? 0), 0);
    const accuracy = total > 0 ? correct / total : 0;
    const verdict = evaluationVerdict(accuracy, state);

    this.setText('scope', `Scored on all ${total} points (training and validation) at epoch ${state.currentEpoch}.`);
    this.setText('accuracy', pct(accuracy));
    this.setText('accuracy-detail', `${correct} of ${total} correct`);
    this.setText('f1', pct(macro.f1));
    this.setText('verdict', verdict.label);
    this.setText('verdict-detail', verdict.detail);
    this.part('verdict-tile')?.setAttribute('data-kind', verdict.kind);

    const rows = classScores.map((scores, i) => {
      const tr = document.createElement('tr');
      const th = document.createElement('th');
      th.scope = 'row';
      th.textContent = `Class ${i}`;
      tr.appendChild(th);
      for (const value of [scores.precision.toFixed(2), scores.recall.toFixed(2), scores.f1.toFixed(2), String(support[i] ?? 0)]) {
        const td = document.createElement('td');
        td.textContent = value;
        tr.appendChild(td);
      }
      return tr;
    });
    this.part('rows')?.replaceChildren(...rows);
    this.root.dataset.state = 'ready';
  }

  clear(): void {
    this.setText('scope', 'Train the model to see how well it classifies.');
    for (const name of ['accuracy', 'f1', 'verdict']) this.setText(name, '—');
    for (const name of ['accuracy-detail', 'verdict-detail']) this.setText(name, '');
    this.part('verdict-tile')?.removeAttribute('data-kind');
    this.part('rows')?.replaceChildren();
    this.root.dataset.state = 'empty';
  }

  private setText(name: string, text: string): void {
    const el = this.part(name);
    if (el) el.textContent = text;
  }
}
