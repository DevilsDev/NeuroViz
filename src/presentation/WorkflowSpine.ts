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

const STAGE_LABELS: Record<WorkflowStage, string> = {
  prepare: 'Prepare',
  configure: 'Configure',
  train: 'Train',
  analyze: 'Analyze',
};

const STAGE_ORDER: WorkflowStage[] = ['prepare', 'configure', 'train', 'analyze'];

/**
 * Renders the workflow spine breadcrumb into a container element.
 * Call update() with each new TrainingState snapshot.
 */
export class WorkflowSpine {
  private container: HTMLElement;
  private stageEls = new Map<WorkflowStage, HTMLElement>();

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`WorkflowSpine container #${containerId} not found`);
    this.container = el;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = '';
    this.container.classList.add('workflow-spine');
    this.container.setAttribute('role', 'navigation');
    this.container.setAttribute('aria-label', 'Training workflow progress');

    for (let i = 0; i < STAGE_ORDER.length; i++) {
      const stage = STAGE_ORDER[i]!;

      if (i > 0) {
        const connector = document.createElement('span');
        connector.className = 'workflow-connector';
        connector.setAttribute('aria-hidden', 'true');
        connector.textContent = '\u203A'; // ›
        this.container.appendChild(connector);
      }

      const el = document.createElement('span');
      el.className = 'workflow-stage';
      el.setAttribute('data-stage', stage);
      el.textContent = STAGE_LABELS[stage];
      this.container.appendChild(el);
      this.stageEls.set(stage, el);
    }
  }

  update(state: TrainingState): void {
    const stages = deriveStages(state);

    for (const stage of STAGE_ORDER) {
      const el = this.stageEls.get(stage);
      if (!el) continue;

      const s = stages[stage];
      el.classList.toggle('active', s.active);
      el.classList.toggle('complete', s.complete);
      el.setAttribute('aria-current', s.active ? 'step' : 'false');
    }
  }
}
