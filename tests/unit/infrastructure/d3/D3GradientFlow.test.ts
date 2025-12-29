/**
 * D3GradientFlow Infrastructure Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { D3GradientFlow, type GradientData } from '../../../../src/infrastructure/d3/D3GradientFlow';

describe('D3GradientFlow', () => {
  let chart: D3GradientFlow;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '300px';
    container.style.height = '150px';
    document.body.appendChild(container);

    chart = new D3GradientFlow(container);
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
    it('should render with gradient data', () => {
      const data: GradientData = {
        layerGradients: [
          [0.1, 0.5, 0.3],
          [0.2, 0.4],
        ],
        layerNames: ['Layer 1', 'Layer 2'],
        maxGradient: 0.5,
      };

      expect(() => chart.render(data)).not.toThrow();
    });

    it('should handle empty gradients', () => {
      const data: GradientData = {
        layerGradients: [],
        layerNames: [],
        maxGradient: 0,
      };

      expect(() => chart.render(data)).not.toThrow();
    });

    it('should handle zero max gradient', () => {
      const data: GradientData = {
        layerGradients: [[0, 0], [0, 0, 0]],
        layerNames: ['Layer 1', 'Layer 2'],
        maxGradient: 0,
      };

      expect(() => chart.render(data)).not.toThrow();
    });

    it('should handle single layer', () => {
      const data: GradientData = {
        layerGradients: [[0.1, 0.5, 0.9]],
        layerNames: ['Single Layer'],
        maxGradient: 0.9,
      };

      expect(() => chart.render(data)).not.toThrow();
    });

    it('should handle different layer sizes', () => {
      const data: GradientData = {
        layerGradients: [
          [0.1, 0.2],
          [0.3, 0.4, 0.5, 0.6],
          [0.7],
        ],
        layerNames: ['Layer 1', 'Layer 2', 'Layer 3'],
        maxGradient: 0.7,
      };

      expect(() => chart.render(data)).not.toThrow();
    });

    it('should handle large gradients', () => {
      const data: GradientData = {
        layerGradients: [[100, 200, 300]],
        layerNames: ['Large'],
        maxGradient: 300,
      };

      expect(() => chart.render(data)).not.toThrow();
    });

    it('should handle small gradients', () => {
      const data: GradientData = {
        layerGradients: [[0.0001, 0.0002]],
        layerNames: ['Small'],
        maxGradient: 0.0002,
      };

      expect(() => chart.render(data)).not.toThrow();
    });

    it('should update existing visualization', () => {
      const data1: GradientData = {
        layerGradients: [[0.1, 0.2]],
        layerNames: ['Layer'],
        maxGradient: 0.2,
      };

      const data2: GradientData = {
        layerGradients: [[0.5, 0.6]],
        layerNames: ['Layer'],
        maxGradient: 0.6,
      };

      chart.render(data1);
      expect(() => chart.render(data2)).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear visualization', () => {
      const data: GradientData = {
        layerGradients: [[0.1]],
        layerNames: ['Layer'],
        maxGradient: 0.1,
      };

      chart.render(data);
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
      const data: GradientData = {
        layerGradients: [[NaN, 0.5, NaN]],
        layerNames: ['Layer'],
        maxGradient: 0.5,
      };

      expect(() => chart.render(data)).not.toThrow();
    });

    it('should handle Infinity values', () => {
      const data: GradientData = {
        layerGradients: [[Infinity, -Infinity]],
        layerNames: ['Layer'],
        maxGradient: Infinity,
      };

      expect(() => chart.render(data)).not.toThrow();
    });

    it('should handle negative gradients', () => {
      const data: GradientData = {
        layerGradients: [[-0.5, -0.3, -0.1]],
        layerNames: ['Layer'],
        maxGradient: -0.1,
      };

      expect(() => chart.render(data)).not.toThrow();
    });

    it('should handle empty layer names', () => {
      const data: GradientData = {
        layerGradients: [[0.1, 0.2]],
        layerNames: [],
        maxGradient: 0.2,
      };

      expect(() => chart.render(data)).not.toThrow();
    });
  });
});
