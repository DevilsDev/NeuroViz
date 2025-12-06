import { ICommand } from './ICommand';
import { ValidationResult } from './ValidationResult';
import { ITrainingSession } from '../ITrainingSession';
import { Hyperparameters, OptimizerType, ActivationType } from '../../domain';

/**
 * Configuration for InitializeNetworkCommand
 */
export interface InitializeNetworkConfig {
  learningRate: number;
  layers: number[];
  optimizer: OptimizerType;
  momentum?: number;
  activation: ActivationType;
  layerActivations?: ActivationType[];
  l1Regularization?: number;
  l2Regularization?: number;
  numClasses?: number;
  dropoutRate?: number;
  clipNorm?: number;
  batchNorm?: boolean;
}

/**
 * Command to initialize a neural network with given hyperparameters
 */
export class InitializeNetworkCommand implements ICommand<void> {
  constructor(
    private session: ITrainingSession,
    private config: InitializeNetworkConfig,
    private onNetworkUpdate?: () => void
  ) {}

  validate(): ValidationResult {
    const errors = new Map<string, string>();

    // Validate learning rate
    if (isNaN(this.config.learningRate) || this.config.learningRate <= 0) {
      errors.set('learningRate', 'Learning rate must be a positive number');
    }

    if (this.config.learningRate > 1) {
      errors.set('learningRate', 'Learning rate should typically be less than 1');
    }

    // Validate layers
    if (!this.config.layers || this.config.layers.length === 0) {
      errors.set('layers', 'At least one hidden layer is required');
    }

    if (this.config.layers.some(l => l <= 0)) {
      errors.set('layers', 'All layer sizes must be positive');
    }

    if (this.config.layers.some(l => isNaN(l))) {
      errors.set('layers', 'All layer sizes must be valid numbers');
    }

    // Validate momentum (if SGD optimizer)
    if (this.config.optimizer === 'sgd' && this.config.momentum !== undefined) {
      if (this.config.momentum < 0 || this.config.momentum >= 1) {
        errors.set('momentum', 'Momentum must be between 0 and 1');
      }
    }

    // Validate regularization
    if (this.config.l1Regularization !== undefined && this.config.l1Regularization < 0) {
      errors.set('l1Regularization', 'L1 regularization must be non-negative');
    }

    if (this.config.l2Regularization !== undefined && this.config.l2Regularization < 0) {
      errors.set('l2Regularization', 'L2 regularization must be non-negative');
    }

    // Validate dropout
    if (this.config.dropoutRate !== undefined && (this.config.dropoutRate < 0 || this.config.dropoutRate >= 1)) {
      errors.set('dropoutRate', 'Dropout rate must be between 0 and 1');
    }

    // Validate clip norm
    if (this.config.clipNorm !== undefined && this.config.clipNorm < 0) {
      errors.set('clipNorm', 'Clip norm must be non-negative');
    }

    // Validate number of classes
    if (this.config.numClasses !== undefined && this.config.numClasses < 2) {
      errors.set('numClasses', 'Number of classes must be at least 2');
    }

    // Validate layer activations (if provided)
    if (this.config.layerActivations && this.config.layerActivations.length !== this.config.layers.length) {
      errors.set('layerActivations', 'Layer activations must match the number of layers');
    }

    if (errors.size > 0) {
      return ValidationResult.errors(errors);
    }

    return ValidationResult.success();
  }

  async execute(): Promise<void> {
    const hyperparameters: Hyperparameters = {
      learningRate: this.config.learningRate,
      layers: this.config.layers,
      optimizer: this.config.optimizer,
      momentum: this.config.momentum ?? 0.9,
      activation: this.config.activation,
      layerActivations: this.config.layerActivations && this.config.layerActivations.length > 0
        ? this.config.layerActivations
        : undefined,
      l1Regularization: this.config.l1Regularization ?? 0,
      l2Regularization: this.config.l2Regularization ?? 0,
      numClasses: this.config.numClasses ?? 2,
      dropoutRate: this.config.dropoutRate ?? 0,
      clipNorm: this.config.clipNorm ?? 0,
      batchNorm: this.config.batchNorm ?? false,
    };

    await this.session.setHyperparameters(hyperparameters);

    // Trigger callback to update network diagram
    if (this.onNetworkUpdate) {
      this.onNetworkUpdate();
    }
  }
}
