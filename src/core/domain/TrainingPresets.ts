import type { Hyperparameters } from './Hyperparameters';
import { DEFAULT_HYPERPARAMETERS } from './Hyperparameters';

/**
 * Dataset types available in NeuroViz
 */
export type DatasetType = 'circle' | 'xor' | 'gaussian' | 'spiral' | 'moons';

/**
 * Training preset configuration
 */
export interface TrainingPreset {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly hyperparameters: Hyperparameters;
  readonly datasetType: DatasetType;
  readonly recommendedEpochs: number;
}

/**
 * Predefined training presets for common scenarios
 */
export const TRAINING_PRESETS: Record<string, TrainingPreset> = {
  quickDemo: {
    id: 'quickDemo',
    name: 'Quick Demo',
    description: 'Fast training with simple architecture - good for demos and quick exploration',
    hyperparameters: {
      ...DEFAULT_HYPERPARAMETERS,
      layers: [4],
      learningRate: 0.1,
      activation: 'relu',
      optimizer: 'adam',
      numClasses: 2,
    },
    datasetType: 'circle',
    recommendedEpochs: 100,
  },

  deepNetwork: {
    id: 'deepNetwork',
    name: 'Deep Network',
    description: 'Multiple hidden layers for complex pattern learning',
    hyperparameters: {
      ...DEFAULT_HYPERPARAMETERS,
      layers: [16, 16, 8],
      learningRate: 0.01,
      activation: 'relu',
      optimizer: 'adam',
      numClasses: 2,
      l2Regularization: 0.0001,
    },
    datasetType: 'spiral',
    recommendedEpochs: 500,
  },

  highAccuracy: {
    id: 'highAccuracy',
    name: 'High Accuracy',
    description: 'Slower but more accurate - uses smaller learning rate and more epochs',
    hyperparameters: {
      ...DEFAULT_HYPERPARAMETERS,
      layers: [12, 8],
      learningRate: 0.005,
      activation: 'tanh',
      optimizer: 'adam',
      momentum: 0.95,
      numClasses: 2,
      l2Regularization: 0.0001,
    },
    datasetType: 'xor',
    recommendedEpochs: 1000,
  },

  overfitDemo: {
    id: 'overfitDemo',
    name: 'Overfit Demo',
    description: 'Deliberately overfits to illustrate the concept - large network, no regularization',
    hyperparameters: {
      ...DEFAULT_HYPERPARAMETERS,
      layers: [32, 32, 16, 8],
      learningRate: 0.05,
      activation: 'relu',
      optimizer: 'sgd',
      momentum: 0.9,
      numClasses: 2,
      l1Regularization: 0,
      l2Regularization: 0,
      dropoutRate: 0,
    },
    datasetType: 'gaussian',
    recommendedEpochs: 2000,
  },
};

/**
 * Get all available presets
 */
export function getAllPresets(): TrainingPreset[] {
  return Object.values(TRAINING_PRESETS);
}

/**
 * Get preset by ID
 */
export function getPreset(id: string): TrainingPreset | null {
  return TRAINING_PRESETS[id] ?? null;
}
