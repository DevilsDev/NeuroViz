/**
 * Interactive tutorial system for guiding users through NeuroViz features.
 */

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void | Promise<void>; // Action to perform when step is shown
  waitFor?: string; // CSS selector - wait for this element to exist
}

export interface Tutorial {
  id: string;
  name: string;
  description: string;
  steps: TutorialStep[];
}

// Built-in tutorials
export const TUTORIALS: Tutorial[] = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Learn the basics of NeuroViz',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to NeuroViz! 👋',
        content: 'This interactive tutorial will guide you through the basics of training neural networks and visualizing decision boundaries.',
        position: 'bottom',
      },
      {
        id: 'dataset',
        title: 'Step 1: Choose a Dataset',
        content: 'Start by selecting a dataset. Try "Circle" for a simple classification problem, or "Spiral" for something more challenging.',
        target: '#dataset-select',
        position: 'right',
      },
      {
        id: 'load-data',
        title: 'Step 2: Load the Data',
        content: 'Click "Load Data" to generate the dataset. You\'ll see the data points appear on the chart.',
        target: '#btn-load-data',
        position: 'right',
      },
      {
        id: 'architecture',
        title: 'Step 3: Configure the Network',
        content: 'Set the hidden layer sizes. For example, "8,8" creates two hidden layers with 8 neurons each. More layers = more complex boundaries.',
        target: '#input-layers',
        position: 'right',
      },
      {
        id: 'learning-rate',
        title: 'Step 4: Set Learning Rate',
        content: 'The learning rate controls how fast the network learns. Start with 0.03 - too high causes instability, too low is slow.',
        target: '#input-lr',
        position: 'right',
      },
      {
        id: 'initialize',
        title: 'Step 5: Initialize',
        content: 'Click "Initialise Network" to create the neural network with your settings.',
        target: '#btn-init',
        position: 'right',
      },
      {
        id: 'train',
        title: 'Step 6: Start Training!',
        content: 'Click "Start" to begin training. Watch the decision boundary evolve as the network learns!',
        target: '#btn-start',
        position: 'right',
      },
      {
        id: 'observe',
        title: 'Observe the Training',
        content: 'Watch the loss decrease and accuracy increase. The coloured regions show what the network predicts for each area.',
        target: '#chart',
        position: 'left',
      },
      {
        id: 'complete',
        title: 'Congratulations! 🎉',
        content: 'You\'ve trained your first neural network! Try experimenting with different datasets, architectures, and hyperparameters.',
        position: 'bottom',
      },
    ],
  },
  {
    id: 'hyperparameters',
    name: 'Understanding Hyperparameters',
    description: 'Learn how each setting affects training',
    steps: [
      {
        id: 'intro',
        title: 'Hyperparameters Explained',
        content: 'Hyperparameters are settings that control how your neural network learns. Let\'s explore each one.',
        position: 'bottom',
      },
      {
        id: 'layers',
        title: 'Hidden Layers',
        content: 'More layers allow the network to learn more complex patterns. "4,4" = 2 layers of 4 neurons. "8,8,8" = 3 layers of 8.',
        target: '#input-layers',
        position: 'right',
      },
      {
        id: 'activation',
        title: 'Activation Function',
        content: 'ReLU is fast and works well for most cases. Tanh can be better for data centered around zero. Sigmoid squashes values to 0-1.',
        target: '#input-activation',
        position: 'right',
      },
      {
        id: 'optimizer',
        title: 'Optimizer',
        content: 'Adam is a good default - it adapts the learning rate automatically. SGD with momentum is simpler but can work well too.',
        target: '#input-optimizer',
        position: 'right',
      },
      {
        id: 'regularization',
        title: 'Regularization',
        content: 'L1 and L2 regularization prevent overfitting by penalizing large weights. Dropout randomly disables neurons during training.',
        target: '#input-l2',
        position: 'right',
      },
      {
        id: 'batch-size',
        title: 'Batch Size',
        content: 'Smaller batches = noisier but faster updates. Larger batches = smoother but slower. 0 means use all data each step.',
        target: '#input-batch-size',
        position: 'right',
      },
      {
        id: 'experiment',
        title: 'Experiment!',
        content: 'The best way to learn is to experiment. Try changing one parameter at a time and observe how it affects training.',
        position: 'bottom',
      },
    ],
  },
  {
    id: 'overfitting',
    name: 'Recognizing Overfitting',
    description: 'Learn to identify and fix overfitting',
    steps: [
      {
        id: 'intro',
        title: 'What is Overfitting?',
        content: 'Overfitting occurs when your model memorizes the training data instead of learning general patterns. It performs well on training data but poorly on new data.',
        position: 'bottom',
      },
      {
        id: 'signs',
        title: 'Signs of Overfitting',
        content: 'Watch for: training accuracy much higher than validation accuracy, validation loss increasing while training loss decreases.',
        target: '#loss-chart-container',
        position: 'left',
      },
      {
        id: 'validation',
        title: 'Enable Validation Split',
        content: 'Set a validation split (e.g., 20%) to monitor how well your model generalizes to unseen data.',
        target: '#input-val-split',
        position: 'right',
      },
      {
        id: 'fix-dropout',
        title: 'Fix: Add Dropout',
        content: 'Dropout randomly disables neurons during training, forcing the network to learn more robust features.',
        target: '#input-dropout',
        position: 'right',
      },
      {
        id: 'fix-regularization',
        title: 'Fix: Add Regularization',
        content: 'L2 regularization penalizes large weights, encouraging simpler models that generalize better.',
        target: '#input-l2',
        position: 'right',
      },
      {
        id: 'fix-simplify',
        title: 'Fix: Simplify Architecture',
        content: 'Try using fewer layers or neurons. A simpler model is less likely to overfit.',
        target: '#input-layers',
        position: 'right',
      },
      {
        id: 'early-stopping',
        title: 'Early Stopping',
        content: 'Enable early stopping to automatically stop training when validation loss stops improving.',
        target: '#input-early-stopping',
        position: 'right',
      },
    ],
  },
];

