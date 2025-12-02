/**
 * Explain This Moment Service
 *
 * Generates natural-language explanations of the current training state
 * to help beginners understand what's happening during training.
 *
 * Based on DESIGN_AUDIT_360.md recommendation #3
 */

export type DatasetType = 'circle' | 'xor' | 'spiral' | 'gaussian' | 'custom';

export interface LayerConfig {
  units: number;
  activation: string;
}

export interface NetworkArchitecture {
  layers: LayerConfig[];
}

export interface ExplanationContext {
  datasetType: DatasetType;
  currentEpoch: number;
  totalEpochs: number;
  currentLoss: number;
  initialLoss: number;
  lossHistory: number[];
  accuracy: number;
  architecture: NetworkArchitecture;
  isTraining: boolean;
}

export interface MomentExplanation {
  title: string;
  message: string;
  tip?: string;
  type: 'progress' | 'success' | 'plateau' | 'warning' | 'info';
}

/**
 * Service for generating contextual explanations of training state
 */
export class ExplainMomentService {
  /**
   * Generates an explanation based on current training context
   */
  explainMoment(context: ExplanationContext): MomentExplanation {
    if (!context.isTraining && context.currentEpoch === 0) {
      return this.explainInitialState(context);
    }

    if (context.currentEpoch < 10) {
      return this.explainEarlyTraining(context);
    }

    const lossImprovement = this.calculateLossImprovement(context);
    const recentTrend = this.analyzeLossTrend(context);

    if (recentTrend === 'diverging') {
      return this.explainDivergence();
    }

    if (recentTrend === 'plateau') {
      return this.explainPlateau();
    }

    if (this.isNearConvergence(context)) {
      return this.explainConvergence(context);
    }

    return this.explainProgress(context, lossImprovement);
  }

  /**
   * Explains the initial state before training starts
   */
  private explainInitialState(context: ExplanationContext): MomentExplanation {
    const datasetInfo = this.getDatasetDescription(context.datasetType);
    const architectureInfo = this.getArchitectureDescription(context.architecture);

    return {
      title: "Ready to Learn",
      message: `Your network is ready to learn the ${datasetInfo.name} pattern. ${datasetInfo.description}\n\nYou've configured ${architectureInfo}. ${datasetInfo.architectureAdvice}`,
      tip: "Click Start to begin training and watch how the decision boundary evolves!",
      type: 'info'
    };
  }

  /**
   * Explains early training phase (first 10 epochs)
   */
  private explainEarlyTraining(context: ExplanationContext): MomentExplanation {
    const lossChange = context.initialLoss - context.currentLoss;
    const lossPercent = ((lossChange / context.initialLoss) * 100).toFixed(0);

    return {
      title: "Learning Started",
      message: `After ${context.currentEpoch} epoch${context.currentEpoch === 1 ? '' : 's'}, the network is starting to understand the pattern.\n\nThe loss has ${lossChange > 0 ? 'decreased' : 'changed'} from ${context.initialLoss.toFixed(3)} to ${context.currentLoss.toFixed(3)} (${lossPercent}% ${lossChange > 0 ? 'improvement' : 'change'}).\n\nThe decision boundary is beginning to take shape as the network adjusts its weights.`,
      tip: "Watch how the colored regions (decision boundary) change shape as training continues.",
      type: 'progress'
    };
  }

  /**
   * Explains normal training progress
   */
  private explainProgress(context: ExplanationContext, improvement: number): MomentExplanation {
    const progressPercent = ((context.currentEpoch / context.totalEpochs) * 100).toFixed(0);
    const datasetInfo = this.getDatasetDescription(context.datasetType);

    let message = `Your network is learning the ${datasetInfo.name} pattern.\n\n`;
    message += `After ${context.currentEpoch} epochs, the loss has improved by ${(improvement * 100).toFixed(1)}%. `;

    if (context.accuracy > 0) {
      message += `Current accuracy is ${(context.accuracy * 100).toFixed(1)}%.\n\n`;
    }

    message += datasetInfo.trainingInsight;

    return {
      title: `Training Progress (${progressPercent}%)`,
      message,
      tip: this.getProgressTip(context),
      type: 'progress'
    };
  }

  /**
   * Explains plateau (learning has stalled)
   */
  private explainPlateau(): MomentExplanation {
    return {
      title: "Learning Has Plateaued",
      message: `The loss hasn't improved much in the last few epochs. This is normal and can happen for several reasons:\n\n• The network may need more time to find better solutions\n• The learning rate might be too small to make progress\n• The model might have reached its capacity for this problem`,
      tip: "Try increasing the learning rate or adding more layers to help the network learn better.",
      type: 'plateau'
    };
  }

  /**
   * Explains divergence (loss increasing)
   */
  private explainDivergence(): MomentExplanation {
    return {
      title: "Training Instability Detected",
      message: `The loss is increasing instead of decreasing. This usually means:\n\n• The learning rate is too high, causing the network to "overshoot" good solutions\n• The network architecture might not be suitable for this problem`,
      tip: "Try reducing the learning rate to 0.001 or lower, or reset and try a simpler architecture.",
      type: 'warning'
    };
  }

