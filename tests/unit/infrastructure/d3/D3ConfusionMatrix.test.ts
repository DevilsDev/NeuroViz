/**
 * D3ConfusionMatrix Infrastructure Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { D3ConfusionMatrix, type ConfusionMatrixData } from '../../../../src/infrastructure/d3/D3ConfusionMatrix';

describe('D3ConfusionMatrix', () => {
  let chart: D3ConfusionMatrix;
  const containerId = 'test-confusion-matrix';

  beforeEach(() => {
    const container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);

    chart = new D3ConfusionMatrix(containerId);
  });

  afterEach(() => {
    chart.dispose();
    const container = document.getElementById(containerId);
    if (container) {
      document.body.removeChild(container);
    }
  });

  describe('initialization', () => {
    it('should create chart in specified container', () => {
      const container = document.getElementById(containerId);
      expect(container).not.toBeNull();
    });

    it('should throw error if container not found', () => {
      expect(() => new D3ConfusionMatrix('non-existent')).toThrow(
        'Container element #non-existent not found'
      );
    });
  });

  describe('render', () => {
    it('should render binary classification confusion matrix', () => {
      const data: ConfusionMatrixData = {
        matrix: [
          [45, 5],
          [3, 47],
        ],
        labels: ['Class 0', 'Class 1'],
        total: 100,
      };

      expect(() => chart.render(data)).not.toThrow();

      const container = document.getElementById(containerId);
      const svg = container?.querySelector('svg');
      expect(svg).not.toBeNull();
    });

    it('should render multi-class confusion matrix', () => {
      const data: ConfusionMatrixData = {
        matrix: [
          [30, 2, 1],
          [1, 28, 2],
          [2, 1, 30],
        ],
        labels: ['Class A', 'Class B', 'Class C'],
        total: 97,
      };

      expect(() => chart.render(data)).not.toThrow();
    });

    it('should handle empty matrix', () => {
      const data: ConfusionMatrixData = {
        matrix: [],
        labels: [],
        total: 0,
      };

      expect(() => chart.render(data)).not.toThrow();
    });

    it('should handle single class', () => {
      const data: ConfusionMatrixData = {
        matrix: [[50]],
        labels: ['Single Class'],
        total: 50,
      };

      expect(() => chart.render(data)).not.toThrow();
    });

    it('should handle zero total', () => {
      const data: ConfusionMatrixData = {
        matrix: [
          [0, 0],
          [0, 0],
        ],
        labels: ['Class 0', 'Class 1'],
        total: 0,
      };

      expect(() => chart.render(data)).not.toThrow();
    });

    it('should update existing visualization', () => {
      const data1: ConfusionMatrixData = {
        matrix: [
          [10, 5],
          [3, 12],
        ],
        labels: ['A', 'B'],
        total: 30,
      };

      const data2: ConfusionMatrixData = {
        matrix: [
          [45, 5],
          [3, 47],
        ],
        labels: ['A', 'B'],
        total: 100,
      };

      chart.render(data1);
      expect(() => chart.render(data2)).not.toThrow();
    });

    it('should handle large matrices', () => {
      const numClasses = 10;
      const matrix = Array(numClasses).fill(null).map(() =>
        Array(numClasses).fill(5)
      );

      const data: ConfusionMatrixData = {
        matrix,
        labels: Array(numClasses).fill(null).map((_, i) => `Class ${i}`),
        total: numClasses * numClasses * 5,
      };

      expect(() => chart.render(data)).not.toThrow();
    });

    it('should handle missing matrix values', () => {
      const data: ConfusionMatrixData = {
        matrix: [
          [10],
          [],
        ],
        labels: ['A', 'B'],
        total: 10,
      };

      expect(() => chart.render(data)).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear visualization', () => {
      const data: ConfusionMatrixData = {
        matrix: [
          [45, 5],
          [3, 47],
        ],
        labels: ['Class 0', 'Class 1'],
        total: 100,
      };

      chart.render(data);
      expect(() => chart.clear()).not.toThrow();
    });

    it('should allow render after clear', () => {
      const data: ConfusionMatrixData = {
        matrix: [[50]],
        labels: ['A'],
        total: 50,
      };

      chart.render(data);
      chart.clear();
      expect(() => chart.render(data)).not.toThrow();
    });
  });

  describe('dispose', () => {
    it('should clean up resources', () => {
      const data: ConfusionMatrixData = {
        matrix: [[50]],
        labels: ['A'],
        total: 50,
      };

      chart.render(data);
      expect(() => chart.dispose()).not.toThrow();
    });

    it('should be safe to call multiple times', () => {
      expect(() => {
        chart.dispose();
        chart.dispose();
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle very large values', () => {
      const data: ConfusionMatrixData = {
        matrix: [
          [1000000, 100],
          [50, 900000],
        ],
        labels: ['A', 'B'],
        total: 1900150,
      };

      expect(() => chart.render(data)).not.toThrow();
    });

    it('should handle asymmetric matrices', () => {
      const data: ConfusionMatrixData = {
        matrix: [
          [10, 5, 2],
          [3, 12],
        ],
        labels: ['A', 'B'],
        total: 32,
      };

      expect(() => chart.render(data)).not.toThrow();
    });

    it('should handle special characters in labels', () => {
      const data: ConfusionMatrixData = {
        matrix: [[50]],
        labels: ['Class <>&"\''],
        total: 50,
      };

      expect(() => chart.render(data)).not.toThrow();
    });
  });
});
