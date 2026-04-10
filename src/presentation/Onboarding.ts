import { tutorialManager } from './Tutorial';
import { logger } from '../infrastructure/logging/Logger';

const FIRST_RUN_KEY = 'neuroviz-first-run-complete';

/**
 * First-run onboarding modal with three entry points.
 * Replaces the old auto-starting tutorial wizard.
 */
export class Onboarding {
  private overlay: HTMLElement | null = null;

  shouldShow(): boolean {
    return localStorage.getItem(FIRST_RUN_KEY) !== 'true';
  }

  private dismiss(): void {
    localStorage.setItem(FIRST_RUN_KEY, 'true');
    if (this.overlay) {
      this.overlay.classList.add('hidden');
      this.overlay.remove();
      this.overlay = null;
    }
  }

  show(): void {
    if (!this.shouldShow()) return;

    this.overlay = document.createElement('div');
    this.overlay.className = 'onboarding-overlay';
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');
    this.overlay.setAttribute('aria-label', 'Welcome to NeuroViz');

    const modal = document.createElement('div');
    modal.className = 'onboarding-modal';

    modal.innerHTML = `
      <h2 class="onboarding-title">Welcome to NeuroViz</h2>
      <p class="onboarding-subtitle">
        Train neural networks and watch them learn in real time.
        How would you like to start?
      </p>
      <div class="onboarding-actions">
        <button class="onboarding-btn onboarding-btn-primary" data-action="preset">
          <span class="onboarding-btn-icon">&#9654;</span>
          <span>
            <strong>Start with a preset</strong>
            <small>Load a dataset and train immediately</small>
          </span>
        </button>
        <button class="onboarding-btn onboarding-btn-secondary" data-action="tutorial">
          <span class="onboarding-btn-icon">&#128218;</span>
          <span>
            <strong>Follow the tutorial</strong>
            <small>Step-by-step walkthrough of the basics</small>
          </span>
        </button>
        <button class="onboarding-btn onboarding-btn-tertiary" data-action="lab">
          <span class="onboarding-btn-icon">&#128300;</span>
          <span>
            <strong>Jump to Lab Mode</strong>
            <small>Full controls, no hand-holding</small>
          </span>
        </button>
      </div>
    `;

    this.overlay.appendChild(modal);
    document.body.appendChild(this.overlay);

    // Bind entry point handlers
    modal.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
      if (!btn) return;

      const action = btn.dataset.action;
      this.dismiss();

      switch (action) {
        case 'preset':
          this.handlePresetEntry();
          break;
        case 'tutorial':
          this.handleTutorialEntry();
          break;
        case 'lab':
          this.handleLabEntry();
          break;
      }
    });

    // Close on overlay click (outside modal)
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.dismiss();
      }
    });

    // Close on Escape
    const escHandler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        this.dismiss();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  private handlePresetEntry(): void {
    logger.info('Onboarding: user chose preset entry', { component: 'Onboarding' });
    // Click the first dataset chip (Circle) to auto-load a simple dataset
    const circleChip = document.querySelector('.dataset-chip[data-dataset="circle"]') as HTMLElement | null;
    circleChip?.click();

    // Brief delay then click load data
    setTimeout(() => {
      const loadBtn = document.getElementById('btn-load-data') as HTMLButtonElement | null;
      loadBtn?.click();
    }, 200);
  }

  private handleTutorialEntry(): void {
    logger.info('Onboarding: user chose tutorial entry', { component: 'Onboarding' });
    tutorialManager.start('getting-started', () => {
      logger.info('Tutorial completed from onboarding', { component: 'Onboarding' });
    });
  }

  private handleLabEntry(): void {
    logger.info('Onboarding: user chose lab mode entry', { component: 'Onboarding' });
    // Switch to advanced mode
    const advancedBtn = document.querySelector('.mode-btn[data-mode="advanced"]') as HTMLElement | null;
    advancedBtn?.click();
  }
}

/**
 * Legacy compat — existing code calls setupOnboardingWizard().
 * Now delegates to the new Onboarding class.
 */
export function setupOnboardingWizard(): void {
  const onboarding = new Onboarding();
  if (onboarding.shouldShow()) {
    setTimeout(() => onboarding.show(), 800);
  }
}