/**
 * Tutorial manager class.
 */
export class TutorialManager {
  private currentTutorial: Tutorial | null = null;
  private currentStepIndex = 0;
  private overlay: HTMLDivElement | null = null;
  private tooltip: HTMLDivElement | null = null;
  private onComplete: (() => void) | null = null;

  constructor() {
    this.createOverlay();
    this.createTooltip();
  }

  private createOverlay(): void {
    this.overlay = document.createElement('div');
    this.overlay.id = 'tutorial-overlay';
    this.overlay.className = 'fixed inset-0 bg-black/50 z-40 hidden';
    this.overlay.innerHTML = `
      <div id="tutorial-highlight" class="absolute border-2 border-accent-400 rounded-lg shadow-lg shadow-accent-400/30 transition-all duration-300"></div>
    `;
    document.body.appendChild(this.overlay);
  }

  private createTooltip(): void {
    this.tooltip = document.createElement('div');
    this.tooltip.id = 'tutorial-tooltip';
    this.tooltip.className = 'fixed z-50 bg-navy-800 border border-navy-600 rounded-lg shadow-xl p-4 max-w-sm hidden';
    this.tooltip.innerHTML = `
      <div class="flex items-start justify-between mb-2">
        <h3 id="tutorial-title" class="text-lg font-semibold text-white"></h3>
        <button id="tutorial-close" class="text-slate-400 hover:text-white">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <p id="tutorial-content" class="text-slate-300 text-sm mb-4"></p>
      <div class="flex items-center justify-between">
        <span id="tutorial-progress" class="text-xs text-slate-500"></span>
        <div class="flex gap-2">
          <button id="tutorial-prev" class="btn-secondary text-xs px-3 py-1">Previous</button>
          <button id="tutorial-next" class="btn-primary text-xs px-3 py-1">Next</button>
        </div>
      </div>
    `;
    document.body.appendChild(this.tooltip);

    // Bind events
    document.getElementById('tutorial-close')?.addEventListener('click', () => this.stop());
    document.getElementById('tutorial-prev')?.addEventListener('click', () => this.prev());
    document.getElementById('tutorial-next')?.addEventListener('click', () => this.next());
  }

  /**
   * Starts a tutorial by ID.
   */
  start(tutorialId: string, onComplete?: () => void): boolean {
    const tutorial = TUTORIALS.find(t => t.id === tutorialId);
    if (!tutorial) return false;

    this.currentTutorial = tutorial;
    this.currentStepIndex = 0;
    this.onComplete = onComplete ?? null;

    this.overlay?.classList.remove('hidden');
    this.tooltip?.classList.remove('hidden');

    this.showStep();
    return true;
  }

