/**
 * Tutorial Domain Models
 * 
 * Defines the structure for guided tutorials that teach ML concepts.
 * Tutorials are sequences of steps with text, actions, and UI focus.
 */

/**
 * Position for highlighting UI elements
 */
export interface HighlightPosition {
  /** CSS selector for the element to highlight */
  selector: string;
  /** Optional padding around the highlight */
  padding?: number;
}

/**
 * Action the user should take to proceed
 */
export type TutorialAction =
  | { type: 'click'; selector: string }
  | { type: 'change'; selector: string; value?: string }
  | { type: 'wait'; durationMs: number }
  | { type: 'manual' } // User clicks "Next" button
  | { type: 'training-start' }
  | { type: 'training-complete' }
  | { type: 'epoch-reached'; epoch: number };

/**
 * A single step in a tutorial
 */
export interface TutorialStep {
  /** Unique identifier for this step */
  id: string;
  /** Title shown in the tutorial overlay */
  title: string;
  /** Main explanation text (supports markdown-like formatting) */
  content: string;
  /** Optional tip or hint */
  tip?: string;
  /** Element(s) to highlight during this step */
  highlight?: HighlightPosition[];
  /** Action required to proceed to next step */
  action: TutorialAction;
  /** Whether to disable other UI interactions during this step */
  lockUI?: boolean;
  /** Optional callback when step becomes active */
  onEnter?: string; // Function name to call
  /** Optional callback when step is exited */
  onExit?: string;
}

/**
 * A complete tutorial definition
 */
export interface Tutorial {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Brief description shown in tutorial list */
  description: string;
  /** Estimated time to complete (e.g., "5 min") */
  duration: string;
  /** Difficulty level */
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  /** Category for grouping */
  category: 'concepts' | 'techniques' | 'troubleshooting';
  /** Ordered list of steps */
  steps: TutorialStep[];
  /** Prerequisites (other tutorial IDs) */
  prerequisites?: string[];
}

/**
 * State of a tutorial in progress
 */
export interface TutorialProgress {
  /** Tutorial ID */
  tutorialId: string;
  /** Current step index (0-based) */
  currentStepIndex: number;
  /** Whether the tutorial is paused */
  isPaused: boolean;
  /** Timestamp when started */
  startedAt: number;
  /** Steps that have been completed */
  completedSteps: string[];
}

/**
 * Record of a completed tutorial
 */
export interface TutorialCompletion {
  tutorialId: string;
  completedAt: number;
  durationMs: number;
}

/**
 * All tutorials available in the application
 */
