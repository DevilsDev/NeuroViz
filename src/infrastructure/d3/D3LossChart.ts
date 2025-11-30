import * as d3 from 'd3';
import type { TrainingHistory, TrainingRecord } from '../../core/domain';

/**
 * D3.js line chart for visualizing training loss and accuracy over epochs.
 *
 * @remarks
 * - Dual Y-axis: loss (left) and accuracy (right)
 * - Auto-scaling axes based on data range
 * - Smooth line interpolation
 * - Responsive to container size
 */
export class D3LossChart {
  private readonly container: d3.Selection<HTMLElement, unknown, null, undefined>;
  private readonly svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private readonly width: number;
  private readonly height: number;
  private readonly margin = { top: 20, right: 50, bottom: 30, left: 50 };

  private xScale: d3.ScaleLinear<number, number>;
  private yScaleLoss: d3.ScaleLinear<number, number>;
  private yScaleAccuracy: d3.ScaleLinear<number, number>;

  private lossLine: d3.Line<TrainingRecord>;
  private valLossLine: d3.Line<TrainingRecord>;
  private accuracyLine: d3.Line<TrainingRecord>;

  private lossPath: d3.Selection<SVGPathElement, unknown, null, undefined>;
  private valLossPath: d3.Selection<SVGPathElement, unknown, null, undefined>;
  private accuracyPath: d3.Selection<SVGPathElement, unknown, null, undefined>;
  private xAxisGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  private yAxisLossGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  private yAxisAccuracyGroup: d3.Selection<SVGGElement, unknown, null, undefined>;

