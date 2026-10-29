import { describe, it, expect, afterEach } from 'vitest';
import { LRFinderService, suggestLearningRate } from '../../../../src/core/application/training/LRFinderService';
import { random, seedRandom } from '../../../../src/core/domain/Random';
import type { Point } from '../../../../src/core/domain';
import { MockNeuralNetworkService } from '../../mocks';

const data: Point[] = Array.from({ length: 40 }, (_, i) => ({ x: i / 40, y: 0, label: i % 2 }));
const config = { learningRate: 0.03, layers: [4] as const };

/** Loss falls to a minimum around step `minAt`, then climbs steeply */
function valleyLosses(steps: number, minAt: number): number[] {
  return Array.from({ length: steps }, (_, i) => (i <= minAt ? 1 - 0.8 * (i / minAt) : 0.2 + 0.5 * (i - minAt)));
}

afterEach(() => seedRandom(null));

describe('LRFinderService', () => {
  it('sweeps a throwaway network and disposes it', async () => {
    const throwaway = new MockNeuralNetworkService();
    throwaway.setLossSequence(valleyLosses(30, 20));
    const service = new LRFinderService(() => throwaway);

    const result = await service.run(config, data, { steps: 30, minLR: 1e-4, maxLR: 1 });

    expect(throwaway.initialize).toHaveBeenCalledWith(expect.objectContaining({ learningRate: 1e-4 }));
    expect(throwaway.dispose).toHaveBeenCalled();
    expect(result.points[0]?.lr).toBeCloseTo(1e-4);
    // Rates grow monotonically
    for (let i = 1; i < result.points.length; i++) {
      expect(result.points[i]!.lr).toBeGreaterThan(result.points[i - 1]!.lr);
    }
  });

  it('stops once the loss diverges', async () => {
    const net = new MockNeuralNetworkService();
    net.setLossSequence([...valleyLosses(15, 10), 50, 60, 70, 80, 90]);
    const result = await new LRFinderService(() => net).run(config, data, { steps: 40 });
    expect(result.points.length).toBeLessThan(40);
    expect(result.points[result.points.length - 1]!.loss).toBeGreaterThanOrEqual(0.2 * 4);
  });

  it('can be cancelled and reports progress', async () => {
    const net = new MockNeuralNetworkService();
    const progress: number[] = [];
    let calls = 0;
    const result = await new LRFinderService(() => net).run(config, data, {
      steps: 20,
      onProgress: (step) => progress.push(step),
      isCancelled: () => ++calls > 3,
    });
    expect(result.points).toHaveLength(3);
    expect(progress).toEqual([1, 2, 3]);
  });

  it('leaves the shared seeded stream untouched', async () => {
    seedRandom(77);
    const expected = [random(), random(), random()];
    seedRandom(77);
    const net = new MockNeuralNetworkService();
    await new LRFinderService(() => net).run({ ...config, seed: 5 }, data, { steps: 10 });
    expect([random(), random(), random()]).toEqual(expected);
  });

  it('refuses to run without data', async () => {
    await expect(new LRFinderService(() => new MockNeuralNetworkService()).run(config, [])).rejects.toThrow(/dataset/);
  });
});

describe('suggestLearningRate', () => {
  const sweep = (losses: number[]) => losses.map((loss, i) => ({ lr: 1e-4 * Math.pow(10, i / 10), loss }));

  it('suggests a tenth of the rate at the smoothed minimum', () => {
    const points = sweep(valleyLosses(30, 20));
    const suggested = suggestLearningRate(points);
    expect(suggested).not.toBeNull();
    // Smoothing lags the raw minimum a little, so allow a small band
    expect(suggested!).toBeGreaterThan(points[15]!.lr / 10);
    expect(suggested!).toBeLessThan(points[25]!.lr / 10);
  });

  it('gives two significant figures', () => {
    const suggested = suggestLearningRate(sweep(valleyLosses(30, 20)))!;
    expect(String(suggested)).toMatch(/^0\.0*\d{1,2}$|^\d\.\d$/);
  });

  it('has no suggestion for short or only-rising sweeps', () => {
    expect(suggestLearningRate(sweep([1, 0.9, 0.8]))).toBeNull();
    expect(suggestLearningRate(sweep(Array.from({ length: 20 }, (_, i) => 0.5 + i)))).toBeNull();
  });
});
