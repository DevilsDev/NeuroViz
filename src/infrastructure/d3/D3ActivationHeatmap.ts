import * as d3 from 'd3';

/**
 * D3-based neuron activation heatmap visualization.
 * Shows real-time activations for each neuron across layers.
 */
export class D3ActivationHeatmap {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private width: number;
  private height: number;
  private margin = { top: 20, right: 10, bottom: 20, left: 40 };

  // Colour scale for activations
  private colorScale = d3.scaleSequential(d3.interpolateViridis).domain([0, 1]);

  constructor(container: HTMLElement) {
    const rect = container.getBoundingClientRect();
    this.width = rect.width || 300;
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
   * Renders the activation heatmap.
   * @param activations - Array of activation arrays per layer
   * @param layerNames - Optional names for each layer
   */
  render(activations: number[][], layerNames?: string[]): void {
    if (activations.length === 0) return;

    const innerWidth = this.width - this.margin.left - this.margin.right;
    const innerHeight = this.height - this.margin.top - this.margin.bottom;

    // Clear previous content
    this.svg.selectAll('*').remove();

    const g = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // Calculate cell dimensions
    const numLayers = activations.length;
    const maxNeurons = Math.max(...activations.map(a => a.length));
    const cellWidth = innerWidth / numLayers;
    const cellHeight = Math.min(innerHeight / maxNeurons, 15);

    // Draw cells for each layer
    activations.forEach((layerActivations, layerIndex) => {
      const layerGroup = g.append('g')
        .attr('transform', `translate(${layerIndex * cellWidth}, 0)`);

      // Center neurons vertically
      const layerHeight = layerActivations.length * cellHeight;
      const yOffset = (innerHeight - layerHeight) / 2;

      layerActivations.forEach((activation, neuronIndex) => {
        // Normalize activation to [0, 1] for colour mapping
        const normalizedActivation = Math.max(0, Math.min(1, activation));

        layerGroup.append('rect')
          .attr('x', 2)
          .attr('y', yOffset + neuronIndex * cellHeight)
          .attr('width', cellWidth - 4)
          .attr('height', cellHeight - 2)
          .attr('rx', 2)
          .attr('fill', this.colorScale(normalizedActivation))
          .attr('stroke', 'var(--border-color)')
          .attr('stroke-width', 0.5)
          .append('title')
          .text(`Layer ${layerIndex + 1}, Neuron ${neuronIndex + 1}: ${activation.toFixed(4)}`);
      });

      // Add layer label
      const label = layerNames?.[layerIndex] ?? `L${layerIndex + 1}`;
      layerGroup.append('text')
        .attr('x', cellWidth / 2)
        .attr('y', innerHeight + 12)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--text-secondary)')
        .attr('font-size', '8px')
        .text(label);
    });

    // Add colour scale legend
    const legendWidth = 60;
    const legendHeight = 8;
    const legendX = innerWidth - legendWidth;
    const legendY = -15;

    const legendScale = d3.scaleLinear()
      .domain([0, 1])
      .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
      .ticks(3)
      .tickSize(3);

    const legend = g.append('g')
      .attr('transform', `translate(${legendX}, ${legendY})`);

    // Gradient
    const defs = this.svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'activation-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', this.colorScale(0));

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', this.colorScale(1));

    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .attr('fill', 'url(#activation-gradient)');

    legend.append('g')
      .attr('transform', `translate(0, ${legendHeight})`)
      .call(legendAxis)
      .selectAll('text')
      .attr('fill', 'var(--text-muted)')
      .attr('font-size', '6px');

    legend.selectAll('.domain, .tick line')
      .attr('stroke', 'var(--text-muted)');
  }

  /**
   * Clears the heatmap.
   */
  clear(): void {
    this.svg.selectAll('*').remove();
  }
}
