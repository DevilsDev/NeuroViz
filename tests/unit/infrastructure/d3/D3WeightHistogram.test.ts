/**
 * D3WeightHistogram Infrastructure Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { D3WeightHistogram } from '../../../../src/infrastructure/d3/D3WeightHistogram';

describe('D3WeightHistogram', () => {
  let chart: D3WeightHistogram;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '200px';
    container.style.height = '100px';
    document.body.appendChild(container);

    chart = new D3WeightHistogram(container);
  });

  afterEach(() => {
    chart.dispose();
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  describe('initialization', () => {
    it('should create SVG in container', () => {
      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();
    });

    it('should set proper attributes', () => {
      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('width')).toBe('100%');
      expect(svg?.getAttribute('height')).toBe('100%');
    });
  });

  describe('update', () => {
    it('should handle empty weights', () => {
      expect(() => chart.update([])).not.toThrow();

      const text = container.querySelector('text');
      expect(text?.textContent).toBe('No weights');
    });

    it('should update with weights', () => {
      const weights = [-0.5, -0.2, 0, 0.1, 0.3, 0.5, 0.7];
      expect(() => chart.update(weights)).not.toThrow();
    });

    it('should handle single weight', () => {
      expect(() => chart.update([0.5])).not.toThrow();
    });

    it('should handle many weights', () => {
      const weights = Array(1000).fill(0).map(() => Math.random() - 0.5);
      expect(() => chart.update(weights)).not.toThrow();
    });

    it('should handle all negative weights', () => {
      const weights = [-1, -0.5, -0.1];
      expect(() => chart.update(weights)).not.toThrow();
    });

    it('should handle all positive weights', () => {
      const weights = [0.1, 0.5, 1];
      expect(() => chart.update(weights)).not.toThrow();
    });

    it('should handle zero weights', () => {
      const weights = [0, 0, 0];
      expect(() => chart.update(weights)).not.toThrow();
    });

    it('should handle large weight values', () => {
      const weights = [-100, -50, 0, 50, 100];
      expect(() => chart.update(weights)).not.toThrow();
    });

    it('should handle small weight values', () => {
      const weights = [-0.00001, 0, 0.00001];
      expect(() => chart.update(weights)).not.toThrow();
    });

    it('should update multiple times', () => {
      chart.update([0.1, 0.2]);
      expect(() => chart.update([0.5, 0.6, 0.7])).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear visualization', () => {
      chart.update([0.1, 0.5]);
      expect(() => chart.clear()).not.toThrow();
    });

    it('should allow update after clear', () => {
      chart.update([0.1]);
      chart.clear();
      expect(() => chart.update([0.2])).not.toThrow();
    });
  });

  describe('dispose', () => {
    it('should clean up resources', () => {
      expect(() => chart.dispose()).not.toThrow();
    });

    it('should be safe to call multiple times', () => {
      chart.dispose();
      expect(() => chart.dispose()).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle NaN values', () => {
      const weights = [NaN, 0.5, NaN];
      expect(() => chart.update(weights)).not.toThrow();
    });

    it('should handle Infinity values', () => {
      const weights = [Infinity, -Infinity, 0];
      expect(() => chart.update(weights)).not.toThrow();
    });

    it('should handle very wide range', () => {
      const weights = [-1000, -0.001, 0, 0.001, 1000];
      expect(() => chart.update(weights)).not.toThrow();
    });

    it('should handle weights from normal distribution', () => {
      const weights = Array(100).fill(0).map(() => {
        // Box-Muller transform for normal distribution
        const u1 = Math.random();
        const u2 = Math.random();
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      });

      expect(() => chart.update(weights)).not.toThrow();
    });
  });
});
