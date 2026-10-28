import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as d3 from 'd3';
import { D3Chart } from '../../../../src/infrastructure/d3/D3Chart';

describe('D3Chart - zoom', () => {
  let container: HTMLDivElement;
  let chart: D3Chart;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'zoom-test-chart';
    document.body.appendChild(container);
    chart = new D3Chart('zoom-test-chart');
    chart.setConfig({ zoomEnabled: true });
  });

  afterEach(() => {
    chart.dispose();
    container.remove();
  });

  function applyZoom(transform: d3.ZoomTransform): void {
    const internals = chart as unknown as {
      svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
      zoom: d3.ZoomBehavior<SVGSVGElement, unknown>;
    };
    internals.svg.call(internals.zoom.transform, transform);
  }

  const xTicks = (): string[] =>
    Array.from(container.querySelectorAll('.x-axis .tick text')).map((t) => t.textContent ?? '');

  it('should keep the margin offset and clip-path fixed while zooming', () => {
    const plotArea = container.querySelector('svg > g[clip-path]');
    const before = plotArea?.getAttribute('transform');

    applyZoom(d3.zoomIdentity.translate(40, 20).scale(2));

    expect(plotArea?.getAttribute('transform')).toBe(before);
    expect(before).toBe('translate(32,6)');
  });

  it('should rescale the axes to the zoomed domain and restore them on reset', () => {
    const initialTicks = xTicks();

    applyZoom(d3.zoomIdentity.scale(4));
    expect(xTicks()).not.toEqual(initialTicks);

    applyZoom(d3.zoomIdentity);
    expect(xTicks()).toEqual(initialTicks);
  });

  it('should keep the point under the cursor fixed in SVG coordinates', () => {
    const svgTransform = d3.zoomIdentity.translate(-100, -50).scale(2);
    applyZoom(svgTransform);

    const zoomLayer = container.querySelector('svg > g[clip-path] > g');
    const inner = zoomLayer?.getAttribute('transform') ?? '';
    const match = /translate\(([-\d.]+),([-\d.]+)\) scale\(([-\d.]+)\)/.exec(inner);
    expect(match).not.toBeNull();
    const [tx, ty, k] = [Number(match![1]), Number(match![2]), Number(match![3])];

    // A content point p (inner coords) is drawn at margin + inner(p) and must
    // land where the SVG-space zoom puts it: svgTransform(margin + p)
    const p = [50, 30] as const;
    const drawn = [32 + tx + k * p[0], 6 + ty + k * p[1]];
    expect(drawn).toEqual(svgTransform.apply([32 + p[0], 6 + p[1]]));
  });
});
