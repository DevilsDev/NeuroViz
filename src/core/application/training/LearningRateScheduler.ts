import { LRScheduleConfig, LRScheduleType } from '../../domain';

/**
 * Learning Rate Scheduler
 *
 * Handles all learning rate scheduling strategies including:
 * - Exponential decay
 * - Step decay
 * - Cosine annealing
 * - Cyclic triangular (triangular wave)
 * - Cyclic cosine (smooth oscillation)
 * - Warmup (linear increase at start)
 */
export class LearningRateScheduler {
  private currentLR: number;

  constructor(
    private initialLR: number,
    private schedule: LRScheduleConfig
  ) {
    this.currentLR = initialLR;
  }

  /**
   * Calculates the learning rate for the given epoch
   * @param epoch - Current training epoch
   * @param maxEpochs - Maximum number of epochs (for cosine annealing)
   * @returns Calculated learning rate
   */
  calculateLR(epoch: number, maxEpochs?: number): number {
    const warmupEpochs = this.schedule.warmupEpochs ?? 0;

    // Apply warmup: linear increase from 0 to initialLR
    if (warmupEpochs > 0 && epoch < warmupEpochs) {
      this.currentLR = this.initialLR * (epoch + 1) / warmupEpochs;
      return this.currentLR;
    }

    // Adjust epoch for decay calculation (subtract warmup epochs)
    const effectiveEpoch = warmupEpochs > 0 ? epoch - warmupEpochs : epoch;

    switch (this.schedule.type) {
      case 'exponential':
        this.currentLR = this.calculateExponentialDecay(effectiveEpoch);
        break;

      case 'step':
        this.currentLR = this.calculateStepDecay(effectiveEpoch);
        break;

      case 'cosine':
        this.currentLR = this.calculateCosineAnnealing(effectiveEpoch, maxEpochs, warmupEpochs);
        break;

      case 'cyclic_triangular':
        this.currentLR = this.calculateCyclicTriangular(effectiveEpoch);
        break;

      case 'cyclic_cosine':
        this.currentLR = this.calculateCyclicCosine(effectiveEpoch);
        break;

      case 'none':
      default:
        this.currentLR = this.initialLR;
        break;
    }

    return this.currentLR;
  }

  /**
   * Gets the current learning rate without recalculating
   */
  getCurrentLR(): number {
    return this.currentLR;
  }

  /**
   * Updates the initial learning rate (for reinitialization)
   */
  setInitialLR(lr: number): void {
    this.initialLR = lr;
    this.currentLR = lr;
  }

  /**
   * Updates the schedule configuration
   */
  setSchedule(schedule: LRScheduleConfig): void {
    this.schedule = schedule;
  }

  /**
   * Checks if the LR has changed significantly since last calculation
   * @param previousLR - Previous learning rate value
   * @param threshold - Minimum relative change to be considered significant (default: 1%)
   */
  hasSignificantChange(previousLR: number, threshold = 0.01): boolean {
    const lrChangeRatio = Math.abs(this.currentLR - previousLR) / previousLR;
    return lrChangeRatio > threshold;
  }

  // ========================================================================
  // Private calculation methods for each schedule type
  // ========================================================================

  /**
   * Exponential Decay: LR = initial_lr * decay_rate^epoch
   */
  private calculateExponentialDecay(epoch: number): number {
    const decayRate = this.schedule.decayRate ?? 0.95;
    return this.initialLR * Math.pow(decayRate, epoch);
  }

  /**
   * Step Decay: LR = initial_lr * decay_rate^(epoch / decay_steps)
   */
  private calculateStepDecay(epoch: number): number {
    const decayRate = this.schedule.decayRate ?? 0.5;
    const decaySteps = this.schedule.decaySteps ?? 10;
    const numDecays = Math.floor(epoch / decaySteps);
    return this.initialLR * Math.pow(decayRate, numDecays);
  }

  /**
   * Cosine Annealing: LR = initial_lr * 0.5 * (1 + cos(pi * epoch / max_epochs))
   */
  private calculateCosineAnnealing(epoch: number, maxEpochs: number | undefined, warmupEpochs: number): number {
    const effectiveMaxEpochs = Math.max((maxEpochs || 100) - warmupEpochs, 1);
    const progress = Math.min(epoch / effectiveMaxEpochs, 1);
    return this.initialLR * 0.5 * (1 + Math.cos(Math.PI * progress));
  }

  /**
   * Cyclic Triangular: Triangle wave between minLR and maxLR (initialLR)
   */
  private calculateCyclicTriangular(epoch: number): number {
    const cycleLength = this.schedule.cycleLength ?? 20;
    const minLR = this.schedule.minLR ?? this.initialLR / 10;
    const cyclePosition = epoch % cycleLength;
    const halfCycle = cycleLength / 2;

    // Triangle: rise for first half, fall for second half
    const triangleValue = cyclePosition < halfCycle
      ? cyclePosition / halfCycle
      : 1 - (cyclePosition - halfCycle) / halfCycle;

    return minLR + (this.initialLR - minLR) * triangleValue;
  }

  /**
   * Cyclic Cosine: Cosine wave between minLR and maxLR (initialLR)
   */
  private calculateCyclicCosine(epoch: number): number {
    const cycleLength = this.schedule.cycleLength ?? 20;
    const minLR = this.schedule.minLR ?? this.initialLR / 10;
    const cyclePosition = epoch % cycleLength;

    // Cosine: smooth oscillation
    const cosineValue = 0.5 * (1 + Math.cos(Math.PI * cyclePosition / cycleLength));

    return minLR + (this.initialLR - minLR) * cosineValue;
  }
}
