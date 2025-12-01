import * as d3 from 'd3';

/**
 * ROC (Receiver Operating Characteristic) curve data point.
 */
export interface RocPoint {
  fpr: number; // False Positive Rate (1 - Specificity)
  tpr: number; // True Positive Rate (Sensitivity/Recall)
  threshold: number;
}

/**
 * Calculates ROC curve points from predictions and labels.
 * Only works for binary classification.
 * 
 * @param predictions - Array of prediction confidences (0-1) for the positive class
 * @param labels - Array of actual labels (0 or 1)
 * @returns Array of ROC points and AUC score
 */
export function calculateRocCurve(
  predictions: number[],
  labels: number[]
): { points: RocPoint[]; auc: number } {
  if (predictions.length !== labels.length || predictions.length === 0) {
    return { points: [], auc: 0 };
  }

  // Combine predictions and labels, sort by prediction descending
  const combined = predictions.map((pred, i) => ({
    pred,
    label: labels[i] ?? 0,
  }));
  combined.sort((a, b) => b.pred - a.pred);

  const totalPositives = labels.filter(l => l === 1).length;
  const totalNegatives = labels.length - totalPositives;

  if (totalPositives === 0 || totalNegatives === 0) {
    return { points: [], auc: 0 };
  }

  const points: RocPoint[] = [];
  let tp = 0;
  let fp = 0;

  // Add origin point
  points.push({ fpr: 0, tpr: 0, threshold: 1.0 });

  // Calculate TPR and FPR at each threshold
  for (let i = 0; i < combined.length; i++) {
    const item = combined[i];
    if (!item) continue;
    
    if (item.label === 1) {
      tp++;
    } else {
      fp++;
    }

    const tpr = tp / totalPositives;
    const fpr = fp / totalNegatives;
    const threshold = item.pred;

    // Only add point if it's different from the last one
    const lastPoint = points[points.length - 1];
    if (!lastPoint || lastPoint.tpr !== tpr || lastPoint.fpr !== fpr) {
      points.push({ fpr, tpr, threshold });
    }
  }

  // Ensure we end at (1, 1)
  const lastPoint = points[points.length - 1];
  if (!lastPoint || lastPoint.fpr !== 1 || lastPoint.tpr !== 1) {
    points.push({ fpr: 1, tpr: 1, threshold: 0 });
  }

  // Calculate AUC using trapezoidal rule
  let auc = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    if (prev && curr) {
      auc += (curr.fpr - prev.fpr) * (curr.tpr + prev.tpr) / 2;
    }
  }

  return { points, auc };
}

/**
 * D3-based ROC curve visualization.
 */
export class D3RocCurve {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private width: number;
  private height: number;
  private margin = { top: 10, right: 10, bottom: 30, left: 35 };

  constructor(container: HTMLElement) {
    const rect = container.getBoundingClientRect();
    this.width = rect.width || 200;
    this.height = rect.height || 200;

    // Clear existing content
    d3.select(container).selectAll('*').remove();

    this.svg = d3.select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${this.width} ${this.height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');
  }

  /**
   * Renders the ROC curve.
   */
  render(points: RocPoint[], auc: number): void {
    const innerWidth = this.width - this.margin.left - this.margin.right;
    const innerHeight = this.height - this.margin.top - this.margin.bottom;

    // Clear previous content
    this.svg.selectAll('*').remove();

    const g = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // Scales
    const x = d3.scaleLinear().domain([0, 1]).range([0, innerWidth]);
    const y = d3.scaleLinear().domain([0, 1]).range([innerHeight, 0]);

    // Draw diagonal (random classifier)
    g.append('line')
      .attr('x1', x(0))
      .attr('y1', y(0))
      .attr('x2', x(1))
      .attr('y2', y(1))
      .attr('stroke', 'var(--border-color)')
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0.5);

    // Draw ROC curve
    if (points.length > 0) {
      const line = d3.line<RocPoint>()
        .x(d => x(d.fpr))
        .y(d => y(d.tpr));

      // Fill area under curve
      const area = d3.area<RocPoint>()
        .x(d => x(d.fpr))
        .y0(innerHeight)
        .y1(d => y(d.tpr));

      g.append('path')
        .datum(points)
        .attr('fill', 'var(--accent-500)')
        .attr('fill-opacity', 0.2)
        .attr('d', area);

      g.append('path')
        .datum(points)
        .attr('fill', 'none')
        .attr('stroke', 'var(--accent-500)')
        .attr('stroke-width', 2)
        .attr('d', line);
    }

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format('.1f')))
      .selectAll('text')
      .attr('fill', 'var(--text-secondary)')
      .attr('font-size', '9px');

    g.selectAll('.domain, .tick line')
      .attr('stroke', 'var(--border-color)');

    // Y axis
    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('.1f')))
      .selectAll('text')
      .attr('fill', 'var(--text-secondary)')
      .attr('font-size', '9px');

    // Axis labels
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 25)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--text-secondary)')
      .attr('font-size', '10px')
      .text('FPR');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -25)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--text-secondary)')
      .attr('font-size', '10px')
      .text('TPR');

    // AUC label
    g.append('text')
      .attr('x', innerWidth - 5)
      .attr('y', 15)
      .attr('text-anchor', 'end')
      .attr('fill', 'var(--accent-400)')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text(`AUC: ${auc.toFixed(3)}`);
  }

  /**
   * Clears the chart.
   */
  clear(): void {
    this.svg.selectAll('*').remove();
  }
}
