/**
 * Progressive Grid Renderer
 * 
 * Renders large grids progressively to avoid blocking the main thread.
 * Uses chunked rendering with requestIdleCallback for smooth performance.
 */

export interface GridCell {
  x: number;
  y: number;
  value: number;
  color?: string;
}

export interface ProgressiveRenderConfig {
  /** Grid resolution (cells per axis) */
  resolution: number;
  /** Cells to render per chunk */
  chunkSize: number;
  /** Use low-res preview first */
  usePreview: boolean;
  /** Preview resolution multiplier (0.25 = 1/4 resolution) */
  previewScale: number;
}

export interface RenderProgress {
  phase: 'preview' | 'full' | 'complete';
  progress: number; // 0-1
  cellsRendered: number;
  totalCells: number;
}

type RenderCallback = (cells: GridCell[], isPreview: boolean) => void;
type ProgressCallback = (progress: RenderProgress) => void;

/**
 * Manages progressive rendering of large grids.
 */
export class ProgressiveRenderer {
  private config: ProgressiveRenderConfig;
  private isRendering: boolean = false;
  private abortController: AbortController | null = null;

  constructor(config?: Partial<ProgressiveRenderConfig>) {
    this.config = {
      resolution: 50,
      chunkSize: 500,
      usePreview: true,
      previewScale: 0.25,
      ...config,
    };
  }

  /**
   * Updates configuration.
   */
  setConfig(config: Partial<ProgressiveRenderConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Gets optimal resolution based on performance mode.
   */
  getOptimalResolution(qualityMultiplier: number = 1): number {
    return Math.round(this.config.resolution * qualityMultiplier);
  }

  /**
   * Renders a grid progressively.
   */
  async render(
    computeValue: (x: number, y: number) => number,
    colorMapper: (value: number) => string,
    onRender: RenderCallback,
    onProgress?: ProgressCallback,
    bounds: { minX: number; maxX: number; minY: number; maxY: number } = { minX: -6, maxX: 6, minY: -6, maxY: 6 }
  ): Promise<void> {
    // Abort any existing render
    this.abort();

    this.isRendering = true;
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    const { resolution, chunkSize, usePreview, previewScale } = this.config;
    const { minX, maxX, minY, maxY } = bounds;

    // Phase 1: Quick preview at low resolution
    if (usePreview) {
      const previewRes = Math.max(10, Math.round(resolution * previewScale));
      const previewCells = this.generateGrid(previewRes, minX, maxX, minY, maxY, computeValue, colorMapper);
      
      if (signal.aborted) return;
      
      onRender(previewCells, true);
      onProgress?.({
        phase: 'preview',
        progress: 1,
        cellsRendered: previewCells.length,
        totalCells: previewCells.length,
      });
    }

    // Phase 2: Full resolution in chunks
    const totalCells = resolution * resolution;
    const stepX = (maxX - minX) / resolution;
    const stepY = (maxY - minY) / resolution;
    
    let cellsRendered = 0;
    let currentChunk: GridCell[] = [];

    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        if (signal.aborted) return;

        const x = minX + (i + 0.5) * stepX;
        const y = minY + (j + 0.5) * stepY;
        const value = computeValue(x, y);
        const color = colorMapper(value);

        currentChunk.push({ x, y, value, color });
        cellsRendered++;

        // Render chunk when full
        if (currentChunk.length >= chunkSize) {
          onRender(currentChunk, false);
          currentChunk = [];

          onProgress?.({
            phase: 'full',
            progress: cellsRendered / totalCells,
            cellsRendered,
            totalCells,
          });

          // Yield to main thread
          await this.yieldToMain();
        }
      }
    }

    // Render remaining cells
    if (currentChunk.length > 0) {
      onRender(currentChunk, false);
    }

    onProgress?.({
      phase: 'complete',
      progress: 1,
      cellsRendered: totalCells,
      totalCells,
    });

    this.isRendering = false;
  }

  /**
   * Generates a complete grid at once (for small grids).
   */
  generateGrid(
    resolution: number,
    minX: number,
    maxX: number,
    minY: number,
    maxY: number,
    computeValue: (x: number, y: number) => number,
    colorMapper: (value: number) => string
  ): GridCell[] {
    const cells: GridCell[] = [];
    const stepX = (maxX - minX) / resolution;
    const stepY = (maxY - minY) / resolution;

    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const x = minX + (i + 0.5) * stepX;
        const y = minY + (j + 0.5) * stepY;
        const value = computeValue(x, y);
        const color = colorMapper(value);
        cells.push({ x, y, value, color });
      }
    }

    return cells;
  }

  /**
   * Aborts the current render.
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isRendering = false;
  }

  /**
   * Checks if currently rendering.
   */
  isActive(): boolean {
    return this.isRendering;
  }

  /**
   * Yields to the main thread using requestIdleCallback or setTimeout.
   */
  private yieldToMain(): Promise<void> {
    return new Promise(resolve => {
      if ('requestIdleCallback' in window) {
        (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => resolve());
      } else {
        setTimeout(resolve, 0);
      }
    });
  }
}

/**
 * Singleton instance for global progressive rendering.
 */
export const progressiveRenderer = new ProgressiveRenderer();
