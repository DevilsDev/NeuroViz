/**
 * Unit tests for TrainingController
 * 
 * Tests disposal behaviour, validation logic, and key UI interactions.
 * Uses mocks at the port/interface level rather than real adapters.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { TrainingElements } from '../../../src/presentation/controllers/TrainingController';
import type { TrainingState } from '../../../src/core/application/ITrainingSession';

// Helper to create a complete TrainingState for tests
function createMockState(overrides: Partial<TrainingState> = {}): TrainingState {
    return {
        isInitialised: false,
        datasetLoaded: false,
        isRunning: false,
        isPaused: false,
        isProcessing: false,
        currentEpoch: 0,
        currentLoss: null,
        currentAccuracy: null,
        currentValLoss: null,
        currentValAccuracy: null,
        maxEpochs: 0,
        batchSize: 0,
        targetFps: 60,
        validationSplit: 0.2,
        history: {
            records: [],
            bestLoss: Infinity,
            bestEpoch: 0,
            bestValLoss: Infinity,
            bestValEpoch: 0,
            totalTimeMs: 0,
        },
        ...overrides,
    };
}

// Mock validation utilities
vi.mock('../../../src/utils/validation', () => ({
    parseOptimizerType: vi.fn((v: string) => v === 'invalid' ? 'adam' : v),
    parseActivationType: vi.fn((v: string) => v === 'invalid' ? 'relu' : v),
    parseLRScheduleType: vi.fn((v: string) => v === 'invalid' ? 'none' : v),
    parsePerformanceMode: vi.fn((v: string) => v === 'invalid' ? 'full' : v),
    performanceModeToFps: vi.fn((mode: string) => mode === 'full' ? 60 : mode === 'balanced' ? 30 : 15),
    fpsToPerformanceMode: vi.fn((fps: number) => fps >= 50 ? 'full' : fps >= 25 ? 'balanced' : 'battery'),
}));

// Mock DOM helpers
vi.mock('../../../src/utils/dom', () => ({
    setVisible: vi.fn(),
    setEnabled: vi.fn(),
    setActiveState: vi.fn(),
}));

// Mock toast
vi.mock('../../../src/presentation/toast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
        info: vi.fn(),
    },
}));

// Mock SuggestedFixes
vi.mock('../../../src/presentation/SuggestedFixes', () => ({
    resetSuggestionsDismissal: vi.fn(),
}));

describe('TrainingController', () => {
    // Helper to create mock elements
    function createMockElements(): TrainingElements {
        const createElement = <T extends HTMLElement>(tagName: string): T => {
            const el = document.createElement(tagName) as T;
            return el;
        };

        return {
            inputLr: Object.assign(createElement<HTMLInputElement>('input'), { value: '0.003' }),
            inputLayers: Object.assign(createElement<HTMLInputElement>('input'), { value: '8, 4' }),
            inputOptimizer: Object.assign(createElement<HTMLSelectElement>('select'), { value: 'adam' }),
            inputMomentum: Object.assign(createElement<HTMLInputElement>('input'), { value: '0.9' }),
            momentumValue: createElement<HTMLSpanElement>('span'),
            momentumControl: createElement<HTMLDivElement>('div'),
            inputActivation: Object.assign(createElement<HTMLSelectElement>('select'), { value: 'relu' }),
            inputL1: Object.assign(createElement<HTMLInputElement>('input'), { value: '0' }),
            inputL2: Object.assign(createElement<HTMLInputElement>('input'), { value: '0' }),
            inputNumClasses: Object.assign(createElement<HTMLSelectElement>('select'), { value: '2' }),
            inputDropout: Object.assign(createElement<HTMLSelectElement>('select'), { value: '0' }),
            inputClipNorm: Object.assign(createElement<HTMLSelectElement>('select'), { value: '0' }),
            inputBatchNorm: Object.assign(createElement<HTMLInputElement>('input'), { checked: false }),
            inputLayerActivations: Object.assign(createElement<HTMLInputElement>('input'), { value: '' }),
            btnInit: createElement<HTMLButtonElement>('button'),
            inputBatchSize: Object.assign(createElement<HTMLInputElement>('input'), { value: '32' }),
            inputMaxEpochs: Object.assign(createElement<HTMLInputElement>('input'), { value: '100' }),
            inputFps: Object.assign(createElement<HTMLInputElement>('input'), { value: '60' }),
            fpsValue: createElement<HTMLSpanElement>('span'),
            inputLrSchedule: Object.assign(createElement<HTMLSelectElement>('select'), { value: 'none' }),
            inputWarmup: Object.assign(createElement<HTMLInputElement>('input'), { value: '0' }),
            inputCycleLength: Object.assign(createElement<HTMLInputElement>('input'), { value: '20' }),
            inputMinLr: Object.assign(createElement<HTMLInputElement>('input'), { value: '0.001' }),
            inputEarlyStop: Object.assign(createElement<HTMLInputElement>('input'), { value: '0' }),
            cyclicLrControls: createElement<HTMLDivElement>('div'),
            inputValSplit: Object.assign(createElement<HTMLSelectElement>('select'), { value: '20' }),
            inputTargetFps: Object.assign(createElement<HTMLSelectElement>('select'), { value: 'full' }),
            btnStart: createElement<HTMLButtonElement>('button'),
            btnPause: createElement<HTMLButtonElement>('button'),
            btnStep: createElement<HTMLButtonElement>('button'),
            btnReset: createElement<HTMLButtonElement>('button'),
            fabStart: createElement<HTMLButtonElement>('button'),
            fabPause: createElement<HTMLButtonElement>('button'),
            epochValue: createElement<HTMLElement>('span'),
            lossValue: createElement<HTMLElement>('span'),
            accuracyValue: createElement<HTMLElement>('span'),
            valLossValue: createElement<HTMLElement>('span'),
            valAccuracyValue: createElement<HTMLElement>('span'),
            stateDisplay: createElement<HTMLElement>('span'),
            suggestionsPanel: createElement<HTMLDivElement>('div'),
            suggestionsList: createElement<HTMLDivElement>('div'),
            floatingMetricsBar: createElement<HTMLDivElement>('div'),
            floatEpoch: createElement<HTMLElement>('span'),
            floatLoss: createElement<HTMLElement>('span'),
            floatAccuracy: createElement<HTMLElement>('span'),
            floatLr: createElement<HTMLElement>('span'),
            floatLossTrend: createElement<HTMLElement>('span'),
            floatAccuracyTrend: createElement<HTMLElement>('span'),
            vizPanel: createElement<HTMLElement>('div'),
        };
    }

    // Helper to create mock session
    function createMockSession(stateOverrides: Partial<TrainingState> = {}) {
        return {
            getState: vi.fn(() => createMockState(stateOverrides)),
            setTrainingConfig: vi.fn(),
            pause: vi.fn(),
            reset: vi.fn(),
            onStateChange: vi.fn(),
        };
    }

    describe('Disposal', () => {
        it('should remove all event listeners on dispose', async () => {
            const { TrainingController } = await import('../../../src/presentation/controllers/TrainingController');
            
            const mockElements = createMockElements();
            const mockSession = createMockSession();
            const callbacks = {
                onNetworkUpdate: vi.fn(),
                onClearVisualization: vi.fn(),
                onDismissSuggestions: vi.fn(),
            };

            // Spy on removeEventListener
            const removeListenerSpies = new Map<HTMLElement, ReturnType<typeof vi.spyOn>>();
            Object.values(mockElements).forEach(el => {
                if (el instanceof HTMLElement) {
                    removeListenerSpies.set(el, vi.spyOn(el, 'removeEventListener'));
                }
            });

            const controller = new TrainingController(
                mockSession as any,
                mockElements,
                callbacks
            );

            // Dispose should clean up listeners
            controller.dispose();

            // Verify removeEventListener was called on key elements
            expect(removeListenerSpies.get(mockElements.btnInit)?.mock.calls.length).toBeGreaterThan(0);
            expect(removeListenerSpies.get(mockElements.btnStart)?.mock.calls.length).toBeGreaterThan(0);
        });

        it('should clear eventCleanup array after dispose', async () => {
            const { TrainingController } = await import('../../../src/presentation/controllers/TrainingController');
            
            const mockElements = createMockElements();
            const mockSession = createMockSession();
            const callbacks = {
                onNetworkUpdate: vi.fn(),
                onClearVisualization: vi.fn(),
                onDismissSuggestions: vi.fn(),
            };

            const controller = new TrainingController(
                mockSession as any,
                mockElements,
                callbacks
            );

            // Access private eventCleanup via any cast
            const controllerAny = controller as any;
            expect(controllerAny.eventCleanup.length).toBeGreaterThan(0);

            controller.dispose();

            expect(controllerAny.eventCleanup.length).toBe(0);
        });
    });

    describe('Validation', () => {
        it('should use validated optimizer type when building config', async () => {
            const { parseOptimizerType } = await import('../../../src/utils/validation');
            const { TrainingController } = await import('../../../src/presentation/controllers/TrainingController');
            
            const mockElements = createMockElements();
            mockElements.inputOptimizer.value = 'invalid';
            
            const mockSession = createMockSession();
            const callbacks = {
                onNetworkUpdate: vi.fn(),
                onClearVisualization: vi.fn(),
                onDismissSuggestions: vi.fn(),
            };

            const controller = new TrainingController(
                mockSession as any,
                mockElements,
                callbacks
            );

            // Access private method via any cast
            const config = (controller as any).buildInitializeNetworkConfig();

            // parseOptimizerType should have been called
            expect(parseOptimizerType).toHaveBeenCalledWith('invalid');
            // Should return default 'adam' for invalid input
            expect(config.optimizer).toBe('adam');

            controller.dispose();
        });

        it('should use validated activation type when building config', async () => {
            const { parseActivationType } = await import('../../../src/utils/validation');
            const { TrainingController } = await import('../../../src/presentation/controllers/TrainingController');
            
            const mockElements = createMockElements();
            mockElements.inputActivation.value = 'invalid';
            
            const mockSession = createMockSession();
            const callbacks = {
                onNetworkUpdate: vi.fn(),
                onClearVisualization: vi.fn(),
                onDismissSuggestions: vi.fn(),
            };

            const controller = new TrainingController(
                mockSession as any,
                mockElements,
                callbacks
            );

            const config = (controller as any).buildInitializeNetworkConfig();

            expect(parseActivationType).toHaveBeenCalledWith('invalid');
            expect(config.activation).toBe('relu');

            controller.dispose();
        });

        it('should parse layers input correctly', async () => {
            const { TrainingController } = await import('../../../src/presentation/controllers/TrainingController');
            
            const mockElements = createMockElements();
            mockElements.inputLayers.value = '16, 8, 4';
            
            const mockSession = createMockSession();
            const callbacks = {
                onNetworkUpdate: vi.fn(),
                onClearVisualization: vi.fn(),
                onDismissSuggestions: vi.fn(),
            };

            const controller = new TrainingController(
                mockSession as any,
                mockElements,
                callbacks
            );

            const config = (controller as any).buildInitializeNetworkConfig();

            expect(config.layers).toEqual([16, 8, 4]);

            controller.dispose();
        });

        it('should filter invalid layer values', async () => {
            const { TrainingController } = await import('../../../src/presentation/controllers/TrainingController');
            
            const mockElements = createMockElements();
            mockElements.inputLayers.value = '8, -1, abc, 4';
            
            const mockSession = createMockSession();
            const callbacks = {
                onNetworkUpdate: vi.fn(),
                onClearVisualization: vi.fn(),
                onDismissSuggestions: vi.fn(),
            };

            const controller = new TrainingController(
                mockSession as any,
                mockElements,
                callbacks
            );

            const config = (controller as any).buildInitializeNetworkConfig();

            // Should only include valid positive integers
            expect(config.layers).toEqual([8, 4]);

            controller.dispose();
        });
    });

    describe('UI State Updates', () => {
        it('should update UI correctly when training is running', async () => {
            const { setVisible, setEnabled } = await import('../../../src/utils/dom');
            const { TrainingController } = await import('../../../src/presentation/controllers/TrainingController');
            
            const mockElements = createMockElements();
            const mockSession = createMockSession();
            mockSession.getState.mockReturnValue(createMockState({
                isInitialised: true,
                datasetLoaded: true,
                isRunning: true,
                isPaused: false,
                isProcessing: false,
                currentEpoch: 5,
                currentLoss: 0.5,
                currentAccuracy: 0.8,
            }));

            const callbacks = {
                onNetworkUpdate: vi.fn(),
                onClearVisualization: vi.fn(),
                onDismissSuggestions: vi.fn(),
            };

            const controller = new TrainingController(
                mockSession as any,
                mockElements,
                callbacks
            );

            // Trigger UI update
            controller.updateUI(mockSession.getState());

            // Start button should be hidden, Pause should be visible
            expect(setVisible).toHaveBeenCalledWith(mockElements.btnStart, false);
            expect(setVisible).toHaveBeenCalledWith(mockElements.btnPause, true);

            controller.dispose();
        });

        it('should update status display text correctly', async () => {
            const { TrainingController } = await import('../../../src/presentation/controllers/TrainingController');
            
            const mockElements = createMockElements();
            const mockSession = createMockSession();

            const callbacks = {
                onNetworkUpdate: vi.fn(),
                onClearVisualization: vi.fn(),
                onDismissSuggestions: vi.fn(),
            };

            const controller = new TrainingController(
                mockSession as any,
                mockElements,
                callbacks
            );

            // Test 'Idle' state
            controller.updateUI(createMockState());
            expect(mockElements.stateDisplay.textContent).toBe('Idle');

            // Test 'Ready' state
            controller.updateUI(createMockState({
                isInitialised: true,
                datasetLoaded: true,
            }));
            expect(mockElements.stateDisplay.textContent).toBe('Ready');

            // Test 'Training' state
            controller.updateUI(createMockState({
                isInitialised: true,
                datasetLoaded: true,
                isRunning: true,
                currentEpoch: 5,
                currentLoss: 0.5,
                currentAccuracy: 0.8,
            }));
            expect(mockElements.stateDisplay.textContent).toBe('Training');

            // Test 'Paused' state
            controller.updateUI(createMockState({
                isInitialised: true,
                datasetLoaded: true,
                isRunning: true,
                isPaused: true,
                currentEpoch: 5,
                currentLoss: 0.5,
                currentAccuracy: 0.8,
            }));
            expect(mockElements.stateDisplay.textContent).toBe('Paused');

            controller.dispose();
        });
    });

    describe('Performance Mode', () => {
        it('should sync FPS slider with performance mode dropdown', async () => {
            const { fpsToPerformanceMode } = await import('../../../src/utils/validation');
            const { TrainingController } = await import('../../../src/presentation/controllers/TrainingController');
            
            const mockElements = createMockElements();
            mockElements.inputFps.value = '60';
            
            const mockSession = createMockSession();
            const callbacks = {
                onNetworkUpdate: vi.fn(),
                onClearVisualization: vi.fn(),
                onDismissSuggestions: vi.fn(),
            };

            const controller = new TrainingController(
                mockSession as any,
                mockElements,
                callbacks
            );

            // Simulate FPS slider change
            mockElements.inputFps.value = '30';
            mockElements.inputFps.dispatchEvent(new Event('input'));

            // fpsToPerformanceMode should be called
            expect(fpsToPerformanceMode).toHaveBeenCalled();

            controller.dispose();
        });
    });
});
