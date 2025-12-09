/**
 * Tooltip Domain Tests
 */

import { describe, it, expect } from 'vitest';
import {
  TOOLTIP_REGISTRY,
  getAllTooltips,
  getTooltipForTarget,
  getTooltipsByCategory,
  hasTooltip,
} from '../../../src/core/domain/Tooltip';

describe('Tooltip Domain', () => {
  describe('TOOLTIP_REGISTRY', () => {
    it('should have tooltips in all categories', () => {
      expect(TOOLTIP_REGISTRY.architecture.length).toBeGreaterThan(0);
      expect(TOOLTIP_REGISTRY.training.length).toBeGreaterThan(0);
      expect(TOOLTIP_REGISTRY.dataset.length).toBeGreaterThan(0);
      expect(TOOLTIP_REGISTRY.visualisation.length).toBeGreaterThan(0);
    });

    it('should have valid structure for each tooltip', () => {
      const allTooltips = getAllTooltips();
      for (const tooltip of allTooltips) {
        expect(tooltip.target).toBeTruthy();
        expect(tooltip.title).toBeTruthy();
        expect(tooltip.content).toBeTruthy();
        // Position is optional but should be valid if present
        if (tooltip.position) {
          expect(['top', 'bottom', 'left', 'right', 'auto']).toContain(tooltip.position);
        }
      }
    });

    it('should have unique targets across all tooltips', () => {
      const allTooltips = getAllTooltips();
      const targets = allTooltips.map(t => t.target);
      const uniqueTargets = new Set(targets);
      expect(uniqueTargets.size).toBe(targets.length);
    });
  });

  describe('getAllTooltips', () => {
    it('should return flat array of all tooltips', () => {
      const allTooltips = getAllTooltips();
      expect(Array.isArray(allTooltips)).toBe(true);
      expect(allTooltips.length).toBeGreaterThan(10); // We defined many tooltips
    });
  });

  describe('getTooltipForTarget', () => {
    it('should return tooltip for known target', () => {
      const tooltip = getTooltipForTarget('#input-learning-rate');
      expect(tooltip).toBeDefined();
      expect(tooltip?.title).toBe('Learning Rate');
    });

    it('should return undefined for unknown target', () => {
      const tooltip = getTooltipForTarget('#nonexistent-element');
      expect(tooltip).toBeUndefined();
    });
  });

  describe('getTooltipsByCategory', () => {
    it('should return tooltips for training category', () => {
      const trainingTooltips = getTooltipsByCategory('training');
      expect(trainingTooltips.length).toBeGreaterThan(0);
      // All should be from the training category
      expect(trainingTooltips).toEqual(TOOLTIP_REGISTRY.training);
    });

    it('should return empty array for unknown category', () => {
      // TypeScript would prevent this, but test runtime behaviour
      const tooltips = getTooltipsByCategory('nonexistent' as any);
      expect(tooltips).toEqual([]);
    });
  });

  describe('hasTooltip', () => {
    it('should return true for known target', () => {
      expect(hasTooltip('#input-learning-rate')).toBe(true);
      expect(hasTooltip('#input-batch-size')).toBe(true);
    });

    it('should return false for unknown target', () => {
      expect(hasTooltip('#nonexistent')).toBe(false);
    });
  });

  describe('Tooltip content quality', () => {
    it('should have concise titles (under 30 chars)', () => {
      const allTooltips = getAllTooltips();
      for (const tooltip of allTooltips) {
        expect(tooltip.title.length).toBeLessThan(30);
      }
    });

    it('should have meaningful content (at least 20 chars)', () => {
      const allTooltips = getAllTooltips();
      for (const tooltip of allTooltips) {
        expect(tooltip.content.length).toBeGreaterThan(20);
      }
    });

    it('should have tips that are different from content', () => {
      const allTooltips = getAllTooltips();
      for (const tooltip of allTooltips) {
        if (tooltip.tip) {
          expect(tooltip.tip).not.toBe(tooltip.content);
        }
      }
    });
  });
});
