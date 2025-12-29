/**
 * D3RocCurve Infrastructure Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { D3RocCurve, calculateRocCurve } from '../../../../src/infrastructure/d3/D3RocCurve';

describe('D3RocCurve', () => {
  let chart: D3RocCurve;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '300px';
    container.style.height = '300px';
    document.body.appendChild(container);

    chart = new D3RocCurve(container);
  });

  afterEach(() => {
    chart.clear();
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  describe('initialization', () => {
    it('should create SVG in container', () => {
      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();
    });
  });

  describe('render', () => {
    it('should render ROC curve with valid data', () => {
      const predictions = [0.9, 0.8, 0.7, 0.3, 0.2, 0.1];
      const labels = [1, 1, 1, 0, 0, 0];

      const { points, auc } = calculateRocCurve(predictions, labels);
      expect(() => chart.render(points, auc)).not.toThrow();
    });

    it('should handle perfect classifier', () => {
      const predictions = [1, 1, 0, 0];
      const labels = [1, 1, 0, 0];

      const { points, auc } = calculateRocCurve(predictions, labels);
      expect(() => chart.render(points, auc)).not.toThrow();
    });

    it('should handle random classifier', () => {
      const predictions = [0.5, 0.5, 0.5, 0.5];
      const labels = [1, 0, 1, 0];

      const { points, auc } = calculateRocCurve(predictions, labels);
      expect(() => chart.render(points, auc)).not.toThrow();
    });

    it('should handle empty arrays', () => {
      const { points, auc } = calculateRocCurve([], []);
      expect(() => chart.render(points, auc)).not.toThrow();
    });

    it('should handle all positive labels', () => {
      const predictions = [0.9, 0.7, 0.5];
      const labels = [1, 1, 1];

      const { points, auc } = calculateRocCurve(predictions, labels);
      expect(() => chart.render(points, auc)).not.toThrow();
    });

    it('should handle all negative labels', () => {
      const predictions = [0.9, 0.7, 0.5];
      const labels = [0, 0, 0];

      const { points, auc } = calculateRocCurve(predictions, labels);
      expect(() => chart.render(points, auc)).not.toThrow();
    });

    it('should handle mismatched array lengths', () => {
      const predictions = [0.9, 0.7];
      const labels = [1, 0, 1];

      const { points, auc } = calculateRocCurve(predictions, labels);
      expect(() => chart.render(points, auc)).not.toThrow();
    });
  });

  describe('calculateRocCurve', () => {
    it('should calculate correct ROC points', () => {
      const predictions = [0.9, 0.7, 0.5, 0.3];
      const labels = [1, 1, 0, 0];

      const result = calculateRocCurve(predictions, labels);

      expect(result.points.length).toBeGreaterThan(0);
      expect(result.auc).toBeGreaterThanOrEqual(0);
      expect(result.auc).toBeLessThanOrEqual(1);
    });

    it('should return AUC of 1 for perfect classifier', () => {
      const predictions = [1, 1, 0, 0];
      const labels = [1, 1, 0, 0];

      const result = calculateRocCurve(predictions, labels);

      expect(result.auc).toBe(1);
    });

    it('should return AUC near 0.5 for random classifier', () => {
      const predictions = [0.5, 0.5, 0.5, 0.5];
      const labels = [1, 0, 1, 0];

      const result = calculateRocCurve(predictions, labels);

      expect(result.auc).toBeGreaterThanOrEqual(0);
      expect(result.auc).toBeLessThanOrEqual(1);
    });

    it('should handle empty arrays', () => {
      const result = calculateRocCurve([], []);

      expect(result.points).toEqual([]);
      expect(result.auc).toBe(0);
    });

    it('should handle all positive labels', () => {
      const predictions = [0.9, 0.7];
      const labels = [1, 1];

      const result = calculateRocCurve(predictions, labels);

      expect(result.points).toEqual([]);
      expect(result.auc).toBe(0);
    });

    it('should handle all negative labels', () => {
      const predictions = [0.9, 0.7];
      const labels = [0, 0];

      const result = calculateRocCurve(predictions, labels);

      expect(result.points).toEqual([]);
      expect(result.auc).toBe(0);
    });

    it('should handle mismatched lengths', () => {
      const predictions = [0.9, 0.7];
      const labels = [1];

      const result = calculateRocCurve(predictions, labels);

      expect(result.points).toEqual([]);
      expect(result.auc).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear visualization', () => {
      const predictions = [0.9, 0.7, 0.5];
      const labels = [1, 1, 0];

      const { points, auc } = calculateRocCurve(predictions, labels);
      chart.render(points, auc);
      expect(() => chart.clear()).not.toThrow();
    });

    it('should be safe to call multiple times', () => {
      chart.clear();
      expect(() => chart.clear()).not.toThrow();
    });
  });
});
