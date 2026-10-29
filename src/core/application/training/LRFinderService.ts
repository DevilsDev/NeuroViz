import type { Hyperparameters, Point } from '../../domain';
import { mulberry32 } from '../../domain/Random';
import type { INeuralNetworkService } from '../../ports';

/**
 * Learning-rate range test: trains a throwaway copy of the model while the
 * learning rate grows exponentially, recording the loss at each step. The
 * loss usually falls, flattens, then blows up; a good learning rate sits
 * well before the minimum.
 *
 * The sweep runs on a separate network built from the same config, so the
 * user's model, its trained weights and optimizer state are never touched.
 * Batches come from a local generator, not the shared seeded stream, so
 * running the finder does not change the batch order of a locked-seed run.
 */

export interface LRFinderPoint {
  readonly lr: number;
  readonly loss: number;
}

export interface LRFinderResult {
  readonly points: LRFinderPoint[];
  /** null when the sweep was too short to judge */
  readonly suggestedLR: number | null;
}

export interface LRFinderOptions {
  readonly minLR?: number;
  readonly maxLR?: number;
  readonly steps?: number;
  readonly batchSize?: number;
  readonly onProgress?: (step: number, total: number) => void;
  /** Checked between steps; returning true stops the sweep early */
  readonly isCancelled?: () => boolean;
}

export const LR_FINDER_DEFAULTS = { minLR: 1e-4, maxLR: 1, steps: 60, batchSize: 32 } as const;

/** Loss this many times above the best seen so far means the sweep has diverged */
const DIVERGENCE_FACTOR = 4;
/** Steps before divergence is checked (early losses are noisy) */
const WARMUP_STEPS = 5;

export class LRFinderService {
  constructor(private readonly createNetwork: () => INeuralNetworkService) {}

  async run(config: Hyperparameters, trainingData: Point[], options: LRFinderOptions = {}): Promise<LRFinderResult> {
    const minLR = options.minLR ?? LR_FINDER_DEFAULTS.minLR;
    const maxLR = options.maxLR ?? LR_FINDER_DEFAULTS.maxLR;
    const steps = options.steps ?? LR_FINDER_DEFAULTS.steps;
    const batchSize = Math.max(1, Math.min(options.batchSize ?? LR_FINDER_DEFAULTS.batchSize, trainingData.length));
    if (trainingData.length === 0) throw new Error('Load a dataset before finding a learning rate.');

    const rand = mulberry32(config.seed ?? Math.floor(Math.random() * 2 ** 31));
    const sample = (): Point[] =>
      Array.from({ length: batchSize }, () => trainingData[Math.floor(rand() * trainingData.length)] as Point);

    const net = this.createNetwork();
    const points: LRFinderPoint[] = [];
    try {
      await net.initialize({ ...config, learningRate: minLR });
      const multiplier = Math.pow(maxLR / minLR, 1 / Math.max(1, steps - 1));
      let lr = minLR;
      let best = Infinity;

      for (let step = 0; step < steps; step++) {
        if (options.isCancelled?.()) break;
        net.updateLearningRate(lr);
        const { loss } = await net.train(sample());
        if (!Number.isFinite(loss)) break;
        points.push({ lr, loss });
        best = Math.min(best, loss);
        options.onProgress?.(step + 1, steps);
        if (step >= WARMUP_STEPS && loss > best * DIVERGENCE_FACTOR) break;
        lr *= multiplier;
      }
    } finally {
      net.dispose();
    }

    return { points, suggestedLR: suggestLearningRate(points) };
  }
}

/**
 * Suggested rate: a tenth of the rate at the minimum of the smoothed loss
 * curve (a common rule of thumb), rounded to two significant figures.
 */
export function suggestLearningRate(points: readonly LRFinderPoint[]): number | null {
  if (points.length < 8) return null;

  // Exponential moving average with bias correction
  const beta = 0.8;
  let avg = 0;
  let bestIndex = 0;
  let bestLoss = Infinity;
  points.forEach((p, i) => {
    avg = beta * avg + (1 - beta) * p.loss;
    const smoothed = avg / (1 - Math.pow(beta, i + 1));
    if (smoothed < bestLoss) {
      bestLoss = smoothed;
      bestIndex = i;
    }
  });

  // A minimum at the very start means the loss only rose: nothing to suggest
  if (bestIndex < 2) return null;
  const atMin = points[bestIndex]?.lr ?? 0;
  const first = points[0]?.lr ?? atMin;
  const suggestion = Math.max(first, atMin / 10);
  return Number(suggestion.toPrecision(2));
}
