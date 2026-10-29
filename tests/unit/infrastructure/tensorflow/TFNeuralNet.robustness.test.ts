/**
 * TFNeuralNet robustness tests: activation/structure alignment, gradient
 * clipping, gradient-explosion detection and exception-safe tensor disposal.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as tf from '@tensorflow/tfjs';
import { TFNeuralNet } from '../../../../src/infrastructure/tensorflow/TFNeuralNet';
import { GradientExplosionError } from '../../../../src/infrastructure/tensorflow/errors';
import type { Point } from '../../../../src/core/domain';

/** Exposes the private model for white-box stubbing. */
function modelOf(net: TFNeuralNet): tf.Sequential {
  return (net as unknown as { model: tf.Sequential }).model;
}

const XOR_DATA: Point[] = [
  { x: -1, y: -1, label: 0 },
  { x: 1, y: 1, label: 0 },
  { x: -1, y: 1, label: 1 },
  { x: 1, y: -1, label: 1 },
];

function snapshotWeights(net: TFNeuralNet): Float32Array[] {
  return modelOf(net).getWeights().map((w) => w.dataSync().slice() as Float32Array);
}

function globalDeltaNorm(before: Float32Array[], after: Float32Array[]): number {
  let sumSq = 0;
  before.forEach((b, i) => {
    const a = after[i]!;
    for (let j = 0; j < b.length; j++) {
      const d = (a[j] ?? 0) - (b[j] ?? 0);
      sumSq += d * d;
    }
  });
  return Math.sqrt(sumSq);
}

describe('TFNeuralNet - robustness', () => {
  let net: TFNeuralNet;

  beforeEach(() => {
    net = new TFNeuralNet();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    net.dispose();
    tf.disposeVariables();
  });

  describe('getLayerActivations alignment with getStructure', () => {
    it('returns one entry per structure layer when dropout and batch norm are enabled', async () => {
      await net.initialize({
        learningRate: 0.01,
        layers: [8, 4],
        numClasses: 3,
        activation: 'relu',
        dropoutRate: 0.5,
        batchNorm: true,
      });

      const structure = net.getStructure()!;
      expect(structure.layers).toEqual([2, 8, 4, 3]);

      const activations = net.getLayerActivations({ x: 0.3, y: -0.7, label: 0 });

      expect(activations).toHaveLength(structure.layers.length);
      expect(activations.map((a) => a.length)).toEqual(structure.layers);
      expect(activations[0]).toEqual([0.3, -0.7]);

      // Hidden activations are post-nonlinearity (relu after batch norm),
      // not the raw linear Dense output that precedes batch norm.
      expect(activations[1]!.every((v) => v >= 0)).toBe(true);
      expect(activations[2]!.every((v) => v >= 0)).toBe(true);

      // Output is a softmax distribution
      const sum = activations[3]!.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1, 5);
    });

    it('does not leak tensors', async () => {
      await net.initialize({
        learningRate: 0.01,
        layers: [8, 4],
        numClasses: 3,
        dropoutRate: 0.2,
        batchNorm: true,
      });
      const before = tf.memory().numTensors;
      net.getLayerActivations({ x: 0.1, y: 0.2, label: 0 });
      expect(tf.memory().numTensors).toBe(before);
    });
  });

  describe('gradient clipping (clipNorm)', () => {
    it('limits the global norm of a single SGD weight update to lr * clipNorm', async () => {
      const learningRate = 1;
      const clipNorm = 1e-3;
      await net.initialize({
        learningRate,
        layers: [8],
        optimizer: 'sgd',
        momentum: 0,
        clipNorm,
      });

      const before = snapshotWeights(net);
      await net.train(XOR_DATA);
      const after = snapshotWeights(net);

      const delta = globalDeltaNorm(before, after);
      expect(delta).toBeGreaterThan(0);
      expect(delta).toBeLessThanOrEqual(learningRate * clipNorm * 1.01);
    });

    it('leaves updates unchanged when the gradient norm is already below clipNorm', async () => {
      const config = {
        learningRate: 0.1,
        layers: [4],
        optimizer: 'sgd' as const,
        momentum: 0,
        l2Regularization: 0.01,
      };
      const reference = new TFNeuralNet();
      await reference.initialize(config);
      await net.initialize({ ...config, clipNorm: 1e6 });
      modelOf(net).setWeights(modelOf(reference).getWeights());

      const refResult = await reference.train(XOR_DATA);
      const clippedResult = await net.train(XOR_DATA);

      expect(clippedResult.loss).toBeCloseTo(refResult.loss, 5);
      const refWeights = snapshotWeights(reference);
      const netWeights = snapshotWeights(net);
      expect(globalDeltaNorm(refWeights, netWeights)).toBeLessThan(1e-5);
      reference.dispose();
    });

    it('does not leak tensors when clipping is enabled', async () => {
      await net.initialize({ learningRate: 0.1, layers: [4], optimizer: 'adam', clipNorm: 0.5 });
      // First step creates optimizer slot variables; measure from the second.
      await net.train(XOR_DATA);
      const before = tf.memory().numTensors;
      await net.train(XOR_DATA);
      await net.train(XOR_DATA);
      expect(tf.memory().numTensors).toBe(before);
    });
  });

  describe('gradient explosion detection', () => {
    it('throws GradientExplosionError when the loss is Infinity', async () => {
      await net.initialize({ learningRate: 0.01, layers: [4] });
      vi.spyOn(modelOf(net), 'trainOnBatch').mockResolvedValue(Number.POSITIVE_INFINITY);
      await expect(net.train(XOR_DATA)).rejects.toBeInstanceOf(GradientExplosionError);
    });

    it('throws GradientExplosionError when the loss is NaN', async () => {
      await net.initialize({ learningRate: 0.01, layers: [4] });
      vi.spyOn(modelOf(net), 'trainOnBatch').mockResolvedValue(Number.NaN);
      await expect(net.train(XOR_DATA)).rejects.toBeInstanceOf(GradientExplosionError);
    });
  });

  describe('exception-safe tensor disposal', () => {
    it('disposes prediction tensors in train() when accuracy computation throws', async () => {
      await net.initialize({ learningRate: 0.01, layers: [4] });
      await net.train(XOR_DATA); // warm up optimizer state
      const before = tf.memory().numTensors;

      vi.spyOn(
        net as unknown as { computeAccuracy: () => Promise<number> },
        'computeAccuracy'
      ).mockRejectedValue(new Error('readback failed'));

      await expect(net.train(XOR_DATA)).rejects.toThrow('readback failed');
      expect(tf.memory().numTensors).toBe(before);
    });

    it('disposes evaluate() result tensors when reading them back throws', async () => {
      await net.initialize({ learningRate: 0.01, layers: [4] });
      const model = modelOf(net);
      const originalEvaluate = model.evaluate.bind(model);
      vi.spyOn(model, 'evaluate').mockImplementation((x, y, args) => {
        const result = originalEvaluate(x, y, args) as tf.Scalar[];
        result[0]!.data = () => Promise.reject(new Error('readback failed'));
        return result;
      });

      const before = tf.memory().numTensors;
      await expect(net.evaluate(XOR_DATA)).rejects.toThrow('readback failed');
      expect(tf.memory().numTensors).toBe(before);
    });
  });
});
