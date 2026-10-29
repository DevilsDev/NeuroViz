/**
 * Saved-session shape guard tests
 */
import { describe, it, expect } from 'vitest';
import { isSessionData } from '../../../src/presentation/controllers/SessionController';

const valid = {
  version: 1,
  timestamp: 1,
  config: {
    datasetType: 'xor', samples: 200, noise: 0.1, numClasses: 2, learningRate: 0.03,
    layers: '8,4', optimizer: 'adam', activation: 'relu', l2Regularization: 0,
    batchSize: 32, maxEpochs: 0, targetFps: 60, validationSplit: 0.2,
  },
  data: [{ x: 0, y: 1, label: 0 }],
  history: { records: [] },
};

describe('isSessionData', () => {
  it('accepts a well-formed saved session', () => {
    expect(isSessionData(valid)).toBe(true);
  });

  it.each([
    ['null', null],
    ['a string', 'session'],
    ['missing config', { ...valid, config: undefined }],
    ['non-numeric samples', { ...valid, config: { ...valid.config, samples: '200' } }],
    ['non-string layers', { ...valid, config: { ...valid.config, layers: [8, 4] } }],
    ['data not an array', { ...valid, data: { x: 1 } }],
    ['malformed point', { ...valid, data: [{ x: 'a', y: 1, label: 0 }] }],
  ])('rejects %s', (_label, value) => {
    expect(isSessionData(value)).toBe(false);
  });
});
