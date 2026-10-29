/**
 * Training timeline under the plot: scrub through recorded decision
 * boundaries once training is paused or finished, jump back to the live
 * model, or export the recording as an animated GIF.
 */
import type { TrainingState } from '../core/application/ITrainingSession';
import type { BoundarySnapshot } from '../core/application/training/ExperimentService';
import { GifEncoder, captureSvgAsImageData } from '../infrastructure/export/GifEncoder';

export interface TimelineHost {
  getState(): TrainingState;
  onStateChange(callback: (state: TrainingState) => void): () => void;
  getBoundarySnapshots(): BoundarySnapshot[];
  showBoundarySnapshot(index: number): boolean;
  showLiveBoundary(): void;
}

/** GIF frames are captured at this width (height keeps the plot's aspect) */
const GIF_WIDTH = 360;
const GIF_FRAME_MS = 120;
const GIF_LAST_FRAME_MS = 1500;

export class TimelinePanel {
  private snapshots: BoundarySnapshot[] = [];
  /** Index being replayed, or null when showing the live model */
  private replaying: number | null = null;
  private exporting = false;
  private readonly cleanup: Array<() => void> = [];

  constructor(
    private readonly host: TimelineHost,
    private readonly els: {
      root: HTMLElement;
      slider: HTMLInputElement;
      label: HTMLElement;
      live: HTMLButtonElement;
      gif: HTMLButtonElement;
      plot: HTMLElement;
    }
  ) {
    const onScrub = (): void => this.scrubTo(parseInt(els.slider.value, 10));
    const onLive = (): void => this.goLive();
    const onGif = (): void => { void this.exportGif(); };
    els.slider.addEventListener('input', onScrub);
    els.live.addEventListener('click', onLive);
    els.gif.addEventListener('click', onGif);
    this.cleanup.push(
      () => els.slider.removeEventListener('input', onScrub),
      () => els.live.removeEventListener('click', onLive),
      () => els.gif.removeEventListener('click', onGif),
      host.onStateChange((state) => this.sync(state))
    );
    this.sync(host.getState());
  }

  static fromDocument(host: TimelineHost): TimelinePanel | null {
    const get = <T extends HTMLElement>(id: string): T | null => document.getElementById(id) as T | null;
    const root = get('timeline');
    const slider = get<HTMLInputElement>('timeline-slider');
    const label = get('timeline-label');
    const live = get<HTMLButtonElement>('btn-timeline-live');
    const gif = get<HTMLButtonElement>('btn-timeline-gif');
    const plot = get('viz-container');
    if (!root || !slider || !label || !live || !gif || !plot) return null;
    return new TimelinePanel(host, { root, slider, label, live, gif, plot });
  }

  dispose(): void {
    this.cleanup.splice(0).forEach((remove) => remove());
  }

  private isTraining(state: TrainingState): boolean {
    return state.isRunning && !state.isPaused;
  }

  /** Keeps the strip in step with the recording and the training state. */
  sync(state: TrainingState = this.host.getState()): void {
    this.snapshots = this.host.getBoundarySnapshots();
    const count = this.snapshots.length;
    const training = this.isTraining(state);
    if (training || count === 0) this.replaying = null;

    // Shown from data load (not from the second frame) so the plot does not
    // change height part-way through training
    this.els.root.hidden = !state.datasetLoaded;
    this.els.slider.max = String(Math.max(0, count - 1));
    this.els.slider.disabled = training || this.exporting || count < 2;
    this.els.gif.disabled = training || this.exporting || count < 2;
    this.els.live.hidden = this.replaying === null;
    if (this.replaying === null) this.els.slider.value = String(Math.max(0, count - 1));

    const last = this.snapshots[count - 1];
    if (this.replaying !== null) {
      const shown = this.snapshots[this.replaying];
      this.setLabel(`Replaying epoch ${shown?.epoch ?? '?'} of ${last?.epoch ?? '?'}`);
    } else if (training) {
      this.setLabel(`Recording · ${count} frames`);
    } else {
      this.setLabel(count >= 2 ? `Live · drag to replay ${count} frames` : 'Train to record how the boundary changes');
    }
  }

  scrubTo(index: number): void {
    if (!this.host.showBoundarySnapshot(index)) return;
    // The last frame is the current model, so landing on it counts as live
    this.replaying = index >= this.snapshots.length - 1 ? null : index;
    if (this.replaying === null) this.host.showLiveBoundary();
    this.sync();
  }

  goLive(): void {
    this.replaying = null;
    this.host.showLiveBoundary();
    this.sync();
  }

  /** Renders every frame into the plot, captures it and downloads the GIF. */
  async exportGif(): Promise<void> {
    const svg = this.els.plot.querySelector('svg');
    if (!svg || this.snapshots.length < 2 || this.exporting) return;
    this.exporting = true;
    this.sync();

    try {
      const box = svg.getBoundingClientRect();
      const width = GIF_WIDTH;
      const height = Math.max(1, Math.round((box.height / Math.max(1, box.width)) * GIF_WIDTH));
      const background = getComputedStyle(document.body).backgroundColor || '#ffffff';
      const encoder = new GifEncoder(width, height);

      for (let i = 0; i < this.snapshots.length; i++) {
        this.setLabel(`Making GIF… frame ${i + 1} of ${this.snapshots.length}`);
        this.host.showBoundarySnapshot(i);
        await nextFrame();
        const frame = await captureSvgAsImageData(sizedClone(svg, box), width, height, background);
        encoder.addFrame(frame, i === this.snapshots.length - 1 ? GIF_LAST_FRAME_MS : GIF_FRAME_MS);
      }

      const blob = await encoder.encode();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'neuroviz-training.gif';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } finally {
      this.exporting = false;
      this.replaying = null;
      this.host.showLiveBoundary();
      this.sync();
    }
  }

  private setLabel(text: string): void {
    this.els.label.textContent = text;
    this.els.slider.setAttribute('aria-valuetext', text);
  }
}

/**
 * The plot SVG is sized by CSS (width="100%"), which means nothing once it is
 * serialised to a standalone image: it would fall back to a default size and
 * be clipped. Give the copy its on-screen size and a matching viewBox.
 */
function sizedClone(svg: SVGSVGElement, box: DOMRect): SVGSVGElement {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('width', String(box.width));
  clone.setAttribute('height', String(box.height));
  if (!clone.getAttribute('viewBox')) clone.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
  return clone;
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
