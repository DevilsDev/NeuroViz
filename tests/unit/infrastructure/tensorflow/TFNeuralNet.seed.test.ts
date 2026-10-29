import { describe, it, expect, afterEach } from 'vitest';
import * as tf from '@tensorflow/tfjs';
import { TFNeuralNet } from '../../../../src/infrastructure/tensorflow/TFNeuralNet';
import type { Hyperparameters } from '../../../../src/core/domain';

const nets: TFNeuralNet[] = [];

async function weightsFor(config: Partial<Hyperparameters>): Promise<number[]> {
  const net = new TFNeuralNet();
  nets.push(net);
  await net.initialize({ learningRate: 0.01, layers: [6, 4], ...config });
  return net.getWeights();
}

afterEach(() => {
  nets.splice(0).forEach((n) => n.dispose());
  tf.disposeVariables();
});

describe('TFNeuralNet seeded initialisation', () => {
  it('gives identical starting weights for the same seed', async () => {
    expect(await weightsFor({ seed: 42 })).toEqual(await weightsFor({ seed: 42 }));
  });

  it('gives different starting weights for different seeds', async () => {
    expect(await weightsFor({ seed: 42 })).not.toEqual(await weightsFor({ seed: 43 }));
  });

  it('gives each layer its own weights rather than repeating one draw', async () => {
    const net = new TFNeuralNet();
    nets.push(net);
    await net.initialize({ learningRate: 0.01, layers: [4, 4], seed: 5 });
    const [, second, third] = net.getWeightMatrices();
    // Layers 2 and 3 have the same 4×4 shape; a shared seed would make them equal
    expect(second).not.toEqual(third?.slice(0, 4));
  });

  it('applies the chosen initialiser', async () => {
    const he = await weightsFor({ seed: 7, weightInit: 'heNormal' });
    const glorot = await weightsFor({ seed: 7, weightInit: 'glorotUniform' });
    const lecun = await weightsFor({ seed: 7, weightInit: 'lecunNormal' });
    expect(glorot).not.toEqual(he);
    expect(lecun).not.toEqual(he);
  });

  it('still starts randomly without a seed', async () => {
    expect(await weightsFor({ seed: null })).not.toEqual(await weightsFor({ seed: null }));
  });
});
