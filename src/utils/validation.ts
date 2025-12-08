/**
 * Runtime validation utilities for enum-like values read from the DOM.
 * Ensures type safety when parsing user input that should match TypeScript types.
 */

import type { OptimizerType, ActivationType, LRScheduleType } from '../core/domain';

// =============================================================================
// Valid Value Sets
// =============================================================================

/** Valid optimizer types matching OptimizerType */
export const VALID_OPTIMIZERS: readonly OptimizerType[] = ['sgd', 'adam', 'rmsprop', 'adagrad'];

/** Valid activation types matching ActivationType */
export const VALID_ACTIVATIONS: readonly ActivationType[] = [
    'linear', 'relu', 'sigmoid', 'tanh', 'elu', 'leaky_relu', 'selu', 'softmax'
];

/** Valid learning rate schedule types matching LRScheduleType */
export const VALID_LR_SCHEDULES: readonly LRScheduleType[] = [
    'none', 'exponential', 'step', 'cosine', 'cyclic_triangular', 'cyclic_cosine'
];

/** Valid performance mode values */
export const VALID_PERFORMANCE_MODES = ['full', 'balanced', 'battery'] as const;
export type PerformanceMode = typeof VALID_PERFORMANCE_MODES[number];

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Checks if a string is a valid OptimizerType.
 */
export function isValidOptimizerType(value: string): value is OptimizerType {
    return VALID_OPTIMIZERS.includes(value as OptimizerType);
}

/**
 * Checks if a string is a valid ActivationType.
 */
export function isValidActivationType(value: string): value is ActivationType {
    return VALID_ACTIVATIONS.includes(value as ActivationType);
}

/**
 * Checks if a string is a valid LRScheduleType.
 */
export function isValidLRScheduleType(value: string): value is LRScheduleType {
    return VALID_LR_SCHEDULES.includes(value as LRScheduleType);
}

/**
 * Checks if a string is a valid PerformanceMode.
 */
export function isValidPerformanceMode(value: string): value is PerformanceMode {
    return VALID_PERFORMANCE_MODES.includes(value as PerformanceMode);
}

// =============================================================================
// Validated Parsers
// =============================================================================

/**
 * Parses and validates an optimizer type from a DOM value.
 * Returns the validated type or a default if invalid.
 * 
 * @param value - The string value to validate
 * @param defaultValue - Fallback value if validation fails (default: 'adam')
 * @param logWarning - Whether to log a warning on invalid input (default: true)
 */
export function parseOptimizerType(
    value: string,
    defaultValue: OptimizerType = 'adam',
    logWarning = true
): OptimizerType {
    if (isValidOptimizerType(value)) {
        return value;
    }
    if (logWarning) {
        console.warn(`[Validation] Invalid optimizer type "${value}", using default "${defaultValue}"`);
    }
    return defaultValue;
}

/**
 * Parses and validates an activation type from a DOM value.
 * Returns the validated type or a default if invalid.
 * 
 * @param value - The string value to validate
 * @param defaultValue - Fallback value if validation fails (default: 'relu')
 * @param logWarning - Whether to log a warning on invalid input (default: true)
 */
export function parseActivationType(
    value: string,
    defaultValue: ActivationType = 'relu',
    logWarning = true
): ActivationType {
    if (isValidActivationType(value)) {
        return value;
    }
    if (logWarning) {
        console.warn(`[Validation] Invalid activation type "${value}", using default "${defaultValue}"`);
    }
    return defaultValue;
}

/**
 * Parses and validates a learning rate schedule type from a DOM value.
 * Returns the validated type or a default if invalid.
 * 
 * @param value - The string value to validate
 * @param defaultValue - Fallback value if validation fails (default: 'none')
 * @param logWarning - Whether to log a warning on invalid input (default: true)
 */
export function parseLRScheduleType(
    value: string,
    defaultValue: LRScheduleType = 'none',
    logWarning = true
): LRScheduleType {
    if (isValidLRScheduleType(value)) {
        return value;
    }
    if (logWarning) {
        console.warn(`[Validation] Invalid LR schedule type "${value}", using default "${defaultValue}"`);
    }
    return defaultValue;
}

/**
 * Parses and validates a performance mode from a DOM value.
 * Returns the validated mode or a default if invalid.
 * 
 * @param value - The string value to validate
 * @param defaultValue - Fallback value if validation fails (default: 'full')
 * @param logWarning - Whether to log a warning on invalid input (default: true)
 */
export function parsePerformanceMode(
    value: string,
    defaultValue: PerformanceMode = 'full',
    logWarning = true
): PerformanceMode {
    if (isValidPerformanceMode(value)) {
        return value;
    }
    if (logWarning) {
        console.warn(`[Validation] Invalid performance mode "${value}", using default "${defaultValue}"`);
    }
    return defaultValue;
}

/**
 * Converts a performance mode to its corresponding FPS value.
 * 
 * @param mode - The performance mode
 * @returns The target FPS for the mode
 */
export function performanceModeToFps(mode: PerformanceMode): number {
    switch (mode) {
        case 'full':
            return 60;
        case 'balanced':
            return 30;
        case 'battery':
            return 15;
        default:
            return 60;
    }
}

/**
 * Converts an FPS value to the closest performance mode.
 * 
 * @param fps - The FPS value
 * @returns The closest performance mode
 */
export function fpsToPerformanceMode(fps: number): PerformanceMode {
    if (fps >= 50) return 'full';
    if (fps >= 25) return 'balanced';
    return 'battery';
}

// =============================================================================
// Numeric Validation
// =============================================================================

/**
 * Validates a learning rate value.
 * 
 * @param value - The value to validate
 * @param min - Minimum allowed value (default: 0.00001)
 * @param max - Maximum allowed value (default: 10)
 * @returns Object with isValid flag and sanitised value
 */
export function validateLearningRate(
    value: number,
    min = 0.00001,
    max = 10
): { isValid: boolean; value: number; error?: string } {
    if (Number.isNaN(value)) {
        return { isValid: false, value: 0.003, error: 'Learning rate must be a number' };
    }
    if (value < min) {
        return { isValid: false, value: min, error: `Learning rate must be at least ${min}` };
    }
    if (value > max) {
        return { isValid: false, value: max, error: `Learning rate must be at most ${max}` };
    }
    return { isValid: true, value };
}

/**
 * Validates a layers configuration string.
 * 
 * @param input - Comma-separated layer sizes (e.g., "8, 4, 2")
 * @returns Object with isValid flag, parsed layers array, and optional error
 */
export function validateLayersInput(
    input: string
): { isValid: boolean; layers: number[]; error?: string } {
    const trimmed = input.trim();
    if (!trimmed) {
        return { isValid: false, layers: [], error: 'At least one hidden layer is required' };
    }

    const layers = trimmed
        .split(',')
        .map(s => parseInt(s.trim(), 10))
        .filter(n => !Number.isNaN(n) && n > 0);

    if (layers.length === 0) {
        return { isValid: false, layers: [], error: 'No valid layer sizes found' };
    }

    const maxNeurons = 256;
    const invalidLayers = layers.filter(n => n > maxNeurons);
    if (invalidLayers.length > 0) {
        return {
            isValid: false,
            layers,
            error: `Layer size exceeds maximum of ${maxNeurons} neurons`
        };
    }

    return { isValid: true, layers };
}
