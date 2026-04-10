import * as d3 from 'd3';
import type { TrainingHistory, TrainingRecord } from '../../core/domain';

/**
 * D3.js line chart for visualizing training accuracy over epochs.
 *
 * Layout structure (margin convention):
 *   - Left margin (45px): accuracy tick labels (0%–100%)
 *   - Right margin (10px): minimal breathing room
 *   - Top margin (8px): breathing room
 *   - Bottom margin (20px): epoch axis ticks
 */
/** Reads a CSS custom property from the document root. */
function themeColor(prop: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(prop).trim() || fallback;
}

export class D3AccuracyChart {
  private readonly container: d3.Selection<HTMLElement, unknown, null, undefined>;
  private readonly svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private width: number;
  private height: number;
  private readonly margin = { top: 8, right: 10, bottom: 20, left: 45 };

  private xScale: d3.ScaleLinear<number, number>;
  private yScale: d3.ScaleLinear<number, number>;

  private accuracyLine: d3.Line<TrainingRecord>;
  private accuracyPath: d3.Selection<SVGPathElement, unknown, null, undefined>;
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
      .attr('class', 'accuracy-chart');

    this.svg = svgElement
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`) as unknown as d3.Selection<
        SVGSVGElement, unknown, null, undefined
      >;

    // Scales
    this.xScale = d3.scaleLinear().range([0, this.width]);
    this.yScale = d3.scaleLinear().domain([0, 1]).range([this.height, 0]);

    // Line generator
    this.accuracyLine = d3.line<TrainingRecord>()
      .x(d => this.xScale(d.epoch))
      .y(d => this.yScale(d.accuracy))
      .curve(d3.curveMonotoneX);

    // Axis groups
    this.xAxisGroup = this.svg.append('g')
      .attr('transform', `translate(0,${this.height})`)
      .attr('class', 'x-axis');

    this.yAxisGroup = this.svg.append('g')
      .attr('class', 'y-axis');

    // Accuracy line
    this.accuracyPath = this.svg.append('path')
      .attr('class', 'accuracy-line')
      .attr('fill', 'none')
      .attr('stroke', '#10B981')
      .attr('stroke-width', 1.5);

    // Compact label
    this.svg.append('text')
      .attr('class', 'chart-label')
      .attr('x', 4)
      .attr('y', 10)
      .attr('fill', '#10B981')
      .style('font-size', '9px')
      .style('font-weight', '600')
      .text('Acc');
  }

  update(history: TrainingHistory): void {
    const records = history.records as TrainingRecord[];

    if (records.length === 0) {
      this.clear();
      return;
    }

    const maxEpoch = d3.max(records, d => d.epoch) ?? 1;
    this.xScale.domain([1, maxEpoch]);

    // Axes
    const xAxis = d3.axisBottom(this.xScale)
      .ticks(Math.min(5, maxEpoch))
      .tickFormat(d3.format('d'))
      .tickSize(3);

    const yAxis = d3.axisLeft(this.yScale)
      .ticks(4)
      .tickFormat(d3.format('.0%'))
      .tickSize(3);

    const tickText = themeColor('--chart-tick-text', '#94a3b8');
    const tickLine = themeColor('--chart-tick-line', '#475569');
    const domainColor = themeColor('--chart-domain', '#334155');

    this.xAxisGroup
      .transition().duration(200)
      .call(xAxis as d3.Axis<d3.NumberValue>);
    this.xAxisGroup.selectAll('text').attr('fill', tickText).style('font-size', '9px');
    this.xAxisGroup.selectAll('line').attr('stroke', tickLine);
    this.xAxisGroup.select('.domain').attr('stroke', domainColor);

    this.yAxisGroup
      .transition().duration(200)
      .call(yAxis as d3.Axis<d3.NumberValue>);
    this.yAxisGroup.selectAll('text').attr('fill', '#10B981').style('font-size', '9px');
    this.yAxisGroup.selectAll('line').attr('stroke', tickLine);
    this.yAxisGroup.select('.domain').attr('stroke', domainColor);

    // Update line
    this.accuracyPath
      .datum(records)
      .transition().duration(200)
      .attr('d', this.accuracyLine);
  }

  clear(): void {
    this.accuracyPath.attr('d', null);
    this.xAxisGroup.selectAll('*').remove();
    this.yAxisGroup.selectAll('*').remove();
  }

  dispose(): void {
    this.container.selectAll('*').remove();
  }
}
