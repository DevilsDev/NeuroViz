/**
 * Saliency Maps
 * 
 * Implements gradient-based saliency maps to visualize which input regions
 * most strongly influence the model's predictions.
 */

import type { Point } from '../domain';
import type { INeuralNetworkService } from '../ports';

export interface SaliencyResult {
  /** Grid of saliency values */
  grid: SaliencyCell[][];
  /** Maximum saliency value for normalization */
  maxSaliency: number;
  /** Minimum saliency value */
  minSaliency: number;
  /** Grid resolution */
  resolution: number;
  /** Bounds of the grid */
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
}

export interface SaliencyCell {
  x: number;
  y: number;
  saliency: number;
  gradientX: number;
  gradientY: number;
}

export interface SaliencyConfig {
  /** Grid resolution */
  resolution: number;
  /** Epsilon for numerical gradient computation */
  epsilon: number;
  /** Target class (null = use predicted class) */
  targetClass: number | null;
}

/**
 * Computes saliency map using numerical gradients.
 * 
 * For each point in the grid, computes the gradient of the output
 * with respect to the input coordinates.
 */
export async function computeSaliencyMap(
  model: INeuralNetworkService,
  config: SaliencyConfig = { resolution: 30, epsilon: 0.01, targetClass: null },
  bounds = { minX: -6, maxX: 6, minY: -6, maxY: 6 }
): Promise<SaliencyResult> {
  const { resolution, epsilon, targetClass } = config;
  const { minX, maxX, minY, maxY } = bounds;

  const stepX = (maxX - minX) / resolution;
  const stepY = (maxY - minY) / resolution;

  const grid: SaliencyCell[][] = [];
  let maxSaliency = 0;
  let minSaliency = Infinity;

  for (let i = 0; i < resolution; i++) {
    const row: SaliencyCell[] = [];
    
    for (let j = 0; j < resolution; j++) {
      const x = minX + (i + 0.5) * stepX;
      const y = minY + (j + 0.5) * stepY;

      // Compute numerical gradient
      const { gradX, gradY, saliency } = await computeGradient(
        model, x, y, epsilon, targetClass
      );

      row.push({
        x,
        y,
        saliency,
        gradientX: gradX,
        gradientY: gradY,
      });

      maxSaliency = Math.max(maxSaliency, saliency);
      minSaliency = Math.min(minSaliency, saliency);
    }

    grid.push(row);
  }

  return {
    grid,
    maxSaliency,
    minSaliency,
    resolution,
    bounds,
  };
}

/**
 * Computes numerical gradient at a point.
 */
async function computeGradient(
  model: INeuralNetworkService,
  x: number,
  y: number,
  epsilon: number,
  targetClass: number | null
): Promise<{ gradX: number; gradY: number; saliency: number }> {
  // Create points for finite difference
  const points: Point[] = [
    { x, y, label: 0 },           // center
    { x: x + epsilon, y, label: 0 }, // x+
    { x: x - epsilon, y, label: 0 }, // x-
    { x, y: y + epsilon, label: 0 }, // y+
    { x, y: y - epsilon, label: 0 }, // y-
  ];

  const predictions = await model.predict(points);
  
  // Get confidence for target class
  const getConfidence = (pred: typeof predictions[0], tc: number | null): number => {
    if (!pred) return 0;
    if (tc === null) {
      return pred.confidence;
    }
    if (pred.probabilities && pred.probabilities.length > tc) {
      return pred.probabilities[tc] ?? pred.confidence;
    }
    return pred.predictedClass === tc ? pred.confidence : 1 - pred.confidence;
  };

  const centerPred = predictions[0];
  const tc = targetClass ?? centerPred?.predictedClass ?? 0;

  const fCenter = centerPred ? getConfidence(centerPred, tc) : 0;
  const fXPlus = predictions[1] ? getConfidence(predictions[1], tc) : fCenter;
  const fXMinus = predictions[2] ? getConfidence(predictions[2], tc) : fCenter;
  const fYPlus = predictions[3] ? getConfidence(predictions[3], tc) : fCenter;
  const fYMinus = predictions[4] ? getConfidence(predictions[4], tc) : fCenter;

  // Central difference gradient
  const gradX = (fXPlus - fXMinus) / (2 * epsilon);
  const gradY = (fYPlus - fYMinus) / (2 * epsilon);

  // Saliency = gradient magnitude
  const saliency = Math.sqrt(gradX * gradX + gradY * gradY);

  return { gradX, gradY, saliency };
}

