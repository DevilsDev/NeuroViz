/**
 * Tutorial Service
 * 
 * Manages tutorial state, progression, and UI overlay.
 * Handles step transitions, highlighting, and action detection.
 */

import {
  Tutorial,
  TutorialStep,
  TutorialProgress,
  TutorialCompletion,
  getTutorial,
  TUTORIALS,
} from '../../core/domain/Tutorial';

type StateChangeCallback = (progress: TutorialProgress | null) => void;

/**
 * Service for managing interactive tutorials
 */
export class TutorialService {
  private currentTutorial: Tutorial | null = null;
  private progress: TutorialProgress | null = null;
  private completions: TutorialCompletion[] = [];
  private stateListeners: StateChangeCallback[] = [];
  private actionListeners: Map<string, () => void> = new Map();
  private overlay: HTMLElement | null = null;
  private highlightElements: HTMLElement[] = [];

  constructor() {
    this.loadCompletions();
    this.createOverlay();
  }

  /**
   * Starts a tutorial by ID
   */
  start(tutorialId: string): boolean {
    const tutorial = getTutorial(tutorialId);
    if (!tutorial) {
      console.warn(`Tutorial not found: ${tutorialId}`);
      return false;
    }

    this.currentTutorial = tutorial;
    this.progress = {
      tutorialId,
      currentStepIndex: 0,
      isPaused: false,
      startedAt: Date.now(),
      completedSteps: [],
    };

    this.showOverlay();
    this.renderCurrentStep();
    this.notifyListeners();
    return true;
  }

  /**
   * Advances to the next step
   */
  next(): void {
    if (!this.progress || !this.currentTutorial) return;

    const currentStep = this.getCurrentStep();
    if (currentStep) {
      this.progress.completedSteps.push(currentStep.id);
    }

    if (this.progress.currentStepIndex < this.currentTutorial.steps.length - 1) {
      this.progress.currentStepIndex++;
      this.renderCurrentStep();
      this.notifyListeners();
    } else {
      this.complete();
    }
  }

  /**
   * Goes back to the previous step
   */
  previous(): void {
    if (!this.progress || this.progress.currentStepIndex === 0) return;

    this.progress.currentStepIndex--;
    this.renderCurrentStep();
    this.notifyListeners();
  }

  /**
   * Skips to a specific step
   */
  goToStep(stepIndex: number): void {
    if (!this.progress || !this.currentTutorial) return;
    if (stepIndex < 0 || stepIndex >= this.currentTutorial.steps.length) return;

    this.progress.currentStepIndex = stepIndex;
    this.renderCurrentStep();
    this.notifyListeners();
  }

  /**
   * Pauses the tutorial
   */
  pause(): void {
    if (this.progress) {
      this.progress.isPaused = true;
      this.hideOverlay();
      this.notifyListeners();
    }
  }

  /**
   * Resumes a paused tutorial
   */
  resume(): void {
    if (this.progress) {
      this.progress.isPaused = false;
      this.showOverlay();
      this.renderCurrentStep();
      this.notifyListeners();
    }
  }

  /**
   * Exits the tutorial without completing
   */
  exit(): void {
    this.cleanup();
    this.currentTutorial = null;
    this.progress = null;
    this.notifyListeners();
  }

  /**
   * Restarts the current tutorial
   */
  restart(): void {
    if (!this.currentTutorial) return;
    this.start(this.currentTutorial.id);
  }

  /**
   * Completes the tutorial
   */
  private complete(): void {
    if (!this.currentTutorial || !this.progress) return;

    const completion: TutorialCompletion = {
      tutorialId: this.currentTutorial.id,
      completedAt: Date.now(),
      durationMs: Date.now() - this.progress.startedAt,
    };

    this.completions.push(completion);
    this.saveCompletions();
    this.showCompletionMessage();

    setTimeout(() => {
      this.exit();
    }, 3000);
  }

  /**
   * Gets the current step
   */
  getCurrentStep(): TutorialStep | null {
    if (!this.currentTutorial || !this.progress) return null;
    return this.currentTutorial.steps[this.progress.currentStepIndex] ?? null;
  }

  /**
   * Gets current progress
   */
  getProgress(): TutorialProgress | null {
    return this.progress;
  }

  /**
   * Gets current tutorial
   */
  getCurrentTutorial(): Tutorial | null {
    return this.currentTutorial;
  }

  /**
   * Checks if a tutorial is active
   */
  isActive(): boolean {
    return this.progress !== null && !this.progress.isPaused;
  }

  /**
   * Gets all available tutorials
   */
  getAllTutorials(): Tutorial[] {
    return TUTORIALS;
  }

