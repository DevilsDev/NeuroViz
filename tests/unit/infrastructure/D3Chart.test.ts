/**
 * Unit tests for D3Chart adapter
 *
 * Tests the D3.js implementation of IVisualizerService.
 * Verifies SVG rendering, data visualization, and DOM manipulation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { D3Chart } from '../../../src/infrastructure/d3/D3Chart';
import type { Point, Prediction } from '../../../src/core/domain';
import * as d3 from 'd3';

describe('D3Chart', () => {
  let chart: D3Chart;
  let container: HTMLElement;

  beforeEach(() => {
    // Create a container element in the document with explicit size
    container = document.createElement('div');
    container.id = 'test-viz-container';
    container.style.width = '500px';
    container.style.height = '500px';
    document.body.appendChild(container);

    chart = new D3Chart('test-viz-container');
  });

  afterEach(() => {
    chart.dispose();
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('initialization', () => {
    it('should create SVG element in container', () => {
      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();
    });

    it('should set correct SVG dimensions', () => {
      const svg = container.querySelector('svg');
      // SVG fills container completely
      expect(svg?.getAttribute('width')).toBe('100%');
      expect(svg?.getAttribute('height')).toBe('100%');
    });

    it('should create axes', () => {
      const xAxis = container.querySelector('.x-axis');
      const yAxis = container.querySelector('.y-axis');

      expect(xAxis).not.toBeNull();
      expect(yAxis).not.toBeNull();
    });

    it('should throw error for invalid container ID', () => {
      expect(() => new D3Chart('non-existent-container')).toThrow();
    });

    it('should use container dimensions', () => {
      const customContainer = document.createElement('div');
      customContainer.id = 'custom-container';
      customContainer.style.width = '800px';
      customContainer.style.height = '600px';
      document.body.appendChild(customContainer);

      const customChart = new D3Chart('custom-container');
      const svg = customContainer.querySelector('svg');

      // SVG fills container completely
      expect(svg?.getAttribute('width')).toBe('100%');
      expect(svg?.getAttribute('height')).toBe('100%');

      customChart.dispose();
      customContainer.remove();
    });

    it('should clear existing content in container', () => {
      container.innerHTML = '<div>Existing content</div>';

      const newChart = new D3Chart('test-viz-container');
      const existingContent = container.querySelector('div');

      expect(existingContent).toBeNull();

      newChart.dispose();
    });
  });

  describe('renderData', () => {
    it('should render data points as circles', () => {
      const points: Point[] = [
        { x: 0.5, y: 0.5, label: 1 },
        { x: -0.5, y: -0.5, label: 0 },
        { x: 0.3, y: 0.4, label: 1 },
      ];

      chart.renderData(points);

      const circles = container.querySelectorAll('.data-point');
      expect(circles).toHaveLength(3);
    });

    it('should color points by label', () => {
      const points: Point[] = [
        { x: 0.5, y: 0.5, label: 1 },
        { x: -0.5, y: -0.5, label: 0 },
      ];

      chart.renderData(points);

      const circles = container.querySelectorAll('.data-point');
      const colors = Array.from(circles).map((c) => c.getAttribute('fill'));

      // Should have two different colors (blue and orange)
      expect(new Set(colors).size).toBe(2);
    });

    it('should position points correctly based on coordinates', () => {
      const points: Point[] = [{ x: 0, y: 0, label: 0 }];

      chart.renderData(points);

      const circle = container.querySelector('.data-point');
      const cx = parseFloat(circle?.getAttribute('cx') || '0');
      const cy = parseFloat(circle?.getAttribute('cy') || '0');

      // Center point (0, 0) should be in middle of chart
      // Exact values depend on margins and scale, but should be roughly middle
      expect(cx).toBeGreaterThan(200);
      expect(cx).toBeLessThan(300);
      expect(cy).toBeGreaterThan(200);
      expect(cy).toBeLessThan(300);
    });

    it('should handle empty dataset', () => {
      chart.renderData([]);

      const circles = container.querySelectorAll('.data-point');
      expect(circles).toHaveLength(0);
    });

    it('should replace previous data when called multiple times', () => {
      const points1: Point[] = [
        { x: 0.5, y: 0.5, label: 1 },
        { x: -0.5, y: -0.5, label: 0 },
      ];

      const points2: Point[] = [
        { x: 0.3, y: 0.3, label: 1 },
        { x: -0.3, y: -0.3, label: 0 },
        { x: 0.7, y: 0.7, label: 1 },
      ];

      chart.renderData(points1);
      expect(container.querySelectorAll('.data-point')).toHaveLength(2);

      chart.renderData(points2);
      expect(container.querySelectorAll('.data-point')).toHaveLength(3);
    });

    it('should handle large datasets efficiently', () => {
      const largeDataset: Point[] = [];
      for (let i = 0; i < 1000; i++) {
        largeDataset.push({
          x: Math.random() * 2 - 1,
          y: Math.random() * 2 - 1,
          label: Math.random() > 0.5 ? 1 : 0,
        });
      }

      const start = Date.now();
      chart.renderData(largeDataset);
      const elapsed = Date.now() - start;

      expect(container.querySelectorAll('.data-point')).toHaveLength(1000);
      expect(elapsed).toBeLessThan(1000); // Should render in less than 1 second
    });
  });

  // Helper to create valid prediction objects for tests
  const createPrediction = (predictedClass: number, confidence: number, x = 0, y = 0): Prediction => ({
    x,
    y,
    confidence,
    predictedClass,
  });

  describe('renderBoundary', () => {
    it('should render decision boundary contours', () => {
      const gridSize = 10;
      const predictions: Prediction[] = [];

      // Create a simple gradient from 0 to 1
      for (let i = 0; i < gridSize * gridSize; i++) {
        predictions.push(createPrediction(i > 50 ? 1 : 0, i / 100));
      }

      chart.renderBoundary(predictions, gridSize);

      const boundary = container.querySelector('.boundary');
      expect(boundary).not.toBeNull();
    });

    it('should handle different grid sizes', () => {
      const testGridSize = (size: number) => {
        const predictions: Prediction[] = [];
        for (let i = 0; i < size * size; i++) {
          predictions.push(createPrediction(Math.random() > 0.5 ? 1 : 0, Math.random()));
        }

        chart.renderBoundary(predictions, size);
        const boundary = container.querySelector('.boundary');
        expect(boundary).not.toBeNull();
      };

      testGridSize(10);
      testGridSize(20);
      testGridSize(50);
    });

    it('should warn for mismatched prediction count', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const predictions: Prediction[] = [
        createPrediction(0, 0.5),
        createPrediction(1, 0.7),
      ];

      chart.renderBoundary(predictions, 10); // Expects 100 predictions

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Expected 100 predictions')
      );

      consoleSpy.mockRestore();
    });

    it('should render boundary behind data points', () => {
      const points: Point[] = [{ x: 0, y: 0, label: 0 }];
      const predictions: Prediction[] = [];

      for (let i = 0; i < 100; i++) {
        predictions.push(createPrediction(0, 0.5));
      }

      chart.renderData(points);
      chart.renderBoundary(predictions, 10);

      const boundary = container.querySelector('.boundary');
      const dataPoint = container.querySelector('.data-point');

      // Data point should come after boundary in DOM (rendered on top)
      const boundaryIndex = Array.from(container.querySelectorAll('*')).indexOf(
        boundary as Element
      );
      const dataPointIndex = Array.from(container.querySelectorAll('*')).indexOf(
        dataPoint as Element
      );

      expect(dataPointIndex).toBeGreaterThan(boundaryIndex);
    });

    it('should replace previous boundary when called multiple times', () => {
      const predictions: Prediction[] = [];
      for (let i = 0; i < 100; i++) {
        predictions.push(createPrediction(0, 0.5));
      }

      chart.renderBoundary(predictions, 10);
      chart.renderBoundary(predictions, 10);

      const boundaries = container.querySelectorAll('.boundary');
      expect(boundaries).toHaveLength(1);
    });

    it('should handle uniform confidence values', () => {
      const predictions: Prediction[] = [];
      for (let i = 0; i < 100; i++) {
        predictions.push(createPrediction(0, 0.5));
      }

      chart.renderBoundary(predictions, 10);

      const boundary = container.querySelector('.boundary');
      expect(boundary).not.toBeNull();
    });

    it('should handle extreme confidence values', () => {
      const predictions: Prediction[] = [];
      for (let i = 0; i < 100; i++) {
        predictions.push(createPrediction(i < 50 ? 0 : 1, i < 50 ? 0 : 1));
      }

      chart.renderBoundary(predictions, 10);

      const boundary = container.querySelector('.boundary');
      expect(boundary).not.toBeNull();
    });
  });

  describe('clear', () => {
    it('should remove all data points', () => {
      const points: Point[] = [
        { x: 0.5, y: 0.5, label: 1 },
        { x: -0.5, y: -0.5, label: 0 },
      ];

      chart.renderData(points);
      expect(container.querySelectorAll('.data-point')).toHaveLength(2);

      chart.clear();
      expect(container.querySelectorAll('.data-point')).toHaveLength(0);
    });

    it('should remove boundary', () => {
      const predictions: Prediction[] = [];
      for (let i = 0; i < 100; i++) {
        predictions.push(createPrediction(0, 0.5));
      }

      chart.renderBoundary(predictions, 10);
      expect(container.querySelector('.boundary')).not.toBeNull();

      chart.clear();
      expect(container.querySelector('.boundary')).toBeNull();
    });

    it('should preserve axes after clearing', () => {
      chart.clear();

      const xAxis = container.querySelector('.x-axis');
      const yAxis = container.querySelector('.y-axis');

      expect(xAxis).not.toBeNull();
      expect(yAxis).not.toBeNull();
    });
  });

  describe('dispose', () => {
    it('should remove all SVG content', () => {
      chart.dispose();

      const svg = container.querySelector('svg');
      expect(svg).toBeNull();
    });

    it('should clean up container completely', () => {
      chart.dispose();

      expect(container.children.length).toBe(0);
    });

    it('should be safe to call multiple times', () => {
      chart.dispose();
      chart.dispose();

      expect(container.children.length).toBe(0);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete visualization workflow', () => {
      const points: Point[] = [
        { x: 0.5, y: 0.5, label: 1 },
        { x: -0.5, y: -0.5, label: 0 },
        { x: 0.3, y: 0.4, label: 1 },
        { x: -0.3, y: -0.4, label: 0 },
      ];

      const predictions: Prediction[] = [];
      for (let i = 0; i < 100; i++) {
        predictions.push(createPrediction(Math.random() > 0.5 ? 1 : 0, Math.random()));
      }

      // Render boundary first
      chart.renderBoundary(predictions, 10);
      expect(container.querySelector('.boundary')).not.toBeNull();

      // Then render data on top
      chart.renderData(points);
      expect(container.querySelectorAll('.data-point')).toHaveLength(4);

      // Clear everything
      chart.clear();
      expect(container.querySelector('.boundary')).toBeNull();
      expect(container.querySelectorAll('.data-point')).toHaveLength(0);
    });

    it('should maintain state across multiple render cycles', () => {
      for (let cycle = 0; cycle < 5; cycle++) {
        const points: Point[] = [{ x: cycle * 0.1, y: cycle * 0.1, label: 0 }];
        chart.renderData(points);
        expect(container.querySelectorAll('.data-point')).toHaveLength(1);
      }
    });
  });
});
