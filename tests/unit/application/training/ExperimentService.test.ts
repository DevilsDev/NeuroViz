import { describe, it, expect, beforeEach } from 'vitest';
import { ExperimentService, MAX_SNAPSHOTS } from '../../../../src/core/application/training/ExperimentService';
import type { Prediction } from '../../../../src/core/domain';

const preds = (tag: number): Prediction[] => [{ x: tag, y: 0, confidence: 0.5, predictedClass: 0 }];

describe('ExperimentService boundary recording', () => {
  let service: ExperimentService;

  beforeEach(() => {
    service = new ExperimentService();
  });

  it('records by default', () => {
    service.recordSnapshot(1, preds(1));
    expect(service.getBoundarySnapshots().map((s) => s.epoch)).toEqual([1]);
  });

  it('ignores empty predictions and respects setRecording(false)', () => {
    service.recordSnapshot(1, []);
    service.setRecording(false);
    service.recordSnapshot(2, preds(2));
    expect(service.getBoundarySnapshots()).toEqual([]);
  });

  it('copies predictions so later changes do not alter a frame', () => {
    const live = preds(1);
    service.recordSnapshot(1, live);
    live.push(...preds(2));
    expect(service.getBoundarySnapshots()[0]?.predictions).toHaveLength(1);
  });

  it('replaces a frame recorded twice for the same epoch', () => {
    service.recordSnapshot(5, preds(1));
    service.recordSnapshot(5, preds(2), true);
    const snapshots = service.getBoundarySnapshots();
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]?.predictions[0]?.x).toBe(2);
  });

  it('thins to at most MAX_SNAPSHOTS frames, evenly, keeping the first and latest', () => {
    for (let epoch = 1; epoch <= 1000; epoch++) service.recordSnapshot(epoch, preds(epoch));
    const epochs = service.getBoundarySnapshots().map((s) => s.epoch);
    expect(epochs.length).toBeLessThanOrEqual(MAX_SNAPSHOTS);
    expect(epochs.length).toBeGreaterThan(MAX_SNAPSHOTS / 2);
    expect(epochs[0]).toBe(1);
    expect([...epochs].sort((a, b) => a - b)).toEqual(epochs);
  });

  it('always records a forced (final) frame', () => {
    for (let epoch = 1; epoch <= 200; epoch++) service.recordSnapshot(epoch, preds(epoch));
    service.recordSnapshot(201, preds(201), true);
    const epochs = service.getBoundarySnapshots().map((s) => s.epoch);
    expect(epochs[epochs.length - 1]).toBe(201);
  });

  it('starts dense again after clearing', () => {
    for (let epoch = 1; epoch <= 500; epoch++) service.recordSnapshot(epoch, preds(epoch));
    service.clearBoundarySnapshots();
    service.recordSnapshot(1, preds(1));
    service.recordSnapshot(2, preds(2));
    expect(service.getBoundarySnapshots().map((s) => s.epoch)).toEqual([1, 2]);
  });
});
