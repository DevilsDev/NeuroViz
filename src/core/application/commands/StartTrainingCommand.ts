import { ICommand } from './ICommand';
import { ValidationResult } from './ValidationResult';
import { ITrainingSession } from '../ITrainingSession';

/**
 * Command to start training
 */
export class StartTrainingCommand implements ICommand<void> {
  constructor(private session: ITrainingSession) {}

  validate(): ValidationResult {
    const state = this.session.getState();

    if (!state.isInitialised) {
      return ValidationResult.error('Network must be initialized before training');
    }

    if (!state.datasetLoaded) {
      return ValidationResult.error('Dataset must be loaded before training');
    }

    // Check if training data is empty (validation split might be 100%)
    const trainingData = this.session.getTrainingData();
    if (trainingData.length === 0) {
      return ValidationResult.error('No training data available. Validation split might be set to 100%. Reduce it to create a training set.');
    }

    if (state.isRunning && !state.isPaused) {
      return ValidationResult.error('Training is already running');
    }

    return ValidationResult.success();
  }

  async execute(): Promise<void> {
    this.session.start();
  }
}
