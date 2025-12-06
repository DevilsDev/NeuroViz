import { describe, it, expect } from 'vitest';
import { ValidationResult } from '../../../../src/core/application/commands/ValidationResult';

describe('ValidationResult', () => {
  describe('success', () => {
    it('should create a valid result', () => {
      const result = ValidationResult.success();

      expect(result.isValid).toBe(true);
      expect(result.message).toBe('');
      expect(result.errors.size).toBe(0);
    });

    it('should have empty message', () => {
      const result = ValidationResult.success();

      expect(result.message).toBe('');
    });

    it('should have empty errors map', () => {
      const result = ValidationResult.success();

      expect(result.errors).toBeInstanceOf(Map);
      expect(result.errors.size).toBe(0);
    });
  });

  describe('error', () => {
    it('should create an invalid result with message', () => {
      const errorMessage = 'Validation failed';
      const result = ValidationResult.error(errorMessage);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe(errorMessage);
    });

    it('should handle empty error message', () => {
      const result = ValidationResult.error('');

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('');
    });

    it('should handle long error messages', () => {
      const longMessage = 'A'.repeat(1000);
      const result = ValidationResult.error(longMessage);

      expect(result.message).toBe(longMessage);
    });

    it('should have empty errors map by default', () => {
      const result = ValidationResult.error('Error');

      expect(result.errors.size).toBe(0);
    });
  });

  describe('errors', () => {
    it('should create an invalid result with multiple errors', () => {
      const errorMap = new Map<string, string>([
        ['field1', 'Error 1'],
        ['field2', 'Error 2'],
      ]);

      const result = ValidationResult.errors(errorMap);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBe(errorMap);
      expect(result.errors.size).toBe(2);
    });

    it('should combine error messages into single message', () => {
      const errorMap = new Map<string, string>([
        ['field1', 'Error 1'],
        ['field2', 'Error 2'],
        ['field3', 'Error 3'],
      ]);

      const result = ValidationResult.errors(errorMap);

      expect(result.message).toContain('Error 1');
      expect(result.message).toContain('Error 2');
      expect(result.message).toContain('Error 3');
    });

    it('should join errors with comma separator', () => {
      const errorMap = new Map<string, string>([
        ['a', 'First'],
        ['b', 'Second'],
      ]);

      const result = ValidationResult.errors(errorMap);

      expect(result.message).toBe('First, Second');
    });

    it('should handle empty error map', () => {
      const errorMap = new Map<string, string>();
      const result = ValidationResult.errors(errorMap);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('');
      expect(result.errors.size).toBe(0);
    });

    it('should handle single error in map', () => {
      const errorMap = new Map<string, string>([['field', 'Single error']]);
      const result = ValidationResult.errors(errorMap);

      expect(result.message).toBe('Single error');
      expect(result.errors.size).toBe(1);
    });

    it('should preserve error map reference', () => {
      const errorMap = new Map<string, string>([['field', 'Error']]);
      const result = ValidationResult.errors(errorMap);

      expect(result.errors).toBe(errorMap);
    });
  });

  describe('isValid getter', () => {
    it('should return true for success', () => {
      const result = ValidationResult.success();

      expect(result.isValid).toBe(true);
    });

    it('should return false for error', () => {
      const result = ValidationResult.error('Error');

      expect(result.isValid).toBe(false);
    });

    it('should return false for errors map', () => {
      const result = ValidationResult.errors(new Map([['field', 'Error']]));

      expect(result.isValid).toBe(false);
    });

    it('should be immutable', () => {
      const result = ValidationResult.success();

      // TypeScript should prevent this, but verify readonly behavior
      expect(() => {
        (result as any).isValid = false;
      }).toThrow();
    });
  });

  describe('message getter', () => {
    it('should return empty string for success', () => {
      const result = ValidationResult.success();

      expect(result.message).toBe('');
    });

    it('should return message for error', () => {
      const result = ValidationResult.error('Test error');

      expect(result.message).toBe('Test error');
    });

    it('should return combined messages for errors map', () => {
      const errorMap = new Map<string, string>([
        ['a', 'Error A'],
        ['b', 'Error B'],
      ]);
      const result = ValidationResult.errors(errorMap);

      expect(result.message).toBe('Error A, Error B');
    });
  });

  describe('errors getter', () => {
    it('should return empty map for success', () => {
      const result = ValidationResult.success();

      expect(result.errors).toBeInstanceOf(Map);
      expect(result.errors.size).toBe(0);
    });

    it('should return empty map for simple error', () => {
      const result = ValidationResult.error('Error');

      expect(result.errors).toBeInstanceOf(Map);
      expect(result.errors.size).toBe(0);
    });

    it('should return error map for errors', () => {
      const errorMap = new Map<string, string>([
        ['field1', 'Error 1'],
        ['field2', 'Error 2'],
      ]);
      const result = ValidationResult.errors(errorMap);

      expect(result.errors).toBe(errorMap);
      expect(result.errors.get('field1')).toBe('Error 1');
      expect(result.errors.get('field2')).toBe('Error 2');
    });

    it('should return actual Map instance', () => {
      const result = ValidationResult.success();

      expect(result.errors).toBeInstanceOf(Map);
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in error messages', () => {
      const specialMessage = 'Error with "quotes", \'apostrophes\', and\nnewlines';
      const result = ValidationResult.error(specialMessage);

      expect(result.message).toBe(specialMessage);
    });

    it('should handle unicode in error messages', () => {
      const unicodeMessage = 'Error with unicode: 你好 🚀 ñ';
      const result = ValidationResult.error(unicodeMessage);

      expect(result.message).toBe(unicodeMessage);
    });

    it('should handle error map with special field names', () => {
      const errorMap = new Map<string, string>([
        ['field.nested', 'Nested field error'],
        ['array[0]', 'Array field error'],
        ['special-chars_123', 'Special chars error'],
      ]);

      const result = ValidationResult.errors(errorMap);

      expect(result.errors.get('field.nested')).toBe('Nested field error');
      expect(result.errors.get('array[0]')).toBe('Array field error');
      expect(result.errors.get('special-chars_123')).toBe('Special chars error');
    });

    it('should handle very large error maps', () => {
      const largeMap = new Map<string, string>();
      for (let i = 0; i < 1000; i++) {
        largeMap.set(`field${i}`, `Error ${i}`);
      }

      const result = ValidationResult.errors(largeMap);

      expect(result.errors.size).toBe(1000);
      expect(result.isValid).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should not allow modification of isValid', () => {
      const result = ValidationResult.success();

      expect(() => {
        (result as any).isValid = false;
      }).toThrow();
    });

    it('should not allow modification of message', () => {
      const result = ValidationResult.error('Original');

      expect(() => {
        (result as any).message = 'Modified';
      }).toThrow();
    });

    it('should create independent instances', () => {
      const result1 = ValidationResult.error('Error 1');
      const result2 = ValidationResult.error('Error 2');

      expect(result1.message).toBe('Error 1');
      expect(result2.message).toBe('Error 2');
    });
  });
});
