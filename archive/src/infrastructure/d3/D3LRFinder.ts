import * as d3 from 'd3';

/**
 * Learning rate finder result point.
 */
export interface LRFinderPoint {
  lr: number;
  loss: number;
}

/**
 * D3-based learning rate finder visualization.
 * Shows loss vs learning rate on a log scale.
 */
export class D3LRFinder {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private width: number;
  private height: number;
  private margin = { top: 10, right: 10, bottom: 35, left: 45 };

  constructor(container: HTMLElement) {
    const rect = container.getBoundingClientRect();
    this.width = rect.width || 300;
    this.height = rect.height || 150;

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
   * Renders the LR finder results.
   */
  render(points: LRFinderPoint[], suggestedLR?: number): void {
    if (points.length === 0) return;

    const innerWidth = this.width - this.margin.left - this.margin.right;
    const innerHeight = this.height - this.margin.top - this.margin.bottom;

    // Clear previous content
    this.svg.selectAll('*').remove();

    const g = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // Filter out invalid points
    const validPoints = points.filter(p => p.loss > 0 && isFinite(p.loss) && p.lr > 0);
    if (validPoints.length === 0) return;

    // Scales (log scale for LR)
    const xExtent = d3.extent(validPoints, d => d.lr) as [number, number];
    const yExtent = d3.extent(validPoints, d => d.loss) as [number, number];

    const x = d3.scaleLog()
      .domain([xExtent[0] * 0.9, xExtent[1] * 1.1])
      .range([0, innerWidth]);

    const y = d3.scaleLinear()
      .domain([yExtent[0] * 0.9, yExtent[1] * 1.1])
      .range([innerHeight, 0]);

    // Draw line
    const line = d3.line<LRFinderPoint>()
      .x(d => x(d.lr))
      .y(d => y(d.loss))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(validPoints)
      .attr('fill', 'none')
      .attr('stroke', 'var(--accent-500)')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Draw suggested LR line if provided
    if (suggestedLR && suggestedLR >= xExtent[0] && suggestedLR <= xExtent[1]) {
      g.append('line')
        .attr('x1', x(suggestedLR))
        .attr('y1', 0)
        .attr('x2', x(suggestedLR))
        .attr('y2', innerHeight)
        .attr('stroke', '#22c55e')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,4');

      g.append('text')
        .attr('x', x(suggestedLR) + 5)
        .attr('y', 15)
        .attr('fill', '#22c55e')
        .attr('font-size', '10px')
        .text(`Best: ${suggestedLR.toExponential(1)}`);
    }

    // X axis (log scale)
    const xAxis = d3.axisBottom(x)
      .ticks(5, '.0e');

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', 'var(--text-secondary)')
      .attr('font-size', '9px');

    g.selectAll('.domain, .tick line')
      .attr('stroke', 'var(--border-color)');

    // Y axis
    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .selectAll('text')
      .attr('fill', 'var(--text-secondary)')
      .attr('font-size', '9px');

    // Axis labels
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 30)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--text-secondary)')
      .attr('font-size', '10px')
      .text('Learning Rate');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -35)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--text-secondary)')
      .attr('font-size', '10px')
      .text('Loss');
  }

  /**
   * Clears the chart.
   */
  clear(): void {
    this.svg.selectAll('*').remove();
  }
}

/**
 * Finds the optimal learning rate by analyzing the loss curve.
 * Returns the LR where loss decreases fastest (steepest gradient).
 */
export function findOptimalLR(points: LRFinderPoint[]): number | null {
  if (points.length < 10) return null;

  // Filter valid points
  const valid = points.filter(p => p.loss > 0 && isFinite(p.loss) && p.lr > 0);
  if (valid.length < 10) return null;

  // Find point with steepest negative gradient
  let bestIdx = 0;
  let bestGradient = 0;

  for (let i = 1; i < valid.length - 1; i++) {
    const prev = valid[i - 1];
    const curr = valid[i];
    const next = valid[i + 1];
    
    if (!prev || !curr || !next) continue;

    // Calculate gradient (loss change per log LR change)
    const logLRDiff = Math.log10(next.lr) - Math.log10(prev.lr);
    const lossDiff = next.loss - prev.loss;
    const gradient = lossDiff / logLRDiff;

    // We want the most negative gradient (fastest decrease)
    if (gradient < bestGradient) {
      bestGradient = gradient;
      bestIdx = i;
    }
  }

  // Return LR slightly before the steepest point (safer)
  const optimalIdx = Math.max(0, bestIdx - 2);
  return valid[optimalIdx]?.lr ?? null;
}
