import { describe, it, expect, beforeEach } from 'vitest';
import { TrainingDataSplitter } from '../../../../src/core/application/training/TrainingDataSplitter';
import { Point } from '../../../../src/core/domain';

describe('TrainingDataSplitter', () => {
  let splitter: TrainingDataSplitter;
  let testData: Point[];

  beforeEach(() => {
    splitter = new TrainingDataSplitter();

    // Create test dataset with 100 points
    testData = Array.from({ length: 100 }, (_, i) => ({
      x: i / 100,
      y: i / 100,
      label: i % 2, // Alternating labels for binary classification
    }));
  });

  describe('split', () => {
    describe('basic splitting', () => {
      it('should split data according to validation split ratio', () => {
        const validationSplit = 0.2;
        const result = splitter.split(testData, validationSplit, false);

        expect(result.training.length).toBe(80);
        expect(result.validation.length).toBe(20);
        expect(result.all.length).toBe(100);
      });

      it('should mark training data with isValidation: false', () => {
        const validationSplit = 0.2;
        const result = splitter.split(testData, validationSplit, false);

        expect(result.training.every(p => p.isValidation === false)).toBe(true);
      });

      it('should mark validation data with isValidation: true', () => {
        const validationSplit = 0.2;
        const result = splitter.split(testData, validationSplit, false);

        expect(result.validation.every(p => p.isValidation === true)).toBe(true);
      });

      it('should combine training and validation in all array', () => {
        const validationSplit = 0.2;
        const result = splitter.split(testData, validationSplit, false);

        expect(result.all.length).toBe(result.training.length + result.validation.length);
      });

      it('should handle different validation split ratios', () => {
        const testCases = [0.1, 0.2, 0.3, 0.4, 0.5];

        for (const validationSplit of testCases) {
          const result = splitter.split(testData, validationSplit, false);
          const expectedValidationSize = Math.floor(testData.length * validationSplit);

          expect(result.validation.length).toBe(expectedValidationSize);
          expect(result.training.length).toBe(testData.length - expectedValidationSize);
        }
      });
    });

    describe('shuffling', () => {
      it('should shuffle data when shuffle is true', () => {
        const validationSplit = 0.2;
        const result = splitter.split(testData, validationSplit, true);

        // Check that data order is different from original
        // (very unlikely to be same after shuffle with 100 items)
        const isShuffled = result.all.some((p, i) => {
          const original = testData[i];
          return p.x !== original?.x || p.y !== original?.y;
        });

        expect(isShuffled).toBe(true);
      });

      it('should not shuffle data when shuffle is false', () => {
        const validationSplit = 0.2;
        const result = splitter.split(testData, validationSplit, false);

        // Training data should be first 80 points
        for (let i = 0; i < 80; i++) {
          expect(result.training[i]?.x).toBe(testData[i]?.x);
          expect(result.training[i]?.y).toBe(testData[i]?.y);
        }

        // Validation data should be last 20 points
        for (let i = 0; i < 20; i++) {
          expect(result.validation[i]?.x).toBe(testData[80 + i]?.x);
          expect(result.validation[i]?.y).toBe(testData[80 + i]?.y);
        }
      });

      it('should produce different shuffles on repeated calls', () => {
        const validationSplit = 0.2;
        const result1 = splitter.split(testData, validationSplit, true);
        const result2 = splitter.split(testData, validationSplit, true);

        // Check that at least some points are in different positions
        let differenceCount = 0;
        for (let i = 0; i < result1.all.length; i++) {
          if (result1.all[i]?.x !== result2.all[i]?.x) {
            differenceCount++;
          }
        }

        // With 100 points, highly likely to have differences
        expect(differenceCount).toBeGreaterThan(0);
      });

      it('should default to shuffle = true when not specified', () => {
        const validationSplit = 0.2;
        const result = splitter.split(testData, validationSplit);

        // Should have shuffled by default
        const isShuffled = result.all.some((p, i) => {
          const original = testData[i];
          return p.x !== original?.x || p.y !== original?.y;
        });

        expect(isShuffled).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('should handle empty dataset', () => {
        const result = splitter.split([], 0.2);

        expect(result.training).toEqual([]);
        expect(result.validation).toEqual([]);
        expect(result.all).toEqual([]);
      });

      it('should handle validation split of 0 (no validation)', () => {
        const result = splitter.split(testData, 0);

        expect(result.training.length).toBe(testData.length);
        expect(result.validation).toEqual([]);
      });

      it('should handle validation split of 0.99 (almost all validation)', () => {
        const result = splitter.split(testData, 0.99, false);

        expect(result.training.length).toBe(1);
        expect(result.validation.length).toBe(99);
      });

      it('should handle validation split >= 1 (invalid)', () => {
        const result = splitter.split(testData, 1.0);

        expect(result.training).toEqual(testData);
        expect(result.validation).toEqual([]);
      });

      it('should handle negative validation split', () => {
        const result = splitter.split(testData, -0.2);

        expect(result.training).toEqual(testData);
        expect(result.validation).toEqual([]);
      });

      it('should handle single data point', () => {
        const singlePoint: Point[] = [{ x: 0, y: 0, label: 0 }];
        const result = splitter.split(singlePoint, 0.2, false);

        // With 1 point and 0.2 validation split:
        // splitIndex = floor(1 * 0.8) = 0
        // training: [0:0] = [], validation: [0:] = [point]
        expect(result.training.length).toBe(0);
        expect(result.validation.length).toBe(1);
        expect(result.all.length).toBe(1);
      });

      it('should handle very small datasets', () => {
        const tinyData: Point[] = [
          { x: 0, y: 0, label: 0 },
          { x: 1, y: 1, label: 1 },
        ];
        const result = splitter.split(tinyData, 0.5, false);

        expect(result.training.length).toBe(1);
        expect(result.validation.length).toBe(1);
      });
    });
  });

  describe('stratifiedSplit', () => {
    let multiClassData: Point[];

    beforeEach(() => {
      // Create dataset with 3 classes, 30 points each
      multiClassData = [
        ...Array.from({ length: 30 }, (_, i) => ({ x: i, y: 0, label: 0 })),
        ...Array.from({ length: 30 }, (_, i) => ({ x: i, y: 1, label: 1 })),
        ...Array.from({ length: 30 }, (_, i) => ({ x: i, y: 2, label: 2 })),
      ];
    });

    it('should maintain class distribution in both sets', () => {
      const validationSplit = 0.2;
      const result = splitter.stratifiedSplit(multiClassData, validationSplit);

      // Count classes in training set
      const trainClass0 = result.training.filter(p => p.label === 0).length;
      const trainClass1 = result.training.filter(p => p.label === 1).length;
      const trainClass2 = result.training.filter(p => p.label === 2).length;

      // Count classes in validation set
      const valClass0 = result.validation.filter(p => p.label === 0).length;
      const valClass1 = result.validation.filter(p => p.label === 1).length;
      const valClass2 = result.validation.filter(p => p.label === 2).length;

      // Each class should have 24 training and 6 validation (80/20 split)
      expect(trainClass0).toBe(24);
      expect(trainClass1).toBe(24);
      expect(trainClass2).toBe(24);
      expect(valClass0).toBe(6);
      expect(valClass1).toBe(6);
      expect(valClass2).toBe(6);
    });

    it('should shuffle data within each class', () => {
      const result = splitter.stratifiedSplit(multiClassData, 0.2);

      // Extract class 0 points from result
      const class0Points = result.all.filter(p => p.label === 0);

      // Check if order is different from original (first 30 points)
      const isShuffled = class0Points.some((p, i) => p.x !== i);
      expect(isShuffled).toBe(true);
    });

    it('should mark validation data correctly', () => {
      const result = splitter.stratifiedSplit(multiClassData, 0.2);

      expect(result.training.every(p => p.isValidation === false)).toBe(true);
      expect(result.validation.every(p => p.isValidation === true)).toBe(true);
    });

    it('should handle imbalanced datasets', () => {
      const imbalancedData: Point[] = [
        ...Array.from({ length: 80 }, (_, i) => ({ x: i, y: 0, label: 0 })),
        ...Array.from({ length: 20 }, (_, i) => ({ x: i, y: 1, label: 1 })),
      ];

      const result = splitter.stratifiedSplit(imbalancedData, 0.2);

      const trainClass0 = result.training.filter(p => p.label === 0).length;
      const trainClass1 = result.training.filter(p => p.label === 1).length;
      const valClass0 = result.validation.filter(p => p.label === 0).length;
      const valClass1 = result.validation.filter(p => p.label === 1).length;

      // Class 0: 80 points -> 64 train, 16 val
      // Class 1: 20 points -> 16 train, 4 val
      expect(trainClass0).toBe(64);
      expect(trainClass1).toBe(16);
      expect(valClass0).toBe(16);
      expect(valClass1).toBe(4);
    });

    it('should handle dataset with undefined labels (defaults to 0)', () => {
      const dataWithoutLabels: Point[] = [
        ...Array.from({ length: 50 }, (_, i) => ({ x: i, y: 0 })),
      ];

      const result = splitter.stratifiedSplit(dataWithoutLabels, 0.2);

      expect(result.training.length).toBe(40);
      expect(result.validation.length).toBe(10);
    });

    it('should handle validation split of 0', () => {
      const result = splitter.stratifiedSplit(multiClassData, 0);

      expect(result.training.length).toBe(multiClassData.length);
      expect(result.validation).toEqual([]);
    });

    it('should handle validation split >= 1', () => {
      const result = splitter.stratifiedSplit(multiClassData, 1.0);

      expect(result.training).toEqual(multiClassData);
      expect(result.validation).toEqual([]);
    });

    it('should handle empty dataset', () => {
      const result = splitter.stratifiedSplit([], 0.2);

      expect(result.training).toEqual([]);
      expect(result.validation).toEqual([]);
      expect(result.all).toEqual([]);
    });
  });

  describe('getStatistics', () => {
    it('should calculate correct total samples', () => {
      const split = splitter.split(testData, 0.2, false);
      const stats = splitter.getStatistics(split);

      expect(stats.totalSamples).toBe(100);
    });

    it('should calculate correct training and validation samples', () => {
      const split = splitter.split(testData, 0.2, false);
      const stats = splitter.getStatistics(split);

      expect(stats.trainingSamples).toBe(80);
      expect(stats.validationSamples).toBe(20);
    });

    it('should calculate correct validation fraction', () => {
      const split = splitter.split(testData, 0.3, false);
      const stats = splitter.getStatistics(split);

      expect(stats.validationFraction).toBeCloseTo(0.3, 2);
    });

    it('should provide class distribution for binary classification', () => {
      const split = splitter.split(testData, 0.2, false);
      const stats = splitter.getStatistics(split);

      const class0 = stats.classDistribution.get(0);
      const class1 = stats.classDistribution.get(1);

      expect(class0).toBeDefined();
      expect(class1).toBeDefined();
      expect(class0!.training + class0!.validation).toBe(50);
      expect(class1!.training + class1!.validation).toBe(50);
    });

    it('should provide class distribution for multi-class', () => {
      const multiClassData: Point[] = [
        ...Array.from({ length: 30 }, () => ({ x: 0, y: 0, label: 0 })),
        ...Array.from({ length: 30 }, () => ({ x: 1, y: 1, label: 1 })),
        ...Array.from({ length: 40 }, () => ({ x: 2, y: 2, label: 2 })),
      ];

      const split = splitter.stratifiedSplit(multiClassData, 0.2);
      const stats = splitter.getStatistics(split);

      expect(stats.classDistribution.size).toBe(3);
      expect(stats.classDistribution.get(0)!.training + stats.classDistribution.get(0)!.validation).toBe(30);
      expect(stats.classDistribution.get(1)!.training + stats.classDistribution.get(1)!.validation).toBe(30);
      expect(stats.classDistribution.get(2)!.training + stats.classDistribution.get(2)!.validation).toBe(40);
    });

    it('should handle empty split', () => {
      const emptySplit = {
        training: [],
        validation: [],
        all: [],
      };

      const stats = splitter.getStatistics(emptySplit);

      expect(stats.totalSamples).toBe(0);
      expect(stats.trainingSamples).toBe(0);
      expect(stats.validationSamples).toBe(0);
      expect(stats.validationFraction).toBe(0);
      expect(stats.classDistribution.size).toBe(0);
    });

    it('should handle data with undefined labels (defaults to 0)', () => {
      const dataWithoutLabels: Point[] = [
        ...Array.from({ length: 100 }, (_, i) => ({ x: i, y: i })),
      ];

      const split = splitter.split(dataWithoutLabels, 0.2, false);
      const stats = splitter.getStatistics(split);

      const class0 = stats.classDistribution.get(0);
      expect(class0).toBeDefined();
      expect(class0!.training + class0!.validation).toBe(100);
    });

    it('should handle split with only training data', () => {
      const split = splitter.split(testData, 0, false);
      const stats = splitter.getStatistics(split);

      expect(stats.validationSamples).toBe(0);
      expect(stats.validationFraction).toBe(0);
    });
  });

  describe('data integrity', () => {
    it('should not modify original data array', () => {
      const originalData = [...testData];
      splitter.split(testData, 0.2, true);

      expect(testData).toEqual(originalData);
    });

    it('should preserve all point properties', () => {
      const dataWithExtraProps: Point[] = testData.map(p => ({
        ...p,
        customProp: 'test',
      }));

      const result = splitter.split(dataWithExtraProps, 0.2, false);

      expect(result.training.every((p: any) => p.customProp === 'test')).toBe(true);
      expect(result.validation.every((p: any) => p.customProp === 'test')).toBe(true);
    });

    it('should not lose any data points during split', () => {
      const result = splitter.split(testData, 0.2, true);

      expect(result.training.length + result.validation.length).toBe(testData.length);
    });

    it('should not duplicate data points', () => {
      const result = splitter.split(testData, 0.2, false);

      // Create set of unique x,y combinations
      const allPoints = new Set(result.all.map(p => `${p.x},${p.y}`));
      expect(allPoints.size).toBe(testData.length);
    });
  });
});
