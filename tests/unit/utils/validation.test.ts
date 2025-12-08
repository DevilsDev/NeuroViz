/**
 * Unit tests for validation utilities
 * 
 * Tests runtime validation of enum-like values and numeric validation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    isValidOptimizerType,
    isValidActivationType,
    isValidLRScheduleType,
    isValidPerformanceMode,
    parseOptimizerType,
    parseActivationType,
    parseLRScheduleType,
    parsePerformanceMode,
    performanceModeToFps,
    fpsToPerformanceMode,
    validateLearningRate,
    validateLayersInput,
    VALID_OPTIMIZERS,
    VALID_ACTIVATIONS,
    VALID_LR_SCHEDULES,
    VALID_PERFORMANCE_MODES,
} from '../../../src/utils/validation';

describe('validation utilities', () => {
    beforeEach(() => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    describe('Type Guards', () => {
        describe('isValidOptimizerType', () => {
            it('should return true for valid optimizer types', () => {
                VALID_OPTIMIZERS.forEach(opt => {
                    expect(isValidOptimizerType(opt)).toBe(true);
                });
            });

            it('should return false for invalid optimizer types', () => {
                expect(isValidOptimizerType('invalid')).toBe(false);
                expect(isValidOptimizerType('')).toBe(false);
                expect(isValidOptimizerType('ADAM')).toBe(false); // Case sensitive
            });
        });

        describe('isValidActivationType', () => {
            it('should return true for valid activation types', () => {
                VALID_ACTIVATIONS.forEach(act => {
                    expect(isValidActivationType(act)).toBe(true);
                });
            });

            it('should return false for invalid activation types', () => {
                expect(isValidActivationType('invalid')).toBe(false);
                expect(isValidActivationType('RELU')).toBe(false);
            });
        });

        describe('isValidLRScheduleType', () => {
            it('should return true for valid LR schedule types', () => {
                VALID_LR_SCHEDULES.forEach(sched => {
                    expect(isValidLRScheduleType(sched)).toBe(true);
                });
            });

            it('should return false for invalid LR schedule types', () => {
                expect(isValidLRScheduleType('invalid')).toBe(false);
            });
        });

        describe('isValidPerformanceMode', () => {
            it('should return true for valid performance modes', () => {
                VALID_PERFORMANCE_MODES.forEach(mode => {
                    expect(isValidPerformanceMode(mode)).toBe(true);
                });
            });

            it('should return false for invalid performance modes', () => {
                expect(isValidPerformanceMode('invalid')).toBe(false);
                expect(isValidPerformanceMode('FULL')).toBe(false);
            });
        });
    });

    describe('Validated Parsers', () => {
        describe('parseOptimizerType', () => {
            it('should return valid optimizer unchanged', () => {
                expect(parseOptimizerType('adam')).toBe('adam');
                expect(parseOptimizerType('sgd')).toBe('sgd');
            });

            it('should return default for invalid optimizer', () => {
                expect(parseOptimizerType('invalid')).toBe('adam');
                expect(console.warn).toHaveBeenCalled();
            });

            it('should use custom default when provided', () => {
                expect(parseOptimizerType('invalid', 'sgd')).toBe('sgd');
            });

            it('should not log warning when disabled', () => {
                vi.mocked(console.warn).mockClear();
                parseOptimizerType('invalid', 'adam', false);
                expect(console.warn).not.toHaveBeenCalled();
            });
        });

        describe('parseActivationType', () => {
            it('should return valid activation unchanged', () => {
                expect(parseActivationType('relu')).toBe('relu');
                expect(parseActivationType('sigmoid')).toBe('sigmoid');
            });

            it('should return default for invalid activation', () => {
                expect(parseActivationType('invalid')).toBe('relu');
            });
        });

        describe('parseLRScheduleType', () => {
            it('should return valid schedule unchanged', () => {
                expect(parseLRScheduleType('none')).toBe('none');
                expect(parseLRScheduleType('cosine')).toBe('cosine');
            });

            it('should return default for invalid schedule', () => {
                expect(parseLRScheduleType('invalid')).toBe('none');
            });
        });

        describe('parsePerformanceMode', () => {
            it('should return valid mode unchanged', () => {
                expect(parsePerformanceMode('full')).toBe('full');
                expect(parsePerformanceMode('balanced')).toBe('balanced');
                expect(parsePerformanceMode('battery')).toBe('battery');
            });

            it('should return default for invalid mode', () => {
                expect(parsePerformanceMode('invalid')).toBe('full');
            });
        });
    });

    describe('Performance Mode Conversion', () => {
        describe('performanceModeToFps', () => {
            it('should convert full to 60 FPS', () => {
                expect(performanceModeToFps('full')).toBe(60);
            });

            it('should convert balanced to 30 FPS', () => {
                expect(performanceModeToFps('balanced')).toBe(30);
            });

            it('should convert battery to 15 FPS', () => {
                expect(performanceModeToFps('battery')).toBe(15);
            });
        });

        describe('fpsToPerformanceMode', () => {
            it('should convert high FPS to full mode', () => {
                expect(fpsToPerformanceMode(60)).toBe('full');
                expect(fpsToPerformanceMode(50)).toBe('full');
            });

            it('should convert medium FPS to balanced mode', () => {
                expect(fpsToPerformanceMode(30)).toBe('balanced');
                expect(fpsToPerformanceMode(25)).toBe('balanced');
            });

            it('should convert low FPS to battery mode', () => {
                expect(fpsToPerformanceMode(15)).toBe('battery');
                expect(fpsToPerformanceMode(10)).toBe('battery');
            });
        });
    });

    describe('Numeric Validation', () => {
        describe('validateLearningRate', () => {
            it('should accept valid learning rates', () => {
                const result = validateLearningRate(0.003);
                expect(result.isValid).toBe(true);
                expect(result.value).toBe(0.003);
            });

            it('should reject NaN', () => {
                const result = validateLearningRate(NaN);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('number');
            });

            it('should reject values below minimum', () => {
                const result = validateLearningRate(0.000001);
                expect(result.isValid).toBe(false);
                expect(result.value).toBe(0.00001); // Clamped to min
            });

            it('should reject values above maximum', () => {
                const result = validateLearningRate(100);
                expect(result.isValid).toBe(false);
                expect(result.value).toBe(10); // Clamped to max
            });

            it('should respect custom min/max', () => {
                const result = validateLearningRate(0.5, 0.1, 1.0);
                expect(result.isValid).toBe(true);
            });
        });

        describe('validateLayersInput', () => {
            it('should parse valid layer string', () => {
                const result = validateLayersInput('8, 4, 2');
                expect(result.isValid).toBe(true);
                expect(result.layers).toEqual([8, 4, 2]);
            });

            it('should reject empty input', () => {
                const result = validateLayersInput('');
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('hidden layer');
            });

            it('should filter invalid values', () => {
                const result = validateLayersInput('8, -1, abc, 4');
                expect(result.isValid).toBe(true);
                expect(result.layers).toEqual([8, 4]);
            });

            it('should reject layers exceeding max neurons', () => {
                const result = validateLayersInput('8, 512, 4');
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('maximum');
            });

            it('should handle whitespace', () => {
                const result = validateLayersInput('  8 ,  4  ,  2  ');
                expect(result.isValid).toBe(true);
                expect(result.layers).toEqual([8, 4, 2]);
            });
        });
    });
});
