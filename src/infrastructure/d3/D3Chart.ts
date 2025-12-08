import * as d3 from 'd3';
import type { IVisualizerService, PointAddedCallback } from '../../core/ports';
import type { Point, Prediction, VisualizationConfig, ColourScheme } from '../../core/domain';
import { DEFAULT_VISUALIZATION_CONFIG, COLOUR_PALETTES, MULTI_CLASS_COLOURS } from '../../core/domain';
import { D3VoronoiOverlay } from './D3VoronoiOverlay';

/**
 * D3.js implementation of IVisualizerService.
 * Encapsulates all D3 logic—no other module should import d3 directly.
 *
 * @remarks
 * - Agnostic to neural networks; only knows about Points and Predictions
 * - Uses contour rendering for decision boundaries
 * - Manages its own SVG lifecycle within the provided container
 * - Supports zoom/pan, tooltips, and configurable appearance
 */
export class D3Chart implements IVisualizerService {
  private readonly container: d3.Selection<HTMLElement, unknown, null, undefined>;
  private readonly svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private readonly chartGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  private width: number;
  private height: number;
  private readonly margin = { top: 8, right: 8, bottom: 28, left: 32 };

  private xScale: d3.ScaleLinear<number, number>;
  private yScale: d3.ScaleLinear<number, number>;

  private config: VisualizationConfig = { ...DEFAULT_VISUALIZATION_CONFIG };
  private zoom: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null;
  private tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown> | null = null;

  // Cache for re-rendering after zoom
  private cachedPoints: Point[] = [];
  private cachedPredictions: Prediction[] = [];
  private cachedGridSize = 0;
  private cachedPointPredictions: Prediction[] = []; // Predictions for actual data points (for Voronoi)

  // Draw mode state
  private drawModeEnabled = false;
  private drawModeLabel = 0;
  private drawModeCallback: PointAddedCallback | null = null;

  // Voronoi overlay
  private voronoiOverlay: D3VoronoiOverlay | null = null;
  private voronoiEnabled = false;

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

    // Create SVG with viewBox for responsive sizing
    this.svg = this.container
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('width', '100%')
      .style('height', '100%') as d3.Selection<SVGSVGElement, unknown, null, undefined>;

    // Add clip path to prevent rendering outside chart area
    this.svg
      .append('defs')
      .append('clipPath')
      .attr('id', 'chart-clip')
      .append('rect')
      .attr('width', this.width)
      .attr('height', this.height);

