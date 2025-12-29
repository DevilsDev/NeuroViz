/**
 * D3ActivationHeatmap Infrastructure Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { D3ActivationHeatmap } from '../../../../src/infrastructure/d3/D3ActivationHeatmap';

describe('D3ActivationHeatmap', () => {
  let chart: D3ActivationHeatmap;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '300px';
    container.style.height = '100px';
    document.body.appendChild(container);

    chart = new D3ActivationHeatmap(container);
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
    it('should render with activation data', () => {
      const activations = [
        [0.1, 0.5, 0.9],
        [0.2, 0.6, 0.8],
      ];

      expect(() => chart.render(activations)).not.toThrow();
    });

    it('should handle empty activations', () => {
      expect(() => chart.render([])).not.toThrow();
    });

    it('should render with layer names', () => {
      const activations = [[0.1, 0.5], [0.3, 0.7]];
      const layerNames = ['Layer 1', 'Layer 2'];

      expect(() => chart.render(activations, layerNames)).not.toThrow();
    });

    it('should handle single layer', () => {
      const activations = [[0.1, 0.5, 0.9]];

      expect(() => chart.render(activations)).not.toThrow();
    });

    it('should handle different layer sizes', () => {
      const activations = [
        [0.1, 0.5],
        [0.2, 0.6, 0.8, 0.9],
        [0.3],
      ];

      expect(() => chart.render(activations)).not.toThrow();
    });

    it('should handle zero activations', () => {
      const activations = [[0, 0, 0], [0, 0]];

      expect(() => chart.render(activations)).not.toThrow();
    });

    it('should handle values outside [0,1]', () => {
      const activations = [[-0.5, 1.5], [0.5, 2.0]];

      expect(() => chart.render(activations)).not.toThrow();
    });

    it('should handle many layers', () => {
      const activations = Array(10).fill(null).map(() =>
        Array(5).fill(0).map(() => Math.random())
      );

      expect(() => chart.render(activations)).not.toThrow();
    });

    it('should handle many neurons', () => {
      const activations = [[...Array(100).fill(0).map(() => Math.random())]];

      expect(() => chart.render(activations)).not.toThrow();
    });

    it('should update existing visualization', () => {
      chart.render([[0.1, 0.5]]);
      expect(() => chart.render([[0.3, 0.7]])).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear visualization', () => {
      chart.render([[0.1, 0.5]]);
      expect(() => chart.clear()).not.toThrow();
    });
  });

  describe('clear multiple times', () => {
    it('should be safe to call clear multiple times', () => {
      chart.clear();
      expect(() => chart.clear()).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle NaN values', () => {
      const activations = [[NaN, 0.5, NaN]];

      expect(() => chart.render(activations)).not.toThrow();
    });

    it('should handle Infinity values', () => {
      const activations = [[Infinity, -Infinity, 0]];

      expect(() => chart.render(activations)).not.toThrow();
    });

    it('should handle empty layer', () => {
      const activations = [[], [0.5]];

      expect(() => chart.render(activations)).not.toThrow();
    });
  });
});