  /**
   * Gets completed tutorial IDs
   */
  getCompletedTutorialIds(): string[] {
    return this.completions.map(c => c.tutorialId);
  }

  /**
   * Checks if a tutorial is completed
   */
  isTutorialCompleted(tutorialId: string): boolean {
    return this.completions.some(c => c.tutorialId === tutorialId);
  }

  /**
   * Registers a state change listener
   */
  onStateChange(callback: StateChangeCallback): () => void {
    this.stateListeners.push(callback);
    return () => {
      const index = this.stateListeners.indexOf(callback);
      if (index > -1) this.stateListeners.splice(index, 1);
    };
  }

  /**
   * Notifies the service that a training event occurred
   */
  notifyTrainingEvent(event: 'start' | 'complete' | 'epoch', epoch?: number): void {
    const step = this.getCurrentStep();
    if (!step) return;

    let shouldAdvance = false;

    switch (step.action.type) {
      case 'training-start':
        shouldAdvance = event === 'start';
        break;
      case 'training-complete':
        shouldAdvance = event === 'complete';
        break;
      case 'epoch-reached':
        shouldAdvance = event === 'epoch' && epoch !== undefined && epoch >= step.action.epoch;
        break;
    }

    if (shouldAdvance) {
      this.next();
    }
  }

  /**
   * Notifies the service that a UI action occurred
   */
  notifyUIAction(actionType: 'click' | 'change', selector: string): void {
    const step = this.getCurrentStep();
    if (!step) return;

    if (step.action.type === actionType && step.action.selector === selector) {
      this.next();
    }
  }

