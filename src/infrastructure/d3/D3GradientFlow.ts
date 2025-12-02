/**
 * D3 Gradient Flow Visualization
 * 
 * Visualizes gradient magnitudes flowing through the network during backpropagation.
 * Shows which connections are learning the most.
 */

import * as d3 from 'd3';

export interface GradientData {
  /** Gradient magnitudes per layer [layer][neuron] */
  layerGradients: number[][];
  /** Layer names */
  layerNames: string[];
  /** Max gradient value for scaling */
  maxGradient: number;
}

/**
 * Renders gradient flow visualization as animated bars.
 */
export class D3GradientFlow {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private width: number;
  private height: number;
  private margin = { top: 20, right: 20, bottom: 30, left: 40 };

  constructor(container: HTMLElement) {
    // Clear existing content
    d3.select(container).selectAll('*').remove();

    const rect = container.getBoundingClientRect();
    this.width = rect.width || 300;
    this.height = rect.height || 150;

    this.svg = d3.select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${this.width} ${this.height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('class', 'gradient-flow-chart');
  }

  /**
   * Renders the gradient flow visualization.
   */
  render(data: GradientData): void {
    const { layerGradients, layerNames, maxGradient } = data;
    
    if (layerGradients.length === 0) return;

    const innerWidth = this.width - this.margin.left - this.margin.right;
    const innerHeight = this.height - this.margin.top - this.margin.bottom;

    // Clear previous content
    this.svg.selectAll('*').remove();

    const g = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // X scale for layers
    const xScale = d3.scaleBand()
      .domain(layerNames)
      .range([0, innerWidth])
      .padding(0.2);

    // Y scale for gradient magnitude
    const yScale = d3.scaleLinear()
      .domain([0, maxGradient > 0 ? maxGradient : 1])
      .range([innerHeight, 0]);

    // Color scale (blue = low, red = high)
    const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
      .domain([0, maxGradient > 0 ? maxGradient : 1]);

    // Draw bars for each layer
    layerGradients.forEach((gradients, layerIdx) => {
      const layerName = layerNames[layerIdx] ?? `L${layerIdx}`;
      const barWidth = (xScale.bandwidth() ?? 20) / Math.max(gradients.length, 1);
      const xOffset = xScale(layerName) ?? 0;

      gradients.forEach((grad, neuronIdx) => {
        const x = xOffset + neuronIdx * barWidth;
        const barHeight = innerHeight - yScale(grad);

        // Bar
        g.append('rect')
          .attr('x', x)
          .attr('y', yScale(grad))
          .attr('width', Math.max(barWidth - 1, 2))
          .attr('height', barHeight)
          .attr('fill', colorScale(grad))
          .attr('opacity', 0.8)
          .attr('rx', 1);

        // Animated pulse for high gradients
        if (grad > maxGradient * 0.7) {
          g.append('rect')
            .attr('x', x)
            .attr('y', yScale(grad))
            .attr('width', Math.max(barWidth - 1, 2))
            .attr('height', barHeight)
            .attr('fill', 'none')
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .attr('opacity', 0)
            .attr('rx', 1)
            .transition()
            .duration(500)
            .attr('opacity', 0.5)
            .transition()
            .duration(500)
            .attr('opacity', 0);
        }
      });
    });

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px');

    // Y axis
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(4).tickFormat(d3.format('.2f')))
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px');

    // Title
    this.svg.append('text')
      .attr('x', this.width / 2)
      .attr('y', 12)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .text('Gradient Magnitudes by Layer');

    // Legend
    const legendWidth = 80;
    const legendHeight = 10;
    const legendX = this.width - legendWidth - 10;
    const legendY = 5;

    // Gradient bar
    const defs = this.svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'gradient-legend')
      .attr('x1', '0%')
      .attr('x2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', colorScale(0));
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', colorScale(maxGradient));

    this.svg.append('rect')
      .attr('x', legendX)
      .attr('y', legendY)
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .attr('fill', 'url(#gradient-legend)')
      .attr('rx', 2);
  }

  /**
   * Clears the visualization.
   */
  clear(): void {
    this.svg.selectAll('*').remove();
  }
}

/**
 * Simulates gradient data from weight changes between epochs.
 * In a real implementation, this would come from TensorFlow.js gradient tapes.
 */
export function estimateGradients(
  previousWeights: number[][][],
  currentWeights: number[][][],
  learningRate: number
): GradientData {
  const layerGradients: number[][] = [];
  let maxGradient = 0;

  for (let layer = 0; layer < currentWeights.length; layer++) {
    const prevLayer = previousWeights[layer] ?? [];
    const currLayer = currentWeights[layer] ?? [];
    const gradients: number[] = [];

    // Calculate gradient magnitude for each output neuron
    const numOutputs = currLayer[0]?.length ?? 0;
    for (let out = 0; out < numOutputs; out++) {
      let sumSquaredDiff = 0;
      const numInputs = currLayer.length;
      
      for (let inp = 0; inp < numInputs; inp++) {
        const prev = prevLayer[inp]?.[out] ?? 0;
        const curr = currLayer[inp]?.[out] ?? 0;
        const diff = (curr - prev) / learningRate; // Approximate gradient
        sumSquaredDiff += diff * diff;
      }
      
      const gradMagnitude = Math.sqrt(sumSquaredDiff / numInputs);
      gradients.push(gradMagnitude);
      maxGradient = Math.max(maxGradient, gradMagnitude);
    }

    layerGradients.push(gradients);
  }

  const layerNames = layerGradients.map((_, i) => 
    i === 0 ? 'Input→H1' : 
    i === layerGradients.length - 1 ? `H${i}→Out` : 
    `H${i}→H${i + 1}`
  );

  return { layerGradients, layerNames, maxGradient };
}
