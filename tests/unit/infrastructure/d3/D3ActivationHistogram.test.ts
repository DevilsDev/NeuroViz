/**
 * D3ActivationHistogram Infrastructure Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { D3ActivationHistogram, type LayerActivationData } from '../../../../src/infrastructure/d3/D3ActivationHistogram';

describe('D3ActivationHistogram', () => {
  let chart: D3ActivationHistogram;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '300px';
    container.style.height = '200px';
    document.body.appendChild(container);

    chart = new D3ActivationHistogram(container);
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

    it('should set viewBox attribute', () => {
      const svg = container.querySelector('svg');
      expect(svg?.hasAttribute('viewBox')).toBe(true);
    });

    it('should clear existing content', () => {
      container.innerHTML = '<div>Old</div>';
      const newChart = new D3ActivationHistogram(container);

      const oldDiv = container.querySelector('div');
      expect(oldDiv).toBeNull();

      newChart.dispose();
    });
  });

  describe('update', () => {
    it('should handle empty layers data', () => {
      expect(() => chart.update([])).not.toThrow();

      const text = container.querySelector('text');
      expect(text?.textContent).toBe('No activations');
    });

    it('should update with single layer', () => {
      const data: LayerActivationData[] = [
        {
          layerIndex: 0,
          layerName: 'Layer 1',
          activations: [0.1, 0.5, 0.9, 0.3, 0.7],
        },
      ];

      expect(() => chart.update(data)).not.toThrow();
    });

    it('should update with multiple layers', () => {
      const data: LayerActivationData[] = [
        {
          layerIndex: 0,
          layerName: 'Hidden 1',
          activations: [0.1, 0.5, 0.9],
        },
        {
          layerIndex: 1,
          layerName: 'Hidden 2',
          activations: [0.2, 0.6, 0.8],
        },
      ];

      expect(() => chart.update(data)).not.toThrow();
    });

    it('should handle empty activations array', () => {
      const data: LayerActivationData[] = [
        {
          layerIndex: 0,
          layerName: 'Empty Layer',
          activations: [],
        },
      ];

      expect(() => chart.update(data)).not.toThrow();
    });

    it('should handle negative activations', () => {
      const data: LayerActivationData[] = [
        {
          layerIndex: 0,
          layerName: 'Layer',
          activations: [-0.5, -0.1, 0.1, 0.5],
        },
      ];

      expect(() => chart.update(data)).not.toThrow();
    });

    it('should handle large activation values', () => {
      const data: LayerActivationData[] = [
        {
          layerIndex: 0,
          layerName: 'Layer',
          activations: [100, 200, 300],
        },
      ];

      expect(() => chart.update(data)).not.toThrow();
    });

    it('should handle many activations', () => {
      const data: LayerActivationData[] = [
        {
          layerIndex: 0,
          layerName: 'Large Layer',
          activations: Array(1000).fill(0).map(() => Math.random()),
        },
      ];

      expect(() => chart.update(data)).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear visualization', () => {
      const data: LayerActivationData[] = [
        {
          layerIndex: 0,
          layerName: 'Layer',
          activations: [0.1, 0.5],
        },
      ];

      chart.update(data);
      expect(() => chart.clear()).not.toThrow();
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
      const data: LayerActivationData[] = [
        {
          layerIndex: 0,
          layerName: 'Layer',
          activations: [NaN, 0.5, NaN],
        },
      ];

      expect(() => chart.update(data)).not.toThrow();
    });

    it('should handle Infinity values', () => {
      const data: LayerActivationData[] = [
        {
          layerIndex: 0,
          layerName: 'Layer',
          activations: [Infinity, -Infinity, 0],
        },
      ];

      expect(() => chart.update(data)).not.toThrow();
    });

    it('should handle all zero activations', () => {
      const data: LayerActivationData[] = [
        {
          layerIndex: 0,
          layerName: 'Dead Layer',
          activations: [0, 0, 0, 0],
        },
      ];

      expect(() => chart.update(data)).not.toThrow();
    });

    it('should handle all same values', () => {
      const data: LayerActivationData[] = [
        {
          layerIndex: 0,
          layerName: 'Saturated Layer',
          activations: [1, 1, 1, 1],
        },
      ];

      expect(() => chart.update(data)).not.toThrow();
    });
  });
});
