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

    if (state.isRunning && !state.isPaused) {
      return ValidationResult.error('Training is already running');
    }

    return ValidationResult.success();
  }

  async execute(): Promise<void> {
    this.session.start();
  }
}
