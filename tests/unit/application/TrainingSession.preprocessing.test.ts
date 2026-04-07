import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrainingSession } from '../../../src/core/application/TrainingSession';
import type { INeuralNetworkService } from '../../../src/core/ports/INeuralNetworkService';
import type { IVisualizerService } from '../../../src/core/ports/IVisualizerService';
import type { IDatasetRepository } from '../../../src/core/ports/IDatasetRepository';
import type { Point } from '../../../src/core/domain';

function createMockNeuralNet(): INeuralNetworkService {
  return {
    initialize: vi.fn().mockResolvedValue(undefined),
    updateLearningRate: vi.fn(),
    train: vi.fn().mockResolvedValue({ loss: 0.5, accuracy: 0.8 }),
    predict: vi.fn().mockResolvedValue([]),
    evaluate: vi.fn().mockResolvedValue({ loss: 0.5, accuracy: 0.8 }),
    getWeightMatrices: vi.fn().mockReturnValue([]),
    getLayerActivations: vi.fn().mockReturnValue([]),
    loadModel: vi.fn().mockResolvedValue(undefined),
    getStructure: vi.fn().mockReturnValue(null),
    isReady: vi.fn().mockReturnValue(false),
    dispose: vi.fn(),
    getConfig: vi.fn().mockReturnValue(null),
    getWeights: vi.fn().mockReturnValue([]),
    generateDropoutMask: vi.fn().mockReturnValue([]),
    exportModel: vi.fn().mockResolvedValue({ modelJson: new Blob(), weightsBlob: new Blob() }),
  };
}

function createMockVisualizer(): IVisualizerService {
  return {
    renderData: vi.fn(),
    renderBoundary: vi.fn(),
    setConfig: vi.fn(),
    getConfig: vi.fn().mockReturnValue({}),
    enableDrawMode: vi.fn(),
    disableDrawMode: vi.fn(),
    isDrawModeEnabled: vi.fn().mockReturnValue(false),
    clear: vi.fn(),
    highlightMisclassified: vi.fn(),
    clearMisclassifiedHighlight: vi.fn(),
    renderConfidenceCircles: vi.fn(),
    clearConfidenceCircles: vi.fn(),
    exportAsPNGWithMetadata: vi.fn(),
    dispose: vi.fn(),
    setVoronoiOverlay: vi.fn(),
    setPointPredictions: vi.fn(),
  };
}

function createMockDataRepo(): IDatasetRepository {
  return {
    getDataset: vi.fn().mockResolvedValue([]),
  };
}

describe('TrainingSession - Preprocessing', () => {
  let session: TrainingSession;
  let mockDataRepo: IDatasetRepository;

  beforeEach(() => {
    const mockNeuralNet = createMockNeuralNet();
    const mockVisualizer = createMockVisualizer();
    mockDataRepo = createMockDataRepo();
    session = new TrainingSession(mockNeuralNet, mockVisualizer, mockDataRepo);
  });

  describe('normalize preprocessing', () => {
    it('should handle large datasets without stack overflow', async () => {
      // Generate a dataset larger than the typical call stack limit (~100k)
      const largeDataset: Point[] = [];
      for (let i = 0; i < 150000; i++) {
        largeDataset.push({ x: Math.random() * 10, y: Math.random() * 10, label: i % 2 });
      }
      vi.mocked(mockDataRepo.getDataset).mockResolvedValue(largeDataset);

      // This would throw RangeError with Math.min(...spread) on 150k items
      await expect(
        session.loadData('test', { preprocessing: 'normalize' })
      ).resolves.not.toThrow();
    });

    it('should normalize to [-1, 1] range', async () => {
      const data: Point[] = [
        { x: 0, y: 0, label: 0 },
        { x: 10, y: 20, label: 1 },
        { x: 5, y: 10, label: 0 },
      ];
      vi.mocked(mockDataRepo.getDataset).mockResolvedValue(data);
      await session.loadData('test', { preprocessing: 'normalize' });

      const points = session.getData();
      for (const p of points) {
        expect(p.x).toBeGreaterThanOrEqual(-1);
        expect(p.x).toBeLessThanOrEqual(1);
        expect(p.y).toBeGreaterThanOrEqual(-1);
        expect(p.y).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('standardize preprocessing', () => {
    it('should produce zero mean', async () => {
      const data: Point[] = [
        { x: 1, y: 2, label: 0 },
        { x: 3, y: 4, label: 1 },
        { x: 5, y: 6, label: 0 },
        { x: 7, y: 8, label: 1 },
      ];
      vi.mocked(mockDataRepo.getDataset).mockResolvedValue(data);
      await session.loadData('test', { preprocessing: 'standardize' });

      const points = session.getData();
      const xMean = points.reduce((sum, p) => sum + p.x, 0) / points.length;
      const yMean = points.reduce((sum, p) => sum + p.y, 0) / points.length;

      expect(xMean).toBeCloseTo(0, 10);
      expect(yMean).toBeCloseTo(0, 10);
    });
  });
});
