/**
 * D3LossChart Infrastructure Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { D3LossChart } from '../../../../src/infrastructure/d3/D3LossChart';
import type { TrainingHistory } from '../../../../src/core/domain/TrainingHistory';

describe('D3LossChart', () => {
  let chart: D3LossChart;
  const containerId = 'test-loss-chart';

  beforeEach(() => {
    // Setup DOM
    const container = document.createElement('div');
    container.id = containerId;
    container.style.width = '600px';
    container.style.height = '400px';
    document.body.appendChild(container);

    chart = new D3LossChart(containerId);
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
      const svg = container?.querySelector('svg');
      expect(svg).not.toBeNull();
    });

    it('should throw error if container not found', () => {
      expect(() => new D3LossChart('non-existent-container')).toThrow(
        'Container element with ID "non-existent-container" not found.'
      );
    });

    it('should create SVG with proper attributes', () => {
      const container = document.getElementById(containerId);
      const svg = container?.querySelector('svg');

      expect(svg?.getAttribute('width')).toBe('100%');
      expect(svg?.getAttribute('height')).toBe('100%');
      expect(svg?.hasAttribute('viewBox')).toBe(true);
    });

    it('should clear existing content', () => {
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = '<div>Old content</div>';
        const newChart = new D3LossChart(containerId);

        const oldContent = container.querySelector('div');
        expect(oldContent).toBeNull();

        newChart.dispose();
      }
    });
  });

  describe('update', () => {
    it('should handle empty training history', () => {
      const history: TrainingHistory = {
        records: [],
        initialLoss: 0,
        finalLoss: 0,
      };

      expect(() => chart.update(history)).not.toThrow();
    });

    it('should update with training records', () => {
      const history: TrainingHistory = {
        records: [
          { epoch: 1, loss: 1.0, learningRate: 0.01, accuracy: 0.5 },
          { epoch: 2, loss: 0.8, learningRate: 0.01, accuracy: 0.6 },
          { epoch: 3, loss: 0.6, learningRate: 0.01, accuracy: 0.7 },
        ],
        initialLoss: 1.0,
        finalLoss: 0.6,
      };

      expect(() => chart.update(history)).not.toThrow();
    });

    it('should handle validation loss in records', () => {
      const history: TrainingHistory = {
        records: [
          { epoch: 1, loss: 1.0, learningRate: 0.01, accuracy: 0.5, valLoss: 1.1 },
          { epoch: 2, loss: 0.8, learningRate: 0.01, accuracy: 0.6, valLoss: 0.9 },
        ],
        initialLoss: 1.0,
        finalLoss: 0.8,
      };

      expect(() => chart.update(history)).not.toThrow();
    });

    it('should handle single epoch', () => {
      const history: TrainingHistory = {
        records: [
          { epoch: 1, loss: 1.0, learningRate: 0.01, accuracy: 0.5 },
        ],
        initialLoss: 1.0,
        finalLoss: 1.0,
      };

      expect(() => chart.update(history)).not.toThrow();
    });

    it('should handle large epoch numbers', () => {
      const history: TrainingHistory = {
        records: [
          { epoch: 1000, loss: 0.5, learningRate: 0.01, accuracy: 0.9 },
          { epoch: 1001, loss: 0.4, learningRate: 0.01, accuracy: 0.91 },
        ],
        initialLoss: 1.0,
        finalLoss: 0.4,
      };

      expect(() => chart.update(history)).not.toThrow();
    });

    it('should handle accuracy values outside [0,1]', () => {
      const history: TrainingHistory = {
        records: [
          { epoch: 1, loss: 1.0, learningRate: 0.01, accuracy: -0.1 },
          { epoch: 2, loss: 0.8, learningRate: 0.01, accuracy: 1.5 },
        ],
        initialLoss: 1.0,
        finalLoss: 0.8,
      };

      expect(() => chart.update(history)).not.toThrow();
    });

    it('should update multiple times', () => {
      const history1: TrainingHistory = {
        records: [
          { epoch: 1, loss: 1.0, learningRate: 0.01, accuracy: 0.5 },
        ],
        initialLoss: 1.0,
        finalLoss: 1.0,
      };

      const history2: TrainingHistory = {
        records: [
          { epoch: 1, loss: 1.0, learningRate: 0.01, accuracy: 0.5 },
          { epoch: 2, loss: 0.8, learningRate: 0.01, accuracy: 0.6 },
        ],
        initialLoss: 1.0,
        finalLoss: 0.8,
      };

      expect(() => {
        chart.update(history1);
        chart.update(history2);
      }).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear chart data', () => {
      const history: TrainingHistory = {
        records: [
          { epoch: 1, loss: 1.0, learningRate: 0.01, accuracy: 0.5 },
        ],
        initialLoss: 1.0,
        finalLoss: 1.0,
      };

      chart.update(history);
      expect(() => chart.clear()).not.toThrow();
    });

    it('should allow update after clear', () => {
      const history: TrainingHistory = {
        records: [
          { epoch: 1, loss: 1.0, learningRate: 0.01, accuracy: 0.5 },
        ],
        initialLoss: 1.0,
        finalLoss: 1.0,
      };

      chart.update(history);
      chart.clear();
      expect(() => chart.update(history)).not.toThrow();
    });
  });

  describe('dispose', () => {
    it('should clean up DOM elements', () => {
      const container = document.getElementById(containerId);
      const svg = container?.querySelector('svg');
      expect(svg).not.toBeNull();

      chart.dispose();

      // SVG should be removed by dispose
      const svgAfter = container?.querySelector('svg');
      expect(svgAfter).toBeNull();
    });

    it('should be safe to call multiple times', () => {
      expect(() => {
        chart.dispose();
        chart.dispose();
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle very small loss values', () => {
      const history: TrainingHistory = {
        records: [
          { epoch: 1, loss: 0.00001, learningRate: 0.01, accuracy: 0.99 },
        ],
        initialLoss: 1.0,
        finalLoss: 0.00001,
      };

      expect(() => chart.update(history)).not.toThrow();
    });

    it('should handle very large loss values', () => {
      const history: TrainingHistory = {
        records: [
          { epoch: 1, loss: 1000000, learningRate: 0.01, accuracy: 0.1 },
        ],
        initialLoss: 1000000,
        finalLoss: 1000000,
      };

      expect(() => chart.update(history)).not.toThrow();
    });

    it('should handle zero loss', () => {
      const history: TrainingHistory = {
        records: [
          { epoch: 1, loss: 0, learningRate: 0.01, accuracy: 1.0 },
        ],
        initialLoss: 0,
        finalLoss: 0,
      };

      expect(() => chart.update(history)).not.toThrow();
    });

    it('should handle NaN values gracefully', () => {
      const history: TrainingHistory = {
        records: [
          { epoch: 1, loss: NaN, learningRate: 0.01, accuracy: NaN },
        ],
        initialLoss: 1.0,
        finalLoss: NaN,
      };

      expect(() => chart.update(history)).not.toThrow();
    });
  });
});
