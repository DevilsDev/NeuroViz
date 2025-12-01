/**
 * Feature Importance Analysis
 * 
 * Implements permutation importance to measure how much each input feature
 * contributes to the model's predictions.
 */

import type { Point } from '../domain';
import type { INeuralNetworkService } from '../ports';

export interface FeatureImportanceResult {
  featureName: string;
  featureIndex: number;
  importance: number;
  importanceStd: number;
  baselineAccuracy: number;
  permutedAccuracy: number;
}

export interface FeatureImportanceConfig {
  /** Number of permutation iterations */
  iterations: number;
  /** Random seed for reproducibility */
  seed?: number;
}

/**
 * Calculates permutation importance for each input feature.
 * 
 * Permutation importance measures how much the model's accuracy drops
 * when a feature's values are randomly shuffled, breaking the relationship
 * between the feature and the target.
 */
export async function calculateFeatureImportance(
  model: INeuralNetworkService,
  data: Point[],
  featureNames: string[] = ['X', 'Y'],
  config: FeatureImportanceConfig = { iterations: 10 }
): Promise<FeatureImportanceResult[]> {
  if (data.length === 0) {
    throw new Error('No data provided for feature importance calculation');
  }

  // Calculate baseline accuracy
  const baselineAccuracy = await calculateAccuracy(model, data);
  
  const results: FeatureImportanceResult[] = [];

  // For each feature (X and Y in 2D case)
  for (let featureIdx = 0; featureIdx < featureNames.length; featureIdx++) {
    const importanceScores: number[] = [];

    // Run multiple iterations for stability
    for (let iter = 0; iter < config.iterations; iter++) {
      // Create permuted dataset
      const permutedData = permuteFeature(data, featureIdx);
      
      // Calculate accuracy with permuted feature
      const permutedAccuracy = await calculateAccuracy(model, permutedData);
      
      // Importance = drop in accuracy
      const importance = baselineAccuracy - permutedAccuracy;
      importanceScores.push(importance);
    }

    // Calculate mean and std of importance
    const meanImportance = importanceScores.reduce((a, b) => a + b, 0) / importanceScores.length;
    const variance = importanceScores.reduce((sum, x) => sum + Math.pow(x - meanImportance, 2), 0) / importanceScores.length;
    const stdImportance = Math.sqrt(variance);

    results.push({
      featureName: featureNames[featureIdx] ?? `Feature ${featureIdx}`,
      featureIndex: featureIdx,
      importance: meanImportance,
      importanceStd: stdImportance,
      baselineAccuracy,
      permutedAccuracy: baselineAccuracy - meanImportance,
    });
  }

  // Sort by importance (descending)
  results.sort((a, b) => b.importance - a.importance);

  return results;
}

/**
 * Calculates model accuracy on a dataset.
 */
async function calculateAccuracy(model: INeuralNetworkService, data: Point[]): Promise<number> {
  const predictions = await model.predict(data);
  let correct = 0;

  for (let i = 0; i < data.length; i++) {
    const prediction = predictions[i];
    const point = data[i];
    if (prediction && point && prediction.predictedClass === point.label) {
      correct++;
    }
  }

  return correct / data.length;
}

/**
 * Creates a copy of the data with one feature randomly permuted.
 */
function permuteFeature(data: Point[], featureIndex: number): Point[] {
  const permuted = data.map(p => ({ ...p }));
  
  // Extract feature values
  const values = permuted.map(p => featureIndex === 0 ? p.x : p.y);
  
  // Fisher-Yates shuffle
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j]!, values[i]!];
  }
  
  // Apply shuffled values
  permuted.forEach((p, i) => {
    if (featureIndex === 0) {
      p.x = values[i]!;
    } else {
      p.y = values[i]!;
    }
  });
  
  return permuted;
}

/**
 * Formats feature importance results as HTML.
 */
export function formatFeatureImportanceHTML(results: FeatureImportanceResult[]): string {
  if (results.length === 0) return '<div class="text-slate-400">No results</div>';

  const maxImportance = Math.max(...results.map(r => Math.abs(r.importance)), 0.01);

  const rows = results.map(r => {
    const barWidth = Math.abs(r.importance) / maxImportance * 100;
    const barColor = r.importance > 0 ? 'bg-emerald-500' : 'bg-red-500';
    const sign = r.importance >= 0 ? '+' : '';

    return `
      <div class="mb-2">
        <div class="flex justify-between text-xs mb-1">
          <span class="font-medium">${r.featureName}</span>
          <span class="text-slate-400">${sign}${(r.importance * 100).toFixed(1)}% ± ${(r.importanceStd * 100).toFixed(1)}%</span>
        </div>
        <div class="h-2 bg-navy-700 rounded overflow-hidden">
          <div class="${barColor} h-full rounded" style="width: ${barWidth}%"></div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="text-xs text-slate-400 mb-2">
      Baseline accuracy: ${(results[0]?.baselineAccuracy ?? 0 * 100).toFixed(1)}%
    </div>
    ${rows}
    <div class="text-xs text-slate-500 mt-2">
      Higher = more important. Shows accuracy drop when feature is shuffled.
    </div>
  `;
}
