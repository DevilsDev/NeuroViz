import * as d3 from 'd3';
import type { IVisualizerService } from '../../core/ports';
import type { Point, Prediction } from '../../core/domain';

/**
 * D3.js implementation of IVisualizerService.
 * Encapsulates all D3 logic—no other module should import d3 directly.
 *
 * @remarks
 * - Agnostic to neural networks; only knows about Points and Predictions
 * - Uses contour rendering for decision boundaries
 * - Manages its own SVG lifecycle within the provided container
 */
export class D3Chart implements IVisualizerService {
  private readonly container: d3.Selection<HTMLElement, unknown, null, undefined>;
  private readonly svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private readonly width: number;
  private readonly height: number;
  private readonly margin = { top: 20, right: 20, bottom: 30, left: 40 };

  private xScale: d3.ScaleLinear<number, number>;
  private yScale: d3.ScaleLinear<number, number>;

  /**
   * @param containerId - DOM element ID where the chart will be rendered
   * @param width - Chart width in pixels (default: 500)
   * @param height - Chart height in pixels (default: 500)
   */
  constructor(containerId: string, width = 500, height = 500) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Container element with ID "${containerId}" not found.`);
    }

    this.container = d3.select(element);
    this.width = width - this.margin.left - this.margin.right;
    this.height = height - this.margin.top - this.margin.bottom;

    // Clear any existing content
    this.container.selectAll('*').remove();

    this.svg = this.container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`) as unknown as d3.Selection<
      SVGSVGElement,
      unknown,
      null,
      undefined
    >;

    // Initialise scales with default domain [-1, 1]
    this.xScale = d3.scaleLinear().domain([-1, 1]).range([0, this.width]);
    this.yScale = d3.scaleLinear().domain([-1, 1]).range([this.height, 0]);

    this.renderAxes();
  }

  /**
   * Renders data points on the chart.
   * Points are coloured by label (0 = blue, 1 = orange).
   */
  renderData(points: Point[]): void {
    // Remove existing data points
    this.svg.selectAll('.data-point').remove();

    const colourScale = d3.scaleOrdinal<number, string>().domain([0, 1]).range(['#3b82f6', '#f97316']);

    this.svg
      .selectAll('.data-point')
      .data(points)
      .enter()
      .append('circle')
      .attr('class', 'data-point')
      .attr('cx', (d) => this.xScale(d.x))
      .attr('cy', (d) => this.yScale(d.y))
      .attr('r', 5)
      .attr('fill', (d) => colourScale(d.label))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.9);
  }

  /**
   * Renders the decision boundary as a contour heatmap.
   * Predictions are mapped to colours based on confidence (0 = blue, 1 = orange).
   */
  renderBoundary(predictions: Prediction[], gridSize: number): void {
    // Remove existing boundary
    this.svg.selectAll('.boundary').remove();

    if (predictions.length !== gridSize * gridSize) {
      console.warn(
        `Expected ${gridSize * gridSize} predictions for gridSize ${gridSize}, got ${predictions.length}`
      );
      return;
    }

    // Extract confidence values as a flat array for contour generation
    const confidenceValues = predictions.map((p) => p.confidence);

    // Generate contours
    const contourGenerator = d3
      .contours()
      .size([gridSize, gridSize])
      .thresholds(d3.range(0, 1.1, 0.1));

    const contours = contourGenerator(confidenceValues);

    // Colour scale: blue (0) -> white (0.5) -> orange (1)
    const colourScale = d3
      .scaleLinear<string>()
      .domain([0, 0.5, 1])
      .range(['#3b82f6', '#f5f5f5', '#f97316']);

    // Scale contour paths to chart dimensions
    const xContourScale = d3.scaleLinear().domain([0, gridSize]).range([0, this.width]);
    const yContourScale = d3.scaleLinear().domain([0, gridSize]).range([this.height, 0]);

    const pathGenerator = d3.geoPath().projection(
      d3.geoTransform({
        point(x, y) {
          this.stream.point(xContourScale(x), yContourScale(y));
        },
      })
    );

    // Render contours behind data points
    this.svg
      .insert('g', '.data-point')
      .attr('class', 'boundary')
      .selectAll('path')
      .data(contours)
      .enter()
      .append('path')
      .attr('d', pathGenerator)
      .attr('fill', (d) => colourScale(d.value))
      .attr('stroke', 'none')
      .attr('opacity', 0.6);
  }

  /**
   * Clears all rendered content and resets the chart.
   */
  clear(): void {
    this.svg.selectAll('.data-point').remove();
    this.svg.selectAll('.boundary').remove();
  }

  /**
   * Disposes of all SVG elements and cleans up resources.
   * Call this when the chart is no longer needed to prevent memory leaks.
   */
  dispose(): void {
    this.container.selectAll('*').remove();
  }

  private renderAxes(): void {
    // X axis
    this.svg
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${this.height})`)
      .call(d3.axisBottom(this.xScale).ticks(5));

    // Y axis
    this.svg.append('g').attr('class', 'y-axis').call(d3.axisLeft(this.yScale).ticks(5));
  }
}
