/**
 * Tooltip Domain Models
 * 
 * Centralised registry of contextual explanations for UI controls.
 * Each tooltip provides educational context about a parameter or feature.
 */

/**
 * A tooltip definition
 */
export interface TooltipDefinition {
  /** CSS selector or element ID for the target element */
  target: string;
  /** Short title (shown in bold) */
  title: string;
  /** Main explanation text */
  content: string;
  /** Optional "Pro tip" or advanced note */
  tip?: string;
  /** Link to related tutorial */
  relatedTutorial?: string;
  /** Position preference */
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

/**
 * Category of tooltips for organisation
 */
export type TooltipCategory = 
  | 'architecture'
  | 'training'
  | 'dataset'
  | 'visualisation'
  | 'advanced';

/**
 * All tooltip definitions, organised by category
 */
export const TOOLTIP_REGISTRY: Record<TooltipCategory, TooltipDefinition[]> = {
  architecture: [
    {
      target: '#input-hidden-layers',
      title: 'Hidden Layers',
      content: 'The number of layers between input and output. More layers can learn more complex patterns but are harder to train.',
      tip: 'Start with 1-2 layers. Add more only if the model underfits.',
    },
    {
      target: '#input-neurons',
      title: 'Neurons per Layer',
      content: 'How many neurons in each hidden layer. More neurons = more capacity to learn patterns.',
      tip: 'Common choices: 4, 8, 16, 32. Powers of 2 are efficient on GPUs.',
    },
    {
      target: '#input-activation',
      title: 'Activation Function',
      content: 'The non-linear function applied after each layer. Without activation functions, the network could only learn linear relationships.',
      tip: 'ReLU is fast and works well for most cases. Tanh is good for data centred around zero.',
      relatedTutorial: 'activation-functions',
    },
  ],
  training: [
    {
      target: '#input-learning-rate',
      title: 'Learning Rate',
      content: 'Controls how much weights change after each batch. Higher = faster but unstable. Lower = slower but more precise.',
      tip: 'If loss explodes or becomes NaN, reduce the learning rate.',
      relatedTutorial: 'learning-rate',
    },
    {
      target: '#input-batch-size',
      title: 'Batch Size',
      content: 'Number of samples processed before updating weights. Larger batches are faster but use more memory and may generalise worse.',
      tip: 'Common values: 16, 32, 64. Smaller batches add noise that can help escape local minima.',
    },
    {
      target: '#input-epochs',
      title: 'Epochs',
      content: 'One epoch = one complete pass through all training data. More epochs = more learning, but risk of overfitting.',
      tip: 'Use early stopping to automatically stop when validation loss stops improving.',
      relatedTutorial: 'overfitting',
    },
    {
      target: '#input-optimizer',
      title: 'Optimizer',
      content: 'The algorithm that updates weights. Adam is adaptive and works well out-of-the-box. SGD is simpler but needs tuning.',
      tip: 'Adam is recommended for beginners. SGD with momentum can achieve better final results with careful tuning.',
    },
    {
      target: '#input-l2-regularization',
      title: 'L2 Regularisation',
      content: 'Penalises large weights to prevent overfitting. Higher values = stronger regularisation = simpler model.',
      tip: 'Start with 0.001. Increase if overfitting, decrease if underfitting.',
      relatedTutorial: 'overfitting',
    },
    {
      target: '#input-dropout',
      title: 'Dropout Rate',
      content: 'Randomly "drops" neurons during training to prevent co-adaptation. A form of regularisation.',
      tip: 'Common values: 0.1-0.5. Higher dropout = stronger regularisation but slower learning.',
    },
    {
      target: '#input-lr-schedule',
      title: 'Learning Rate Schedule',
      content: 'Automatically adjusts learning rate during training. Helps fine-tune as the model approaches optimal weights.',
      tip: 'Cosine decay is smooth and effective. Step decay is simpler to understand.',
    },
    {
      target: '#input-early-stopping',
      title: 'Early Stopping',
      content: 'Stops training when validation loss stops improving. Prevents overfitting and saves time.',
      tip: 'Patience of 10-20 epochs is common. Lower patience stops earlier but might miss improvements.',
    },
    {
      target: '#input-validation-split',
      title: 'Validation Split',
      content: 'Percentage of data held out for validation. Used to detect overfitting during training.',
      tip: '20% is standard. Use more for small datasets to get reliable validation metrics.',
    },
  ],
  dataset: [
    {
      target: '#input-samples',
      title: 'Number of Samples',
      content: 'Total data points to generate. More samples = better learning but slower training.',
      tip: '200-500 is good for experimentation. Real-world datasets are much larger.',
    },
    {
      target: '#input-noise',
      title: 'Noise Level',
      content: 'Random variation added to data points. Higher noise makes the problem harder and more realistic.',
      tip: 'High noise + complex model = overfitting. Use to demonstrate regularisation.',
      relatedTutorial: 'overfitting',
    },
    {
      target: '#input-balance',
      title: 'Class Balance',
      content: 'Ratio of samples between classes. 50% = equal classes. Imbalanced data is common in real problems.',
      tip: 'Imbalanced classes can bias the model toward the majority class.',
    },
    {
      target: '#input-preprocessing',
      title: 'Preprocessing',
      content: 'How to transform input features. Normalisation scales to [0,1]. Standardisation centres around 0 with unit variance.',
      tip: 'Standardisation often works better for neural networks.',
    },
  ],
  visualisation: [
    {
      target: '#input-voronoi',
      title: 'Voronoi Overlay',
      content: 'Shows decision regions around each data point. Cells are coloured by the model\'s prediction for that point.',
      tip: 'Red borders indicate misclassified points.',
      relatedTutorial: 'decision-boundary',
    },
    {
      target: '#input-show-gradients',
      title: 'Weight Changes',
      content: 'Visualises how much weights are changing during training. Larger bars = more learning happening in that layer.',
      tip: 'If early layers have tiny gradients, you might have vanishing gradient problem.',
    },
    {
      target: '#input-3d-view',
      title: '3D View',
      content: 'Shows the decision surface as a 3D landscape. Height represents prediction confidence.',
      tip: 'Rotate with mouse drag. Zoom with scroll wheel.',
    },
  ],
  advanced: [
    {
      target: '#input-momentum',
      title: 'Momentum',
      content: 'Helps optimiser build up speed in consistent directions. Reduces oscillation and speeds up convergence.',
      tip: '0.9 is a common default. Higher values = more momentum.',
    },
    {
      target: '#input-beta1',
      title: 'Adam Beta1',
      content: 'Exponential decay rate for first moment estimates in Adam optimiser.',
      tip: '0.9 is the standard default. Rarely needs changing.',
    },
    {
      target: '#input-beta2',
      title: 'Adam Beta2',
      content: 'Exponential decay rate for second moment estimates in Adam optimiser.',
      tip: '0.999 is the standard default. Rarely needs changing.',
    },
  ],
};

/**
 * Gets all tooltip definitions as a flat array
 */
export function getAllTooltips(): TooltipDefinition[] {
  return Object.values(TOOLTIP_REGISTRY).flat();
}

/**
 * Gets a tooltip by target selector
 */
export function getTooltipForTarget(target: string): TooltipDefinition | undefined {
  return getAllTooltips().find(t => t.target === target);
}

/**
 * Gets tooltips by category
 */
export function getTooltipsByCategory(category: TooltipCategory): TooltipDefinition[] {
  return TOOLTIP_REGISTRY[category] ?? [];
}

/**
 * Checks if a target has a tooltip defined
 */
export function hasTooltip(target: string): boolean {
  return getAllTooltips().some(t => t.target === target);
}
