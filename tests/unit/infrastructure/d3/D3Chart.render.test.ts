/**
 * D3Chart rendering tests: tooltips, multi-class boundary, point styling, export.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as d3 from 'd3';
import { D3Chart } from '../../../../src/infrastructure/d3/D3Chart';
import type { Point, Prediction } from '../../../../src/core/domain';

const hover = (el: Element | null, type: 'mouseenter' | 'mouseleave'): void => {
  el?.dispatchEvent(new MouseEvent(type, { bubbles: false, clientX: 5, clientY: 5 }));
};

describe('D3Chart - rendering', () => {
  let container: HTMLDivElement;
  let chart: D3Chart;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'render-test-chart';
    document.body.appendChild(container);
    chart = new D3Chart('render-test-chart');
  });

  afterEach(() => {
    chart.dispose();
    container.remove();
    vi.restoreAllMocks();
  });

  const tooltip = (): d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown> =>
    (chart as unknown as { tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown> }).tooltip;

  const isVisible = (): boolean =>
    tooltip().style('opacity') === '1' && tooltip().style('display') !== 'none';

  describe('tooltips', () => {
    const points: Point[] = [{ x: 0.1, y: 0.2, label: 0 }];

    it('shows the adversarial tooltip', () => {
      chart.renderAdversarialPoints([{ x: 0.5, y: 0.5, label: 1, isAdversarial: true }]);
      hover(container.querySelector('.adversarial-point'), 'mouseenter');
      expect(isVisible()).toBe(true);
    });

    it('still shows data-point tooltips after hovering an adversarial point', () => {
      chart.renderData(points);
      chart.renderAdversarialPoints([{ x: 0.5, y: 0.5, label: 1, isAdversarial: true }]);

      hover(container.querySelector('.adversarial-point'), 'mouseenter');
      hover(container.querySelector('.adversarial-point'), 'mouseleave');
      expect(isVisible()).toBe(false);

      hover(container.querySelector('.data-point'), 'mouseenter');
      expect(isVisible()).toBe(true);

      hover(container.querySelector('.data-point'), 'mouseleave');
      expect(isVisible()).toBe(false);
    });
  });

  describe('multi-class boundary', () => {
    const grid = (gridSize: number, cls: number): Prediction[] =>
      Array.from({ length: gridSize * gridSize }, (_, i) => ({
        x: i % gridSize,
        y: Math.floor(i / gridSize),
        confidence: 0.6,
        predictedClass: (i + cls) % 3,
        probabilities: [0.2, 0.2, 0.6],
      })) as unknown as Prediction[];

    const rects = (): Element[] => Array.from(container.querySelectorAll('.boundary rect'));

    it('reuses the same rect nodes across renders with the same grid size', () => {
      chart.renderBoundary(grid(4, 0), 4);
      const before = rects();
      expect(before).toHaveLength(16);
      const fillBefore = before[0]?.getAttribute('fill');

      chart.renderBoundary(grid(4, 1), 4);
      const after = rects();
      expect(after).toHaveLength(16);
      after.forEach((node, i) => expect(node).toBe(before[i]));
      // fills are updated in place
      expect(after[0]?.getAttribute('fill')).not.toBe(fillBefore);
    });

    it('adds and removes cells when the grid size changes', () => {
      chart.renderBoundary(grid(4, 0), 4);
      chart.renderBoundary(grid(6, 0), 6);
      expect(rects()).toHaveLength(36);
      chart.renderBoundary(grid(3, 0), 3);
      expect(rects()).toHaveLength(9);
      expect(container.querySelectorAll('.boundary')).toHaveLength(1);
    });

    it('replaces the multi-class boundary when switching to binary', () => {
      chart.renderBoundary(grid(4, 0), 4);
      const binary = Array.from({ length: 16 }, (_, i) => ({
        x: 0, y: 0, confidence: (i % 4) / 4, predictedClass: 0, probabilities: [0.5, 0.5],
      })) as unknown as Prediction[];
      chart.renderBoundary(binary, 4);
      expect(rects()).toHaveLength(0);
      expect(container.querySelectorAll('.boundary')).toHaveLength(1);
    });
  });
});
