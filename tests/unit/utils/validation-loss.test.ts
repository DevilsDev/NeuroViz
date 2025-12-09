/**
 * Loss Type Validation Tests
 */

import { describe, it, expect, vi } from 'vitest';
import {
  isValidLossType,
  parseLossType,
  VALID_LOSS_TYPES,
} from '../../../src/utils/validation';

describe('Loss Type Validation', () => {
  describe('VALID_LOSS_TYPES', () => {
    it('should contain expected loss types', () => {
      expect(VALID_LOSS_TYPES).toContain('crossEntropy');
      expect(VALID_LOSS_TYPES).toContain('mse');
      expect(VALID_LOSS_TYPES).toContain('hinge');
    });

    it('should have exactly 3 loss types', () => {
      expect(VALID_LOSS_TYPES).toHaveLength(3);
    });
  });

  describe('isValidLossType', () => {
    it('should return true for valid loss types', () => {
      expect(isValidLossType('crossEntropy')).toBe(true);
      expect(isValidLossType('mse')).toBe(true);
      expect(isValidLossType('hinge')).toBe(true);
    });

    it('should return false for invalid loss types', () => {
      expect(isValidLossType('invalid')).toBe(false);
      expect(isValidLossType('')).toBe(false);
      expect(isValidLossType('MSE')).toBe(false); // Case sensitive
    });
  });

  describe('parseLossType', () => {
    it('should return valid loss type as-is', () => {
      expect(parseLossType('crossEntropy')).toBe('crossEntropy');
      expect(parseLossType('mse')).toBe('mse');
      expect(parseLossType('hinge')).toBe('hinge');
    });

    it('should return default for invalid input', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(parseLossType('invalid')).toBe('crossEntropy');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should use custom default when provided', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(parseLossType('invalid', 'mse')).toBe('mse');

      consoleSpy.mockRestore();
    });

    it('should not log warning when disabled', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      parseLossType('invalid', 'crossEntropy', false);
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
