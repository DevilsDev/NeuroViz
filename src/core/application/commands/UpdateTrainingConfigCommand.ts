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

function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
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

    // 0 is meaningful for both: full batch / unlimited epochs (see TrainingSession)
    if (this.config.batchSize !== undefined && !isNonNegativeInteger(this.config.batchSize)) {
      errors.set('batchSize', 'Batch size must be a whole number (0 = full batch)');
    }

    if (this.config.maxEpochs !== undefined && !isNonNegativeInteger(this.config.maxEpochs)) {
      errors.set('maxEpochs', 'Max epochs must be a whole number (0 = unlimited)');
    }

    if (this.config.targetFps !== undefined && (this.config.targetFps <= 0 || this.config.targetFps > 120)) {
      errors.set('targetFps', 'Target FPS must be between 1 and 120');
    }

    if (this.config.earlyStoppingPatience !== undefined && this.config.earlyStoppingPatience < 0) {
      errors.set('earlyStoppingPatience', 'Early stopping patience must be non-negative');
    }

    const { validationSplit } = this.config;
    if (validationSplit !== undefined && !(validationSplit >= 0 && validationSplit < 1)) {
      errors.set('validationSplit', 'Validation split must be between 0 and 1');
    }

    const schedule = this.config.lrSchedule;
    if (schedule?.minLR !== undefined && !(schedule.minLR > 0)) {
      errors.set('minLR', 'Minimum learning rate must be positive');
    }

    if (schedule?.cycleLength !== undefined && !(schedule.cycleLength > 0)) {
      errors.set('cycleLength', 'Cycle length must be positive');
    }

    if (schedule?.decaySteps !== undefined && !(isNonNegativeInteger(schedule.decaySteps) && schedule.decaySteps > 0)) {
      errors.set('decaySteps', 'Decay steps must be a positive whole number');
    }

    if (schedule?.decayRate !== undefined && !(schedule.decayRate > 0 && schedule.decayRate <= 1)) {
      errors.set('decayRate', 'Decay rate must be greater than 0 and at most 1');
    }

    if (schedule?.warmupEpochs !== undefined && !isNonNegativeInteger(schedule.warmupEpochs)) {
      errors.set('warmupEpochs', 'Warmup epochs must be a non-negative whole number');
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