  /**
   * Explains convergence (near optimal)
   */
  private explainConvergence(context: ExplanationContext): MomentExplanation {
    const datasetInfo = this.getDatasetDescription(context.datasetType);

    return {
      title: "Approaching Optimal Performance",
      message: `Great progress! The network has learned ${datasetInfo.name} pattern well.\n\nLoss: ${context.currentLoss.toFixed(4)} ${context.accuracy > 0 ? `(${(context.accuracy * 100).toFixed(1)}% accuracy)` : ''}\n\nThe decision boundary is now stable and separating the classes effectively. Further training will yield diminishing returns.`,
      tip: "You can stop training now or continue to see if it improves further. Try experimenting with different datasets!",
      type: 'success'
    };
  }

  /**
   * Calculates overall loss improvement from start
   */
  private calculateLossImprovement(context: ExplanationContext): number {
    if (context.initialLoss === 0) return 0;
    return (context.initialLoss - context.currentLoss) / context.initialLoss;
  }

  /**
   * Analyzes recent loss trend
   */
  private analyzeLossTrend(context: ExplanationContext): 'improving' | 'plateau' | 'diverging' {
    const { lossHistory } = context;
    if (lossHistory.length < 5) return 'improving';

    // Look at last 5 epochs
    const recentLosses = lossHistory.slice(-5);
    const avgRecent = recentLosses.reduce((a, b) => a + b, 0) / recentLosses.length;

    // Look at 5 epochs before that
    const previousLosses = lossHistory.slice(-10, -5);
    if (previousLosses.length === 0) return 'improving';
    const avgPrevious = previousLosses.reduce((a, b) => a + b, 0) / previousLosses.length;

    const change = avgRecent - avgPrevious;
    const changePercent = Math.abs(change / avgPrevious);

    // Diverging if loss increased by more than 5%
    if (change > 0 && changePercent > 0.05) {
      return 'diverging';
    }

    // Plateau if change is less than 1%
    if (Math.abs(changePercent) < 0.01) {
      return 'plateau';
    }

    return 'improving';
  }

  /**
   * Checks if training is near convergence
   */
  private isNearConvergence(context: ExplanationContext): boolean {
    // Consider converged if:
    // 1. Loss is very low (< 0.05)
    // 2. Or we're in final 20% of epochs and loss isn't improving much
    if (context.currentLoss < 0.05) return true;

    const progressPercent = context.currentEpoch / context.totalEpochs;
    if (progressPercent > 0.8) {
      const recentTrend = this.analyzeLossTrend(context);
      return recentTrend === 'plateau';
    }

    return false;
  }

  /**
   * Get dataset-specific description
   */
  private getDatasetDescription(datasetType: DatasetType): {
    name: string;
    description: string;
    architectureAdvice: string;
    trainingInsight: string;
  } {
    switch (datasetType) {
      case 'circle':
        return {
          name: "Circle",
          description: "The Circle dataset is linearly separable—a simple straight line can separate the two classes.",
          architectureAdvice: "Even a shallow network (1 hidden layer) can solve this easily.",
          trainingInsight: "The decision boundary is curving to wrap around the circular region. This is a relatively easy pattern to learn."
        };
      case 'xor':
        return {
          name: "XOR",
          description: "XOR is a classic non-linear problem that requires at least one hidden layer to solve.",
          architectureAdvice: "Your hidden layers are learning to transform the space so the classes become separable.",
          trainingInsight: "The decision boundary needs to curve in an X-shape to separate the four regions. This requires the network to learn non-linear transformations."
        };
      case 'spiral':
        return {
          name: "Spiral",
          description: "The Spiral dataset is highly non-linear with intertwined classes.",
          architectureAdvice: "This complex pattern needs deeper networks (2+ hidden layers) and more neurons.",
          trainingInsight: "The decision boundary is learning to spiral and wrap around the intertwined classes. This is one of the most challenging patterns."
        };
      case 'gaussian':
        return {
          name: "Gaussian",
          description: "The Gaussian dataset has overlapping bell-curve distributions.",
          architectureAdvice: "This pattern requires the network to learn probabilistic boundaries.",
          trainingInsight: "The decision boundary is learning to separate the overlapping distributions. Some misclassification is expected where the classes overlap."
        };
      case 'custom':
        return {
          name: "Custom",
          description: "You've created a custom dataset.",
          architectureAdvice: "The network architecture should match the complexity of your pattern.",
          trainingInsight: "The decision boundary is adapting to your custom data pattern."
        };
      default:
        return {
          name: "the dataset",
          description: "This is your training data.",
          architectureAdvice: "The network is configured to learn from this data.",
          trainingInsight: "The decision boundary is learning to separate the classes."
        };
    }
  }

  /**
   * Get architecture description
   */
  private getArchitectureDescription(architecture: NetworkArchitecture): string {
    const layerCount = architecture.layers.length;
    const totalNeurons = architecture.layers.reduce((sum: number, layer: LayerConfig) => sum + layer.units, 0);

    if (layerCount === 0) {
      return "a linear model (no hidden layers)";
    }

    if (layerCount === 1) {
      return `a shallow network with ${architecture.layers[0]!.units} neurons in the hidden layer`;
    }

    return `a ${layerCount}-layer network with ${totalNeurons} total neurons`;
  }

  /**
   * Get contextual training tip
   */
  private getProgressTip(context: ExplanationContext): string {
    const progressPercent = context.currentEpoch / context.totalEpochs;

    if (progressPercent < 0.3) {
      return "Early in training, the network is making big adjustments to find the right direction.";
    }

    if (progressPercent < 0.7) {
      return "The network is refining its understanding, making smaller but more precise adjustments.";
    }

    return "Training is nearly complete. The network is fine-tuning its decision boundary.";
  }
}

/**
 * Global instance of the explain moment service
 */
export const explainMomentService = new ExplainMomentService();
