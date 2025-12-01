/**
 * Suggested Fixes System
 * 
 * Provides actionable recommendations based on training metrics and patterns.
 * Integrates with the existing fit analysis system.
 */

export interface TrainingMetrics {
  epoch: number;
  trainLoss: number;
  valLoss: number | null;
  trainAccuracy: number;
  valAccuracy: number | null;
  learningRate: number;
  lossHistory: number[];
  valLossHistory: number[];
}

export interface Suggestion {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  action?: {
    label: string;
    handler: string; // Function name to call
    params?: Record<string, unknown>;
  };
}

export interface DiagnosisResult {
  status: 'healthy' | 'overfitting' | 'underfitting' | 'unstable' | 'stuck' | 'diverging';
  confidence: number;
  suggestions: Suggestion[];
}

/**
 * Analyzes training metrics and provides actionable suggestions.
 */
export function diagnoseTraining(metrics: TrainingMetrics): DiagnosisResult {
  const suggestions: Suggestion[] = [];
  let status: DiagnosisResult['status'] = 'healthy';
  let confidence = 0;

  const { epoch, trainLoss, valLoss, trainAccuracy, valAccuracy, lossHistory, valLossHistory } = metrics;

  // Need at least some epochs to diagnose
  if (epoch < 5) {
    return { status: 'healthy', confidence: 0, suggestions: [] };
  }

  // Check for diverging loss (NaN or very high)
  if (isNaN(trainLoss) || trainLoss > 100) {
    status = 'diverging';
    confidence = 1.0;
    suggestions.push({
      id: 'diverging-loss',
      type: 'error',
      title: 'Training Diverged',
      message: 'Loss has exploded. This usually means the learning rate is too high.',
      action: {
        label: 'Reduce LR to 0.001',
        handler: 'setLearningRate',
        params: { value: 0.001 },
      },
    });
    suggestions.push({
      id: 'diverging-reset',
      type: 'info',
      title: 'Reset Recommended',
      message: 'Reset the network and try again with lower learning rate.',
      action: {
        label: 'Reset Network',
        handler: 'resetNetwork',
      },
    });
    return { status, confidence, suggestions };
  }

  // Check for stuck training (loss not decreasing)
  if (lossHistory.length >= 20) {
    const recent = lossHistory.slice(-10);
    const earlier = lossHistory.slice(-20, -10);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    const improvement = (earlierAvg - recentAvg) / earlierAvg;

    if (improvement < 0.01 && trainAccuracy < 0.9) {
      status = 'stuck';
      confidence = 0.8;
      suggestions.push({
        id: 'stuck-lr',
        type: 'warning',
        title: 'Training Stuck',
        message: 'Loss hasn\'t improved in 20 epochs. Try increasing the learning rate.',
        action: {
          label: 'Increase LR 3x',
          handler: 'multiplyLearningRate',
          params: { factor: 3 },
        },
      });
      suggestions.push({
        id: 'stuck-capacity',
        type: 'info',
        title: 'Add Capacity',
        message: 'The network might be too simple. Try adding more neurons.',
        action: {
          label: 'Add Layer',
          handler: 'addHiddenLayer',
        },
      });
    }
  }

  // Check for unstable training (oscillating loss)
  if (lossHistory.length >= 10) {
    const recent = lossHistory.slice(-10);
    let oscillations = 0;
    for (let i = 1; i < recent.length - 1; i++) {
      const prev = recent[i - 1] ?? 0;
      const curr = recent[i] ?? 0;
      const next = recent[i + 1] ?? 0;
      if ((curr > prev && curr > next) || (curr < prev && curr < next)) {
        oscillations++;
      }
    }
    if (oscillations >= 6) {
      status = 'unstable';
      confidence = 0.7;
      suggestions.push({
        id: 'unstable-lr',
        type: 'warning',
        title: 'Unstable Training',
        message: 'Loss is oscillating. The learning rate might be too high.',
        action: {
          label: 'Reduce LR by half',
          handler: 'multiplyLearningRate',
          params: { factor: 0.5 },
        },
      });
      suggestions.push({
        id: 'unstable-batch',
        type: 'info',
        title: 'Increase Batch Size',
        message: 'Larger batches can stabilize training.',
        action: {
          label: 'Set Batch Size 32',
          handler: 'setBatchSize',
          params: { value: 32 },
        },
      });
    }
  }

  // Check for overfitting
  if (valLoss !== null && valAccuracy !== null && valLossHistory.length >= 10) {
    const recentValLoss = valLossHistory.slice(-5);
    const valLossIncreasing = recentValLoss.every((v, i) =>
      i === 0 || v >= (recentValLoss[i - 1] ?? 0) * 0.98
    );
    const trainValGap = trainAccuracy - valAccuracy;

    if ((valLossIncreasing && trainValGap > 0.1) || trainValGap > 0.15) {
      status = 'overfitting';
      confidence = Math.min(trainValGap * 5, 1.0);
      suggestions.push({
        id: 'overfit-dropout',
        type: 'warning',
        title: 'Overfitting Detected',
        message: `Training accuracy (${(trainAccuracy * 100).toFixed(0)}%) is much higher than validation (${(valAccuracy * 100).toFixed(0)}%).`,
        action: {
          label: 'Add Dropout 0.2',
          handler: 'setDropout',
          params: { value: 0.2 },
        },
      });
      suggestions.push({
        id: 'overfit-l2',
        type: 'info',
        title: 'Add Regularization',
        message: 'L2 regularization can help prevent overfitting.',
        action: {
          label: 'Set L2 = 0.01',
          handler: 'setL2',
          params: { value: 0.01 },
        },
      });
      suggestions.push({
        id: 'overfit-stop',
        type: 'info',
        title: 'Early Stopping',
        message: 'Consider stopping training now to prevent further overfitting.',
        action: {
          label: 'Stop Training',
          handler: 'stopTraining',
        },
      });
    }
  }

  // Check for underfitting
  if (epoch >= 50 && trainAccuracy < 0.7) {
    status = 'underfitting';
    confidence = 1 - trainAccuracy;
    suggestions.push({
      id: 'underfit-capacity',
      type: 'warning',
      title: 'Underfitting',
      message: `Training accuracy is only ${(trainAccuracy * 100).toFixed(0)}% after ${epoch} epochs.`,
      action: {
        label: 'Double Layer Size',
        handler: 'doubleLayerSize',
      },
    });
    suggestions.push({
      id: 'underfit-lr',
      type: 'info',
      title: 'Increase Learning Rate',
      message: 'A higher learning rate might help learn faster.',
      action: {
        label: 'Increase LR 2x',
        handler: 'multiplyLearningRate',
        params: { factor: 2 },
      },
    });
    suggestions.push({
      id: 'underfit-epochs',
      type: 'info',
      title: 'Train Longer',
      message: 'The model might need more epochs to converge.',
    });
  }

  // Good training - provide positive feedback
  if (status === 'healthy' && trainAccuracy > 0.9) {
    if (valAccuracy !== null && valAccuracy > 0.85) {
      suggestions.push({
        id: 'healthy-good',
        type: 'success',
        title: 'Training Well!',
        message: `Great results! Train: ${(trainAccuracy * 100).toFixed(0)}%, Val: ${(valAccuracy * 100).toFixed(0)}%`,
      });
    } else if (valAccuracy === null) {
      suggestions.push({
        id: 'healthy-no-val',
        type: 'info',
        title: 'Consider Validation',
        message: 'Enable validation split to detect overfitting.',
        action: {
          label: 'Enable 20% Val Split',
          handler: 'setValSplit',
          params: { value: 0.2 },
        },
      });
    }
  }

  return { status, confidence, suggestions };
}

/**
 * Formats suggestions as HTML for display.
 */
export function formatSuggestionsHTML(suggestions: Suggestion[]): string {
  if (suggestions.length === 0) return '';

  return suggestions.map(s => {
    const typeColors = {
      warning: 'bg-amber-900/30 border-amber-700/50 text-amber-300',
      info: 'bg-blue-900/30 border-blue-700/50 text-blue-300',
      success: 'bg-emerald-900/30 border-emerald-700/50 text-emerald-300',
      error: 'bg-red-900/30 border-red-700/50 text-red-300',
    };

    const icons = {
      warning: '⚠️',
      info: '💡',
      success: '✅',
      error: '❌',
    };

    let html = `
      <div class="p-2 rounded border ${typeColors[s.type]} mb-2">
        <div class="font-medium text-sm">${icons[s.type]} ${s.title}</div>
        <div class="text-xs mt-1 opacity-80">${s.message}</div>
    `;

    if (s.action) {
      html += `
        <button 
          class="mt-2 px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 transition-colors"
          data-suggestion-action="${s.action.handler}"
          data-suggestion-params='${JSON.stringify(s.action.params ?? {})}'
        >
          ${s.action.label}
        </button>
      `;
    }

    html += '</div>';
    return html;
  }).join('');
}
