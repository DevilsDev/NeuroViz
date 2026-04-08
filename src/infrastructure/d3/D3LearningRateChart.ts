import * as d3 from 'd3';
import type { TrainingHistory, TrainingRecord } from '../../core/domain';

/**
 * D3.js line chart for visualizing learning rate changes over epochs.
 *
 * Layout structure (margin convention):
 *   - Left margin (45px): LR tick labels
 *   - Right margin (10px): minimal breathing room
 *   - Top margin (8px): breathing room
 *   - Bottom margin (20px): epoch axis ticks
 *
 * Tick formatting uses dynamic precision based on the LR data range:
 *   - Large range (>0.01): 3 significant digits (e.g., 0.03, 0.1)
 *   - Small range: up to 4 digits, but trims trailing zeros
 *   - Uses d3.format('~g') for clean automatic formatting
 */
export class D3LearningRateChart {
  private readonly container: d3.Selection<HTMLElement, unknown, null, undefined>;
  private readonly svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private width: number;
  private height: number;
  private readonly margin = { top: 8, right: 10, bottom: 20, left: 45 };

  private xScale: d3.ScaleLinear<number, number>;
  private yScale: d3.ScaleLinear<number, number>;

  private lrLine: d3.Line<TrainingRecord>;
  private lrPath: d3.Selection<SVGPathElement, unknown, null, undefined>;
  private xAxisGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  private yAxisGroup: d3.Selection<SVGGElement, unknown, null, undefined>;

  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Container element with ID "${containerId}" not found.`);
    }

    this.container = d3.select(element);

    const rect = element.getBoundingClientRect();
    const containerWidth = Math.max(rect.width || 400, this.margin.left + this.margin.right + 50);
    const containerHeight = Math.max(rect.height || 120, this.margin.top + this.margin.bottom + 20);

    this.width = Math.max(0, containerWidth - this.margin.left - this.margin.right);
    this.height = Math.max(0, containerHeight - this.margin.top - this.margin.bottom);

    this.container.selectAll('*').remove();

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
        SVGSVGElement, unknown, null, undefined
      >;

    // Scales
    this.xScale = d3.scaleLinear().range([0, this.width]);
    this.yScale = d3.scaleLinear().range([this.height, 0]);

    // Line generator
    this.lrLine = d3.line<TrainingRecord>()
      .x(d => this.xScale(d.epoch))
      .y(d => this.yScale(d.learningRate))
      .curve(d3.curveMonotoneX);

    // Axis groups
    this.xAxisGroup = this.svg.append('g')
      .attr('transform', `translate(0,${this.height})`)
      .attr('class', 'x-axis');

    this.yAxisGroup = this.svg.append('g')
      .attr('class', 'y-axis');

    // LR line
    this.lrPath = this.svg.append('path')
      .attr('class', 'lr-line')
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 1.5);

    // Compact label: "LR" top-left inside plot area (replaces verbose rotated axis label)
    this.svg.append('text')
      .attr('class', 'chart-label')
      .attr('x', 4)
      .attr('y', 10)
      .attr('fill', '#10b981')
      .style('font-size', '9px')
      .style('font-weight', '600')
      .text('LR');
  }

  /**
   * Formats LR tick values with dynamic precision.
   * Avoids over-precise values like 0.0400 — uses ~g for clean output.
   */
  private formatLR(value: d3.NumberValue): string {
    const v = +value;
    if (v === 0) return '0';
    // Use ~g to auto-trim trailing zeros. 3 significant digits is clean.
    return d3.format('.3~g')(v);
  }

  render(history: TrainingHistory): void {
    const records = history.records;

    if (records.length === 0) {
      this.clear();
      return;
    }

    const maxEpoch = d3.max(records, d => d.epoch) ?? 1;
    this.xScale.domain([0, maxEpoch]);

    const minLR = d3.min(records, d => d.learningRate) ?? 0;
    const maxLR = d3.max(records, d => d.learningRate) ?? 0.1;
    const lrPadding = (maxLR - minLR) * 0.1 || 0.005;
    this.yScale.domain([Math.max(0, minLR - lrPadding), maxLR + lrPadding]);

    // Axes with clean formatting
    const xAxis = d3.axisBottom(this.xScale)
      .ticks(Math.min(5, maxEpoch))
      .tickFormat(d3.format('d'))
      .tickSize(3);

    const yAxis = d3.axisLeft(this.yScale)
      .ticks(3)
      .tickFormat(v => this.formatLR(v))
      .tickSize(3);

    // Apply with consistent styling across all charts
    this.xAxisGroup
      .transition().duration(200)
      .call(xAxis as d3.Axis<d3.NumberValue>);
    this.xAxisGroup.selectAll('text').attr('fill', '#94a3b8').style('font-size', '9px');
    this.xAxisGroup.selectAll('line').attr('stroke', '#475569');
    this.xAxisGroup.select('.domain').attr('stroke', '#334155');

    this.yAxisGroup
      .transition().duration(200)
      .call(yAxis as d3.Axis<d3.NumberValue>);
    this.yAxisGroup.selectAll('text').attr('fill', '#10b981').style('font-size', '9px');
    this.yAxisGroup.selectAll('line').attr('stroke', '#475569');
    this.yAxisGroup.select('.domain').attr('stroke', '#334155');

    // Update line
    this.lrPath
      .datum(records)
      .transition().duration(200)
      .attr('d', this.lrLine);
  }

  clear(): void {
    this.lrPath.attr('d', null);
    this.xAxisGroup.selectAll('*').remove();
    this.yAxisGroup.selectAll('*').remove();
  }

  dispose(): void {
    this.container.selectAll('*').remove();
  }
}
