import { ICommand } from './ICommand';
import { ValidationResult } from './ValidationResult';
import { ITrainingSession } from '../ITrainingSession';
import { LRScheduleType } from '../../domain';

/**
 * Configuration for UpdateTrainingConfigCommand
 */
export interface UpdateTrainingConfigParams {
  batchSize?: number;
  maxEpochs?: number;
  targetFps?: number;
  lrSchedule?: {
    type: LRScheduleType;
    decayRate?: number;
    decaySteps?: number;
    warmupEpochs?: number;
    cycleLength?: number;
    minLR?: number;
  };
  earlyStoppingPatience?: number;
  validationSplit?: number;
}

/**
 * Command to update training configuration
 */
export class UpdateTrainingConfigCommand implements ICommand<void> {
  constructor(
    private session: ITrainingSession,
    private config: UpdateTrainingConfigParams
  ) {}

  validate(): ValidationResult {
    const errors = new Map<string, string>();

    if (this.config.batchSize !== undefined && this.config.batchSize <= 0) {
      errors.set('batchSize', 'Batch size must be positive');
    }

    if (this.config.maxEpochs !== undefined && this.config.maxEpochs <= 0) {
      errors.set('maxEpochs', 'Max epochs must be positive');
    }

    if (this.config.targetFps !== undefined && (this.config.targetFps <= 0 || this.config.targetFps > 120)) {
      errors.set('targetFps', 'Target FPS must be between 1 and 120');
    }

    if (this.config.earlyStoppingPatience !== undefined && this.config.earlyStoppingPatience < 0) {
      errors.set('earlyStoppingPatience', 'Early stopping patience must be non-negative');
    }

    if (this.config.validationSplit !== undefined && (this.config.validationSplit < 0 || this.config.validationSplit >= 1)) {
      errors.set('validationSplit', 'Validation split must be between 0 and 1');
    }

    if (this.config.lrSchedule?.minLR !== undefined && this.config.lrSchedule.minLR <= 0) {
      errors.set('minLR', 'Minimum learning rate must be positive');
    }

    if (this.config.lrSchedule?.cycleLength !== undefined && this.config.lrSchedule.cycleLength <= 0) {
      errors.set('cycleLength', 'Cycle length must be positive');
    }

    if (errors.size > 0) {
      return ValidationResult.errors(errors);
    }

    return ValidationResult.success();
  }

  async execute(): Promise<void> {
    this.session.setTrainingConfig(this.config);
  }
}
