import { describe, it, expect } from 'vitest';
import {
  previewPoints,
  renderDatasetPreview,
  renderAllDatasetPreviews,
} from '../../../src/presentation/DatasetPreviews';

const SVG_NS = 'http://www.w3.org/2000/svg';

describe('previewPoints', () => {
  it('is deterministic for a dataset', () => {
    expect(previewPoints('spiral')).toEqual(previewPoints('spiral'));
  });

  it('keeps points inside the plot', () => {
    for (const type of ['circle', 'xor', 'gaussian', 'spiral', 'clusters', 'iris', 'wine']) {
      const points = previewPoints(type);
      expect(points.length).toBeGreaterThan(0);
      for (const [x, y] of points) {
        expect(Math.abs(x)).toBeLessThanOrEqual(0.95);
        expect(Math.abs(y)).toBeLessThanOrEqual(0.95);
      }
    }
  });

  it('uses one label per class', () => {
    expect(new Set(previewPoints('circle').map((p) => p[2]))).toEqual(new Set([0, 1]));
    expect(new Set(previewPoints('clusters').map((p) => p[2])).size).toBe(4);
  });

  it('returns no points for an unknown dataset', () => {
    expect(previewPoints('nope')).toEqual([]);
  });
});

describe('renderDatasetPreview', () => {
  it('draws one circle per point and hides the thumbnail from screen readers', () => {
    const svg = document.createElementNS(SVG_NS, 'svg');
    renderDatasetPreview(svg, 'xor');
    expect(svg.querySelectorAll('circle')).toHaveLength(previewPoints('xor').length);
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('viewBox')).toBe('0 0 100 64');
  });

  it('replaces previous contents', () => {
    const svg = document.createElementNS(SVG_NS, 'svg');
    renderDatasetPreview(svg, 'xor');
    renderDatasetPreview(svg, 'xor');
    expect(svg.querySelectorAll('circle')).toHaveLength(previewPoints('xor').length);
  });
});

describe('renderAllDatasetPreviews', () => {
  it('fills every svg with a data-preview attribute', () => {
    const root = document.createElement('div');
    root.innerHTML = '<svg data-preview="circle"></svg><svg data-preview="spiral"></svg><svg></svg>';
    renderAllDatasetPreviews(root);
    const [circle, spiral, plain] = Array.from(root.querySelectorAll('svg'));
    expect(circle?.querySelectorAll('circle').length).toBeGreaterThan(0);
    expect(spiral?.querySelectorAll('circle').length).toBeGreaterThan(0);
    expect(plain?.querySelectorAll('circle')).toHaveLength(0);
  });
});
