import type { Point } from '../../domain';
import type { INeuralNetworkService } from '../../ports';
import type { Hyperparameters } from '../../domain';

/**
 * Learning Rate Finder Service
 *
 * Runs an LR range test: trains with exponentially increasing learning rate
 * and records loss at each step. The resulting {lr, loss} curve helps the
 * user pick an optimal learning rate (typically just before the loss starts
 * climbing steeply).
 *
 * Restores the original model weights after the sweep by re-initializing
 * with the original hyperparameters.
 */
export class LRFinderService {
  constructor(private readonly neuralNet: INeuralNetworkService) {}

  /**
   * Runs the LR finder sweep.
   *
   * @param getBatch - Callback returning a training batch
   * @param originalHyperparams - Config to restore model after sweep
   * @param minLR - Starting learning rate (default: 1e-7)
   * @param maxLR - Ending learning rate (default: 1)
   * @param steps - Number of steps in the sweep (default: 100)
   * @returns Array of {lr, loss} points for the sensitivity curve
   */
  async run(
    getBatch: () => Point[],
    originalHyperparams: Hyperparameters,
    minLR = 1e-7,
    maxLR = 1,
    steps = 100
  ): Promise<Array<{ lr: number; loss: number }>> {
    const results: Array<{ lr: number; loss: number }> = [];
    const lrMultiplier = Math.pow(maxLR / minLR, 1 / steps);
    let currentLR = minLR;

    for (let i = 0; i < steps; i++) {
      this.neuralNet.updateLearningRate(currentLR);

      const batch = getBatch();
      const result = await this.neuralNet.train(batch);

      results.push({ lr: currentLR, loss: result.loss });

      // Stop if loss explodes
      if (!isFinite(result.loss) || result.loss > 1e10) {
        break;
      }

      currentLR *= lrMultiplier;
    }

    // Restore original model weights
    await this.neuralNet.initialize(originalHyperparams);

    return results;
  }
}