    // Main chart group with margin transform
    this.chartGroup = this.svg
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`)
      .attr('clip-path', 'url(#chart-clip)') as d3.Selection<SVGGElement, unknown, null, undefined>;

    // Initialise scales with default domain [-1, 1]
    this.xScale = d3.scaleLinear().domain([-1, 1]).range([0, this.width]);
    this.yScale = d3.scaleLinear().domain([-1, 1]).range([this.height, 0]);

    this.renderAxes();
    this.setupZoom();
    this.setupTooltip();

    // Setup resize observer
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          this.resize(entry.contentRect.width, entry.contentRect.height);
        }
      }
    });
    this.resizeObserver.observe(element);
  }

  /**
   * Resizes the chart to fit the new container dimensions.
   */
  resize(width: number, height: number): void {
    if (width === 0 || height === 0) return;

    // Update dimensions
    this.width = width - this.margin.left - this.margin.right;
    this.height = height - this.margin.top - this.margin.bottom;

    // Update SVG viewBox
    this.svg.attr('viewBox', `0 0 ${width} ${height}`);

    // Update clip path
    this.svg.select('#chart-clip rect')
      .attr('width', this.width)
      .attr('height', this.height);

    // Update scales
    this.xScale.range([0, this.width]);
    this.yScale.range([this.height, 0]);

    // Update axes
    this.svg.select<SVGGElement>('.x-axis')
      .attr('transform', `translate(0,${this.height})`)
      .call(d3.axisBottom(this.xScale).ticks(5));

    this.svg.select<SVGGElement>('.y-axis')
      .call(d3.axisLeft(this.yScale).ticks(5));

    // Re-render content
    if (this.cachedPoints.length > 0) {
      this.renderData(this.cachedPoints);
    }
    if (this.cachedPredictions.length > 0) {
      this.renderBoundary(this.cachedPredictions, this.cachedGridSize);
    }
    if (this.voronoiEnabled && this.voronoiOverlay && this.cachedPointPredictions.length > 0) {
      this.voronoiOverlay.resize(this.width, this.height, this.xScale, this.yScale);
      this.voronoiOverlay.render(this.cachedPoints, this.cachedPointPredictions, this.config.boundaryOpacity);
    }
  }

  /**
   * Updates visualization configuration.
   */
  setConfig(config: Partial<VisualizationConfig>): void {
    this.config = { ...this.config, ...config };

    // Re-render with new config
    if (this.cachedPoints.length > 0) {
      this.renderData(this.cachedPoints);
    }
    if (this.cachedPredictions.length > 0) {
      this.renderBoundary(this.cachedPredictions, this.cachedGridSize);
    }

    // Update zoom behaviour
    if (config.zoomEnabled !== undefined) {
      this.setupZoom();
    }
  }

  /**
   * Sets the colour scheme for the visualization.
   */
  setTheme(theme: ColourScheme): void {
    this.setConfig({ colourScheme: theme });
  }

  /**
   * Returns current visualization configuration.
   */
  getConfig(): VisualizationConfig {
    return { ...this.config };
  }

  /**
   * Renders data points on the chart.
   * Points are coloured by label using multi-class colour palette.
   */
  renderData(points: Point[]): void {
    // Cache for re-rendering
    this.cachedPoints = points;

    // Remove existing data points
    this.chartGroup.selectAll('.data-point').remove();

    // Use multi-class colours (supports up to 10 classes)
    const getColour = (label: number): string => {
      return MULTI_CLASS_COLOURS[label % MULTI_CLASS_COLOURS.length] ?? '#888888';
    };

    const dataPoints = this.chartGroup
      .selectAll('.data-point')
      .data(points)
      .enter()
      .append('circle')
      .attr('class', (d) => `data-point ${d.isValidation ? 'validation-point' : 'training-point'}`)
      .attr('cx', (d) => this.xScale(d.x))
      .attr('cy', (d) => this.yScale(d.y))
      .attr('r', this.config.pointRadius)
      .attr('fill', (d) => getColour(d.label))
      .attr('stroke', (d) => d.isValidation ? '#fbbf24' : '#fff')
      .attr('stroke-width', (d) => d.isValidation ? 2.5 : 1.5)
      .attr('stroke-dasharray', (d) => d.isValidation ? '3,2' : 'none')
      .attr('opacity', 0.9);

    // Add tooltip handlers if enabled
    if (this.config.tooltipsEnabled && this.tooltip) {
      const tooltip = this.tooltip;
      dataPoints
        .on('mouseenter', (event, d) => {
          tooltip
            .style('opacity', 1)
            .html(`<strong>${d.isValidation ? 'Validation' : 'Training'} Point</strong><br/>x: ${d.x.toFixed(3)}<br/>y: ${d.y.toFixed(3)}<br/>class: ${d.label}`)
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 10}px`);
        })
        .on('mouseleave', () => {
          tooltip.style('opacity', 0);
        });
    }

    // Add click handler for prediction details
    dataPoints.on('click', (event, d) => {
      event.stopPropagation();
      if (this.pointClickCallback) {
        this.pointClickCallback(d);
      }
    });
  }

  // Callback for point clicks
  private pointClickCallback: ((point: Point) => void) | null = null;

  /**
   * Sets a callback for when a data point is clicked.
   * @param callback - Function to call with the clicked point
   */
  onPointClick(callback: (point: Point) => void): void {
    this.pointClickCallback = callback;
  }

  /**
   * Renders the decision boundary as a heatmap.
   * For binary: contour-based gradient. For multi-class: pixel-based regions.
   */
  renderBoundary(predictions: Prediction[], gridSize: number): void {
    // Cache for re-rendering
    this.cachedPredictions = predictions;
    this.cachedGridSize = gridSize;

    // Remove existing boundary
    this.chartGroup.selectAll('.boundary').remove();

    if (predictions.length !== gridSize * gridSize) {
      console.warn(
        `Expected ${gridSize * gridSize} predictions for gridSize ${gridSize}, got ${predictions.length}`
      );
      return;
    }

    // Determine if multi-class based on predictions
    const numClasses = predictions[0]?.probabilities?.length ?? 2;

    if (numClasses === 2) {
      this.renderBinaryBoundary(predictions, gridSize);
    } else {
      this.renderMultiClassBoundary(predictions, gridSize);
    }
  }

  /**
   * Renders binary classification boundary using contours.
   */
  private renderBinaryBoundary(predictions: Prediction[], gridSize: number): void {
    // Extract confidence values as a flat array for contour generation
    const confidenceValues = predictions.map((p) => p.confidence);

    // Generate contours with configurable count
    const step = 1 / (this.config.contourCount || 10);
    const contourGenerator = d3
      .contours()
      .size([gridSize, gridSize])
      .thresholds(d3.range(0, 1 + step, step));

    const contours = contourGenerator(confidenceValues);

    // Colour scale using current palette
    const palette = COLOUR_PALETTES[this.config.colourScheme];
    const colourScale = d3
      .scaleLinear<string>()
      .domain([0, 0.5, 1])
      .range([palette.low, '#f5f5f5', palette.high]);

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
    this.chartGroup
      .insert('g', '.data-point')
      .attr('class', 'boundary')
      .selectAll('path')
      .data(contours)
      .enter()
      .append('path')
      .attr('d', pathGenerator)
      .attr('fill', (d) => colourScale(d.value))
      .attr('stroke', 'none')
      .attr('opacity', this.config.boundaryOpacity);
  }

  /**
   * Renders multi-class boundary using pixel rectangles.
   */
  private renderMultiClassBoundary(predictions: Prediction[], gridSize: number): void {
    const cellWidth = this.width / gridSize;
    const cellHeight = this.height / gridSize;

    // Get colour for each class with confidence-based opacity
    const getColour = (pred: Prediction): string => {
      const baseColour = MULTI_CLASS_COLOURS[pred.predictedClass % MULTI_CLASS_COLOURS.length] ?? '#888888';
      return baseColour;
    };

    const boundaryGroup = this.chartGroup
      .insert('g', '.data-point')
      .attr('class', 'boundary');

    boundaryGroup
      .selectAll('rect')
      .data(predictions)
      .enter()
      .append('rect')
      .attr('x', (_, i) => (i % gridSize) * cellWidth)
      .attr('y', (_, i) => this.height - Math.floor(i / gridSize) * cellHeight - cellHeight)
      .attr('width', cellWidth)
      .attr('height', cellHeight)
      .attr('fill', (d) => getColour(d))
      .attr('opacity', (d) => this.config.boundaryOpacity * (0.3 + d.confidence * 0.7))
      .attr('stroke', 'none');
  }

  /**
   * Clears all rendered content and resets the chart.
   */
  clear(): void {
    // Clear caches first to prevent re-render
    this.cachedPoints = [];
    this.cachedPredictions = [];
    this.cachedGridSize = 0;
    this.cachedPointPredictions = [];

    // Clear Voronoi overlay
    this.voronoiOverlay?.clear();

    // Remove ALL children of chartGroup (axes are in a separate group on svg)
    this.chartGroup.selectAll('*').remove();
  }

  /**
   * Sets predictions for data points (used by Voronoi overlay).
   * Call this after getting predictions for the actual data points.
   * @param predictions - Predictions for each data point
   */
  setPointPredictions(predictions: Prediction[]): void {
    this.cachedPointPredictions = predictions;
    
    // Update Voronoi if enabled
    if (this.voronoiEnabled && this.voronoiOverlay && this.cachedPoints.length > 0) {
      this.voronoiOverlay.render(this.cachedPoints, predictions, this.config.boundaryOpacity);
    }
  }

  /**
   * Highlights misclassified points with a red outline.
   * @param predictions - Array of predictions corresponding to cached points
   */
  highlightMisclassified(predictions: Prediction[]): void {
    if (predictions.length !== this.cachedPoints.length) return;

    // Create a set of misclassified indices
    const misclassifiedIndices = new Set<number>();
    for (let i = 0; i < predictions.length; i++) {
      const point = this.cachedPoints[i];
      const pred = predictions[i];
      if (point && pred && point.label !== pred.predictedClass) {
        misclassifiedIndices.add(i);
      }
    }

    // Update point styling - preserve validation styling for non-misclassified
    this.chartGroup
      .selectAll<SVGCircleElement, Point>('.data-point')
      .attr('stroke', (d, i) => misclassifiedIndices.has(i) ? '#ef4444' : (d.isValidation ? '#fbbf24' : '#fff'))
      .attr('stroke-width', (d, i) => misclassifiedIndices.has(i) ? 3 : (d.isValidation ? 2.5 : 1.5))
      .attr('stroke-dasharray', (d, i) => misclassifiedIndices.has(i) ? 'none' : (d.isValidation ? '3,2' : 'none'));
  }

  /**
   * Clears misclassified highlighting, restoring default styling.
   */
  clearMisclassifiedHighlight(): void {
    this.chartGroup
      .selectAll<SVGCircleElement, Point>('.data-point')
      .attr('stroke', (d) => d.isValidation ? '#fbbf24' : '#fff')
      .attr('stroke-width', (d) => d.isValidation ? 2.5 : 1.5)
      .attr('stroke-dasharray', (d) => d.isValidation ? '3,2' : 'none');
  }

  /**
   * Renders confidence circles around data points.
   * Circle radius represents uncertainty (1 - confidence).
   * Larger circles = more uncertain predictions.
   * @param predictions - Array of predictions corresponding to cached points
   */
  renderConfidenceCircles(predictions: Prediction[]): void {
    if (predictions.length !== this.cachedPoints.length) return;

    // Remove existing confidence circles
    this.chartGroup.selectAll('.confidence-circle').remove();

    // Maximum radius for uncertainty circle (in pixels)
    const maxRadius = 25;
    const minRadius = 3;

    // Create confidence circles behind data points
    this.chartGroup
      .selectAll('.confidence-circle')
      .data(this.cachedPoints)
      .enter()
      .insert('circle', '.data-point')
      .attr('class', 'confidence-circle')
      .attr('cx', (d) => this.xScale(d.x))
      .attr('cy', (d) => this.yScale(d.y))
      .attr('r', (_, i) => {
        const pred = predictions[i];
        if (!pred) return minRadius;
        // Uncertainty = 1 - confidence
        const uncertainty = 1 - pred.confidence;
        return minRadius + uncertainty * (maxRadius - minRadius);
      })
      .attr('fill', 'none')
      .attr('stroke', (_, i) => {
        const pred = predictions[i];
        if (!pred) return '#888';
        // Colour based on whether prediction matches actual label
        const point = this.cachedPoints[i];
        const isCorrect = point && pred.predictedClass === point.label;
        return isCorrect ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)';
      })
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,2')
      .attr('opacity', 0.8);
  }

  /**
   * Removes confidence circles from the chart.
   */
  clearConfidenceCircles(): void {
    this.chartGroup.selectAll('.confidence-circle').remove();
  }

  // Resize observer
  private resizeObserver: ResizeObserver | null = null;

  /**
   * Disposes of all SVG elements and cleans up resources.
   * Call this when the chart is no longer needed to prevent memory leaks.
   */
  dispose(): void {
    this.disableDrawMode();
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.voronoiOverlay) {
      this.voronoiOverlay.clear();
      this.voronoiOverlay = null;
    }
    this.container.selectAll('*').remove();
  }

  /**
   * Enables drawing mode where clicks add points.
   */
  enableDrawMode(label: number, callback: PointAddedCallback): void {
    this.drawModeEnabled = true;
    this.drawModeLabel = label;
    this.drawModeCallback = callback;

    // Change cursor to crosshair
    this.svg.style('cursor', 'crosshair');

    // Add click handler
    this.svg.on('click.draw', (event: MouseEvent) => {
      if (!this.drawModeEnabled || !this.drawModeCallback) return;

      // Get click position relative to chart group
      const [mouseX, mouseY] = d3.pointer(event, this.chartGroup.node());

      // Convert to data coordinates
      const x = this.xScale.invert(mouseX);
      const y = this.yScale.invert(mouseY);

      // Only add if within bounds
      if (x >= -1 && x <= 1 && y >= -1 && y <= 1) {
        const point: Point = { x, y, label: this.drawModeLabel };
        this.drawModeCallback(point);
      }
    });
  }

  /**
   * Disables drawing mode.
   */
  disableDrawMode(): void {
    this.drawModeEnabled = false;
    this.drawModeCallback = null;
    this.svg.style('cursor', 'default');
    this.svg.on('click.draw', null);
  }

  /**
   * Returns whether drawing mode is currently enabled.
   */
  isDrawModeEnabled(): boolean {
    return this.drawModeEnabled;
  }

  private renderAxes(): void {
    // Axes group (outside clip path so they're always visible)
    const axesGroup = this.svg
      .append('g')
      .attr('class', 'axes')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // X axis
    axesGroup
      .append('g')
      .attr('class', 'x-axis axis')
      .attr('transform', `translate(0,${this.height})`)
      .call(d3.axisBottom(this.xScale).ticks(5));

    // Y axis
    axesGroup.append('g').attr('class', 'y-axis axis').call(d3.axisLeft(this.yScale).ticks(5));
  }

  private setupZoom(): void {
    if (!this.config.zoomEnabled) {
      // Remove zoom behaviour
      this.svg.on('.zoom', null);
      return;
    }

    this.zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 5])
      .on('zoom', (event) => {
        this.chartGroup.attr('transform', event.transform);
      });

    this.svg.call(this.zoom);

    // Add double-click to reset zoom
    this.svg.on('dblclick.zoom', () => {
      this.svg
        .transition()
        .duration(300)
        .call(this.zoom!.transform, d3.zoomIdentity);
    });
  }

  private setupTooltip(): void {
    // Create tooltip div if it doesn't exist
    this.tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'chart-tooltip')
      .style('opacity', 0);
  }

  // ===========================================================================
  // Export Methods
  // ===========================================================================

  /**
   * Exports the current chart as a PNG image.
   * @param filename - Name of the downloaded file (without extension)
   */
  exportAsPNG(filename = 'neuroviz-boundary'): void {
    const svgElement = this.svg.node();
    if (!svgElement) return;

    // Clone SVG and inline styles
    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
    this.inlineStyles(clonedSvg);

    // Add white background for PNG
    const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    background.setAttribute('width', '100%');
    background.setAttribute('height', '100%');
    background.setAttribute('fill', '#0a0f1a');
    clonedSvg.insertBefore(background, clonedSvg.firstChild);

    // Serialize SVG to string
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clonedSvg);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    // Create canvas and draw SVG
    const canvas = document.createElement('canvas');
    const scale = 2; // Higher resolution
    canvas.width = this.width * scale;
    canvas.height = this.height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      // Download PNG
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = pngUrl;
      link.click();
    };
    img.src = url;
  }

  /**
   * Exports the current chart as a PNG image with metadata overlay.
   * @param filename - Name of the downloaded file (without extension)
   * @param metadata - Configuration metadata to display on the image
   */
  exportAsPNGWithMetadata(filename = 'neuroviz-boundary', metadata: Record<string, string>): void {
    const svgElement = this.svg.node();
    if (!svgElement) return;

    // Clone SVG and inline styles
    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
    this.inlineStyles(clonedSvg);

    // Add dark background for PNG
    const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    background.setAttribute('width', '100%');
    background.setAttribute('height', '100%');
    background.setAttribute('fill', '#0a0f1a');
    clonedSvg.insertBefore(background, clonedSvg.firstChild);

    // Serialize SVG to string
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clonedSvg);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    // Create canvas with extra space for metadata
    const canvas = document.createElement('canvas');
    const scale = 2;
    const metadataHeight = 80;
    canvas.width = this.width * scale;
    canvas.height = (this.height + metadataHeight) * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Fill background
      ctx.fillStyle = '#0a0f1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw chart
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      // Draw metadata panel
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.fillRect(0, this.height, this.width, metadataHeight);

      // Draw metadata text
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Inter, system-ui, sans-serif';

      const entries = Object.entries(metadata);
      const cols = 3;
      const colWidth = this.width / cols;
      const startY = this.height + 18;
      const lineHeight = 16;

      entries.forEach(([key, value], i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = col * colWidth + 10;
        const y = startY + row * lineHeight;

        ctx.fillStyle = '#64748b';
        ctx.fillText(`${key}:`, x, y);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(value, x + ctx.measureText(`${key}: `).width, y);
      });

      // Add NeuroViz watermark
      ctx.fillStyle = '#475569';
      ctx.font = '10px Inter, system-ui, sans-serif';
      ctx.fillText('NeuroViz', this.width - 55, this.height + metadataHeight - 8);

      // Download PNG
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = pngUrl;
      link.click();
    };
    img.src = url;
  }

  /**
   * Exports the current chart as an SVG file.
   * @param filename - Name of the downloaded file (without extension)
   */
  exportAsSVG(filename = 'neuroviz-boundary'): void {
    const svgElement = this.svg.node();
    if (!svgElement) return;

    // Clone SVG and inline styles
    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
    this.inlineStyles(clonedSvg);

    // Add background
    const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    background.setAttribute('width', '100%');
    background.setAttribute('height', '100%');
    background.setAttribute('fill', '#0a0f1a');
    clonedSvg.insertBefore(background, clonedSvg.firstChild);

    // Serialize and download
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clonedSvg);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = `${filename}.svg`;
    link.href = url;
    link.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Inlines computed styles into SVG elements for export.
   */
  private inlineStyles(svg: SVGSVGElement): void {
    const elements = svg.querySelectorAll('*');
    elements.forEach((el) => {
      const computed = window.getComputedStyle(el);
      const style = el.getAttribute('style') || '';

      // Copy key styles
      const stylesToCopy = ['fill', 'stroke', 'stroke-width', 'opacity', 'font-family', 'font-size'];
      const inlined = stylesToCopy
        .map((prop) => `${prop}: ${computed.getPropertyValue(prop)}`)
        .join('; ');

      el.setAttribute('style', `${style}; ${inlined}`);
    });
  }

  /**
   * Enables or disables the Voronoi diagram overlay.
   * @param enabled - Whether to show the Voronoi overlay
   */
  setVoronoiOverlay(enabled: boolean): void {
    this.voronoiEnabled = enabled;

    if (enabled) {
      // Initialize overlay if needed
      if (!this.voronoiOverlay) {
        this.voronoiOverlay = new D3VoronoiOverlay(
          this.chartGroup,
          this.width,
          this.height,
          this.xScale,
          this.yScale
        );
      }

      // Render if we have cached point predictions (predictions for actual data points)
      if (this.cachedPoints.length > 0 && this.cachedPointPredictions.length > 0) {
        this.voronoiOverlay.render(this.cachedPoints, this.cachedPointPredictions, this.config.boundaryOpacity);
      }
    } else {
      // Clear overlay
      this.voronoiOverlay?.clear();
    }
  }

  /**
   * Returns whether Voronoi overlay is enabled.
   */
  isVoronoiEnabled(): boolean {
    return this.voronoiEnabled;
  }
}
