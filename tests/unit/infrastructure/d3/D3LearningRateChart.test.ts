/**
 * D3LearningRateChart Infrastructure Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { D3LearningRateChart } from '../../../../src/infrastructure/d3/D3LearningRateChart';
import type { TrainingHistory } from '../../../../src/core/domain/TrainingHistory';

const rec = (epoch: number) => ({
  epoch, loss: 1 / epoch, valLoss: null, accuracy: 0.5 + epoch / 100,
  valAccuracy: null, timestamp: 0, learningRate: 0.01 * epoch,
});
const historyOf = (n: number): TrainingHistory =>
  ({ records: Array.from({ length: n }, (_, i) => rec(i + 1)), bestLoss: null, bestEpoch: null } as unknown as TrainingHistory);

interface Internals {
  xScale: { domain(): number[]; range(): number[] };
  yScale: { range(): number[] };
}

describe('D3LearningRateChart', () => {
  const containerId = 'test-D3LearningRateChart';
  let chart: D3LearningRateChart;

  beforeEach(() => {
    const container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);
    chart = new D3LearningRateChart(containerId);
  });

  afterEach(() => {
    chart.dispose();
    document.getElementById(containerId)?.remove();
    vi.restoreAllMocks();
  });

  it('aligns the epoch axis with the loss chart ([1, maxEpoch])', () => {
    chart.render(historyOf(10));
    expect((chart as unknown as Internals).xScale.domain()).toEqual([1, 10]);
  });

  it('observes its container for resizes', () => {
    expect((chart as unknown as { resizeObserver: unknown }).resizeObserver).toBeTruthy();
  });

  it('resize() updates viewBox, scale ranges and x-axis position', () => {
    chart.render(historyOf(5));
    chart.resize(800, 200);

    const svg = document.querySelector(`#${containerId} svg`);
    expect(svg?.getAttribute('viewBox')).toBe('0 0 800 200');

    const internals = chart as unknown as Internals;
    // margins: left 45, right 10, top 8, bottom 20
    expect(internals.xScale.range()).toEqual([0, 745]);
    expect(internals.yScale.range()).toEqual([172, 0]);
    expect(document.querySelector(`#${containerId} .x-axis`)?.getAttribute('transform')).toBe('translate(0,172)');
  });

  it('resize() ignores dimensions smaller than the margins', () => {
    chart.resize(10, 10);
    const svg = document.querySelector(`#${containerId} svg`);
    expect(svg?.getAttribute('viewBox')).not.toBe('0 0 10 10');
  });

  it('dispose() disconnects the resize observer', () => {
    const disconnect = vi.spyOn(ResizeObserver.prototype, 'disconnect');
    chart.dispose();
    expect(disconnect).toHaveBeenCalled();
  });
});
