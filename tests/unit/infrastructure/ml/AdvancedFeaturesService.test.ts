import { describe, it, expect, beforeEach } from 'vitest';
import { AdvancedFeaturesService } from '../../../../src/infrastructure/ml/AdvancedFeaturesService';
import { MockNeuralNetworkService } from '../../mocks/MockNeuralNetworkService';
import type { Point, Prediction } from '../../../../src/core/domain';

describe('AdvancedFeaturesService - simple adversarial search', () => {
  let service: AdvancedFeaturesService;
  let model: MockNeuralNetworkService;

  beforeEach(() => {
    service = new AdvancedFeaturesService();
    service.setGenerationConfig({
      method: 'simple',
      sampleSize: 10,
      simpleConfig: { maxPerturbation: 0.3, numSteps: 10, stepSize: 0.05, minConfidence: 0.5 },
    });
    model = new MockNeuralNetworkService();
    model.initializeCalled = true; // isReady() -> true
    // Decision boundary at x = 0
    model.predict.mockImplementation(async (grid: Point[]): Promise<Prediction[]> =>
      grid.map((p) => ({ x: p.x, y: p.y, confidence: 0.9, predictedClass: p.x > 0 ? 1 : 0 }))
    );
  });

  it('batches all candidate perturbations into a single predict call', async () => {
    const data: Point[] = [
      { x: -0.1, y: 0, label: 0 },
      { x: -5, y: 0, label: 0 },
      { x: 3, y: 1, label: 1 },
    ];

    await service.generateAdversarialExamples(data, model);

    expect(model.predict).toHaveBeenCalledTimes(1);
  });

  it('finds the first boundary crossing in spiral order', async () => {
    const data: Point[] = [
      { x: -0.1, y: 0, label: 0 }, // crosses at step 4 (radius 0.12), angle 0
      { x: -5, y: 0, label: 0 }, // too far from the boundary
    ];

    const examples = await service.generateAdversarialExamples(data, model);

    expect(examples).toHaveLength(1);
    const [example] = examples;
    expect(example!.originalPoint).toEqual(data[0]);
    expect(example!.predictedClass).toBe(1);
    expect(example!.actualClass).toBe(0);
    expect(example!.point.x).toBeCloseTo(0.02, 10);
    expect(example!.point.y).toBeCloseTo(0, 10);
    expect(example!.perturbationMagnitude).toBeCloseTo(0.12, 10);
    expect(service.getAdversarialExamples()).toEqual(examples);
  });

  it('returns no examples and skips prediction when the model is not ready', async () => {
    model.initializeCalled = false;
    const examples = await service.generateAdversarialExamples([{ x: -0.1, y: 0, label: 0 }], model);
    expect(examples).toEqual([]);
    expect(model.predict).not.toHaveBeenCalled();
  });

  it('reports progress through to completion', async () => {
    const progress: Array<[number, number]> = [];
    await service.generateAdversarialExamples(
      [{ x: -0.1, y: 0, label: 0 }, { x: -5, y: 0, label: 0 }],
      model,
      (current, total) => progress.push([current, total])
    );
    expect(progress[0]).toEqual([0, 2]);
    expect(progress[progress.length - 1]).toEqual([2, 2]);
  });
});
