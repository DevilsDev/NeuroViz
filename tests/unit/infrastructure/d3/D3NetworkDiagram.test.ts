/**
 * D3NetworkDiagram Infrastructure Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { D3NetworkDiagram } from '../../../../src/infrastructure/d3/D3NetworkDiagram';

describe('D3NetworkDiagram', () => {
  let chart: D3NetworkDiagram;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '300px';
    container.style.height = '200px';
    document.body.appendChild(container);

    chart = new D3NetworkDiagram(container);
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
  });

  describe('render', () => {
    it('should render simple network', () => {
      const layers = [2, 3, 1]; // 2 inputs, 3 hidden, 1 output
      expect(() => chart.render(layers)).not.toThrow();
    });

    it('should render with activations', () => {
      const layers = [2, 4, 2];
      const activations = ['relu', 'sigmoid'];
      expect(() => chart.render(layers, activations)).not.toThrow();
    });

    it('should handle single layer', () => {
      const layers = [5];
      expect(() => chart.render(layers)).not.toThrow();
    });

    it('should handle empty layers', () => {
      const layers: number[] = [];
      expect(() => chart.render(layers)).not.toThrow();
    });

    it('should handle deep network', () => {
      const layers = [2, 8, 8, 8, 8, 2];
      expect(() => chart.render(layers)).not.toThrow();
    });

    it('should handle wide network', () => {
      const layers = [10, 50, 10];
      expect(() => chart.render(layers)).not.toThrow();
    });

    it('should render with weights', () => {
      const layers = [2, 2];
      const activations = ['relu'];
      const weights = [
        [[0.5, 0.3], [0.2, 0.8]], // First layer weights
      ];
      expect(() => chart.render(layers, activations, weights)).not.toThrow();
    });

    it('should render with dropout mask', () => {
      const layers = [2, 4, 2];
      const activations = ['relu', 'sigmoid'];
      const dropoutMask = [
        [true, false, true, false], // Hidden layer 1 dropout
      ];
      expect(() => chart.render(layers, activations, undefined, dropoutMask)).not.toThrow();
    });

    it('should handle zero-sized layers', () => {
      const layers = [2, 0, 1];
      expect(() => chart.render(layers)).not.toThrow();
    });

    it('should update existing diagram', () => {
      chart.render([2, 3, 1]);
      expect(() => chart.render([3, 5, 2])).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear diagram', () => {
      chart.render([2, 3, 1]);
      expect(() => chart.clear()).not.toThrow();
    });

    it('should allow render after clear', () => {
      chart.render([2, 3, 1]);
      chart.clear();
      expect(() => chart.render([3, 4, 2])).not.toThrow();
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
    it('should handle very deep network', () => {
      const layers = Array(20).fill(4);
      expect(() => chart.render(layers)).not.toThrow();
    });

    it('should handle network with one node per layer', () => {
      const layers = [1, 1, 1, 1];
      expect(() => chart.render(layers)).not.toThrow();
    });

    it('should handle mismatched activation array', () => {
      const layers = [2, 3, 1];
      const activations = ['relu']; // Too few activations
      expect(() => chart.render(layers, activations)).not.toThrow();
    });

    it('should handle empty activation array', () => {
      const layers = [2, 3, 1];
      const activations: string[] = [];
      expect(() => chart.render(layers, activations)).not.toThrow();
    });
  });
});