  /**
   * Disposes the service
   */
  dispose(): void {
    this.cleanup();
    this.stateListeners = [];
    if (this.overlay?.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }

  // =========================================================================
  // Private Methods
  // =========================================================================

  private notifyListeners(): void {
    for (const listener of this.stateListeners) {
      listener(this.progress);
    }
  }

  private createOverlay(): void {
    this.overlay = document.createElement('div');
    this.overlay.id = 'tutorial-overlay';
    this.overlay.className = 'fixed inset-0 z-[100] pointer-events-none hidden';
    this.overlay.innerHTML = `
      <div class="tutorial-backdrop absolute inset-0 bg-black/50 pointer-events-auto"></div>
      <div class="tutorial-content absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-lg pointer-events-auto">
        <div class="bg-navy-800 rounded-xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/10 p-6">
          <div class="flex items-start justify-between mb-4">
            <div>
              <div class="text-xs text-cyan-400 uppercase tracking-wider mb-1">
                <span class="tutorial-step-counter">Step 1 of 5</span>
              </div>
              <h3 class="tutorial-title text-lg font-bold text-white"></h3>
            </div>
            <button class="tutorial-close p-2 hover:bg-navy-700 rounded-lg text-slate-400 hover:text-white transition-colors" title="Exit tutorial">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="tutorial-content-text text-slate-300 text-sm leading-relaxed mb-4"></div>
          <div class="tutorial-tip hidden bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 mb-4">
            <div class="flex items-start gap-2">
              <svg class="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="tutorial-tip-text text-xs text-cyan-300"></span>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex gap-2">
              <button class="tutorial-prev btn-secondary text-xs px-3 py-1.5 disabled:opacity-30" disabled>
                ← Previous
              </button>
              <button class="tutorial-skip text-xs text-slate-500 hover:text-slate-300 px-2">
                Skip tutorial
              </button>
            </div>
            <button class="tutorial-next btn-primary text-xs px-4 py-1.5">
              Next →
            </button>
          </div>
          <div class="tutorial-progress mt-4 h-1 bg-navy-700 rounded-full overflow-hidden">
            <div class="tutorial-progress-bar h-full bg-cyan-500 transition-all duration-300" style="width: 0%"></div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);
    this.bindOverlayEvents();
  }

  private bindOverlayEvents(): void {
    if (!this.overlay) return;

    const closeBtn = this.overlay.querySelector('.tutorial-close');
    const prevBtn = this.overlay.querySelector('.tutorial-prev');
    const nextBtn = this.overlay.querySelector('.tutorial-next');
    const skipBtn = this.overlay.querySelector('.tutorial-skip');

    closeBtn?.addEventListener('click', () => this.exit());
    prevBtn?.addEventListener('click', () => this.previous());
    nextBtn?.addEventListener('click', () => this.next());
    skipBtn?.addEventListener('click', () => this.exit());
  }

  private showOverlay(): void {
    this.overlay?.classList.remove('hidden');
  }

  private hideOverlay(): void {
    this.overlay?.classList.add('hidden');
    this.clearHighlights();
  }

  private renderCurrentStep(): void {
    const step = this.getCurrentStep();
    if (!step || !this.overlay || !this.currentTutorial) return;

    const stepIndex = this.progress?.currentStepIndex ?? 0;
    const totalSteps = this.currentTutorial.steps.length;

    // Update step counter
    const counter = this.overlay.querySelector('.tutorial-step-counter');
    if (counter) counter.textContent = `Step ${stepIndex + 1} of ${totalSteps}`;

    // Update title
    const title = this.overlay.querySelector('.tutorial-title');
    if (title) title.textContent = step.title;

    // Update content (basic markdown support)
    const content = this.overlay.querySelector('.tutorial-content-text');
    if (content) {
      content.innerHTML = this.renderMarkdown(step.content);
    }

    // Update tip
    const tipContainer = this.overlay.querySelector('.tutorial-tip');
    const tipText = this.overlay.querySelector('.tutorial-tip-text');
    if (tipContainer && tipText) {
      if (step.tip) {
        tipContainer.classList.remove('hidden');
        tipText.textContent = step.tip;
      } else {
        tipContainer.classList.add('hidden');
      }
    }

    // Update navigation buttons
    const prevBtn = this.overlay.querySelector('.tutorial-prev') as HTMLButtonElement;
    const nextBtn = this.overlay.querySelector('.tutorial-next') as HTMLButtonElement;
    if (prevBtn) prevBtn.disabled = stepIndex === 0;
    if (nextBtn) {
      const isLastStep = stepIndex === totalSteps - 1;
      const isManualAction = step.action.type === 'manual';
      nextBtn.textContent = isLastStep ? 'Finish' : (isManualAction ? 'Next →' : 'Waiting...');
      nextBtn.disabled = !isManualAction && !isLastStep;
    }

    // Update progress bar
    const progressBar = this.overlay.querySelector('.tutorial-progress-bar') as HTMLElement;
    if (progressBar) {
      const progress = ((stepIndex + 1) / totalSteps) * 100;
      progressBar.style.width = `${progress}%`;
    }

    // Apply highlights
    this.applyHighlights(step.highlight ?? []);
  }

  private renderMarkdown(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  private applyHighlights(highlights: { selector: string; padding?: number }[]): void {
    this.clearHighlights();

    for (const highlight of highlights) {
      const element = document.querySelector(highlight.selector) as HTMLElement;
      if (!element) continue;

      const rect = element.getBoundingClientRect();
      const padding = highlight.padding ?? 4;

      const highlightEl = document.createElement('div');
      highlightEl.className = 'tutorial-highlight fixed pointer-events-none z-[99]';
      highlightEl.style.cssText = `
        top: ${rect.top - padding}px;
        left: ${rect.left - padding}px;
        width: ${rect.width + padding * 2}px;
        height: ${rect.height + padding * 2}px;
        border: 2px solid #22d3ee;
        border-radius: 8px;
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 20px rgba(34, 211, 238, 0.5);
        animation: tutorial-pulse 2s ease-in-out infinite;
      `;

      document.body.appendChild(highlightEl);
      this.highlightElements.push(highlightEl);
    }
  }

  private clearHighlights(): void {
    for (const el of this.highlightElements) {
      el.parentNode?.removeChild(el);
    }
    this.highlightElements = [];
  }

  private showCompletionMessage(): void {
    if (!this.overlay) return;

    const content = this.overlay.querySelector('.tutorial-content');
    if (content) {
      content.innerHTML = `
        <div class="text-center py-8">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg class="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-white mb-2">Tutorial Complete!</h3>
          <p class="text-slate-400">Great job! You've completed this tutorial.</p>
        </div>
      `;
    }
  }

  private cleanup(): void {
    this.clearHighlights();
    this.hideOverlay();
    this.actionListeners.clear();
  }

  private loadCompletions(): void {
    try {
      const stored = localStorage.getItem('neuroviz-tutorial-completions');
      if (stored) {
        this.completions = JSON.parse(stored);
      }
    } catch {
      this.completions = [];
    }
  }

  private saveCompletions(): void {
    try {
      localStorage.setItem('neuroviz-tutorial-completions', JSON.stringify(this.completions));
    } catch {
      console.warn('Failed to save tutorial completions');
    }
  }
}

// Add CSS animation for highlight pulse
const style = document.createElement('style');
style.textContent = `
  @keyframes tutorial-pulse {
    0%, 100% { box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 20px rgba(34, 211, 238, 0.5); }
    50% { box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 30px rgba(34, 211, 238, 0.8); }
  }
`;
document.head.appendChild(style);
