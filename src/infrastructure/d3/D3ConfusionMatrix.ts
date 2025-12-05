import * as d3 from 'd3';

/**
 * Confusion matrix data structure.
 */
export interface ConfusionMatrixData {
  /** Matrix values [actual][predicted] */
  matrix: number[][];
  /** Class labels */
  labels: string[];
  /** Total samples */
  total: number;
}

/**
 * D3-based confusion matrix visualization.
 */
export class D3ConfusionMatrix {
  private readonly container: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  private svg: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  private readonly margin = { top: 40, right: 20, bottom: 60, left: 60 };
  private width = 200;
  private height = 200;

  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Container element #${containerId} not found`);
    }
    this.container = d3.select(element as HTMLDivElement);
  }

  /**
   * Renders the confusion matrix with animations and interactive tooltips.
   */
  render(data: ConfusionMatrixData): void {
    const numClasses = data.labels.length;
    const cellSize = Math.min(40, 160 / numClasses);
    this.width = cellSize * numClasses;
    this.height = cellSize * numClasses;

    const isFirstRender = !this.svg;

    if (isFirstRender) {
      // Clear and create SVG on first render
      this.container.selectAll('*').remove();

      const totalWidth = this.width + this.margin.left + this.margin.right;
      const totalHeight = this.height + this.margin.top + this.margin.bottom;

      this.svg = this.container
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${totalWidth} ${totalHeight}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .append('g')
        .attr('transform', `translate(${this.margin.left},${this.margin.top})`);
    }

    if (!this.svg) return;

    // Color scale (blue for correct, red for incorrect)
    const maxVal = Math.max(...data.matrix.flat());
    const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, maxVal]);

    // Create tooltip
    const tooltip = d3.select('body').selectAll<HTMLDivElement, unknown>('.cm-tooltip').data([null]);
    const tooltipEnter = tooltip.enter().append('div')
      .attr('class', 'cm-tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(15, 23, 42, 0.95)')
      .style('color', '#f1f5f9')
      .style('padding', '8px 12px')
      .style('border-radius', '6px')
      .style('font-size', '11px')
      .style('pointer-events', 'none')
      .style('opacity', '0')
      .style('z-index', '1000')
      .style('border', '1px solid rgba(0, 217, 255, 0.3)')
      .style('transition', 'opacity 0.2s');

    const tooltipMerged = tooltipEnter.merge(tooltip);

    // Update or create cells with data binding
    for (let i = 0; i < numClasses; i++) {
      for (let j = 0; j < numClasses; j++) {
        const value = data.matrix[i]?.[j] ?? 0;
        const isCorrect = i === j;
        const cellId = `cell-${i}-${j}`;
        const percentage = data.total > 0 ? ((value / data.total) * 100).toFixed(1) : '0.0';

        // Cell background with animation
        const rect = this.svg.selectAll<SVGRectElement, number>(`#${cellId}`).data([value]);

        rect.enter()
          .append('rect')
          .attr('id', cellId)
          .attr('x', j * cellSize)
          .attr('y', i * cellSize)
          .attr('width', cellSize - 1)
          .attr('height', cellSize - 1)
          .attr('rx', 2)
          .attr('fill', isCorrect ? colorScale(0) : d3.interpolateReds(0))
          .style('cursor', 'pointer')
          .on('mouseenter', (event) => {
            tooltipMerged
              .html(`
                <div style="font-weight: bold; margin-bottom: 4px;">
                  Actual: ${data.labels[i]} → Predicted: ${data.labels[j]}
                </div>
                <div>Count: <strong>${value}</strong></div>
                <div>Percentage: <strong>${percentage}%</strong></div>
                ${isCorrect ? '<div style="color: #10b981; margin-top: 4px;">✓ Correct</div>' : '<div style="color: #ef4444; margin-top: 4px;">✗ Misclassification</div>'}
              `)
              .style('left', `${event.pageX + 10}px`)
              .style('top', `${event.pageY - 10}px`)
              .style('opacity', '1');
          })
          .on('mousemove', (event) => {
            tooltipMerged
              .style('left', `${event.pageX + 10}px`)
              .style('top', `${event.pageY - 10}px`);
          })
          .on('mouseleave', () => {
            tooltipMerged.style('opacity', '0');
          })
          .merge(rect)
          .transition()
          .duration(500)
          .attr('fill', isCorrect ? colorScale(value) : d3.interpolateReds(value / (maxVal || 1)));

        // Cell value text with animation
        const textId = `text-${i}-${j}`;
        const text = this.svg.selectAll<SVGTextElement, number>(`#${textId}`).data([value]);

        text.enter()
          .append('text')
          .attr('id', textId)
          .attr('x', j * cellSize + cellSize / 2)
          .attr('y', i * cellSize + cellSize / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('font-size', '10px')
          .attr('font-weight', 'bold')
          .attr('pointer-events', 'none')
          .attr('fill', value > maxVal * 0.5 ? '#fff' : '#e2e8f0')
          .text(0)
          .merge(text)
          .transition()
          .duration(500)
          .attr('fill', value > maxVal * 0.5 ? '#fff' : '#1e293b')
          .textTween(function(d) {
            const i = d3.interpolateNumber(parseFloat(d3.select(this).text()) || 0, d);
            return (t) => Math.round(i(t)).toString();
          });
      }
    }

    // X-axis labels (Predicted)
    const xLabels = this.svg
      .append('g')
      .attr('transform', `translate(0,${this.height + 5})`);

    data.labels.forEach((label, i) => {
      xLabels
        .append('text')
        .attr('x', i * cellSize + cellSize / 2)
        .attr('y', 10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#94a3b8')
        .attr('font-size', '9px')
        .text(label);
    });

    xLabels
      .append('text')
      .attr('x', this.width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .attr('font-size', '10px')
      .text('Predicted');

    // Y-axis labels (Actual)
    const yLabels = this.svg
      .append('g')
      .attr('transform', `translate(-5,0)`);

    data.labels.forEach((label, i) => {
      yLabels
        .append('text')
        .attr('x', -5)
        .attr('y', i * cellSize + cellSize / 2)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#94a3b8')
        .attr('font-size', '9px')
        .text(label);
    });

    yLabels
      .append('text')
      .attr('x', -30)
      .attr('y', this.height / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#64748b')
      .attr('font-size', '10px')
      .attr('transform', `rotate(-90, -30, ${this.height / 2})`)
      .text('Actual');

    // Title
    this.svg
      .append('text')
      .attr('x', this.width / 2)
      .attr('y', -15)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e2e8f0')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text('Confusion Matrix');
  }

  /**
   * Clears the visualization.
   */
  clear(): void {
    this.container.selectAll('*').remove();
  }

  /**
   * Disposes resources.
   */
  dispose(): void {
    this.clear();
  }
}

/**
 * Calculates confusion matrix from predictions and actual labels.
 */
export function calculateConfusionMatrix(
  predictions: number[],
  actuals: number[],
  numClasses: number
): ConfusionMatrixData {
  // Initialize matrix
  const matrix: number[][] = Array.from({ length: numClasses }, () =>
    Array.from({ length: numClasses }, () => 0)
  );

  // Fill matrix
  for (let i = 0; i < predictions.length; i++) {
    const actual = actuals[i] ?? 0;
    const predicted = predictions[i] ?? 0;
    if (actual < numClasses && predicted < numClasses) {
      matrix[actual]![predicted]!++;
    }
  }

  // Generate labels
  const labels = Array.from({ length: numClasses }, (_, i) => `C${i}`);

  return {
    matrix,
    labels,
    total: predictions.length,
  };
}

/**
 * Calculates precision, recall, and F1 score for each class.
 */
export interface ClassMetrics {
  precision: number;
  recall: number;
  f1: number;
}

export function calculateClassMetrics(matrix: number[][]): ClassMetrics[] {
  const numClasses = matrix.length;
  const metrics: ClassMetrics[] = [];

  for (let c = 0; c < numClasses; c++) {
    // True positives: diagonal element
    const tp = matrix[c]?.[c] ?? 0;

    // False positives: sum of column c minus tp
    let fp = 0;
    for (let i = 0; i < numClasses; i++) {
      if (i !== c) {
        fp += matrix[i]?.[c] ?? 0;
      }
    }

    // False negatives: sum of row c minus tp
    let fn = 0;
    for (let j = 0; j < numClasses; j++) {
      if (j !== c) {
        fn += matrix[c]?.[j] ?? 0;
      }
    }

    // Calculate metrics
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    metrics.push({ precision, recall, f1 });
  }

  return metrics;
}

/**
 * Calculates macro-averaged metrics across all classes.
 */
export function calculateMacroMetrics(classMetrics: ClassMetrics[]): ClassMetrics {
  const n = classMetrics.length;
  if (n === 0) return { precision: 0, recall: 0, f1: 0 };

  const sum = classMetrics.reduce(
    (acc, m) => ({
      precision: acc.precision + m.precision,
      recall: acc.recall + m.recall,
      f1: acc.f1 + m.f1,
    }),
    { precision: 0, recall: 0, f1: 0 }
  );

  return {
    precision: sum.precision / n,
    recall: sum.recall / n,
    f1: sum.f1 / n,
  };
}
