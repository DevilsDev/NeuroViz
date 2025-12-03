import * as d3 from 'd3';
import type { Point, Prediction } from '../../core/domain';

/**
 * D3-based Voronoi diagram overlay for decision boundary visualization.
 * Shows decision regions as Voronoi cells based on data points.
 */
export class D3VoronoiOverlay {
  private svg: d3.Selection<SVGGElement, unknown, null, undefined>;
  private width: number;
  private height: number;
  private xScale: d3.ScaleLinear<number, number>;
  private yScale: d3.ScaleLinear<number, number>;
  private voronoiGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;

  // Colour palette for classes
  private classColours = [
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#22c55e', // Green
    '#f59e0b', // Amber
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#ec4899', // Pink
    '#84cc16', // Lime
  ];

  constructor(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    width: number,
    height: number,
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>
  ) {
    this.svg = svg;
    this.width = width;
    this.height = height;
    this.xScale = xScale;
    this.yScale = yScale;
  }

  /**
   * Renders the Voronoi diagram based on data points and their predictions.
   * @param points - Data points
   * @param predictions - Predictions for each point
   * @param opacity - Opacity of the Voronoi cells (0-1)
   */
  render(points: Point[], predictions: Prediction[], opacity = 0.3): void {
    this.clear();

    if (points.length < 3) return; // Need at least 3 points for Voronoi

    // Create Voronoi group
    this.voronoiGroup = this.svg.append('g')
      .attr('class', 'voronoi-overlay')
      .lower(); // Put behind data points

    // Map points to screen coordinates
    const screenPoints: [number, number][] = points.map(p => [
      this.xScale(p.x),
      this.yScale(p.y)
    ]);

    // Create Voronoi diagram
    const delaunay = d3.Delaunay.from(screenPoints);
    const voronoi = delaunay.voronoi([0, 0, this.width, this.height]);

    // Draw Voronoi cells
    this.voronoiGroup.selectAll('path')
      .data(points)
      .enter()
      .append('path')
      .attr('d', (_, i) => voronoi.renderCell(i))
      .attr('fill', (_, i) => {
        const pred = predictions[i];
        if (!pred) return 'transparent';
        const classIndex = pred.predictedClass;
        return this.classColours[classIndex % this.classColours.length] ?? '#888';
      })
      .attr('fill-opacity', (_, i) => {
        const pred = predictions[i];
        if (!pred) return 0;
        // Opacity based on confidence
        return opacity * (0.5 + pred.confidence * 0.5);
      })
      .attr('stroke', 'var(--border-color)')
      .attr('stroke-width', 0.5)
      .attr('stroke-opacity', 0.3);
  }

  /**
   * Renders Voronoi cells with gradient based on confidence.
   * @param points - Data points
   * @param predictions - Predictions for each point
   */
  renderWithGradient(points: Point[], predictions: Prediction[]): void {
    this.clear();

    if (points.length < 3) return;

    this.voronoiGroup = this.svg.append('g')
      .attr('class', 'voronoi-overlay')
      .lower();

    const screenPoints: [number, number][] = points.map(p => [
      this.xScale(p.x),
      this.yScale(p.y)
    ]);

    const delaunay = d3.Delaunay.from(screenPoints);
    const voronoi = delaunay.voronoi([0, 0, this.width, this.height]);

    // Create gradients for each cell
    const defs = this.svg.select('defs').empty()
      ? this.svg.append('defs')
      : this.svg.select('defs');

    points.forEach((point, i) => {
      const pred = predictions[i];
      if (!pred) return;

      const gradientId = `voronoi-gradient-${i}`;
      const classColour = this.classColours[pred.predictedClass % this.classColours.length] ?? '#888';

      // Radial gradient from center
      const gradient = defs.append('radialGradient')
        .attr('id', gradientId)
        .attr('cx', '50%')
        .attr('cy', '50%')
        .attr('r', '50%');

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', classColour)
        .attr('stop-opacity', pred.confidence * 0.6);

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', classColour)
        .attr('stop-opacity', pred.confidence * 0.2);
    });

    // Draw cells with gradients
    this.voronoiGroup.selectAll('path')
      .data(points)
      .enter()
      .append('path')
      .attr('d', (_, i) => voronoi.renderCell(i))
      .attr('fill', (_, i) => `url(#voronoi-gradient-${i})`)
      .attr('stroke', 'var(--border-color)')
      .attr('stroke-width', 0.5)
      .attr('stroke-opacity', 0.2);
  }

  /**
   * Clears the Voronoi overlay.
   */
  clear(): void {
    if (this.voronoiGroup) {
      this.voronoiGroup.remove();
      this.voronoiGroup = null;
    }
    // Clean up gradients
    this.svg.selectAll('defs radialGradient[id^="voronoi-gradient"]').remove();
  }

  /**
   * Updates scales when chart is resized.
   */
  updateScales(
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>
  ): void {
    this.xScale = xScale;
    this.yScale = yScale;
  }

  /**
   * Resizes the overlay to fit new dimensions.
   */
  resize(
    width: number,
    height: number,
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>
  ): void {
    this.width = width;
    this.height = height;
    this.xScale = xScale;
    this.yScale = yScale;
  }
}