  /**
   * Stops the current tutorial.
   */
  stop(): void {
    this.currentTutorial = null;
    this.currentStepIndex = 0;
    this.overlay?.classList.add('hidden');
    this.tooltip?.classList.add('hidden');
  }

  /**
   * Shows the current step.
   */
  private showStep(): void {
    if (!this.currentTutorial || !this.tooltip) return;

    const step = this.currentTutorial.steps[this.currentStepIndex];
    if (!step) return;

    // Update tooltip content
    const titleEl = document.getElementById('tutorial-title');
    const contentEl = document.getElementById('tutorial-content');
    const progressEl = document.getElementById('tutorial-progress');
    const prevBtn = document.getElementById('tutorial-prev') as HTMLButtonElement;
    const nextBtn = document.getElementById('tutorial-next') as HTMLButtonElement;

    if (titleEl) titleEl.textContent = step.title;
    if (contentEl) contentEl.textContent = step.content;
    if (progressEl) {
      progressEl.textContent = `Step ${this.currentStepIndex + 1} of ${this.currentTutorial.steps.length}`;
    }

    // Update button states
    if (prevBtn) prevBtn.disabled = this.currentStepIndex === 0;
    if (nextBtn) {
      nextBtn.textContent = this.currentStepIndex === this.currentTutorial.steps.length - 1 ? 'Finish' : 'Next';
    }

    // Position tooltip
    this.positionTooltip(step);

    // Highlight target element
    this.highlightTarget(step);

    // Execute action if defined
    if (step.action) {
      void step.action();
    }
  }

  private positionTooltip(step: TutorialStep): void {
    if (!this.tooltip) return;

    const target = step.target ? document.querySelector(step.target) : null;
    const position = step.position ?? 'bottom';

    if (target) {
      const rect = target.getBoundingClientRect();
      const tooltipRect = this.tooltip.getBoundingClientRect();
      const padding = 16;

      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = rect.top - tooltipRect.height - padding;
          left = rect.left + (rect.width - tooltipRect.width) / 2;
          break;
        case 'bottom':
          top = rect.bottom + padding;
          left = rect.left + (rect.width - tooltipRect.width) / 2;
          break;
        case 'left':
          top = rect.top + (rect.height - tooltipRect.height) / 2;
          left = rect.left - tooltipRect.width - padding;
          break;
        case 'right':
          top = rect.top + (rect.height - tooltipRect.height) / 2;
          left = rect.right + padding;
          break;
      }

      // Keep within viewport
      top = Math.max(padding, Math.min(window.innerHeight - tooltipRect.height - padding, top));
      left = Math.max(padding, Math.min(window.innerWidth - tooltipRect.width - padding, left));

      this.tooltip.style.top = `${top}px`;
      this.tooltip.style.left = `${left}px`;
    } else {
      // Center on screen
      this.tooltip.style.top = '50%';
      this.tooltip.style.left = '50%';
      this.tooltip.style.transform = 'translate(-50%, -50%)';
    }
  }

  private highlightTarget(step: TutorialStep): void {
    const highlight = document.getElementById('tutorial-highlight');
    if (!highlight) return;

    if (step.target) {
      const target = document.querySelector(step.target);
      if (target) {
        const rect = target.getBoundingClientRect();
        const padding = 4;

        highlight.style.top = `${rect.top - padding}px`;
        highlight.style.left = `${rect.left - padding}px`;
        highlight.style.width = `${rect.width + padding * 2}px`;
        highlight.style.height = `${rect.height + padding * 2}px`;
        highlight.style.display = 'block';
        return;
      }
    }

    highlight.style.display = 'none';
  }

  /**
   * Goes to the next step.
   */
  next(): void {
    if (!this.currentTutorial) return;

    if (this.currentStepIndex < this.currentTutorial.steps.length - 1) {
      this.currentStepIndex++;
      this.showStep();
    } else {
      this.stop();
      this.onComplete?.();
    }
  }

  /**
   * Goes to the previous step.
   */
  prev(): void {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.showStep();
    }
  }

  /**
   * Gets available tutorials.
   */
  getTutorials(): Tutorial[] {
    return TUTORIALS;
  }
}

// Singleton instance
export const tutorialManager = new TutorialManager();
