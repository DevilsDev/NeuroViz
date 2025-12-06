import { ICommand } from './ICommand';
import { ValidationResult } from './ValidationResult';
import { ITrainingSession } from '../ITrainingSession';

/**
 * Command to step through one epoch of training
 */
export class StepTrainingCommand implements ICommand<void> {
  constructor(private session: ITrainingSession) {}

  validate(): ValidationResult {
    const state = this.session.getState();

    if (!state.isInitialised) {
      return ValidationResult.error('Network must be initialized before stepping');
    }

    if (!state.datasetLoaded) {
      return ValidationResult.error('Dataset must be loaded before stepping');
    }

    if (state.isRunning) {
      return ValidationResult.error('Cannot step while training is running');
    }

    return ValidationResult.success();
  }

  async execute(): Promise<void> {
    await this.session.step();
  }
}