  /**
   * @param containerId - DOM element ID where the chart will be rendered
   * @param width - Chart width in pixels (default: 400)
   * @param height - Chart height in pixels (default: 200)
   */
  constructor(containerId: string, width = 400, height = 200) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Container element with ID "${containerId}" not found.`);
    }

    this.container = d3.select(element);
    this.width = width - this.margin.left - this.margin.right;
    this.height = height - this.margin.top - this.margin.bottom;

    // Clear any existing content
    this.container.selectAll('*').remove();

    // Create SVG
    const svgElement = this.container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'loss-chart');

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
    this.yScaleLoss = d3.scaleLinear().range([this.height, 0]);
    this.yScaleAccuracy = d3.scaleLinear().domain([0, 1]).range([this.height, 0]);

    // Initialize line generators
    this.lossLine = d3
      .line<TrainingRecord>()
      .x((d) => this.xScale(d.epoch))
      .y((d) => this.yScaleLoss(d.loss))
      .curve(d3.curveMonotoneX);

    this.valLossLine = d3
      .line<TrainingRecord>()
      .defined((d) => d.valLoss !== null)
      .x((d) => this.xScale(d.epoch))
      .y((d) => this.yScaleLoss(d.valLoss ?? 0))
      .curve(d3.curveMonotoneX);

    this.accuracyLine = d3
      .line<TrainingRecord>()
      .x((d) => this.xScale(d.epoch))
      .y((d) => this.yScaleAccuracy(d.accuracy))
      .curve(d3.curveMonotoneX);

    // Create axis groups
    this.xAxisGroup = this.svg
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${this.height})`);

    this.yAxisLossGroup = this.svg.append('g').attr('class', 'y-axis-loss');

    this.yAxisAccuracyGroup = this.svg
      .append('g')
      .attr('class', 'y-axis-accuracy')
      .attr('transform', `translate(${this.width},0)`);

    // Create path elements
    this.lossPath = this.svg
      .append('path')
      .attr('class', 'loss-line')
      .attr('fill', 'none')
      .attr('stroke', '#f97316') // Orange - training loss
      .attr('stroke-width', 2);

    this.valLossPath = this.svg
      .append('path')
      .attr('class', 'val-loss-line')
      .attr('fill', 'none')
      .attr('stroke', '#ef4444') // Red - validation loss
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,2'); // Dashed line

    this.accuracyPath = this.svg
      .append('path')
      .attr('class', 'accuracy-line')
      .attr('fill', 'none')
      .attr('stroke', '#22c55e') // Green
      .attr('stroke-width', 2);

    // Add legend
    this.addLegend();

    // Add axis labels
    this.addAxisLabels();
  }

  /**
   * Updates the chart with new training history data.
   */
  update(history: TrainingHistory): void {
    const records = history.records as TrainingRecord[];

    if (records.length === 0) {
      this.clear();
      return;
    }

    // Update scales - include validation loss in max calculation
    const maxEpoch = d3.max(records, (d) => d.epoch) ?? 1;
    const maxTrainLoss = d3.max(records, (d) => d.loss) ?? 1;
    const maxValLoss = d3.max(records, (d) => d.valLoss ?? 0) ?? 0;
    const maxLoss = Math.max(maxTrainLoss, maxValLoss);

    this.xScale.domain([1, maxEpoch]);
    this.yScaleLoss.domain([0, maxLoss * 1.1]); // 10% padding

    // Update axes
    this.xAxisGroup.call(
      d3.axisBottom(this.xScale).ticks(Math.min(maxEpoch, 10)).tickFormat(d3.format('d'))
    );

    this.yAxisLossGroup.call(d3.axisLeft(this.yScaleLoss).ticks(5).tickFormat(d3.format('.3f')));

    this.yAxisAccuracyGroup.call(
      d3.axisRight(this.yScaleAccuracy).ticks(5).tickFormat(d3.format('.0%'))
    );

    // Update lines
    this.lossPath.datum(records).attr('d', this.lossLine);
    this.valLossPath.datum(records).attr('d', this.valLossLine);
    this.accuracyPath.datum(records).attr('d', this.accuracyLine);
  }

  /**
   * Clears the chart.
   */
  clear(): void {
    this.lossPath.attr('d', null);
    this.valLossPath.attr('d', null);
    this.accuracyPath.attr('d', null);
    this.xScale.domain([1, 10]);
    this.yScaleLoss.domain([0, 1]);
    this.xAxisGroup.call(d3.axisBottom(this.xScale).ticks(5));
    this.yAxisLossGroup.call(d3.axisLeft(this.yScaleLoss).ticks(5));
    this.yAxisAccuracyGroup.call(d3.axisRight(this.yScaleAccuracy).ticks(5));
  }

  /**
   * Disposes of all SVG elements.
   */
  dispose(): void {
    this.container.selectAll('*').remove();
  }

  private addLegend(): void {
    const legend = this.svg
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${this.width - 80}, -5)`);

    // Training Loss legend
    legend
      .append('line')
      .attr('x1', 0)
      .attr('x2', 20)
      .attr('y1', 0)
      .attr('y2', 0)
      .attr('stroke', '#f97316')
      .attr('stroke-width', 2);

    legend
      .append('text')
      .attr('x', 25)
      .attr('y', 4)
      .attr('class', 'legend-text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '9px')
      .text('Train');

    // Validation Loss legend
    legend
      .append('line')
      .attr('x1', 0)
      .attr('x2', 20)
      .attr('y1', 12)
      .attr('y2', 12)
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,2');

    legend
      .append('text')
      .attr('x', 25)
      .attr('y', 16)
      .attr('class', 'legend-text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '9px')
      .text('Val');

    // Accuracy legend
    legend
      .append('line')
      .attr('x1', 0)
      .attr('x2', 20)
      .attr('y1', 24)
      .attr('y2', 24)
      .attr('stroke', '#22c55e')
      .attr('stroke-width', 2);

    legend
      .append('text')
      .attr('x', 25)
      .attr('y', 28)
      .attr('class', 'legend-text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '9px')
      .text('Acc');
  }

  private addAxisLabels(): void {
    // X-axis label
    this.svg
      .append('text')
      .attr('class', 'axis-label')
      .attr('x', this.width / 2)
      .attr('y', this.height + 25)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .attr('font-size', '10px')
      .text('Epoch');

    // Y-axis label (Loss)
    this.svg
      .append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -this.height / 2)
      .attr('y', -35)
      .attr('text-anchor', 'middle')
      .attr('fill', '#f97316')
      .attr('font-size', '10px')
      .text('Loss');

    // Y-axis label (Accuracy)
    this.svg
      .append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(90)')
      .attr('x', this.height / 2)
      .attr('y', -this.width - 35)
      .attr('text-anchor', 'middle')
      .attr('fill', '#22c55e')
      .attr('font-size', '10px')
      .text('Accuracy');
  }
}
