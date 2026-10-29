/**
 * Reproducibility card in the Train step: seed, weight initialiser and a lock.
 *
 * Unlocked, a new seed is drawn each time a dataset loads, so the seed shown
 * always describes the current run. Locking it repeats that run exactly:
 * same data, split, starting weights and batch order.
 */
import { newSeed, parseSeed } from '../core/domain';

const HINT_LOCKED = 'Same seed, same run: data, split, starting weights and batch order repeat. Dropout masks stay random.';
const HINT_UNLOCKED = 'A new seed is drawn each time you load a dataset. Lock it to repeat this run.';

/** What the dataset controller needs: the seed for the load it is about to do. */
export interface DataSeedSource {
  seedForDataLoad(): number;
}

export class ReproducibilityPanel implements DataSeedSource {
  private readonly cleanup: Array<() => void> = [];

  constructor(
    private readonly seedInput: HTMLInputElement,
    private readonly lock: HTMLInputElement,
    private readonly newSeedButton: HTMLButtonElement | null,
    private readonly hint: HTMLElement | null
  ) {
    this.listen(this.lock, 'change', () => this.renderHint());
    this.listen(this.seedInput, 'input', () => this.validate());
    if (this.newSeedButton) {
      this.listen(this.newSeedButton, 'click', () => this.setSeed(newSeed()));
    }
    if (parseSeed(this.seedInput.value) === null) this.seedInput.value = String(newSeed());
    this.renderHint();
  }

  static fromDocument(): ReproducibilityPanel | null {
    const seed = document.getElementById('input-seed') as HTMLInputElement | null;
    const lock = document.getElementById('input-seed-lock') as HTMLInputElement | null;
    if (!seed || !lock) return null;
    return new ReproducibilityPanel(
      seed,
      lock,
      document.getElementById('btn-new-seed') as HTMLButtonElement | null,
      document.getElementById('repro-hint')
    );
  }

  get locked(): boolean {
    return this.lock.checked;
  }

  /** The seed in the field, drawing a fresh one if the field is invalid. */
  currentSeed(): number {
    const seed = parseSeed(this.seedInput.value);
    if (seed !== null) return seed;
    const fresh = newSeed();
    this.setSeed(fresh);
    return fresh;
  }

  seedForDataLoad(): number {
    if (!this.locked) this.setSeed(newSeed());
    return this.currentSeed();
  }

  dispose(): void {
    this.cleanup.splice(0).forEach((remove) => remove());
  }

  private setSeed(seed: number): void {
    this.seedInput.value = String(seed);
    this.validate();
    // Same events as typing, so the stale-model badge sees the change
    this.seedInput.dispatchEvent(new Event('input', { bubbles: true }));
    this.seedInput.dispatchEvent(new Event('change', { bubbles: true }));
  }

  private validate(): void {
    const valid = parseSeed(this.seedInput.value) !== null;
    this.seedInput.setAttribute('aria-invalid', String(!valid));
  }

  private renderHint(): void {
    if (this.hint) this.hint.textContent = this.locked ? HINT_LOCKED : HINT_UNLOCKED;
  }

  private listen(el: HTMLElement, type: string, handler: EventListener): void {
    el.addEventListener(type, handler);
    this.cleanup.push(() => el.removeEventListener(type, handler));
  }
}