export const TUTORIALS: Tutorial[] = [
  {
    id: 'decision-boundary',
    name: 'What is a Decision Boundary?',
    description: 'Learn how neural networks separate data into classes using decision boundaries.',
    duration: '3 min',
    difficulty: 'beginner',
    category: 'concepts',
    steps: [
      {
        id: 'intro',
        title: 'Welcome!',
        content: 'In this tutorial, you\'ll learn what a **decision boundary** is and how neural networks create them to classify data.',
        action: { type: 'manual' },
      },
      {
        id: 'load-dataset',
        title: 'Load a Dataset',
        content: 'First, let\'s load the **Circle** dataset. This has two classes: points inside a circle (blue) and points outside (orange).',
        tip: 'Click on the Circle dataset card to load it.',
        highlight: [{ selector: '[data-dataset="circle"]', padding: 8 }],
        action: { type: 'click', selector: '[data-dataset="circle"]' },
      },
      {
        id: 'observe-data',
        title: 'Observe the Data',
        content: 'Notice how the data points are arranged. The **blue points** form a cluster in the centre, while **orange points** surround them.',
        highlight: [{ selector: '#viz-container', padding: 4 }],
        action: { type: 'manual' },
      },
      {
        id: 'start-training',
        title: 'Start Training',
        content: 'Now click **Start Training** to teach the network to separate these classes. Watch the coloured background appear!',
        highlight: [{ selector: '#btn-start', padding: 4 }],
        action: { type: 'training-start' },
      },
      {
        id: 'watch-boundary',
        title: 'The Decision Boundary',
        content: 'See the coloured regions forming? This is the **decision boundary**. The network is learning where to draw the line between classes.',
        tip: 'Blue regions = network predicts Class 0. Orange regions = network predicts Class 1.',
        highlight: [{ selector: '#viz-container', padding: 4 }],
        action: { type: 'epoch-reached', epoch: 20 },
      },
      {
        id: 'boundary-explained',
        title: 'Understanding the Boundary',
        content: 'The **decision boundary** is where the network\'s prediction changes from one class to another. Points on the blue side are classified as Class 0, points on the orange side as Class 1.',
        action: { type: 'manual' },
      },
      {
        id: 'complete',
        title: 'Well Done!',
        content: 'You\'ve learned what a decision boundary is! The network has learned to draw a circular boundary to separate the two classes.',
        tip: 'Try different datasets to see how the boundary shape changes.',
        action: { type: 'manual' },
      },
    ],
  },
  {
    id: 'learning-rate',
    name: 'Why Does Learning Rate Matter?',
    description: 'Discover how the learning rate affects training speed and stability.',
    duration: '5 min',
    difficulty: 'beginner',
    category: 'concepts',
    steps: [
      {
        id: 'intro',
        title: 'Learning Rate Explained',
        content: 'The **learning rate** controls how much the network adjusts its weights after each batch. Too high = unstable. Too low = slow.',
        action: { type: 'manual' },
      },
      {
        id: 'find-lr-slider',
        title: 'Find the Learning Rate Control',
        content: 'Look at the **Learning Rate** slider in the configuration panel. It\'s currently set to a reasonable default.',
        highlight: [{ selector: '#input-learning-rate', padding: 8 }],
        action: { type: 'manual' },
      },
      {
        id: 'load-spiral',
        title: 'Load a Challenging Dataset',
        content: 'Let\'s use the **Spiral** dataset - it\'s harder to learn and will show the effects of learning rate clearly.',
        highlight: [{ selector: '[data-dataset="spiral"]', padding: 8 }],
        action: { type: 'click', selector: '[data-dataset="spiral"]' },
      },
      {
        id: 'train-normal',
        title: 'Train with Normal Learning Rate',
        content: 'Start training and watch the loss decrease smoothly. This is what good training looks like.',
        highlight: [{ selector: '#btn-start', padding: 4 }],
        action: { type: 'epoch-reached', epoch: 50 },
      },
      {
        id: 'observe-loss',
        title: 'Observe the Loss Curve',
        content: 'Look at the **Training History** chart. The loss should be decreasing steadily. This indicates stable learning.',
        highlight: [{ selector: '#loss-chart-container', padding: 4 }],
        action: { type: 'manual' },
      },
      {
        id: 'reset',
        title: 'Reset and Try High LR',
        content: 'Click **Start Over** to reset. Then we\'ll try a very high learning rate to see what happens.',
        highlight: [{ selector: '#btn-reset', padding: 4 }],
        action: { type: 'click', selector: '#btn-reset' },
      },
      {
        id: 'set-high-lr',
        title: 'Set a High Learning Rate',
        content: 'Move the learning rate slider to **0.5** or higher. This is much too high for most problems.',
        highlight: [{ selector: '#input-learning-rate', padding: 8 }],
        action: { type: 'change', selector: '#input-learning-rate' },
      },
      {
        id: 'train-high-lr',
        title: 'Train with High Learning Rate',
        content: 'Start training again. Watch what happens to the loss!',
        highlight: [{ selector: '#btn-start', padding: 4 }],
        action: { type: 'epoch-reached', epoch: 30 },
      },
      {
        id: 'observe-instability',
        title: 'Unstable Training!',
        content: 'Notice how the loss jumps around or even increases? The network is **overshooting** the optimal weights because the learning rate is too high.',
        tip: 'If loss becomes NaN or Infinity, the network has "exploded" - a common sign of too-high learning rate.',
        highlight: [{ selector: '#loss-chart-container', padding: 4 }],
        action: { type: 'manual' },
      },
      {
        id: 'complete',
        title: 'Key Takeaway',
        content: 'The learning rate is one of the most important hyperparameters. Start with small values (0.001-0.1) and adjust based on how training behaves.',
        tip: 'Use learning rate schedulers to automatically reduce LR as training progresses.',
        action: { type: 'manual' },
      },
    ],
  },
  {
    id: 'overfitting',
    name: 'Understanding Overfitting',
    description: 'Learn to recognise and prevent overfitting in neural networks.',
    duration: '6 min',
    difficulty: 'intermediate',
    category: 'concepts',
    steps: [
      {
        id: 'intro',
        title: 'What is Overfitting?',
        content: '**Overfitting** occurs when a model learns the training data too well, including its noise and quirks, and fails to generalise to new data.',
        action: { type: 'manual' },
      },
      {
        id: 'analogy',
        title: 'An Analogy',
        content: 'Imagine memorising answers to a practice test instead of understanding the concepts. You\'d ace the practice test but fail a real exam with different questions.',
        action: { type: 'manual' },
      },
      {
        id: 'load-noisy-data',
        title: 'Load Noisy Data',
        content: 'Let\'s load the **Circle** dataset with high noise to see overfitting in action.',
        highlight: [{ selector: '[data-dataset="circle"]', padding: 8 }],
        action: { type: 'click', selector: '[data-dataset="circle"]' },
      },
      {
        id: 'increase-noise',
        title: 'Increase the Noise',
        content: 'Move the **Noise** slider to a high value (30-40). This adds randomness to the data.',
        highlight: [{ selector: '#input-noise', padding: 8 }],
        action: { type: 'change', selector: '#input-noise' },
      },
      {
        id: 'add-layers',
        title: 'Create a Complex Network',
        content: 'Add more hidden layers and neurons. A complex network can memorise noise more easily.',
        tip: 'Try 3-4 hidden layers with 16+ neurons each.',
        highlight: [{ selector: '#architecture-controls', padding: 8 }],
        action: { type: 'manual' },
      },
      {
        id: 'train-long',
        title: 'Train for Many Epochs',
        content: 'Start training and let it run for a while. Watch both the training loss AND validation loss.',
        highlight: [{ selector: '#btn-start', padding: 4 }],
        action: { type: 'epoch-reached', epoch: 100 },
      },
      {
        id: 'spot-overfitting',
        title: 'Spot the Overfitting',
        content: 'Look at the loss chart. If **training loss** keeps decreasing but **validation loss** starts increasing, that\'s overfitting!',
        tip: 'The gap between training and validation loss is called the "generalisation gap".',
        highlight: [{ selector: '#loss-chart-container', padding: 4 }],
        action: { type: 'manual' },
      },
      {
        id: 'boundary-overfitting',
        title: 'Overfitting in the Boundary',
        content: 'Look at the decision boundary. An overfit model creates a very complex, wiggly boundary that fits every training point perfectly.',
        highlight: [{ selector: '#viz-container', padding: 4 }],
        action: { type: 'manual' },
      },
      {
        id: 'prevention',
        title: 'Preventing Overfitting',
        content: 'To prevent overfitting:\n• Use **regularisation** (L2)\n• Add **dropout**\n• Use **early stopping**\n• Get more training data\n• Simplify the model',
        action: { type: 'manual' },
      },
      {
        id: 'complete',
        title: 'Summary',
        content: 'Overfitting is when your model memorises training data instead of learning general patterns. Watch the validation loss to detect it early!',
        action: { type: 'manual' },
      },
    ],
  },
];

/**
 * Gets a tutorial by ID
 */
export function getTutorial(id: string): Tutorial | undefined {
  return TUTORIALS.find(t => t.id === id);
}

/**
 * Gets tutorials by category
 */
export function getTutorialsByCategory(category: Tutorial['category']): Tutorial[] {
  return TUTORIALS.filter(t => t.category === category);
}

/**
 * Gets tutorials by difficulty
 */
export function getTutorialsByDifficulty(difficulty: Tutorial['difficulty']): Tutorial[] {
  return TUTORIALS.filter(t => t.difficulty === difficulty);
}
