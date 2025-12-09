/**
 * Model Complexity Domain Tests
 */

import { describe, it, expect } from 'vitest';
import {
  calculateModelComplexity,
  formatBytes,
  formatNumber,
  getComplexityRating,
  getComplexityExplanation,
} from '../../../src/core/domain/ModelComplexity';

describe('Model Complexity', () => {
  describe('calculateModelComplexity', () => {
    it('should calculate parameters for simple network', () => {
      // Network: 2 inputs -> 4 hidden -> 2 outputs
      // Layer 1: 2*4 + 4 = 12 params
      // Layer 2: 4*2 + 2 = 10 params
      // Total: 22 params
      const metrics = calculateModelComplexity(2, [4], 2, false, 0);

      expect(metrics.totalParameters).toBe(22);
      expect(metrics.layerBreakdown).toHaveLength(2);
    });

    it('should calculate parameters for multi-layer network', () => {
      // Network: 2 -> 8 -> 4 -> 2
      // Layer 1: 2*8 + 8 = 24
      // Layer 2: 8*4 + 4 = 36
      // Layer 3: 4*2 + 2 = 10
      // Total: 70
      const metrics = calculateModelComplexity(2, [8, 4], 2, false, 0);

      expect(metrics.totalParameters).toBe(70);
      expect(metrics.layerBreakdown).toHaveLength(3);
    });

    it('should add batch norm parameters when enabled', () => {
      const withoutBN = calculateModelComplexity(2, [8], 2, false, 0);
      const withBN = calculateModelComplexity(2, [8], 2, true, 0);

      // BN adds 2 params per hidden unit (gamma, beta)
      expect(withBN.totalParameters).toBe(withoutBN.totalParameters + 8 * 2);
    });

    it('should calculate FLOPs correctly', () => {
      const metrics = calculateModelComplexity(2, [4], 2, false, 0);

      // FLOPs should be positive and proportional to network size
      expect(metrics.flopsPerForward).toBeGreaterThan(0);
    });

    it('should calculate memory usage', () => {
      const metrics = calculateModelComplexity(2, [8, 4], 2, false, 0);

      // Memory should be 4 bytes per parameter (float32)
      expect(metrics.parameterMemoryBytes).toBe(metrics.totalParameters * 4);
      expect(metrics.totalMemoryBytes).toBeGreaterThan(metrics.parameterMemoryBytes);
    });

    it('should include dropout in layer names', () => {
      const metrics = calculateModelComplexity(2, [8], 2, false, 0.5);

      const hiddenLayer = metrics.layerBreakdown[0];
      expect(hiddenLayer?.name).toContain('50% dropout');
    });

    it('should include batch norm in layer names', () => {
      const metrics = calculateModelComplexity(2, [8], 2, true, 0);

      const hiddenLayer = metrics.layerBreakdown[0];
      expect(hiddenLayer?.name).toContain('BN');
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(500)).toBe('500 B');
      expect(formatBytes(1024)).toBe('1.0 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(1048576)).toBe('1.00 MB');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with K/M suffixes', () => {
      expect(formatNumber(100)).toBe('100');
      expect(formatNumber(1500)).toBe('1.5K');
      expect(formatNumber(1500000)).toBe('1.50M');
    });
  });

  describe('getComplexityRating', () => {
    it('should return correct ratings', () => {
      expect(getComplexityRating(50)).toBe('tiny');
      expect(getComplexityRating(500)).toBe('small');
      expect(getComplexityRating(5000)).toBe('medium');
      expect(getComplexityRating(50000)).toBe('large');
    });
  });

  describe('getComplexityExplanation', () => {
    it('should provide explanation for each rating', () => {
      const tinyMetrics = calculateModelComplexity(2, [2], 2, false, 0);
      // Need >10000 params for 'large' rating - use bigger network
      const largeMetrics = calculateModelComplexity(2, [128, 128, 128], 2, false, 0);

      const tinyExplanation = getComplexityExplanation(tinyMetrics);
      const largeExplanation = getComplexityExplanation(largeMetrics);

      expect(tinyExplanation).toContain('simple');
      expect(largeExplanation).toContain('Complex');
    });
  });
});
