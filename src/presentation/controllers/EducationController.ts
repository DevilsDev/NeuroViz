/**
 * Education Controller
 * 
 * Manages UI interactions for tutorials, challenges, and tooltips.
 * Coordinates between education services and the DOM.
 */

import { TutorialService } from '../../infrastructure/education/TutorialService';
import { TooltipService } from '../../infrastructure/education/TooltipService';
import { ChallengeService, ChallengeState } from '../../infrastructure/education/ChallengeService';
import { TUTORIALS } from '../../core/domain/Tutorial';
import { CHALLENGES, Challenge } from '../../core/domain/Challenge';
import type { Hyperparameters } from '../../core/domain/Hyperparameters';
import type { TrainingHistory } from '../../core/domain/TrainingHistory';

/**
 * Controller for education features
 */
export class EducationController {
  private tutorialService: TutorialService;
  private tooltipService: TooltipService;
  private challengeService: ChallengeService;
  private cleanupFunctions: Array<() => void> = [];

  constructor() {
    this.tutorialService = new TutorialService();
    this.tooltipService = new TooltipService();
    this.challengeService = new ChallengeService();
  }

  /**
   * Initialises all education features
   */
  initialise(): void {
    this.setupLearnMenu();
    this.setupTutorialsModal();
    this.setupChallengesModal();
    this.setupChallengeBanner();
    this.tooltipService.initialise();
    this.updateCompletionBadge();

    // Listen for tutorial start events from tooltips
    const tutorialHandler = (e: Event) => {
      const customEvent = e as CustomEvent<{ tutorialId: string }>;
      this.tutorialService.start(customEvent.detail.tutorialId);
    };
    window.addEventListener('start-tutorial', tutorialHandler);
    this.cleanupFunctions.push(() => window.removeEventListener('start-tutorial', tutorialHandler));
  }

  /**
   * Notifies education services of training events
   */
  notifyTrainingEvent(event: 'start' | 'complete' | 'epoch', epoch?: number): void {
    this.tutorialService.notifyTrainingEvent(event, epoch);
  }

  /**
   * Validates current training against active challenge
   */
  validateChallenge(
    config: Hyperparameters,
    history: TrainingHistory,
    datasetType: string
  ): void {
    const result = this.challengeService.validate(config, history, datasetType);
    if (result) {
      this.updateChallengeBanner();
      if (result.success) {
        this.showChallengeComplete();
      }
    }
  }

  /**
   * Gets the challenge service for external access
   */
  getChallengeService(): ChallengeService {
    return this.challengeService;
  }

  /**
   * Gets the tutorial service for external access
   */
  getTutorialService(): TutorialService {
    return this.tutorialService;
  }

  /**
   * Disposes all resources
   */
  dispose(): void {
    this.tutorialService.dispose();
    this.tooltipService.dispose();
    this.challengeService.dispose();
    this.cleanupFunctions.forEach(fn => fn());
    this.cleanupFunctions = [];
  }

  // =========================================================================
  // Private Methods
  // =========================================================================

  private setupLearnMenu(): void {
    const menuBtn = document.getElementById('btn-learn-menu');
    const dropdown = document.getElementById('learn-menu-dropdown');
    const tutorialsBtn = document.getElementById('btn-open-tutorials');
    const challengesBtn = document.getElementById('btn-open-challenges');
    const helpBtn = document.getElementById('btn-open-help');

    if (menuBtn && dropdown) {
      menuBtn.addEventListener('click', () => {
        dropdown.classList.toggle('hidden');
      });

      // Close on click outside
      document.addEventListener('click', (e) => {
        if (!menuBtn.contains(e.target as Node) && !dropdown.contains(e.target as Node)) {
          dropdown.classList.add('hidden');
        }
      });
    }

    if (tutorialsBtn) {
      tutorialsBtn.addEventListener('click', () => {
        dropdown?.classList.add('hidden');
        this.openTutorialsModal();
      });
    }

    if (challengesBtn) {
      challengesBtn.addEventListener('click', () => {
        dropdown?.classList.add('hidden');
        this.openChallengesModal();
      });
    }

    if (helpBtn) {
      helpBtn.addEventListener('click', () => {
        dropdown?.classList.add('hidden');
        const helpModal = document.getElementById('help-modal');
        helpModal?.classList.remove('hidden');
      });
    }
  }

