import type { TrainingState } from '../core/application/ITrainingSession';

export type WorkflowStage = 'prepare' | 'configure' | 'train' | 'analyze';

interface StageState {
  active: boolean;
  complete: boolean;
}

/**
 * Derives workflow stage states from a TrainingState snapshot.
 * Pure function — no subscriptions, no side effects.
 */
export function deriveStages(state: TrainingState): Record<WorkflowStage, StageState> {
  const hasData = state.datasetLoaded;
  const hasModel = state.isInitialised;
  const hasTrainedAtLeastOnce = state.currentEpoch > 0;
  const isTraining = state.isRunning && !state.isPaused;

  return {
    prepare: {
      complete: hasData,
      active: !hasData,
    },
    configure: {
      complete: hasModel,
      active: hasData && !hasModel,
    },
    train: {
      complete: hasTrainedAtLeastOnce && !isTraining,
      active: isTraining || (hasModel && !hasTrainedAtLeastOnce),
    },
    analyze: {
      complete: false,
      active: hasTrainedAtLeastOnce,
    },
  };
}

/** Which workflow nav tab represents each stage */
const STAGE_TABS: Record<WorkflowStage, string> = {
  prepare: 'tab-data',
  configure: 'tab-model',
  train: 'tab-train',
  analyze: 'tab-analyze',
};

const STAGE_ORDER: WorkflowStage[] = ['prepare', 'configure', 'train', 'analyze'];

/**
 * Shows workflow progress on the step navigation (the vertical sidebar tabs):
 * completed steps get a check mark, the step to do next is highlighted.
 * Call update() with each new TrainingState snapshot.
 */
export class WorkflowNav {
  private readonly steps = new Map<WorkflowStage, { button: HTMLElement; status: HTMLElement }>();

  constructor(navId: string) {
    const nav = document.getElementById(navId);
    if (!nav) throw new Error(`WorkflowNav #${navId} not found`);

    for (const stage of STAGE_ORDER) {
      const button = nav.querySelector<HTMLElement>(`[data-tab="${STAGE_TABS[stage]}"]`);
      if (!button) continue;
      // Screen-reader text mirroring the visual check mark / highlight
      const status = document.createElement('span');
      status.className = 'sr-only step-status';
      button.appendChild(status);
      this.steps.set(stage, { button, status });
    }
  }

  update(state: TrainingState): void {
    const stages = deriveStages(state);

    for (const stage of STAGE_ORDER) {
      const step = this.steps.get(stage);
      if (!step) continue;

      const { active, complete } = stages[stage];
      const status = complete ? 'complete' : active ? 'current' : 'pending';
      step.button.dataset.status = status;
      step.status.textContent = complete ? ' (done)' : active ? ' (next step)' : '';
    }
  }
}
