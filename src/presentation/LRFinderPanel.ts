/**
 * "Find a good learning rate" in the Model step: runs the range test on a
 * throwaway copy of the model, draws loss against learning rate and offers
 * the suggested rate. "Use it" writes the rate into #input-lr.
 */
import type { Hyperparameters, Point } from '../core/domain';
import type { TrainingState } from '../core/application/ITrainingSession';
import type { LRFinderResult, LRFinderOptions } from '../core/application/training/LRFinderService';
import { renderLRFinderChart } from '../infrastructure/d3/LRFinderChart';

/** What the panel needs from the app (kept narrow for testing) */
export interface LRFinderHost {
  getState(): TrainingState;
  getTrainingData(): Point[];
  onStateChange(callback: (state: TrainingState) => void): () => void;
  /** Current model settings as entered */
  getConfig(): Hyperparameters;
  getBatchSize(): number;
  runFinder(config: Hyperparameters, data: Point[], options: LRFinderOptions): Promise<LRFinderResult>;
}

const IDLE_LABEL = 'Find a good learning rate';

export class LRFinderPanel {
  private running = false;
  private cancelled = false;
  private suggested: number | null = null;
  private readonly cleanup: Array<() => void> = [];

  constructor(
    private readonly host: LRFinderHost,
    private readonly els: {
      button: HTMLButtonElement;
      result: HTMLElement;
      status: HTMLElement;
      chart: HTMLElement;
      use: HTMLButtonElement;
      lrInput: HTMLInputElement;
    }
  ) {
    const onFind = (): void => { void this.toggle(); };
    const onUse = (): void => this.applySuggestion();
    els.button.addEventListener('click', onFind);
    els.use.addEventListener('click', onUse);
    this.cleanup.push(
      () => els.button.removeEventListener('click', onFind),
      () => els.use.removeEventListener('click', onUse),
      host.onStateChange((state) => this.syncAvailability(state))
    );
    this.syncAvailability(host.getState());
  }

  static fromDocument(host: LRFinderHost): LRFinderPanel | null {
    const get = <T extends HTMLElement>(id: string): T | null => document.getElementById(id) as T | null;
    const button = get<HTMLButtonElement>('btn-find-lr');
    const result = get('lr-finder-result');
    const status = get('lr-finder-status');
    const chart = get('lr-finder-chart');
    const use = get<HTMLButtonElement>('btn-use-lr');
    const lrInput = get<HTMLInputElement>('input-lr');
    if (!button || !result || !status || !chart || !use || !lrInput) return null;
    return new LRFinderPanel(host, { button, result, status, chart, use, lrInput });
  }

  dispose(): void {
    this.cancelled = true;
    this.cleanup.splice(0).forEach((remove) => remove());
  }

  /** Starts a sweep, or cancels the one in progress. */
  async toggle(): Promise<void> {
    if (this.running) {
      this.cancelled = true;
      return;
    }
    await this.run();
  }

  private async run(): Promise<void> {
    const data = this.host.getTrainingData();
    if (data.length === 0) return;

    this.running = true;
    this.cancelled = false;
    this.suggested = null;
    this.els.result.hidden = false;
    this.els.use.hidden = true;
    this.els.chart.replaceChildren();
    this.els.button.textContent = 'Cancel';
    this.setStatus('Testing learning rates on a copy of your model…');

    try {
      const result = await this.host.runFinder(this.host.getConfig(), data, {
        batchSize: this.host.getBatchSize(),
        onProgress: (step, total) => this.setStatus(`Testing learning rates… ${step} of ${total}`),
        isCancelled: () => this.cancelled,
      });
      if (this.cancelled && result.points.length === 0) {
        this.setStatus('Cancelled.');
        return;
      }
      renderLRFinderChart(this.els.chart, result.points, result.suggestedLR);
      this.showResult(result);
    } catch (error) {
      this.setStatus(`Could not run the finder: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.running = false;
      this.els.button.textContent = IDLE_LABEL;
      this.syncAvailability(this.host.getState());
    }
  }

  private showResult(result: LRFinderResult): void {
    this.suggested = result.suggestedLR;
    if (result.suggestedLR === null) {
      this.setStatus('The loss never clearly fell, so there is no suggestion. Try a smaller model or check the data.');
      return;
    }
    this.setStatus(
      `Suggested rate: ${result.suggestedLR}, a tenth of the rate where the loss bottomed out (current: ${this.els.lrInput.value}).`
    );
    this.els.use.textContent = `Use ${result.suggestedLR}`;
    this.els.use.hidden = false;
  }

  private applySuggestion(): void {
    if (this.suggested === null) return;
    this.els.lrInput.value = String(this.suggested);
    // Same events as typing, so the stale-model badge and history react
    this.els.lrInput.dispatchEvent(new Event('input', { bubbles: true }));
    this.els.lrInput.dispatchEvent(new Event('change', { bubbles: true }));
    this.setStatus(`Learning rate set to ${this.suggested}. Build the model to use it.`);
    this.els.use.hidden = true;
  }

  private syncAvailability(state: TrainingState): void {
    if (this.running) return;
    const training = state.isRunning && !state.isPaused;
    const ready = state.datasetLoaded && !training;
    this.els.button.disabled = !ready;
    this.els.button.title = !state.datasetLoaded
      ? 'Load a dataset first'
      : training ? 'Pause training first' : 'Sweep learning rates on a copy of the model';
  }

  private setStatus(text: string): void {
    this.els.status.textContent = text;
  }
}
