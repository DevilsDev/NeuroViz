/**
 * D3VoronoiOverlay Infrastructure Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { D3VoronoiOverlay } from '../../../../src/infrastructure/d3/D3VoronoiOverlay';
import type { Point, Prediction } from '../../../../src/core/domain';
import * as d3 from 'd3';

describe('D3VoronoiOverlay', () => {
  let overlay: D3VoronoiOverlay;
  let svg: d3.Selection<SVGGElement, unknown, null, undefined>;
  let container: HTMLElement;
  const width = 400;
  const height = 400;
  const xScale = d3.scaleLinear().domain([-1, 1]).range([0, width]);
  const yScale = d3.scaleLinear().domain([-1, 1]).range([height, 0]);

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const svgElement = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    svg = svgElement.append('g') as d3.Selection<SVGGElement, unknown, null, undefined>;

    overlay = new D3VoronoiOverlay(svg, width, height, xScale, yScale);
  });

  afterEach(() => {
    overlay.clear();
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
  });

  describe('render', () => {
    it('should render with valid data', () => {
      const points: Point[] = [
        { x: 0, y: 0, label: 0 },
        { x: 0.5, y: 0.5, label: 1 },
      ];

      const predictions: Prediction[] = [
        { x: 0, y: 0, confidence: 0.9, predictedClass: 0 },
        { x: 0.5, y: 0.5, confidence: 0.9, predictedClass: 1 },
      ];

      expect(() => overlay.render(points, predictions)).not.toThrow();
    });

    it('should handle empty data', () => {
      expect(() => overlay.render([], [])).not.toThrow();
    });

    it('should handle single point', () => {
      const points: Point[] = [{ x: 0, y: 0, label: 0 }];
      const predictions: Prediction[] = [{ x: 0, y: 0, confidence: 1, predictedClass: 0 }];

      expect(() => overlay.render(points, predictions)).not.toThrow();
    });

    it('should handle custom opacity', () => {
      const points: Point[] = [
        { x: 0, y: 0, label: 0 },
        { x: 0.5, y: 0.5, label: 1 },
      ];

      const predictions: Prediction[] = [
        { x: 0, y: 0, confidence: 0.9, predictedClass: 0 },
        { x: 0.5, y: 0.5, confidence: 0.9, predictedClass: 1 },
      ];

      expect(() => overlay.render(points, predictions, 0.3)).not.toThrow();
    });

    it('should handle many points', () => {
      const numPoints = 100;
      const points: Point[] = Array(numPoints).fill(null).map((_, i) => ({
        x: Math.random() * 2 - 1,
        y: Math.random() * 2 - 1,
        label: i % 2,
      }));

      const predictions: Prediction[] = points.map(p => ({
        x: p.x,
        y: p.y,
        confidence: Math.random(),
        predictedClass: p.label,
      }));

      expect(() => overlay.render(points, predictions)).not.toThrow();
    });

    it('should handle multi-class', () => {
      const points: Point[] = [
        { x: -0.5, y: -0.5, label: 0 },
        { x: 0.5, y: -0.5, label: 1 },
        { x: 0, y: 0.5, label: 2 },
      ];

      const predictions: Prediction[] = [
        { x: -0.5, y: -0.5, confidence: 0.9, predictedClass: 0 },
        { x: 0.5, y: -0.5, confidence: 0.9, predictedClass: 1 },
        { x: 0, y: 0.5, confidence: 0.9, predictedClass: 2 },
      ];

      expect(() => overlay.render(points, predictions)).not.toThrow();
    });

    it('should handle mismatched array lengths', () => {
      const points: Point[] = [{ x: 0, y: 0, label: 0 }];
      const predictions: Prediction[] = [
        { x: 0, y: 0, confidence: 1, predictedClass: 0 },
        { x: 0.5, y: 0.5, confidence: 0.8, predictedClass: 1 },
      ];

      expect(() => overlay.render(points, predictions)).not.toThrow();
    });

    it('should update existing overlay', () => {
      const points1: Point[] = [{ x: 0, y: 0, label: 0 }];
      const predictions1: Prediction[] = [{ x: 0, y: 0, confidence: 1, predictedClass: 0 }];

      const points2: Point[] = [
        { x: 0, y: 0, label: 0 },
        { x: 0.5, y: 0.5, label: 1 },
      ];
      const predictions2: Prediction[] = [
        { x: 0, y: 0, confidence: 0.9, predictedClass: 0 },
        { x: 0.5, y: 0.5, confidence: 0.9, predictedClass: 1 },
      ];

      overlay.render(points1, predictions1);
      expect(() => overlay.render(points2, predictions2)).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear overlay', () => {
      const points: Point[] = [{ x: 0, y: 0, label: 0 }];
      const predictions: Prediction[] = [{ x: 0, y: 0, confidence: 1, predictedClass: 0 }];

      overlay.render(points, predictions);
      expect(() => overlay.clear()).not.toThrow();
    });

    it('should be safe to call multiple times', () => {
      overlay.clear();
      expect(() => overlay.clear()).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle points at domain boundaries', () => {
      const points: Point[] = [
        { x: -1, y: -1, label: 0 },
        { x: 1, y: 1, label: 1 },
      ];

      const predictions: Prediction[] = [
        { x: -1, y: -1, confidence: 1, predictedClass: 0 },
        { x: 1, y: 1, confidence: 1, predictedClass: 1 },
      ];

      expect(() => overlay.render(points, predictions)).not.toThrow();
    });

    it('should handle points outside domain', () => {
      const points: Point[] = [
        { x: -2, y: -2, label: 0 },
        { x: 2, y: 2, label: 1 },
      ];

      const predictions: Prediction[] = [
        { x: -2, y: -2, confidence: 1, predictedClass: 0 },
        { x: 2, y: 2, confidence: 1, predictedClass: 1 },
      ];

      expect(() => overlay.render(points, predictions)).not.toThrow();
    });

    it('should handle coincident points', () => {
      const points: Point[] = [
        { x: 0, y: 0, label: 0 },
        { x: 0, y: 0, label: 1 },
      ];

      const predictions: Prediction[] = [
        { x: 0, y: 0, confidence: 0.5, predictedClass: 0 },
        { x: 0, y: 0, confidence: 0.5, predictedClass: 1 },
      ];

      expect(() => overlay.render(points, predictions)).not.toThrow();
    });
  });
});
