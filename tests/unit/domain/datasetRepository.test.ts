import { describe, it, expect, beforeEach } from 'vitest';
import { MockDatasetRepository } from '../mocks';
import type { Point } from '../../../src/core/domain';

/**
 * Dataset Repository Tests
 *
 * Tests the IDatasetRepository contract using mocks.
 * Verifies that the repository correctly loads and returns Point entities.
 */

describe('IDatasetRepository Contract', () => {
  let repository: MockDatasetRepository;

  beforeEach(() => {
    repository = new MockDatasetRepository();
    repository.reset();
  });

  describe('getDataset()', () => {
    it('should return an array of Point entities', async () => {
      const dataset = await repository.getDataset('circle');

      expect(Array.isArray(dataset)).toBe(true);
      expect(dataset.length).toBeGreaterThan(0);

      // Verify each item is a valid Point
      dataset.forEach((point: Point) => {
        expect(point).toHaveProperty('x');
        expect(point).toHaveProperty('y');
        expect(point).toHaveProperty('label');
        expect(typeof point.x).toBe('number');
        expect(typeof point.y).toBe('number');
        expect(typeof point.label).toBe('number');
      });
    });

    it('should return the correct number of points from mock dataset', async () => {
      const mockPoints: Point[] = [
        { x: 0, y: 0, label: 0 },
        { x: 1, y: 1, label: 1 },
        { x: -1, y: -1, label: 0 },
        { x: 0.5, y: -0.5, label: 1 },
        { x: -0.5, y: 0.5, label: 0 },
      ];

      repository.setMockDataset(mockPoints);

      const dataset = await repository.getDataset('test');

      expect(dataset).toHaveLength(5);
    });

    it('should track the dataset type requested', async () => {
      await repository.getDataset('spiral');

      expect(repository.lastRequestedType).toBe('spiral');
      expect(repository.getDatasetCallCount).toBe(1);
    });

    it('should track multiple calls correctly', async () => {
      await repository.getDataset('circle');
      await repository.getDataset('xor');
      await repository.getDataset('gaussian');

      expect(repository.getDatasetCallCount).toBe(3);
      expect(repository.lastRequestedType).toBe('gaussian');
    });

    it('should return a copy of the dataset (not the original reference)', async () => {
      const originalPoints: Point[] = [{ x: 0, y: 0, label: 0 }];
      repository.setMockDataset(originalPoints);

      const dataset1 = await repository.getDataset('test');
      const dataset2 = await repository.getDataset('test');

      // Should be equal in value but different references
      expect(dataset1).toEqual(dataset2);
      expect(dataset1).not.toBe(dataset2);
    });

    it('should throw an error when configured to do so', async () => {
      repository.setError('Network error: Service unavailable');

      await expect(repository.getDataset('circle')).rejects.toThrow(
        'Network error: Service unavailable'
      );
    });

    it('should be callable with different dataset types', async () => {
      const datasetTypes = ['circle', 'xor', 'spiral', 'gaussian'];

      for (const type of datasetTypes) {
        const dataset = await repository.getDataset(type);
        expect(dataset).toBeDefined();
      }

      expect(repository.getDatasetCallCount).toBe(4);
    });
  });

  describe('Mock Configuration', () => {
    it('should allow setting custom mock datasets', async () => {
      const customDataset: Point[] = [
        { x: 0.1, y: 0.2, label: 0 },
        { x: 0.3, y: 0.4, label: 1 },
      ];

      repository.setMockDataset(customDataset);
      const result = await repository.getDataset('custom');

      expect(result).toEqual(customDataset);
    });

    it('should reset state correctly', async () => {
      await repository.getDataset('test');
      repository.setError('Error');

      repository.reset();

      expect(repository.getDatasetCallCount).toBe(0);
      expect(repository.lastRequestedType).toBeNull();
      expect(repository.shouldThrow).toBe(false);
    });
  });
});

describe('Dataset Loading Integration', () => {
  it('should provide data suitable for neural network training', async () => {
    const repository = new MockDatasetRepository();

    // Set up a realistic training dataset
    const trainingData: Point[] = Array.from({ length: 100 }, (_, i) => ({
      x: Math.cos((i / 100) * Math.PI * 2) * 0.5,
      y: Math.sin((i / 100) * Math.PI * 2) * 0.5,
      label: i % 2,
    }));

    repository.setMockDataset(trainingData);

    const dataset = await repository.getDataset('circle');

    // Verify dataset is suitable for training
    expect(dataset).toHaveLength(100);
    expect(dataset.every((p: Point) => p.x >= -1 && p.x <= 1)).toBe(true);
    expect(dataset.every((p: Point) => p.y >= -1 && p.y <= 1)).toBe(true);
    expect(dataset.some((p: Point) => p.label === 0)).toBe(true);
    expect(dataset.some((p: Point) => p.label === 1)).toBe(true);
  });
});
