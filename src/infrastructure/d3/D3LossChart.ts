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
  private width: number;
  private height: number;
  private readonly margin = { top: 20, right: 70, bottom: 30, left: 50 };

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
   */
  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Container element with ID "${containerId}" not found.`);
    }

    this.container = d3.select(element);
    
    // Get actual container dimensions
    const rect = element.getBoundingClientRect();
    const containerWidth = rect.width || 600;
    const containerHeight = rect.height || 150;
    
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
      .attr('class', 'x-axis axis')
      .attr('transform', `translate(0,${this.height})`);

    this.yAxisLossGroup = this.svg.append('g').attr('class', 'y-axis-loss axis');

    this.yAxisAccuracyGroup = this.svg
      .append('g')
      .attr('class', 'y-axis-accuracy axis')
      .attr('transform', `translate(${this.width},0)`);

    // Add Grid Lines Group (behind data)
    this.svg.append('g').attr('class', 'grid-lines');

    // Create path elements
    this.lossPath = this.svg
      .append('path')
      .attr('class', 'loss-line')
      .attr('fill', 'none')
      .attr('stroke', '#00D9FF') // Cyan - training loss (wireframe)
      .attr('stroke-width', 2);

    this.valLossPath = this.svg
      .append('path')
      .attr('class', 'val-loss-line')
      .attr('fill', 'none')
      .attr('stroke', '#FF00AA') // Magenta - validation loss (wireframe)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,2'); // Dashed line

    this.accuracyPath = this.svg
      .append('path')
      .attr('class', 'accuracy-line')
      .attr('fill', 'none')
      .attr('stroke', '#10B981') // Green - accuracy (wireframe)
      .attr('stroke-width', 2);

    // Add legend
    this.addLegend();

    // Add axis labels
    this.addAxisLabels();

    // Setup resize observer
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          this.resize(entry.contentRect.width, entry.contentRect.height);
        }
      }
    });
    this.resizeObserver.observe(element);

    // Initial clear to set empty state styling
    this.clear();
  }

  /**
   * Resizes the chart to fit the new container dimensions.
   */
  resize(width: number, height: number): void {
    // Guard against invalid dimensions
    const minWidth = this.margin.left + this.margin.right + 50;
    const minHeight = this.margin.top + this.margin.bottom + 20;
    if (width < minWidth || height < minHeight) return;

    // Update dimensions
    this.width = Math.max(0, width - this.margin.left - this.margin.right);
    this.height = Math.max(0, height - this.margin.top - this.margin.bottom);

    // Update SVG viewBox (select the actual SVG element, not the inner g)
    this.container.select('svg').attr('viewBox', `0 0 ${width} ${height}`);

    // Update scales
    this.xScale.range([0, this.width]);
    this.yScaleLoss.range([this.height, 0]);
    this.yScaleAccuracy.range([this.height, 0]);

    // Update Grid
    this.updateGrid();

    // Update axes
    this.svg.select<SVGGElement>('.x-axis')
      .attr('transform', `translate(0,${this.height})`)
      .call(d3.axisBottom(this.xScale).ticks(5).tickFormat(d3.format('d')));

    this.svg.select<SVGGElement>('.y-axis-loss')
      .call(d3.axisLeft(this.yScaleLoss).ticks(5).tickFormat(d3.format('.2f')));

    this.svg.select<SVGGElement>('.y-axis-accuracy')
      .attr('transform', `translate(${this.width},0)`)
      .call(d3.axisRight(this.yScaleAccuracy).ticks(5).tickFormat(d3.format('.0%')));

    // Update legend position (in right margin area)
    this.svg.select('.legend')
      .attr('transform', `translate(${this.width + 10}, 5)`);

    // Update axis labels positions
    this.svg.selectAll('.axis-label').remove();
    this.addAxisLabels();

    // Re-render lines if data exists
    const currentData = this.lossPath.datum() as TrainingRecord[];
    if (currentData && currentData.length > 0) {
      this.lossPath.attr('d', this.lossLine as unknown as string);
      this.valLossPath.attr('d', this.valLossLine as unknown as string);
      this.accuracyPath.attr('d', this.accuracyLine as unknown as string);
    }
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

    // Show axes and labels
    this.svg.selectAll('.axis').style('opacity', 1);
    this.svg.selectAll('.axis-label').style('opacity', 1);
    this.svg.selectAll('.grid-lines').style('opacity', 1);

    // Update scales - include validation loss in max calculation
    const maxEpoch = d3.max(records, (d) => d.epoch) ?? 1;
    const maxTrainLoss = d3.max(records, (d) => d.loss) ?? 1;
    const maxValLoss = d3.max(records, (d) => d.valLoss ?? 0) ?? 0;
    const maxLoss = Math.max(maxTrainLoss, maxValLoss);

    this.xScale.domain([1, maxEpoch]);
    this.yScaleLoss.domain([0, maxLoss * 1.1]); // 10% padding

    // Update Grid
    this.updateGrid();

    // Update axes
    this.xAxisGroup.call(
      d3.axisBottom(this.xScale).ticks(Math.min(maxEpoch, 10)).tickFormat(d3.format('d'))
    );

    this.yAxisLossGroup.call(d3.axisLeft(this.yScaleLoss).ticks(5).tickFormat(d3.format('.2f')));

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

    // Hide axes and grid in empty state for cleaner look
    this.svg.selectAll('.axis').style('opacity', 0);
    this.svg.selectAll('.axis-label').style('opacity', 0);
    this.svg.selectAll('.grid-lines').style('opacity', 0);
  }

  // Resize observer
  private resizeObserver: ResizeObserver | null = null;

  /**
   * Disposes of all SVG elements.
   */
  dispose(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.container.selectAll('*').remove();
  }

  private updateGrid(): void {
    const gridContext = this.svg.select<SVGGElement>('.grid-lines');

    // Remove old grid
    gridContext.selectAll('*').remove();

    // Add Y-axis grid lines
    gridContext.call(
      d3.axisLeft(this.yScaleLoss)
        .ticks(5)
        .tickSize(-this.width)
        .tickFormat(() => '') as unknown as (selection: d3.Selection<SVGGElement, unknown, null, undefined>) => void
    );

    // Style grid lines
    gridContext.selectAll('.tick line')
      .attr('stroke', 'rgba(255, 255, 255, 0.05)')
      .attr('stroke-dasharray', '2,2');

    gridContext.select('.domain').remove(); // Remove outer border
  }

  private addLegend(): void {
    // Position legend in the top-right corner, inside the margin area
    const legend = this.svg
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${this.width + 10}, 5)`);

    // Training Loss legend
    legend
      .append('line')
      .attr('x1', 0)
      .attr('x2', 20)
      .attr('y1', 0)
      .attr('y2', 0)
      .attr('stroke', '#00D9FF')
      .attr('stroke-width', 2);

    legend
      .append('text')
      .attr('x', 25)
      .attr('y', 4)
      .attr('class', 'legend-text')
      .attr('fill', '#94a3b8')
      .style('font-size', '10px')
      .text('Train');

    // Validation Loss legend
    legend
      .append('line')
      .attr('x1', 0)
      .attr('x2', 20)
      .attr('y1', 12)
      .attr('y2', 12)
      .attr('stroke', '#FF00AA')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,2');

    legend
      .append('text')
      .attr('x', 25)
      .attr('y', 16)
      .attr('class', 'legend-text')
      .attr('fill', '#94a3b8')
      .style('font-size', '10px')
      .text('Val');

    // Accuracy legend
    legend
      .append('line')
      .attr('x1', 0)
      .attr('x2', 20)
      .attr('y1', 24)
      .attr('y2', 24)
      .attr('stroke', '#10B981')
      .attr('stroke-width', 2);

    legend
      .append('text')
      .attr('x', 25)
      .attr('y', 28)
      .attr('class', 'legend-text')
      .attr('fill', '#94a3b8')
      .style('font-size', '10px')
      .text('Acc');
  }

  private addAxisLabels(): void {
    // X-axis label
    this.svg
      .append('text')
      .attr('class', 'axis-label text-tiny')
      .attr('x', this.width / 2)
      .attr('y', this.height + 25)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .text('Epoch');

    // Y-axis label (Loss)
    this.svg
      .append('text')
      .attr('class', 'axis-label text-tiny')
      .attr('transform', 'rotate(-90)')
      .attr('x', -this.height / 2)
      .attr('y', -35)
      .attr('text-anchor', 'middle')
      .attr('fill', '#00D9FF') // Match line color
      .text('Loss');

    // Y-axis label (Accuracy)
    this.svg
      .append('text')
      .attr('class', 'axis-label text-tiny')
      .attr('transform', 'rotate(90)')
      .attr('x', this.height / 2)
      .attr('y', -this.width - 35)
      .attr('text-anchor', 'middle')
      .attr('fill', '#10B981') // Match line color
      .text('Accuracy');
  }
}
