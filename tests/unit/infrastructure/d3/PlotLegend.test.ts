import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderPlotLegend, EMPTY_LEGEND_STATE } from '../../../../src/infrastructure/d3/PlotLegend';
import { D3Chart } from '../../../../src/infrastructure/d3/D3Chart';
import type { Point, Prediction } from '../../../../src/core/domain';

const labels = (el: HTMLElement): string[] =>
  Array.from(el.querySelectorAll('.viz-legend-item')).map((i) => i.textContent ?? '');

describe('renderPlotLegend', () => {
  let el: HTMLElement;

  beforeEach(() => {
    el = document.createElement('div');
  });

  it('is hidden when no data is shown', () => {
    renderPlotLegend(el, EMPTY_LEGEND_STATE);
    expect(el.hidden).toBe(true);
    expect(el.children).toHaveLength(0);
  });

  it('lists each class plus the active overlays', () => {
    renderPlotLegend(el, {
      ...EMPTY_LEGEND_STATE,
      classes: [0, 1],
      hasValidation: true,
      showMisclassified: true,
      binaryBoundary: true,
    });
    expect(el.hidden).toBe(false);
    expect(labels(el)).toEqual([
      'Class 0',
      'Class 1',
      'Validation point',
      'Misclassified',
      'Model confidence (class 0 ↔ class 1)',
    ]);
  });

  it('builds text with DOM nodes, never markup', () => {
    renderPlotLegend(el, { ...EMPTY_LEGEND_STATE, classes: [0] });
    expect(el.querySelector('script, img')).toBeNull();
    expect(el.querySelector('.viz-legend-swatch')?.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('D3Chart legend and axis titles', () => {
  let container: HTMLDivElement;
  let legend: HTMLDivElement;
  let chart: D3Chart;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'legend-test-chart';
    legend = document.createElement('div');
    legend.id = 'viz-legend';
    legend.hidden = true;
    document.body.append(container, legend);
    chart = new D3Chart('legend-test-chart');
  });

  afterEach(() => {
    chart.dispose();
    container.remove();
    legend.remove();
  });

  const points: Point[] = [
    { x: -0.5, y: 0.2, label: 0 },
    { x: 0.5, y: -0.2, label: 1 },
    { x: 0.1, y: 0.1, label: 1, isValidation: true },
  ];

  it('labels the axes with the input features', () => {
    const titles = Array.from(container.querySelectorAll('.axis-title')).map((t) => t.textContent);
    expect(titles).toEqual(['x₁ →', 'x₂ ↑']);
  });

  it('updates the legend as data, boundary and highlights change', () => {
    chart.renderData(points);
    expect(labels(legend)).toEqual(['Class 0', 'Class 1', 'Validation point']);

    const grid: Prediction[] = Array.from({ length: 4 }, (_, i) => ({
      x: i % 2, y: Math.floor(i / 2), confidence: 0.6, predictedClass: 0, probabilities: [0.6, 0.4],
    }));
    chart.renderBoundary(grid, 2);
    expect(labels(legend)).toContain('Model confidence (class 0 ↔ class 1)');

    const preds: Prediction[] = points.map((p) => ({
      x: p.x, y: p.y, confidence: 0.9, predictedClass: 0, probabilities: [0.9, 0.1],
    }));
    chart.highlightMisclassified(preds);
    expect(labels(legend)).toContain('Misclassified');

    chart.clearMisclassifiedHighlight();
    expect(labels(legend)).not.toContain('Misclassified');

    chart.clear();
    expect(legend.hidden).toBe(true);
  });
});
