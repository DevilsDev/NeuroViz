import * as d3 from 'd3';

/**
 * Data for a single layer's activation histogram
 */
export interface LayerActivationData {
  layerIndex: number;
  layerName: string;
  activations: number[];
}

/**
 * D3-based layer activation histogram visualization.
 * Shows distribution of activations for each layer as compact histograms.
 * Helps diagnose dead neurons, saturation, or unstable activation ranges.
 */
export class D3ActivationHistogram {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private width: number;
  private height: number;
  private margin = { top: 15, right: 10, bottom: 20, left: 40 };

  constructor(container: HTMLElement) {
    const rect = container.getBoundingClientRect();
    this.width = rect.width || 300;
    this.height = rect.height || 200;

    // Clear existing content
    d3.select(container).selectAll('*').remove();

    this.svg = d3
      .select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${this.width} ${this.height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');
  }

  /**
   * Updates the histogram with activation data from all layers.
   * @param layersData - Array of activation data per layer
   */
  update(layersData: LayerActivationData[]): void {
    // Clear previous content
    this.svg.selectAll('*').remove();

    if (layersData.length === 0) {
      this.svg
        .append('text')
        .attr('x', this.width / 2)
        .attr('y', this.height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#94a3b8') // Slate-400
        .attr('font-size', '11px')
        .text('No activations');
      return;
    }

    // Calculate layout for multiple layers
    const layerHeight = Math.min(
      60,
      (this.height - this.margin.top - this.margin.bottom - (layersData.length - 1) * 5) / layersData.length
    );
    const innerWidth = this.width - this.margin.left - this.margin.right;

    layersData.forEach((layerData, index) => {
      const yOffset = this.margin.top + index * (layerHeight + 5);
      this.renderLayerHistogram(layerData, yOffset, innerWidth, layerHeight);
    });
  }

  /**
   * Renders a histogram for a single layer.
   */
  private renderLayerHistogram(
    layerData: LayerActivationData,
    yOffset: number,
    width: number,
    height: number
  ): void {
    const g = this.svg.append('g').attr('transform', `translate(${this.margin.left},${yOffset})`);

    const activations = layerData.activations;

    if (activations.length === 0) {
      g.append('text')
        .attr('x', 0)
        .attr('y', height / 2)
        .attr('fill', '#94a3b8')
        .attr('font-size', '9px')
        .text(`${layerData.layerName}: No data`);
      return;
    }

    // Calculate histogram bins
    const extent = d3.extent(activations) as [number, number];
    const binCount = 15;

    const x = d3.scaleLinear().domain(extent).range([0, width]);

    const histogram = d3
      .bin<number, number>()
      .domain(x.domain() as [number, number])
      .thresholds(x.ticks(binCount));

    const bins = histogram(activations);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(bins, (d) => d.length) ?? 0])
      .range([height, 0]);

    // Detect dead neurons (all activations near zero)
    const deadNeurons = activations.filter((a) => Math.abs(a) < 0.001).length;
    const deadRatio = deadNeurons / activations.length;
    const isDead = deadRatio > 0.9;

    // Detect saturation (most activations at extremes)
    const saturated = activations.filter((a) => Math.abs(a) > 0.9).length;
    const saturationRatio = saturated / activations.length;
    const isSaturated = saturationRatio > 0.7;

    // Choose color based on health
    let barColor = '#10b981'; // Emerald-500 (healthy)
    if (isDead) barColor = '#ef4444'; // Red-500 (dead)
    else if (isSaturated) barColor = '#f59e0b'; // Amber-500 (saturated)

    // Draw bars
    g.selectAll('rect')
      .data(bins)
      .enter()
      .append('rect')
      .attr('x', (d) => x(d.x0 ?? 0) + 1)
      .attr('width', (d) => Math.max(0, x(d.x1 ?? 0) - x(d.x0 ?? 0) - 1))
      .attr('y', (d) => y(d.length))
      .attr('height', (d) => height - y(d.length))
      .attr('fill', barColor)
      .attr('opacity', 0.7);

    // X axis (compact)
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(3).tickFormat(d3.format('.1f')))
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '8px');

    g.selectAll('.domain, .tick line').attr('stroke', '#475569'); // Slate-600

    // Layer label
    const mean = d3.mean(activations) ?? 0;
    const std = d3.deviation(activations) ?? 0;

    g.append('text')
      .attr('x', -this.margin.left + 5)
      .attr('y', height / 2)
      .attr('fill', '#cbd5e1') // Slate-300
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .text(layerData.layerName);

    // Stats
    g.append('text')
      .attr('x', width)
      .attr('y', 0)
      .attr('text-anchor', 'end')
      .attr('fill', '#94a3b8')
      .attr('font-size', '8px')
      .text(`μ=${mean.toFixed(2)} σ=${std.toFixed(2)}`);

    // Warning indicators
    if (isDead) {
      g.append('text')
        .attr('x', width)
        .attr('y', height - 2)
        .attr('text-anchor', 'end')
        .attr('fill', '#ef4444')
        .attr('font-size', '8px')
        .attr('font-weight', 'bold')
        .text('⚠ DEAD');
    } else if (isSaturated) {
      g.append('text')
        .attr('x', width)
        .attr('y', height - 2)
        .attr('text-anchor', 'end')
        .attr('fill', '#f59e0b')
        .attr('font-size', '8px')
        .attr('font-weight', 'bold')
        .text('⚠ SAT');
    }
  }

  /**
   * Clears the histogram.
   */
  clear(): void {
    this.svg.selectAll('*').remove();
  }

  /**
   * Disposes of the histogram and cleans up resources.
   */
  dispose(): void {
    this.svg.selectAll('*').remove();
  }
}
