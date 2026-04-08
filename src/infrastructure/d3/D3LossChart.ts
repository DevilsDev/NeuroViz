import * as d3 from 'd3';
import type { TrainingHistory, TrainingRecord } from '../../core/domain';

/**
 * D3.js line chart for visualizing training loss and accuracy over epochs.
 *
 * Layout structure (margin convention):
 *   - Left margin (45px): loss axis ticks
 *   - Right margin (40px): accuracy axis ticks
 *   - Top margin (8px): breathing room
 *   - Bottom margin (20px): epoch axis ticks
 *   - Legend: top-left inside the plot area, avoids axis collision
 *
 * The right "Accuracy" rotated label is removed — the legend and
 * color-coded ticks provide sufficient context without overlap.
 */
export class D3LossChart {
  private readonly container: d3.Selection<HTMLElement, unknown, null, undefined>;
  private readonly svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private width: number;
  private height: number;

  // Margins: balanced to avoid annotation collisions
  private readonly margin = { top: 8, right: 40, bottom: 20, left: 45 };

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
  private resizeObserver: ResizeObserver | null = null;

  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Container element with ID "${containerId}" not found.`);
    }

    this.container = d3.select(element);

    const rect = element.getBoundingClientRect();
    const containerWidth = rect.width || 600;
    const containerHeight = rect.height || 150;

    this.width = containerWidth - this.margin.left - this.margin.right;
    this.height = containerHeight - this.margin.top - this.margin.bottom;

    this.container.selectAll('*').remove();

    const svgElement = this.container
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${containerWidth} ${containerHeight}`)
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('class', 'loss-chart');

    this.svg = svgElement
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`) as unknown as d3.Selection<
        SVGSVGElement, unknown, null, undefined
      >;

    // Scales
    this.xScale = d3.scaleLinear().range([0, this.width]);
    this.yScaleLoss = d3.scaleLinear().range([this.height, 0]);
    this.yScaleAccuracy = d3.scaleLinear().domain([0, 1]).range([this.height, 0]);

    // Line generators
    this.lossLine = d3.line<TrainingRecord>()
      .x(d => this.xScale(d.epoch))
      .y(d => this.yScaleLoss(d.loss))
      .curve(d3.curveMonotoneX);

    this.valLossLine = d3.line<TrainingRecord>()
      .defined(d => d.valLoss !== null)
      .x(d => this.xScale(d.epoch))
      .y(d => this.yScaleLoss(d.valLoss ?? 0))
      .curve(d3.curveMonotoneX);

    this.accuracyLine = d3.line<TrainingRecord>()
      .x(d => this.xScale(d.epoch))
      .y(d => this.yScaleAccuracy(d.accuracy))
      .curve(d3.curveMonotoneX);

    // Grid (behind data)
    this.svg.append('g').attr('class', 'grid-lines');

    // Axis groups
    this.xAxisGroup = this.svg.append('g')
      .attr('class', 'x-axis axis')
      .attr('transform', `translate(0,${this.height})`);

    this.yAxisLossGroup = this.svg.append('g').attr('class', 'y-axis-loss axis');

    this.yAxisAccuracyGroup = this.svg.append('g')
      .attr('class', 'y-axis-accuracy axis')
      .attr('transform', `translate(${this.width},0)`);

    // Data paths
    this.lossPath = this.svg.append('path')
      .attr('class', 'loss-line')
      .attr('fill', 'none')
      .attr('stroke', '#00D9FF')
      .attr('stroke-width', 1.5);

    this.valLossPath = this.svg.append('path')
      .attr('class', 'val-loss-line')
      .attr('fill', 'none')
      .attr('stroke', '#FF00AA')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,2');

    this.accuracyPath = this.svg.append('path')
      .attr('class', 'accuracy-line')
      .attr('fill', 'none')
      .attr('stroke', '#10B981')
      .attr('stroke-width', 1.5);

    // Legend — top-left inside plot area to avoid right-axis collision
    this.addLegend();

    // Resize observer
    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.contentRect) {
          this.resize(entry.contentRect.width, entry.contentRect.height);
        }
      }
    });
    this.resizeObserver.observe(element);

    this.clear();
  }

  resize(width: number, height: number): void {
    const minWidth = this.margin.left + this.margin.right + 50;
    const minHeight = this.margin.top + this.margin.bottom + 20;
    if (width < minWidth || height < minHeight) return;

    this.width = Math.max(0, width - this.margin.left - this.margin.right);
    this.height = Math.max(0, height - this.margin.top - this.margin.bottom);

    this.container.select('svg').attr('viewBox', `0 0 ${width} ${height}`);

    this.xScale.range([0, this.width]);
    this.yScaleLoss.range([this.height, 0]);
    this.yScaleAccuracy.range([this.height, 0]);

    this.updateGrid();

    this.svg.select<SVGGElement>('.x-axis')
      .attr('transform', `translate(0,${this.height})`)
      .call(d3.axisBottom(this.xScale).ticks(5).tickFormat(d3.format('d')));

    this.svg.select<SVGGElement>('.y-axis-loss')
      .call(d3.axisLeft(this.yScaleLoss).ticks(4).tickFormat(d3.format('.2f')));

    this.svg.select<SVGGElement>('.y-axis-accuracy')
      .attr('transform', `translate(${this.width},0)`)
      .call(d3.axisRight(this.yScaleAccuracy).ticks(4).tickFormat(d3.format('.0%')));

    // Re-render lines if data exists
    const currentData = this.lossPath.datum() as TrainingRecord[];
    if (currentData && currentData.length > 0) {
      this.lossPath.attr('d', this.lossLine as unknown as string);
      this.valLossPath.attr('d', this.valLossLine as unknown as string);
      this.accuracyPath.attr('d', this.accuracyLine as unknown as string);
    }
  }

  update(history: TrainingHistory): void {
    const records = history.records as TrainingRecord[];

    if (records.length === 0) {
      this.clear();
      return;
    }

    // Show axes
    this.svg.selectAll('.axis').style('opacity', 1);
    this.svg.selectAll('.grid-lines').style('opacity', 1);

    // Update scales
    const maxEpoch = d3.max(records, d => d.epoch) ?? 1;
    const maxTrainLoss = d3.max(records, d => d.loss) ?? 1;
    const maxValLoss = d3.max(records, d => d.valLoss ?? 0) ?? 0;
    const maxLoss = Math.max(maxTrainLoss, maxValLoss);

    this.xScale.domain([1, maxEpoch]);
    this.yScaleLoss.domain([0, maxLoss * 1.1]);

    this.updateGrid();

    // Update axes with reduced tick counts for compact chart
    this.xAxisGroup.call(
      d3.axisBottom(this.xScale).ticks(Math.min(maxEpoch, 8)).tickFormat(d3.format('d'))
    );

    this.yAxisLossGroup.call(
      d3.axisLeft(this.yScaleLoss).ticks(4).tickFormat(d3.format('.2f'))
    );

    this.yAxisAccuracyGroup.call(
      d3.axisRight(this.yScaleAccuracy).ticks(4).tickFormat(d3.format('.0%'))
    );

    // Update lines
    this.lossPath.datum(records).attr('d', this.lossLine);
    this.valLossPath.datum(records).attr('d', this.valLossLine);
    this.accuracyPath.datum(records).attr('d', this.accuracyLine);
  }

  clear(): void {
    this.lossPath.attr('d', null);
    this.valLossPath.attr('d', null);
    this.accuracyPath.attr('d', null);
    this.svg.selectAll('.axis').style('opacity', 0);
    this.svg.selectAll('.grid-lines').style('opacity', 0);
  }

  dispose(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.container.selectAll('*').remove();
  }

  private updateGrid(): void {
    const gridContext = this.svg.select<SVGGElement>('.grid-lines');
    gridContext.selectAll('*').remove();

    gridContext.call(
      d3.axisLeft(this.yScaleLoss)
        .ticks(4)
        .tickSize(-this.width)
        .tickFormat(() => '') as unknown as (selection: d3.Selection<SVGGElement, unknown, null, undefined>) => void
    );

    gridContext.selectAll('.tick line')
      .attr('stroke', 'rgba(255, 255, 255, 0.05)')
      .attr('stroke-dasharray', '2,2');
    gridContext.select('.domain').remove();
  }

  /**
   * Legend: positioned top-left inside the plot area.
   * This avoids collision with the right-side accuracy axis ticks.
   * Uses compact inline layout: colored line + label, stacked vertically.
   */
  private addLegend(): void {
    const legend = this.svg.append('g')
      .attr('class', 'legend')
      .attr('transform', 'translate(4, 2)'); // top-left inside plot

    const items = [
      { color: '#00D9FF', label: 'Loss', dash: '' },
      { color: '#FF00AA', label: 'Val', dash: '4,2' },
      { color: '#10B981', label: 'Acc', dash: '' },
    ];

    items.forEach((item, i) => {
      const g = legend.append('g')
        .attr('transform', `translate(${i * 50}, 0)`); // horizontal layout

      g.append('line')
        .attr('x1', 0).attr('x2', 14)
        .attr('y1', 0).attr('y2', 0)
        .attr('stroke', item.color)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', item.dash);

      g.append('text')
        .attr('x', 17).attr('y', 3)
        .attr('fill', '#94a3b8')
        .style('font-size', '9px')
        .text(item.label);
    });
  }
}
