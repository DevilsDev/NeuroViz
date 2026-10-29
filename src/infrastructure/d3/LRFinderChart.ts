import * as d3 from 'd3';
import type { LRFinderPoint } from '../../core/application/training/LRFinderService';

const WIDTH = 280;
const HEIGHT = 140;
const MARGIN = { top: 8, right: 10, bottom: 30, left: 38 };

/**
 * Loss against learning rate (log scale) for the learning-rate finder, with
 * the suggested rate marked. Styled through CSS classes so it follows the theme.
 */
export function renderLRFinderChart(container: HTMLElement, points: readonly LRFinderPoint[], suggestedLR: number | null): void {
  d3.select(container).selectAll('*').remove();
  const valid = points.filter((p) => p.lr > 0 && Number.isFinite(p.loss));
  if (valid.length < 2) return;

  const svg = d3.select(container)
    .append('svg')
    .attr('class', 'lr-finder-chart')
    .attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`)
    .attr('role', 'img')
    .attr('aria-label', suggestedLR
      ? `Loss against learning rate. Suggested rate ${suggestedLR}.`
      : 'Loss against learning rate.');

  const innerW = WIDTH - MARGIN.left - MARGIN.right;
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

  const [lrMin, lrMax] = d3.extent(valid, (d) => d.lr) as [number, number];
  const [lossMin, lossMax] = d3.extent(valid, (d) => d.loss) as [number, number];
  const x = d3.scaleLog().domain([lrMin, lrMax]).range([0, innerW]);
  const pad = (lossMax - lossMin) * 0.08 || 0.05;
  const y = d3.scaleLinear().domain([Math.max(0, lossMin - pad), lossMax + pad]).range([innerH, 0]).nice();

  g.append('g')
    .attr('class', 'lr-finder-axis')
    .attr('transform', `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(4, '.0e').tickSizeOuter(0));
  g.append('g')
    .attr('class', 'lr-finder-axis')
    .call(d3.axisLeft(y).ticks(4).tickSizeOuter(0));

  g.append('text')
    .attr('class', 'lr-finder-label')
    .attr('x', innerW / 2)
    .attr('y', innerH + 26)
    .attr('text-anchor', 'middle')
    .text('Learning rate (log scale)');

  if (suggestedLR !== null && suggestedLR >= lrMin && suggestedLR <= lrMax) {
    const sx = x(suggestedLR);
    g.append('line')
      .attr('class', 'lr-finder-suggestion')
      .attr('x1', sx).attr('x2', sx)
      .attr('y1', 0).attr('y2', innerH);
  }

  g.append('path')
    .datum(valid)
    .attr('class', 'lr-finder-line')
    .attr('d', d3.line<LRFinderPoint>().x((d) => x(d.lr)).y((d) => y(d.loss)).curve(d3.curveMonotoneX));
}
