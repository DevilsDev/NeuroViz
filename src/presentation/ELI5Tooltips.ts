/**
 * ELI5 (Explain Like I'm 5) Tooltip System
 *
 * Provides beginner-friendly explanations for machine learning concepts.
 * Tooltips appear on hover and use simple analogies.
 */

import { safeHTML } from '../infrastructure/security/htmlSanitizer';

export interface TooltipContent {
  title: string;
  simple: string;
  analogy?: string;
  tip?: string;
}

/**
 * Collection of ELI5 explanations for ML concepts.
 */
export const ELI5_EXPLANATIONS: Record<string, TooltipContent> = {
  // Hyperparameters
  'learning-rate': {
    title: 'Learning Rate',
    simple: 'How big of steps the network takes when learning. Too big = overshoots, too small = takes forever.',
    analogy: '🎯 Like adjusting how far you jump when playing hot/cold. Big jumps find the area fast, but small steps find the exact spot.',
    tip: 'Start with 0.01-0.1. If loss jumps around, go smaller. If it barely moves, go bigger.',
  },
  'layers': {
    title: 'Hidden Layers',
    simple: 'The "thinking" layers between input and output. More layers = can learn more complex patterns.',
    analogy: '🧠 Like having multiple people pass a message, each adding their interpretation.',
    tip: 'Start with 1-2 layers of 4-8 neurons. Add more only if needed.',
  },
  'neurons': {
    title: 'Neurons per Layer',
    simple: 'How many "detectors" in each layer. More neurons = can detect more features.',
    analogy: '👀 Like having more eyes looking at different parts of a picture.',
    tip: 'Usually 2-4x the input size. Too many can cause overfitting.',
  },
  'epochs': {
    title: 'Epochs',
    simple: 'How many times the network sees all the training data.',
    analogy: '📚 Like re-reading a textbook. First read = get the gist. More reads = deeper understanding.',
    tip: 'Watch the loss curve. Stop when it flattens or validation loss rises.',
  },
  'batch-size': {
    title: 'Batch Size',
    simple: 'How many examples to look at before updating. Smaller = noisier but faster learning.',
    analogy: '🍕 Like deciding how many pizza slices to taste before judging the whole pizza.',
    tip: 'Try 16-64. Smaller batches add noise that can help escape bad spots.',
  },
  
  // Activations
  'activation-relu': {
    title: 'ReLU Activation',
    simple: 'Keeps positive values, zeros out negatives. Simple and fast.',
    analogy: '🚦 Like a one-way valve that only lets positive signals through.',
    tip: 'Default choice for hidden layers. Fast and works well most of the time.',
  },
  'activation-sigmoid': {
    title: 'Sigmoid Activation',
    simple: 'Squashes values between 0 and 1. Good for probabilities.',
    analogy: '📊 Like a dimmer switch that smoothly goes from off (0) to on (1).',
    tip: 'Use for binary classification output. Can cause "vanishing gradients" in deep networks.',
  },
  'activation-tanh': {
    title: 'Tanh Activation',
    simple: 'Squashes values between -1 and 1. Centered around zero.',
    analogy: '⚖️ Like a balance scale that tips left (-1) or right (+1).',
    tip: 'Good when you need negative outputs. Often works better than sigmoid in hidden layers.',
  },
  'activation-softmax': {
    title: 'Softmax Activation',
    simple: 'Converts scores to probabilities that sum to 1. Used for multi-class output.',
    analogy: '🥧 Like dividing a pie so all slices add up to 100%.',
    tip: 'Always use for multi-class classification output layer.',
  },
  
  // Optimizers
  'optimizer-sgd': {
    title: 'SGD (Stochastic Gradient Descent)',
    simple: 'The classic optimizer. Simple but can be slow.',
    analogy: '🚶 Like walking downhill by always stepping in the steepest direction.',
    tip: 'Good baseline. Add momentum to speed it up.',
  },
  'optimizer-adam': {
    title: 'Adam Optimizer',
    simple: 'Smart optimizer that adapts learning rate for each parameter.',
    analogy: '🚗 Like a car with automatic transmission that adjusts speed for the terrain.',
    tip: 'Usually the best default choice. Works well out of the box.',
  },
  'optimizer-rmsprop': {
    title: 'RMSprop Optimizer',
    simple: 'Adapts learning rate based on recent gradients. Good for noisy data.',
    analogy: '🎸 Like adjusting volume based on how loud the recent notes were.',
    tip: 'Good for recurrent networks and noisy problems.',
  },
  
  // Regularization
  'dropout': {
    title: 'Dropout',
    simple: 'Randomly "turns off" neurons during training. Prevents over-reliance on any single neuron.',
    analogy: '🎭 Like training a team where random members sit out each practice, so everyone learns to contribute.',
    tip: 'Try 0.1-0.5. Higher values = stronger regularization.',
  },
  'l1-regularization': {
    title: 'L1 Regularization (Lasso)',
    simple: 'Pushes small weights to exactly zero. Creates sparse networks.',
    analogy: '✂️ Like a strict editor who cuts unnecessary words entirely.',
    tip: 'Good for feature selection. Makes some weights exactly 0.',
  },
  'l2-regularization': {
    title: 'L2 Regularization (Ridge)',
    simple: 'Keeps weights small but not zero. Prevents any weight from dominating.',
    analogy: '⚖️ Like a fair teacher who makes sure no student does all the work.',
    tip: 'Most common choice. Try 0.001-0.01.',
  },
  'batch-norm': {
    title: 'Batch Normalization',
    simple: 'Normalizes layer inputs. Helps training be faster and more stable.',
    analogy: '📏 Like making sure everyone uses the same units before comparing.',
    tip: 'Usually helps. Can sometimes hurt with very small batches.',
  },
  
  // Training concepts
  'loss': {
    title: 'Loss',
    simple: 'How wrong the network is. Lower = better. The goal is to minimize this.',
    analogy: '🎯 Like the distance from the bullseye. Training tries to get closer.',
    tip: 'Watch for: decreasing = good, stuck = try different settings, increasing = problem!',
  },
  'accuracy': {
    title: 'Accuracy',
    simple: 'Percentage of correct predictions. Higher = better.',
    analogy: '✅ Like your test score. 90% = got 9 out of 10 right.',
    tip: 'Good for balanced datasets. Can be misleading if classes are imbalanced.',
  },
  'overfitting': {
    title: 'Overfitting',
    simple: 'Network memorizes training data instead of learning patterns. Works great on training, fails on new data.',
    analogy: '📝 Like memorizing answers instead of understanding the subject.',
    tip: 'Signs: train accuracy >> validation accuracy. Fix: more data, dropout, regularization.',
  },
  'underfitting': {
    title: 'Underfitting',
    simple: 'Network is too simple to learn the pattern. Bad on both training and new data.',
    analogy: '🔨 Like using a hammer for everything. Sometimes you need more tools.',
    tip: 'Signs: both train and val accuracy are low. Fix: more layers, more neurons, train longer.',
  },
  'validation-split': {
    title: 'Validation Split',
    simple: 'Portion of data held back to test how well the model generalizes.',
    analogy: '📋 Like saving some practice problems to test yourself before the real exam.',
    tip: 'Usually 10-20%. Helps detect overfitting early.',
  },
  
  // Datasets
  'dataset-circle': {
    title: 'Circle Dataset',
    simple: 'Points inside vs outside a circle. Tests if network can learn curved boundaries.',
    analogy: '🎯 Like separating darts that hit the bullseye from those that missed.',
    tip: 'Simple dataset. Good for testing basic setups.',
  },
  'dataset-xor': {
    title: 'XOR Dataset',
    simple: 'Classic problem that requires at least one hidden layer to solve.',
    analogy: '🔀 Like "opposite corners are friends" - needs non-linear thinking.',
    tip: 'If your network can\'t solve this, something is wrong with the setup.',
  },
  'dataset-spiral': {
    title: 'Spiral Dataset',
    simple: 'Intertwined spirals. Very hard! Requires deep networks.',
    analogy: '🌀 Like separating two tangled phone cords by color.',
    tip: 'Needs multiple layers and many neurons. Great for testing network capacity.',
  },
  'dataset-moons': {
    title: 'Moons Dataset',
    simple: 'Two interleaving half-circles. Moderately challenging.',
    analogy: '🌙 Like separating two crescent moons facing each other.',
    tip: 'Good middle-ground difficulty. 1-2 hidden layers usually enough.',
  },
  
  // Visualization
  'decision-boundary': {
    title: 'Decision Boundary',
    simple: 'The line (or curve) where the network switches from predicting one class to another.',
    analogy: '🗺️ Like borders on a map showing where one country ends and another begins.',
    tip: 'Smooth = good generalization. Too wiggly = overfitting.',
  },
  'confusion-matrix': {
    title: 'Confusion Matrix',
    simple: 'Table showing what the model predicted vs what was actually true.',
    analogy: '📊 Like a report card showing which questions you got right and which you confused.',
    tip: 'Diagonal = correct. Off-diagonal = mistakes. Look for patterns in errors.',
  },
  'what-if': {
    title: 'What-If Analysis',
    simple: 'Tests different settings to see which works best for your data.',
    analogy: '🔬 Like trying different recipes to see which tastes best.',
    tip: 'Run this before long training sessions to find optimal settings.',
  },
  'gradient-flow': {
    title: 'Gradient Flow',
    simple: 'Shows how much each layer is learning. Higher bars = more learning happening.',
    analogy: '📊 Like a fitness tracker showing which muscles are working hardest.',
    tip: 'If early layers have tiny gradients, you might have "vanishing gradients" - try ReLU or batch norm.',
  },
};

