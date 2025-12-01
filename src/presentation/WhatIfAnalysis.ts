/**
 * What-If Analysis System
 * 
 * Provides parameter sensitivity analysis by simulating different configurations.
 * Shows how changes to hyperparameters might affect training outcomes.
 */

import type { Hyperparameters, Point } from '../core/domain';
import type { INeuralNetworkService } from '../core/ports';

export interface ParameterVariation {
  name: string;
  parameter: keyof Hyperparameters | 'learningRate' | 'layers' | 'dropout';
  values: (number | number[] | string)[];
  labels: string[];
}

export interface WhatIfResult {
  parameter: string;
  value: string;
  epochs: number;
  finalLoss: number;
  finalAccuracy: number;
  convergenceEpoch: number | null; // Epoch where accuracy > 90%
}

export interface WhatIfAnalysisResult {
  baselineResult: WhatIfResult;
  variations: WhatIfResult[];
  bestVariation: WhatIfResult | null;
  recommendation: string;
}

/**
 * Predefined parameter variations for quick analysis.
 */
export const PARAMETER_VARIATIONS: ParameterVariation[] = [
  {
    name: 'Learning Rate',
    parameter: 'learningRate',
    values: [0.001, 0.01, 0.03, 0.1, 0.3],
    labels: ['0.001 (slow)', '0.01', '0.03 (default)', '0.1', '0.3 (fast)'],
  },
  {
    name: 'Network Depth',
    parameter: 'layers',
    values: [[4], [8, 4], [16, 8], [16, 8, 4], [32, 16, 8]],
    labels: ['1 layer (4)', '2 layers (8,4)', '2 layers (16,8)', '3 layers', '3 layers (wide)'],
  },
  {
    name: 'Dropout Rate',
    parameter: 'dropout',
    values: [0, 0.1, 0.2, 0.3, 0.5],
    labels: ['None', '10%', '20%', '30%', '50%'],
  },
];

/**
 * Runs a quick training simulation with given hyperparameters.
 * Returns metrics after a fixed number of epochs.
 */
export async function simulateTraining(
  createModel: () => INeuralNetworkService,
  baseConfig: Hyperparameters,
  trainingData: Point[],
  epochs: number = 50
): Promise<{ loss: number; accuracy: number; convergenceEpoch: number | null }> {
  const model = createModel();
  await model.initialize(baseConfig);

  let loss = 0;
  let accuracy = 0;
  let convergenceEpoch: number | null = null;

  for (let epoch = 0; epoch < epochs; epoch++) {
    const result = await model.train(trainingData);
    loss = result.loss;
    accuracy = result.accuracy;

    if (convergenceEpoch === null && accuracy >= 0.9) {
      convergenceEpoch = epoch + 1;
    }
  }

  return { loss, accuracy, convergenceEpoch };
}

/**
 * Runs what-if analysis for a specific parameter.
 */
export async function runWhatIfAnalysis(
  createModel: () => INeuralNetworkService,
  baseConfig: Hyperparameters,
  trainingData: Point[],
  variation: ParameterVariation,
  epochs: number = 30,
  onProgress?: (current: number, total: number) => void
): Promise<WhatIfAnalysisResult> {
  const results: WhatIfResult[] = [];
  const total = variation.values.length;

  for (let i = 0; i < variation.values.length; i++) {
    const value = variation.values[i];
    const label = variation.labels[i] ?? String(value);

    onProgress?.(i + 1, total);

    // Create modified config
    const modifiedConfig = { ...baseConfig };
    if (variation.parameter === 'learningRate') {
      modifiedConfig.learningRate = value as number;
    } else if (variation.parameter === 'layers') {
      modifiedConfig.layers = value as number[];
    } else if (variation.parameter === 'dropout') {
      modifiedConfig.dropoutRate = value as number;
    }

    try {
      const { loss, accuracy, convergenceEpoch } = await simulateTraining(
        createModel,
        modifiedConfig,
        trainingData,
        epochs
      );

      results.push({
        parameter: variation.name,
        value: label,
        epochs,
        finalLoss: loss,
        finalAccuracy: accuracy,
        convergenceEpoch,
      });
    } catch (error) {
      console.error(`Failed to simulate ${label}:`, error);
      results.push({
        parameter: variation.name,
        value: label,
        epochs,
        finalLoss: Infinity,
        finalAccuracy: 0,
        convergenceEpoch: null,
      });
    }
  }

  // Find baseline (usually the middle/default value)
  const baselineIndex = Math.floor(variation.values.length / 2);
  const baselineResult = results[baselineIndex] ?? results[0]!;

  // Find best variation
  const validResults = results.filter(r => r.finalAccuracy > 0);
  const bestVariation = validResults.length > 0
    ? validResults.reduce((best, curr) => 
        curr.finalAccuracy > best.finalAccuracy ? curr : best
      )
    : null;

  // Generate recommendation
  let recommendation = '';
  if (bestVariation && bestVariation !== baselineResult) {
    const improvement = ((bestVariation.finalAccuracy - baselineResult.finalAccuracy) * 100).toFixed(1);
    recommendation = `Consider using ${variation.name} = ${bestVariation.value}. ` +
      `This could improve accuracy by ~${improvement}%.`;
  } else if (bestVariation) {
    recommendation = `Current ${variation.name} setting appears optimal.`;
  } else {
    recommendation = `Unable to determine optimal ${variation.name}.`;
  }

  return {
    baselineResult,
    variations: results,
    bestVariation,
    recommendation,
  };
}

/**
 * Formats what-if results as HTML table.
 */
export function formatWhatIfResultsHTML(result: WhatIfAnalysisResult): string {
  const rows = result.variations.map(v => {
    const isBest = v === result.bestVariation;
    const isBaseline = v === result.baselineResult;
    const rowClass = isBest ? 'bg-emerald-900/30' : isBaseline ? 'bg-blue-900/20' : '';
    const badge = isBest ? '<span class="text-emerald-400 text-xs ml-1">★ Best</span>' : 
                  isBaseline ? '<span class="text-blue-400 text-xs ml-1">◆ Current</span>' : '';

    return `
      <tr class="${rowClass}">
        <td class="px-2 py-1 text-sm">${v.value}${badge}</td>
        <td class="px-2 py-1 text-sm text-right">${(v.finalAccuracy * 100).toFixed(1)}%</td>
        <td class="px-2 py-1 text-sm text-right">${v.finalLoss.toFixed(4)}</td>
        <td class="px-2 py-1 text-sm text-right">${v.convergenceEpoch ?? '—'}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="text-xs text-slate-400 mb-2">${result.recommendation}</div>
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="border-b border-navy-600">
          <th class="px-2 py-1 text-xs text-slate-400">${result.baselineResult.parameter}</th>
          <th class="px-2 py-1 text-xs text-slate-400 text-right">Accuracy</th>
          <th class="px-2 py-1 text-xs text-slate-400 text-right">Loss</th>
          <th class="px-2 py-1 text-xs text-slate-400 text-right">Conv.</th>
        </tr>
      </thead>
      <tbody class="text-slate-300">
        ${rows}
      </tbody>
    </table>
  `;
}