  private setupTutorialsModal(): void {
    const modal = document.getElementById('tutorials-modal');
    const closeBtn = document.getElementById('tutorials-close');
    const list = document.getElementById('tutorials-list');

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
      });
    }

    if (list) {
      this.renderTutorialsList(list);
    }
  }

  private renderTutorialsList(container: HTMLElement): void {
    const completedIds = this.tutorialService.getCompletedTutorialIds();

    container.innerHTML = TUTORIALS.map(tutorial => {
      const isCompleted = completedIds.includes(tutorial.id);
      const difficultyColors: Record<string, string> = {
        beginner: 'bg-emerald-500/20 text-emerald-400',
        intermediate: 'bg-amber-500/20 text-amber-400',
        advanced: 'bg-red-500/20 text-red-400',
      };

      return `
        <div class="tutorial-card bg-navy-900/50 rounded-lg p-4 border border-navy-700 hover:border-cyan-500/50 transition-colors cursor-pointer" data-tutorial-id="${tutorial.id}">
          <div class="flex items-start justify-between mb-2">
            <h3 class="font-bold text-white">${tutorial.name}</h3>
            ${isCompleted ? '<span class="text-emerald-400 text-xs">✓ Completed</span>' : ''}
          </div>
          <p class="text-sm text-slate-400 mb-3">${tutorial.description}</p>
          <div class="flex items-center gap-3 text-xs">
            <span class="px-2 py-0.5 rounded ${difficultyColors[tutorial.difficulty]}">${tutorial.difficulty}</span>
            <span class="text-slate-500">${tutorial.duration}</span>
            <span class="text-slate-500">${tutorial.steps.length} steps</span>
          </div>
        </div>
      `;
    }).join('');

    // Add click handlers
    container.querySelectorAll('.tutorial-card').forEach(card => {
      card.addEventListener('click', () => {
        const tutorialId = card.getAttribute('data-tutorial-id');
        if (tutorialId) {
          document.getElementById('tutorials-modal')?.classList.add('hidden');
          this.tutorialService.start(tutorialId);
        }
      });
    });
  }

  private openTutorialsModal(): void {
    const modal = document.getElementById('tutorials-modal');
    const list = document.getElementById('tutorials-list');
    if (list) this.renderTutorialsList(list);
    modal?.classList.remove('hidden');
  }

  private setupChallengesModal(): void {
    const modal = document.getElementById('challenges-modal');
    const closeBtn = document.getElementById('challenges-close');
    const tabs = document.querySelectorAll('.challenge-tab');

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
      });
    }

    // Tab switching
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        tabs.forEach(t => {
          t.classList.remove('text-cyan-400', 'border-b-2', 'border-cyan-400');
          t.classList.add('text-slate-400');
        });
        tab.classList.add('text-cyan-400', 'border-b-2', 'border-cyan-400');
        tab.classList.remove('text-slate-400');

        const challengesList = document.getElementById('challenges-list');
        const leaderboard = document.getElementById('leaderboard-content');

        if (tabName === 'challenges') {
          challengesList?.classList.remove('hidden');
          leaderboard?.classList.add('hidden');
        } else {
          challengesList?.classList.add('hidden');
          leaderboard?.classList.remove('hidden');
          this.renderLeaderboard();
        }
      });
    });

    // Update challenge state listener
    this.challengeService.onStateChange(() => {
      this.updateChallengeBanner();
      this.updateCompletionBadge();
    });
  }

  private renderChallengesList(container: HTMLElement): void {
    const difficultyColors: Record<string, string> = {
      easy: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      hard: 'bg-red-500/20 text-red-400 border-red-500/30',
      expert: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    };

    container.innerHTML = CHALLENGES.map(challenge => {
      const isCompleted = this.challengeService.isChallengeCompleted(challenge.id);
      const state = this.challengeService.getState();
      const isActive = state.activeChallenge?.id === challenge.id;

      return `
        <div class="challenge-card bg-navy-900/50 rounded-lg p-4 border ${isActive ? 'border-amber-500' : 'border-navy-700'} hover:border-cyan-500/50 transition-colors" data-challenge-id="${challenge.id}">
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-2">
              <h3 class="font-bold text-white">${challenge.name}</h3>
              ${isCompleted ? '<span class="text-emerald-400">✓</span>' : ''}
            </div>
            <span class="text-amber-400 font-bold text-sm">${challenge.points} pts</span>
          </div>
          <p class="text-sm text-slate-400 mb-3">${challenge.description}</p>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded text-xs border ${difficultyColors[challenge.difficulty]}">${challenge.difficulty}</span>
              <span class="text-xs text-slate-500">${challenge.dataset}</span>
            </div>
            <button class="challenge-start-btn btn-primary text-xs px-3 py-1 ${isActive ? 'bg-amber-600 hover:bg-amber-500' : ''}" data-challenge-id="${challenge.id}">
              ${isActive ? 'Active' : isCompleted ? 'Retry' : 'Start'}
            </button>
          </div>
          ${challenge.hint ? `<div class="mt-3 text-xs text-slate-500 italic">💡 ${challenge.hint}</div>` : ''}
        </div>
      `;
    }).join('');

    // Add click handlers
    container.querySelectorAll('.challenge-start-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const challengeId = btn.getAttribute('data-challenge-id');
        if (challengeId) {
          this.startChallenge(challengeId);
        }
      });
    });
  }

  private renderLeaderboard(): void {
    const container = document.getElementById('leaderboard-list');
    if (!container) return;

    const entries = this.challengeService.getGlobalLeaderboard();

    if (entries.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-slate-500">
          <p>No leaderboard entries yet.</p>
          <p class="text-sm mt-2">Complete challenges to appear here!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="grid grid-cols-12 gap-2 text-xs text-slate-500 uppercase tracking-wider mb-2 px-2">
        <div class="col-span-1">#</div>
        <div class="col-span-4">Challenge</div>
        <div class="col-span-3">Config</div>
        <div class="col-span-2">Accuracy</div>
        <div class="col-span-2 text-right">Score</div>
      </div>
      ${entries.slice(0, 20).map((entry, index) => {
        const challenge = this.challengeService.getChallenge(entry.challengeId);
        return `
          <div class="grid grid-cols-12 gap-2 text-sm py-2 px-2 rounded ${index % 2 === 0 ? 'bg-navy-900/30' : ''}">
            <div class="col-span-1 text-slate-400">${index + 1}</div>
            <div class="col-span-4 text-white truncate">${challenge?.name ?? entry.challengeId}</div>
            <div class="col-span-3 text-slate-400 font-mono text-xs truncate">${entry.configName}</div>
            <div class="col-span-2 text-emerald-400">${(entry.metrics.accuracy * 100).toFixed(1)}%</div>
            <div class="col-span-2 text-right text-amber-400 font-bold">${entry.score}</div>
          </div>
        `;
      }).join('')}
    `;
  }

  private openChallengesModal(): void {
    const modal = document.getElementById('challenges-modal');
    const list = document.getElementById('challenges-list');
    const pointsEl = document.getElementById('challenge-total-points');

    if (list) this.renderChallengesList(list);
    if (pointsEl) pointsEl.textContent = this.challengeService.getTotalPoints().toString();

    modal?.classList.remove('hidden');
  }

  private startChallenge(challengeId: string): void {
    const challenge = this.challengeService.getChallenge(challengeId);
    if (!challenge) return;

    this.challengeService.startChallenge(challengeId);
    document.getElementById('challenges-modal')?.classList.add('hidden');

    // Dispatch event to load the required dataset
    window.dispatchEvent(new CustomEvent('load-dataset', {
      detail: { dataset: challenge.dataset }
    }));
  }

  private setupChallengeBanner(): void {
    const abandonBtn = document.getElementById('challenge-banner-abandon');
    if (abandonBtn) {
      abandonBtn.addEventListener('click', () => {
        this.challengeService.abandonChallenge();
        this.updateChallengeBanner();
      });
    }
  }

  private updateChallengeBanner(): void {
    const banner = document.getElementById('challenge-banner');
    const nameEl = document.getElementById('challenge-banner-name');
    const statusEl = document.getElementById('challenge-banner-status');

    const state = this.challengeService.getState();

    if (state.isActive && state.activeChallenge) {
      banner?.classList.remove('hidden');
      if (nameEl) nameEl.textContent = state.activeChallenge.name;

      if (state.lastValidation) {
        const goalsMet = state.lastValidation.goalsMet.filter(m => m).length;
        const totalGoals = state.lastValidation.goalsMet.length;
        if (statusEl) {
          statusEl.textContent = state.isComplete
            ? '✓ Complete!'
            : `${goalsMet}/${totalGoals} goals met`;
          statusEl.className = state.isComplete
            ? 'text-xs text-emerald-400 ml-4 font-bold'
            : 'text-xs text-slate-300 ml-4';
        }
      }
    } else {
      banner?.classList.add('hidden');
    }
  }

  private updateCompletionBadge(): void {
    const badge = document.getElementById('challenge-completion-badge');
    if (badge) {
      const completed = this.challengeService.getCompletedChallenges().length;
      badge.textContent = `${completed}/${CHALLENGES.length}`;
    }
  }

  private showChallengeComplete(): void {
    // Show a toast or notification
    const state = this.challengeService.getState();
    if (!state.activeChallenge) return;

    // Create celebration overlay
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[150] flex items-center justify-center pointer-events-none';
    overlay.innerHTML = `
      <div class="bg-navy-800 border-2 border-amber-500 rounded-xl p-8 shadow-2xl text-center animate-bounce-in pointer-events-auto">
        <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
          <svg class="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-white mb-2">Challenge Complete!</h2>
        <p class="text-slate-400 mb-4">${state.activeChallenge.name}</p>
        <p class="text-amber-400 text-xl font-bold">+${state.activeChallenge.points} points</p>
      </div>
    `;

    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.remove();
    }, 3000);
  }
}

// Add animation CSS
const educationStyle = document.createElement('style');
educationStyle.textContent = `
  @keyframes bounce-in {
    0% { transform: scale(0.5); opacity: 0; }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
  }
  .animate-bounce-in {
    animation: bounce-in 0.5s ease-out;
  }
`;
document.head.appendChild(educationStyle);