/**
 * Creates and manages ELI5 tooltips.
 */
export class ELI5TooltipManager {
  private tooltipElement: HTMLDivElement | null = null;
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.createTooltipElement();
    this.attachListeners();
  }

  /**
   * Creates the tooltip DOM element.
   */
  private createTooltipElement(): void {
    this.tooltipElement = document.createElement('div');
    this.tooltipElement.id = 'eli5-tooltip';
    this.tooltipElement.className = `
      fixed z-[100] max-w-xs p-3 rounded-lg shadow-xl
      bg-navy-800 border border-navy-600
      text-sm text-slate-200
      opacity-0 pointer-events-none
      transition-opacity duration-200
    `.replace(/\s+/g, ' ').trim();
    this.tooltipElement.style.display = 'none';
    document.body.appendChild(this.tooltipElement);
  }

  /**
   * Attaches hover listeners to elements with data-eli5 attribute.
   */
  private attachListeners(): void {
    document.addEventListener('mouseover', (e) => {
      const target = (e.target as HTMLElement).closest('[data-eli5]');
      if (target) {
        const key = target.getAttribute('data-eli5');
        if (key && ELI5_EXPLANATIONS[key]) {
          this.show(ELI5_EXPLANATIONS[key], target as HTMLElement);
        }
      }
    });

    document.addEventListener('mouseout', (e) => {
      const target = (e.target as HTMLElement).closest('[data-eli5]');
      if (target) {
        this.scheduleHide();
      }
    });
  }

  /**
   * Shows the tooltip near the target element.
   */
  private show(content: TooltipContent, target: HTMLElement): void {
    if (!this.tooltipElement) return;

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    // Build tooltip content with XSS protection
    let html = safeHTML`
      <div class="font-semibold text-white mb-1">${content.title}</div>
      <div class="text-slate-300 mb-2">${content.simple}</div>
    `;

    if (content.analogy) {
      html += safeHTML`<div class="text-slate-400 text-xs mb-2">${content.analogy}</div>`;
    }

    if (content.tip) {
      html += safeHTML`<div class="text-emerald-400 text-xs">💡 ${content.tip}</div>`;
    }

    this.tooltipElement.innerHTML = html;
    this.tooltipElement.style.display = 'block';

    // Position tooltip
    const rect = target.getBoundingClientRect();
    const tooltipRect = this.tooltipElement.getBoundingClientRect();

    let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
    let top = rect.bottom + 8;

    // Keep within viewport
    if (left < 8) left = 8;
    if (left + tooltipRect.width > window.innerWidth - 8) {
      left = window.innerWidth - tooltipRect.width - 8;
    }
    if (top + tooltipRect.height > window.innerHeight - 8) {
      top = rect.top - tooltipRect.height - 8;
    }

    this.tooltipElement.style.left = `${left}px`;
    this.tooltipElement.style.top = `${top}px`;
    this.tooltipElement.style.opacity = '1';
  }

  /**
   * Schedules hiding the tooltip.
   */
  private scheduleHide(): void {
    this.hideTimeout = setTimeout(() => {
      this.hide();
    }, 150);
  }

  /**
   * Hides the tooltip.
   */
  private hide(): void {
    if (!this.tooltipElement) return;
    this.tooltipElement.style.opacity = '0';
    setTimeout(() => {
      if (this.tooltipElement) {
        this.tooltipElement.style.display = 'none';
      }
    }, 200);
  }
}

/**
 * Initializes the ELI5 tooltip system.
 */
export function initELI5Tooltips(): ELI5TooltipManager {
  return new ELI5TooltipManager();
}
