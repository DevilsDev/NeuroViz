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
});
