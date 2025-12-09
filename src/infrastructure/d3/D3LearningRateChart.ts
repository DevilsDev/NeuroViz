import * as d3 from 'd3';
import type { TrainingHistory, TrainingRecord } from '../../core/domain';

/**
 * D3.js line chart for visualizing learning rate changes over epochs.
 *
 * @remarks
 * - Shows LR evolution during training
 * - Supports static and scheduled learning rates
 * - Auto-scaling based on LR range
 * - Responsive to container size
 * - Compact design for dashboard integration
 */
export class D3LearningRateChart {
  private readonly container: d3.Selection<HTMLElement, unknown, null, undefined>;
  private readonly svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private width: number;
  private height: number;
  private readonly margin = { top: 15, right: 40, bottom: 25, left: 45 };

  private xScale: d3.ScaleLinear<number, number>;
  private yScale: d3.ScaleLinear<number, number>;

  private lrLine: d3.Line<TrainingRecord>;
  private lrPath: d3.Selection<SVGPathElement, unknown, null, undefined>;
  private xAxisGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  private yAxisGroup: d3.Selection<SVGGElement, unknown, null, undefined>;

  /**
   * @param containerId - DOM element ID where the chart will be rendered
   */
  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Container element with ID "${containerId}" not found.`);
    }

    this.container = d3.select(element);

    // Get actual container dimensions
    const rect = element.getBoundingClientRect();
    const containerWidth = rect.width || 400;
    const containerHeight = rect.height || 120;

    this.width = containerWidth - this.margin.left - this.margin.right;
    this.height = containerHeight - this.margin.top - this.margin.bottom;

    // Clear any existing content
    this.container.selectAll('*').remove();

    // Create responsive SVG that fills container
    const svgElement = this.container
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${containerWidth} ${containerHeight}`)
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('class', 'lr-chart');

    this.svg = svgElement
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`) as unknown as d3.Selection<
        SVGSVGElement,
        unknown,
        null,
        undefined
      >;

    // Initialize scales
    this.xScale = d3.scaleLinear().range([0, this.width]);
    this.yScale = d3.scaleLinear().range([this.height, 0]);

    // Initialize line generator
    this.lrLine = d3
      .line<TrainingRecord>()
      .x((d) => this.xScale(d.epoch))
      .y((d) => this.yScale(d.learningRate))
      .curve(d3.curveMonotoneX);

    // Create axis groups
    this.xAxisGroup = this.svg
      .append('g')
      .attr('transform', `translate(0,${this.height})`)
      .attr('class', 'x-axis');

    this.yAxisGroup = this.svg
      .append('g')
      .attr('class', 'y-axis');

    // Create path for learning rate line
    this.lrPath = this.svg
      .append('path')
      .attr('class', 'lr-line')
      .attr('fill', 'none')
      .attr('stroke', '#10b981') // Emerald-500 for LR
      .attr('stroke-width', 2);

    // Add axis labels
    this.svg
      .append('text')
      .attr('class', 'axis-label')
      .attr('x', this.width / 2)
      .attr('y', this.height + this.margin.bottom - 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8') // Slate-400
      .style('font-size', '10px')
      .text('Epoch');

    this.svg
      .append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -this.height / 2)
      .attr('y', -this.margin.left + 12)
      .attr('text-anchor', 'middle')
      .attr('fill', '#10b981') // Emerald-500
      .style('font-size', '10px')
      .text('Learning Rate');
  }

  /**
   * Updates the chart with new training history.
   */
  render(history: TrainingHistory): void {
    const records = history.records;

    if (records.length === 0) {
      this.clear();
      return;
    }

    // Update x scale domain
    const maxEpoch = d3.max(records, (d) => d.epoch) ?? 1;
    this.xScale.domain([0, maxEpoch]);

    // Update y scale domain with padding
    const minLR = d3.min(records, (d) => d.learningRate) ?? 0;
    const maxLR = d3.max(records, (d) => d.learningRate) ?? 0.1;
    const lrPadding = (maxLR - minLR) * 0.1 || 0.01;
    this.yScale.domain([Math.max(0, minLR - lrPadding), maxLR + lrPadding]);

    // Update axes
    const xAxis = d3.axisBottom(this.xScale).ticks(Math.min(5, maxEpoch)).tickFormat(d3.format('d'));
    const yAxis = d3.axisLeft(this.yScale).ticks(4).tickFormat(d3.format('.4f'));

    this.xAxisGroup
      .transition()
      .duration(300)
      .call(xAxis as any)
      .selectAll('text')
      .attr('fill', '#94a3b8') // Slate-400
      .style('font-size', '10px');

    this.yAxisGroup
      .transition()
      .duration(300)
      .call(yAxis as any)
      .selectAll('text')
      .attr('fill', '#10b981') // Emerald-500
      .style('font-size', '10px');

    // Update learning rate line
    this.lrPath
      .datum(records)
      .transition()
      .duration(300)
      .attr('d', this.lrLine);
  }

  /**
   * Clears all rendered content.
   */
  clear(): void {
    this.lrPath.attr('d', null);
    this.xAxisGroup.selectAll('*').remove();
    this.yAxisGroup.selectAll('*').remove();
  }

  /**
   * Disposes of the chart and cleans up resources.
   */
  dispose(): void {
    this.container.selectAll('*').remove();
  }
}