/**
 * Converts saliency map to color values for visualization.
 */
export function saliencyToColors(
  result: SaliencyResult,
  colorScheme: 'heat' | 'diverging' | 'viridis' = 'heat'
): string[][] {
  const { grid, maxSaliency } = result;
  const normalizer = maxSaliency > 0 ? maxSaliency : 1;

  return grid.map(row =>
    row.map(cell => {
      const normalized = cell.saliency / normalizer;
      return getColor(normalized, colorScheme);
    })
  );
}

/**
 * Gets color for a normalized saliency value.
 */
function getColor(value: number, scheme: 'heat' | 'diverging' | 'viridis'): string {
  const v = Math.max(0, Math.min(1, value));

  switch (scheme) {
    case 'heat': {
      // Black -> Red -> Yellow -> White
      if (v < 0.33) {
        const t = v / 0.33;
        return `rgb(${Math.round(t * 255)}, 0, 0)`;
      } else if (v < 0.66) {
        const t = (v - 0.33) / 0.33;
        return `rgb(255, ${Math.round(t * 255)}, 0)`;
      } else {
        const t = (v - 0.66) / 0.34;
        return `rgb(255, 255, ${Math.round(t * 255)})`;
      }
    }
    case 'diverging': {
      // Blue -> White -> Red
      if (v < 0.5) {
        const t = v / 0.5;
        return `rgb(${Math.round(t * 255)}, ${Math.round(t * 255)}, 255)`;
      } else {
        const t = (v - 0.5) / 0.5;
        return `rgb(255, ${Math.round((1 - t) * 255)}, ${Math.round((1 - t) * 255)})`;
      }
    }
    case 'viridis':
    default: {
      // Approximate viridis colormap
      const r = Math.round(68 + v * (253 - 68));
      const g = Math.round(1 + v * (231 - 1));
      const b = Math.round(84 + (1 - v) * (168 - 84));
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
}

/**
 * Formats saliency map statistics as HTML.
 */
export function formatSaliencyStatsHTML(result: SaliencyResult): string {
  const { maxSaliency, minSaliency, resolution } = result;

  // Find hotspots (high saliency regions)
  const hotspots: { x: number; y: number; saliency: number }[] = [];
  const threshold = maxSaliency * 0.8;

  for (const row of result.grid) {
    for (const cell of row) {
      if (cell.saliency >= threshold) {
        hotspots.push({ x: cell.x, y: cell.y, saliency: cell.saliency });
      }
    }
  }

  // Sort by saliency
  hotspots.sort((a, b) => b.saliency - a.saliency);
  const topHotspots = hotspots.slice(0, 3);

  return `
    <div class="text-xs space-y-2">
      <div class="flex justify-between">
        <span class="text-slate-400">Max Saliency:</span>
        <span>${maxSaliency.toFixed(3)}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-slate-400">Min Saliency:</span>
        <span>${minSaliency.toFixed(3)}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-slate-400">Resolution:</span>
        <span>${resolution}×${resolution}</span>
      </div>
      ${topHotspots.length > 0 ? `
        <div class="mt-2">
          <span class="text-slate-400">High Sensitivity Regions:</span>
          <ul class="mt-1 text-slate-300">
            ${topHotspots.map(h => `
              <li>• (${h.x.toFixed(1)}, ${h.y.toFixed(1)}): ${h.saliency.toFixed(3)}</li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `;
}
