/**
 * WebGL-Accelerated 2D Renderer
 *
 * Uses WebGL for fast rendering of decision boundaries and data points.
 * Falls back to Canvas 2D if WebGL is not available.
 */

import { logger } from '../logging/Logger';

export interface WebGLRendererConfig {
  width: number;
  height: number;
  antialias: boolean;
  preserveDrawingBuffer: boolean;
}

export interface RenderablePoint {
  x: number;
  y: number;
  color: [number, number, number, number]; // RGBA 0-1
  size: number;
}

export interface RenderableRect {
  x: number;
  y: number;
  width: number;
  height: number;
  color: [number, number, number, number]; // RGBA 0-1
}

/**
 * WebGL-based 2D renderer for high-performance visualization.
 */
export class WebGLRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;
  private ctx2d: CanvasRenderingContext2D | null = null;
  private useWebGL: boolean = false;
  private pointProgram: WebGLProgram | null = null;
  private rectProgram: WebGLProgram | null = null;
  private config: WebGLRendererConfig;

  // Shader sources
  private static readonly POINT_VERTEX_SHADER = `
    attribute vec2 a_position;
    attribute vec4 a_color;
    attribute float a_size;
    uniform vec2 u_resolution;
    varying vec4 v_color;
    
    void main() {
      vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      gl_PointSize = a_size;
      v_color = a_color;
    }
  `;

  private static readonly POINT_FRAGMENT_SHADER = `
    precision mediump float;
    varying vec4 v_color;
    
    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      if (length(coord) > 0.5) discard;
      gl_FragColor = v_color;
    }
  `;

  private static readonly RECT_VERTEX_SHADER = `
    attribute vec2 a_position;
    attribute vec4 a_color;
    uniform vec2 u_resolution;
    varying vec4 v_color;
    
    void main() {
      vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      v_color = a_color;
    }
  `;

  private static readonly RECT_FRAGMENT_SHADER = `
    precision mediump float;
    varying vec4 v_color;
    
    void main() {
      gl_FragColor = v_color;
    }
  `;

  constructor(container: HTMLElement, config?: Partial<WebGLRendererConfig>) {
    this.config = {
      width: container.clientWidth || 400,
      height: container.clientHeight || 400,
      antialias: true,
      preserveDrawingBuffer: true,
      ...config,
    };

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.config.width;
    this.canvas.height = this.config.height;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    container.appendChild(this.canvas);

    // Try WebGL first
    this.initWebGL();
  }

  /**
   * Initializes WebGL context and shaders.
   */
  private initWebGL(): void {
    try {
      this.gl = this.canvas.getContext('webgl', {
        antialias: this.config.antialias,
        preserveDrawingBuffer: this.config.preserveDrawingBuffer,
      });

      if (!this.gl) {
        throw new Error('WebGL not supported');
      }

      // Compile shaders
      this.pointProgram = this.createProgram(
        WebGLRenderer.POINT_VERTEX_SHADER,
        WebGLRenderer.POINT_FRAGMENT_SHADER
      );
      this.rectProgram = this.createProgram(
        WebGLRenderer.RECT_VERTEX_SHADER,
        WebGLRenderer.RECT_FRAGMENT_SHADER
      );

      if (!this.pointProgram || !this.rectProgram) {
        throw new Error('Failed to compile shaders');
      }

      this.useWebGL = true;
      logger.info('WebGL renderer initialized', {
        component: 'WebGLRenderer',
        action: 'initialize',
        width: this.config.width,
        height: this.config.height,
      });
    } catch (error) {
      console.warn('WebGL not available, falling back to Canvas 2D:', error);
      this.ctx2d = this.canvas.getContext('2d');
      this.useWebGL = false;
    }
  }

  /**
   * Creates a WebGL program from vertex and fragment shader sources.
   */
  private createProgram(vertexSource: string, fragmentSource: string): WebGLProgram | null {
    if (!this.gl) return null;

    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentSource);

    if (!vertexShader || !fragmentShader) return null;

    const program = this.gl.createProgram();
    if (!program) return null;

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Program link error:', this.gl.getProgramInfoLog(program));
      return null;
    }

    return program;
  }

  /**
   * Compiles a shader.
   */
  private compileShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;

    const shader = this.gl.createShader(type);
    if (!shader) return null;

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
      return null;
    }

    return shader;
  }

  /**
   * Clears the canvas.
   */
  clear(color: [number, number, number, number] = [0.05, 0.08, 0.15, 1]): void {
    if (this.useWebGL && this.gl) {
      this.gl.clearColor(...color);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    } else if (this.ctx2d) {
      this.ctx2d.fillStyle = `rgba(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255}, ${color[3]})`;
      this.ctx2d.fillRect(0, 0, this.config.width, this.config.height);
    }
  }

  /**
   * Renders points using WebGL or Canvas 2D.
   */
  renderPoints(points: RenderablePoint[]): void {
    if (points.length === 0) return;

    if (this.useWebGL && this.gl && this.pointProgram) {
      this.renderPointsWebGL(points);
    } else if (this.ctx2d) {
      this.renderPointsCanvas(points);
    }
  }

  /**
   * Renders points using WebGL.
   */
  private renderPointsWebGL(points: RenderablePoint[]): void {
    if (!this.gl || !this.pointProgram) return;

    this.gl.useProgram(this.pointProgram);

    // Set resolution uniform
    const resolutionLocation = this.gl.getUniformLocation(this.pointProgram, 'u_resolution');
    this.gl.uniform2f(resolutionLocation, this.config.width, this.config.height);

    // Prepare vertex data
    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];

    for (const point of points) {
      positions.push(point.x, point.y);
      colors.push(...point.color);
      sizes.push(point.size);
    }

    // Position buffer
    const positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
    const positionLocation = this.gl.getAttribLocation(this.pointProgram, 'a_position');
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

    // Color buffer
    const colorBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW);
    const colorLocation = this.gl.getAttribLocation(this.pointProgram, 'a_color');
    this.gl.enableVertexAttribArray(colorLocation);
    this.gl.vertexAttribPointer(colorLocation, 4, this.gl.FLOAT, false, 0, 0);

    // Size buffer
    const sizeBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, sizeBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(sizes), this.gl.STATIC_DRAW);
    const sizeLocation = this.gl.getAttribLocation(this.pointProgram, 'a_size');
    this.gl.enableVertexAttribArray(sizeLocation);
    this.gl.vertexAttribPointer(sizeLocation, 1, this.gl.FLOAT, false, 0, 0);

    // Enable blending
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    // Draw
    this.gl.drawArrays(this.gl.POINTS, 0, points.length);

    // Cleanup
    this.gl.deleteBuffer(positionBuffer);
    this.gl.deleteBuffer(colorBuffer);
    this.gl.deleteBuffer(sizeBuffer);
  }

  /**
   * Renders points using Canvas 2D.
   */
  private renderPointsCanvas(points: RenderablePoint[]): void {
    if (!this.ctx2d) return;

    for (const point of points) {
      const [r, g, b, a] = point.color;
      this.ctx2d.fillStyle = `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`;
      this.ctx2d.beginPath();
      this.ctx2d.arc(point.x, point.y, point.size / 2, 0, Math.PI * 2);
      this.ctx2d.fill();
    }
  }

  /**
   * Renders rectangles (for decision boundary grid).
   */
  renderRects(rects: RenderableRect[]): void {
    if (rects.length === 0) return;

    if (this.useWebGL && this.gl && this.rectProgram) {
      this.renderRectsWebGL(rects);
    } else if (this.ctx2d) {
      this.renderRectsCanvas(rects);
    }
  }

  /**
   * Renders rectangles using WebGL.
   */
  private renderRectsWebGL(rects: RenderableRect[]): void {
    if (!this.gl || !this.rectProgram) return;

    this.gl.useProgram(this.rectProgram);

    const resolutionLocation = this.gl.getUniformLocation(this.rectProgram, 'u_resolution');
    this.gl.uniform2f(resolutionLocation, this.config.width, this.config.height);

    // Build vertex data for all rectangles (2 triangles per rect)
    const positions: number[] = [];
    const colors: number[] = [];

    for (const rect of rects) {
      const { x, y, width, height, color } = rect;
      const x2 = x + width;
      const y2 = y + height;

      // Triangle 1
      positions.push(x, y, x2, y, x, y2);
      // Triangle 2
      positions.push(x, y2, x2, y, x2, y2);

      // 6 vertices per rect, same color
      for (let i = 0; i < 6; i++) {
        colors.push(...color);
      }
    }

    // Position buffer
    const positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
    const positionLocation = this.gl.getAttribLocation(this.rectProgram, 'a_position');
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

    // Color buffer
    const colorBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW);
    const colorLocation = this.gl.getAttribLocation(this.rectProgram, 'a_color');
    this.gl.enableVertexAttribArray(colorLocation);
    this.gl.vertexAttribPointer(colorLocation, 4, this.gl.FLOAT, false, 0, 0);

    // Draw
    this.gl.drawArrays(this.gl.TRIANGLES, 0, rects.length * 6);

    // Cleanup
    this.gl.deleteBuffer(positionBuffer);
    this.gl.deleteBuffer(colorBuffer);
  }

  /**
   * Renders rectangles using Canvas 2D.
   */
  private renderRectsCanvas(rects: RenderableRect[]): void {
    if (!this.ctx2d) return;

    for (const rect of rects) {
      const [r, g, b, a] = rect.color;
      this.ctx2d.fillStyle = `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`;
      this.ctx2d.fillRect(rect.x, rect.y, rect.width, rect.height);
    }
  }

  /**
   * Resizes the canvas.
   */
  resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;
    this.canvas.width = width;
    this.canvas.height = height;

    if (this.gl) {
      this.gl.viewport(0, 0, width, height);
    }
  }

  /**
   * Returns whether WebGL is being used.
   */
  isWebGLEnabled(): boolean {
    return this.useWebGL;
  }

  /**
   * Gets the canvas element.
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * Disposes of resources.
   */
  dispose(): void {
    if (this.gl) {
      if (this.pointProgram) this.gl.deleteProgram(this.pointProgram);
      if (this.rectProgram) this.gl.deleteProgram(this.rectProgram);
    }
    this.canvas.remove();
  }
}
