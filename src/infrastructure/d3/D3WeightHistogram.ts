import * as d3 from 'd3';

/**
 * D3-based weight histogram visualization.
 * Shows distribution of model weights as a bar chart.
 */
export class D3WeightHistogram {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private width: number;
  private height: number;
  private margin = { top: 15, right: 15, bottom: 25, left: 50 };

  constructor(container: HTMLElement) {
    const rect = container.getBoundingClientRect();
    this.width = rect.width || 200;
    this.height = rect.height || 100;

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
   * Updates the histogram with new weight data.
   */
  update(weights: number[]): void {
    const innerWidth = this.width - this.margin.left - this.margin.right;
    const innerHeight = this.height - this.margin.top - this.margin.bottom;

    // Clear previous content
    this.svg.selectAll('*').remove();

    if (weights.length === 0) {
      this.svg.append('text')
        .attr('x', this.width / 2)
        .attr('y', this.height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--text-secondary)')
        .attr('font-size', '12px')
        .text('No weights');
      return;
    }

    const g = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // Calculate histogram bins
    const extent = d3.extent(weights) as [number, number];
    const binCount = 20;
    
    const x = d3.scaleLinear()
      .domain(extent)
      .range([0, innerWidth]);

    const histogram = d3.bin<number, number>()
      .domain(x.domain() as [number, number])
      .thresholds(x.ticks(binCount));

    const bins = histogram(weights);

    const y = d3.scaleLinear()
      .domain([0, d3.max(bins, d => d.length) ?? 0])
      .range([innerHeight, 0]);

    // Draw bars
    g.selectAll('rect')
      .data(bins)
      .enter()
      .append('rect')
      .attr('x', d => x(d.x0 ?? 0) + 1)
      .attr('width', d => Math.max(0, x(d.x1 ?? 0) - x(d.x0 ?? 0) - 1))
      .attr('y', d => y(d.length))
      .attr('height', d => innerHeight - y(d.length))
      .attr('fill', '#06b6d4')
      .attr('opacity', 0.85);

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format('.1f')))
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '9px');

    g.selectAll('.domain, .tick line')
      .attr('stroke', '#475569');

    // Y axis
    g.append('g')
      .call(d3.axisLeft(y).ticks(3))
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '9px');

    // Stats text
    const mean = d3.mean(weights) ?? 0;
    const std = d3.deviation(weights) ?? 0;
    
    g.append('text')
      .attr('x', innerWidth)
      .attr('y', 0)
      .attr('text-anchor', 'end')
      .attr('fill', 'var(--text-secondary)')
      .attr('font-size', '9px')
      .text(`μ=${mean.toFixed(3)} σ=${std.toFixed(3)}`);
  }

  /**
   * Clears the histogram.
   */
  clear(): void {
    this.svg.selectAll('*').remove();
  }

  /**
   * Disposes of all resources and removes DOM elements.
   * Call this when the histogram is no longer needed.
   */
  dispose(): void {
    this.clear();
  }
}
