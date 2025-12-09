/**
 * Model Complexity Metrics
 * 
 * Provides calculations for model complexity indicators:
 * - Parameter count
 * - FLOPs estimation
 * - Memory usage estimation
 */

/**
 * Model complexity metrics
 */
export interface ModelComplexityMetrics {
  /** Total number of trainable parameters */
  totalParameters: number;
  /** Estimated FLOPs per forward pass */
  flopsPerForward: number;
  /** Estimated memory for parameters (bytes) */
  parameterMemoryBytes: number;
  /** Estimated memory for activations per sample (bytes) */
  activationMemoryBytes: number;
  /** Total estimated memory (bytes) */
  totalMemoryBytes: number;
  /** Breakdown by layer */
  layerBreakdown: LayerComplexity[];
}

/**
 * Complexity metrics for a single layer
 */
export interface LayerComplexity {
  /** Layer name/type */
  name: string;
  /** Layer index */
  index: number;
  /** Number of parameters in this layer */
  parameters: number;
  /** FLOPs for this layer */
  flops: number;
  /** Output size (neurons) */
  outputSize: number;
}

/**
 * Calculates model complexity metrics from architecture description.
 * 
 * @param inputSize - Number of input features (default: 2 for x,y)
 * @param hiddenLayers - Array of neurons per hidden layer
 * @param outputSize - Number of output classes
 * @param useBatchNorm - Whether batch normalisation is enabled
 * @param dropoutRate - Dropout rate (doesn't affect params, but noted)
 * @returns Complete complexity metrics
 */
export function calculateModelComplexity(
  inputSize: number,
  hiddenLayers: readonly number[],
  outputSize: number,
  useBatchNorm: boolean = false,
  dropoutRate: number = 0
): ModelComplexityMetrics {
  const layerBreakdown: LayerComplexity[] = [];
  let totalParameters = 0;
  let totalFlops = 0;
  let activationMemory = 0;

  // Build full layer sizes: [input, ...hidden, output]
  const allLayers = [inputSize, ...hiddenLayers, outputSize];

  for (let i = 0; i < allLayers.length - 1; i++) {
    const inputUnits = allLayers[i] ?? 0;
    const outputUnits = allLayers[i + 1] ?? 0;
    const isOutput = i === allLayers.length - 2;

    // Dense layer: weights + biases
    // Parameters = inputUnits * outputUnits + outputUnits (bias)
    const denseParams = inputUnits * outputUnits + outputUnits;

    // FLOPs for dense layer:
    // Multiply-accumulate: inputUnits * outputUnits * 2 (mul + add)
    // Bias add: outputUnits
    // Activation: outputUnits (approximate)
    const denseFlops = inputUnits * outputUnits * 2 + outputUnits * 2;

    let layerParams = denseParams;
    let layerFlops = denseFlops;
    let layerName = isOutput ? 'Output' : `Hidden ${i + 1}`;

    // Batch normalisation adds parameters and FLOPs
    if (useBatchNorm && !isOutput) {
      // BN has 4 params per unit: gamma, beta, moving_mean, moving_var
      // Only gamma and beta are trainable (2 per unit)
      const bnParams = outputUnits * 2;
      // BN FLOPs: normalize (4 ops) + scale/shift (2 ops) per unit
      const bnFlops = outputUnits * 6;

      layerParams += bnParams;
      layerFlops += bnFlops;
      layerName += ' + BN';
    }

    // Dropout doesn't add parameters, just noted in name
    if (dropoutRate > 0 && !isOutput) {
      layerName += ` (${Math.round(dropoutRate * 100)}% dropout)`;
    }

    layerBreakdown.push({
      name: layerName,
      index: i,
      parameters: layerParams,
      flops: layerFlops,
      outputSize: outputUnits,
    });

    totalParameters += layerParams;
    totalFlops += layerFlops;

    // Activation memory: 4 bytes per float32 per output unit
    activationMemory += outputUnits * 4;
  }

  // Parameter memory: 4 bytes per float32
  const parameterMemory = totalParameters * 4;

  return {
    totalParameters,
    flopsPerForward: totalFlops,
    parameterMemoryBytes: parameterMemory,
    activationMemoryBytes: activationMemory,
    totalMemoryBytes: parameterMemory + activationMemory,
    layerBreakdown,
  };
}

/**
 * Formats bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Formats large numbers with K/M suffixes
 */
export function formatNumber(num: number): string {
  if (num < 1000) return num.toString();
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
  return `${(num / 1000000).toFixed(2)}M`;
}

/**
 * Gets a complexity rating based on parameter count
 */
export function getComplexityRating(params: number): 'tiny' | 'small' | 'medium' | 'large' {
  if (params < 100) return 'tiny';
  if (params < 1000) return 'small';
  if (params < 10000) return 'medium';
  return 'large';
}

/**
 * Provides educational context about model complexity
 */
export function getComplexityExplanation(metrics: ModelComplexityMetrics): string {
  const rating = getComplexityRating(metrics.totalParameters);
  
  switch (rating) {
    case 'tiny':
      return 'Very simple model. May underfit complex patterns but trains quickly.';
    case 'small':
      return 'Compact model. Good for simple problems, low overfitting risk.';
    case 'medium':
      return 'Moderate complexity. Balance between capacity and generalisation.';
    case 'large':
      return 'Complex model. High capacity but may overfit without regularisation.';
  }
}
