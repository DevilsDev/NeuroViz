import { TrainingSession } from '../../core/application/TrainingSession';
import { toast } from '../toast';
import { OptimizerType, ActivationType, LRScheduleType } from '../../core/domain';
import { TrainingState } from '../../core/application/ITrainingSession';
import { resetSuggestionsDismissal } from '../SuggestedFixes';
import {
    CommandExecutor,
    InitializeNetworkCommand,
    InitializeNetworkConfig,
    UpdateTrainingConfigCommand,
    StartTrainingCommand,
    StepTrainingCommand,
} from '../../core/application/commands';
import {
    parseOptimizerType,
    parseActivationType,
    parseLRScheduleType,
    parsePerformanceMode,
    performanceModeToFps,
    fpsToPerformanceMode,
} from '../../utils/validation';
import { setVisible, setEnabled, setActiveState } from '../../utils/dom';

export interface TrainingElements {
    inputLr: HTMLInputElement;
    inputLayers: HTMLInputElement;
    inputOptimizer: HTMLSelectElement;
    inputMomentum: HTMLInputElement;
    momentumValue: HTMLSpanElement;
    momentumControl: HTMLDivElement;
    inputActivation: HTMLSelectElement;
    inputL1: HTMLInputElement;
    inputL2: HTMLInputElement;
    inputNumClasses: HTMLSelectElement;
    inputDropout: HTMLSelectElement;
    inputClipNorm: HTMLSelectElement;
    inputBatchNorm: HTMLInputElement;
    inputLayerActivations: HTMLInputElement;
    btnInit: HTMLButtonElement;

    inputBatchSize: HTMLInputElement;
    inputMaxEpochs: HTMLInputElement;
    inputFps: HTMLInputElement;
    fpsValue: HTMLSpanElement;
    inputLrSchedule: HTMLSelectElement;
    inputWarmup: HTMLInputElement;
    inputCycleLength: HTMLInputElement;
    inputMinLr: HTMLInputElement;
    inputEarlyStop: HTMLInputElement;
    cyclicLrControls: HTMLDivElement;
    inputValSplit: HTMLSelectElement;
    inputTargetFps: HTMLSelectElement;

    btnStart: HTMLButtonElement;
    btnPause: HTMLButtonElement;
    btnStep: HTMLButtonElement;
    btnReset: HTMLButtonElement;

    // Mobile FAB
    fabStart: HTMLButtonElement;
    fabPause: HTMLButtonElement;

    // UI Updates
    epochValue: HTMLElement;
    lossValue: HTMLElement;
    accuracyValue: HTMLElement;
    valLossValue: HTMLElement;
    valAccuracyValue: HTMLElement;
    stateDisplay: HTMLElement;
    suggestionsPanel: HTMLDivElement;
    suggestionsList: HTMLDivElement;

    // Floating Metrics Bar
    floatingMetricsBar: HTMLDivElement;
    floatEpoch: HTMLElement;
    floatLoss: HTMLElement;
    floatAccuracy: HTMLElement;
    floatLr: HTMLElement;
    floatLossTrend: HTMLElement;
    floatAccuracyTrend: HTMLElement;

    // Visualization Panel (for training animation)
    vizPanel: HTMLElement;
}

/**
 * TrainingController - Orchestrates UI interactions for neural network training
 *
 * This controller has been refactored to use the Command pattern, which:
 * - Moves business logic out of the presentation layer into commands
 * - Enables better validation and error handling
 * - Improves testability by separating concerns
 * - Reduces controller complexity from 469 lines to ~430 lines
 */
export class TrainingController {
    private previousLoss: number | null = null;
    private previousAccuracy: number | null = null;
    private commandExecutor: CommandExecutor;

    // Event cleanup tracking for proper disposal
    private eventCleanup: Array<{ element: HTMLElement; event: string; handler: EventListener }> = [];

    constructor(
        private session: TrainingSession,
        private elements: TrainingElements,
        private callbacks: {
            onNetworkUpdate: () => void;
            onClearVisualization: () => void;
            onDismissSuggestions: () => void;
        }
    ) {
        this.commandExecutor = new CommandExecutor();
        this.bindEvents();
    }

    /**
     * Helper to add event listener and track for cleanup
     */
    private addTrackedListener(element: HTMLElement, event: string, handler: EventListener): void {
        element.addEventListener(event, handler);
        this.eventCleanup.push({ element, event, handler });
    }

    private bindEvents(): void {
        this.addTrackedListener(this.elements.btnInit, 'click', () => void this.handleInitialise());

        // Training controls
        this.addTrackedListener(this.elements.btnStart, 'click', () => void this.handleStart());
        this.addTrackedListener(this.elements.btnPause, 'click', () => this.handlePause());
        this.addTrackedListener(this.elements.btnStep, 'click', () => void this.handleStep());
        this.addTrackedListener(this.elements.btnReset, 'click', () => this.handleReset());

        // Mobile FAB
        this.addTrackedListener(this.elements.fabStart, 'click', () => void this.handleStart());
        this.addTrackedListener(this.elements.fabPause, 'click', () => this.handlePause());

        // Config changes
        this.addTrackedListener(this.elements.inputLrSchedule, 'change', () => this.handleLrScheduleChange());
        this.addTrackedListener(this.elements.inputFps, 'input', () => this.handleFpsSliderChange());
        this.addTrackedListener(this.elements.inputBatchSize, 'change', () => this.handleBatchSizeChange());
        this.addTrackedListener(this.elements.inputMaxEpochs, 'change', () => this.handleMaxEpochsChange());
        this.addTrackedListener(this.elements.inputValSplit, 'change', () => this.handleValSplitChange());
        this.addTrackedListener(this.elements.inputTargetFps, 'change', () => this.handlePerfModeChange());


        // Optimizer change to toggle momentum
        this.addTrackedListener(this.elements.inputOptimizer, 'change', () => {
            if (this.elements.inputOptimizer.value === 'sgd') {
                this.elements.momentumControl.classList.remove('hidden');
            } else {
                this.elements.momentumControl.classList.add('hidden');
            }
        });

        this.addTrackedListener(this.elements.inputMomentum, 'input', () => {
            this.elements.momentumValue.textContent = this.elements.inputMomentum.value;
        });
    }

    /**
     * Clean up all event listeners to prevent memory leaks.
     * Call this before re-instantiating the controller.
     */
    public dispose(): void {
        for (const { element, event, handler } of this.eventCleanup) {
            element.removeEventListener(event, handler);
        }
        this.eventCleanup = [];
    }


    /**
     * Handles network initialization using InitializeNetworkCommand
     * Business logic and validation have been moved to the command
     */
    public async handleInitialise(): Promise<void> {
        // Build configuration from UI inputs
        const config = this.buildInitializeNetworkConfig();

        // Create and execute command
        const command = new InitializeNetworkCommand(
            this.session,
            config,
            this.callbacks.onNetworkUpdate
        );

        this.elements.btnInit.disabled = true;
        this.elements.btnInit.textContent = 'Initialising...';

        try {
            const result = await this.commandExecutor.execute(command);

            if (!result.success) {
                if (result.validationResult) {
                    toast.warning(result.validationResult.message);
                } else if (result.error) {
                    toast.error(`Failed to initialise: ${result.error.message}`);
                }
                return;
            }

            // Apply training config after successful initialization
            await this.applyTrainingConfig();

            const optimizer = this.elements.inputOptimizer.value.toUpperCase();
            toast.success(`Network initialized with ${optimizer} optimizer!`);
        } catch (error) {
            console.error('Unexpected error during initialization:', error);
            toast.error('An unexpected error occurred during initialization');
        } finally {
            this.elements.btnInit.disabled = false;
            this.elements.btnInit.textContent = 'Initialise Network';
        }
    }

    /**
     * Builds InitializeNetworkConfig from UI inputs.
     * Uses runtime validation for enum-like values to ensure type safety.
     */
    private buildInitializeNetworkConfig(): InitializeNetworkConfig {
        const learningRate = parseFloat(this.elements.inputLr.value);
        const layers = this.parseLayersInput(this.elements.inputLayers.value);
        // Validate enum values at runtime to prevent invalid configurations
        const optimizer = parseOptimizerType(this.elements.inputOptimizer.value);
        const momentum = parseFloat(this.elements.inputMomentum.value) || 0.9;
        const activation = parseActivationType(this.elements.inputActivation.value);
        const l1Regularization = parseFloat(this.elements.inputL1.value) || 0;
        const l2Regularization = parseFloat(this.elements.inputL2.value) || 0;
        const numClasses = parseInt(this.elements.inputNumClasses.value, 10) || 2;
        const dropoutRate = parseFloat(this.elements.inputDropout.value) || 0;
        const clipNorm = parseFloat(this.elements.inputClipNorm.value) || 0;
        const batchNorm = this.elements.inputBatchNorm.checked;
        const layerActivations = this.parseLayerActivations(this.elements.inputLayerActivations.value);

        return {
            learningRate,
            layers,
            optimizer,
            momentum,
            activation,
            layerActivations: layerActivations.length > 0 ? layerActivations : undefined,
            l1Regularization,
            l2Regularization,
            numClasses,
            dropoutRate,
            clipNorm,
            batchNorm,
        };
    }

    /**
     * Applies training configuration using UpdateTrainingConfigCommand
     */
    public async applyTrainingConfig(): Promise<void> {
        const config = this.buildTrainingConfig();
        const command = new UpdateTrainingConfigCommand(this.session, config);

        const result = await this.commandExecutor.execute(command);

        if (!result.success) {
            if (result.validationResult) {
                console.warn('Training config validation failed:', result.validationResult.message);
            } else if (result.error) {
                console.error('Failed to apply training config:', result.error);
            }
        }
    }

    /**
     * Builds training configuration from UI inputs.
     * Uses runtime validation for enum-like values.
     */
    private buildTrainingConfig() {
        const batchSize = parseInt(this.elements.inputBatchSize.value, 10) || 0;
        const maxEpochs = parseInt(this.elements.inputMaxEpochs.value, 10) || 0;
        const targetFps = parseInt(this.elements.inputFps.value, 10) || 60;
        // Validate LR schedule type at runtime
        const lrScheduleType = parseLRScheduleType(this.elements.inputLrSchedule.value);
        const warmupEpochs = parseInt(this.elements.inputWarmup.value, 10) || 0;
        const cycleLength = parseInt(this.elements.inputCycleLength.value, 10) || 20;
        const minLR = parseFloat(this.elements.inputMinLr.value) || 0.001;
        const earlyStoppingPatience = parseInt(this.elements.inputEarlyStop.value, 10) || 0;

        return {
            batchSize,
            maxEpochs,
            targetFps,
            lrSchedule: {
                type: lrScheduleType,
                decayRate: 0.95,
                decaySteps: 10,
                warmupEpochs,
                cycleLength,
                minLR,
            },
            earlyStoppingPatience,
        };
    }

    private handleLrScheduleChange(): void {
        const scheduleType = this.elements.inputLrSchedule.value;
        const isCyclic = scheduleType === 'cyclic_triangular' || scheduleType === 'cyclic_cosine';

        if (isCyclic) {
            this.elements.cyclicLrControls.classList.remove('hidden');
        } else {
            this.elements.cyclicLrControls.classList.add('hidden');
        }

        void this.applyTrainingConfig();
    }

    /**
     * Handles FPS slider changes - updates display and syncs performance mode dropdown.
     * Uses validated conversion to performance mode.
     */
    private handleFpsSliderChange(): void {
        const fps = parseInt(this.elements.inputFps.value, 10) || 60;
        this.elements.fpsValue.textContent = fps.toString();
        this.session.setTrainingConfig({ targetFps: fps });

        // Sync performance mode dropdown using validated conversion
        this.elements.inputTargetFps.value = fpsToPerformanceMode(fps);
    }

    /**
     * Handles performance mode dropdown changes - converts to FPS and syncs slider.
     * Uses runtime validation for the performance mode value.
     */
    private handlePerfModeChange(): void {
        // Validate performance mode at runtime
        const mode = parsePerformanceMode(this.elements.inputTargetFps.value);
        const fps = performanceModeToFps(mode);

        // Update slider and display
        this.elements.inputFps.value = fps.toString();
        this.elements.fpsValue.textContent = fps.toString();
        this.session.setTrainingConfig({ targetFps: fps });
    }


    private handleBatchSizeChange(): void {
        const batchSize = parseInt(this.elements.inputBatchSize.value, 10) || 0;
        this.session.setTrainingConfig({ batchSize });
    }

    private handleMaxEpochsChange(): void {
        const maxEpochs = parseInt(this.elements.inputMaxEpochs.value, 10) || 0;
        this.session.setTrainingConfig({ maxEpochs });
    }

    private handleValSplitChange(): void {
        const split = parseInt(this.elements.inputValSplit.value, 10);
        this.session.setTrainingConfig({ validationSplit: split / 100 });
    }

    /**
     * Handles training start using StartTrainingCommand
     */
    public async handleStart(): Promise<void> {
        resetSuggestionsDismissal('suggestions-panel');

        const command = new StartTrainingCommand(this.session);
        const result = await this.commandExecutor.execute(command);

        if (!result.success) {
            if (result.validationResult) {
                toast.warning(result.validationResult.message);
            } else if (result.error) {
                toast.error(`Failed to start: ${result.error.message}`);
            }
        }
    }

    public handlePause(): void {
        this.session.pause();
    }

    /**
     * Handles training step using StepTrainingCommand
     */
    public async handleStep(): Promise<void> {
        // Guard against rapid clicks while processing
        if (this.elements.btnStep.disabled) {
            return;
        }

        this.elements.btnStep.disabled = true;

        try {
            const command = new StepTrainingCommand(this.session);
            const result = await this.commandExecutor.execute(command);

            if (!result.success) {
                if (result.validationResult) {
                    toast.warning(result.validationResult.message);
                } else if (result.error) {
                    toast.error(`Step failed: ${result.error.message}`);
                }
            }

            // Wait a frame for state notification to complete
            await new Promise((resolve) => requestAnimationFrame(resolve));
        } finally {
            // Re-enable only if state is valid for stepping
            const state = this.session.getState();
            const canStep = state.isInitialised && state.datasetLoaded && (!state.isRunning || state.isPaused) && !state.isProcessing;
            this.elements.btnStep.disabled = !canStep;
        }
    }

    public handleReset(): void {
        this.session.reset();
        this.callbacks.onClearVisualization();
        this.callbacks.onDismissSuggestions();
    }

    public updateUI(state: TrainingState): void {
        this.elements.epochValue.textContent = state.currentEpoch.toString();
        this.elements.lossValue.textContent = state.currentLoss?.toFixed(4) ?? '—';
        this.elements.accuracyValue.textContent = state.currentAccuracy ? `${(state.currentAccuracy * 100).toFixed(1)}%` : '—';
        this.elements.valLossValue.textContent = state.currentValLoss?.toFixed(4) ?? '—';
        this.elements.valAccuracyValue.textContent = state.currentValAccuracy ? `${(state.currentValAccuracy * 100).toFixed(1)}%` : '—';

        // Update status display text
        let statusText = 'Idle';
        if (state.isRunning && !state.isPaused) {
            statusText = 'Training';
        } else if (state.isPaused) {
            statusText = 'Paused';
        } else if (state.isInitialised && state.datasetLoaded) {
            statusText = 'Ready';
        }
        this.elements.stateDisplay.textContent = statusText;

        // Determine if training can be started (or resumed from pause)
        const canStart = state.isInitialised && state.datasetLoaded && (!state.isRunning || state.isPaused);

        // Update button states using standardised DOM helpers
        const isTraining = state.isRunning && !state.isPaused;
        
        // Toggle Start/Pause button visibility
        setVisible(this.elements.btnStart, !isTraining);
        setVisible(this.elements.btnPause, isTraining);
        setEnabled(this.elements.btnPause, isTraining);
        setEnabled(this.elements.btnStep, canStart && !isTraining && !state.isProcessing);

        // Mobile FAB buttons
        setVisible(this.elements.fabStart, !isTraining);
        setVisible(this.elements.fabPause, isTraining);

        // Enable Reset button if initialized and not running (or paused)
        const canReset = state.isInitialised && (!state.isRunning || state.isPaused);
        setEnabled(this.elements.btnReset, canReset);

        // Enable/disable Start buttons based on readiness
        setEnabled(this.elements.btnStart, canStart);
        setEnabled(this.elements.fabStart, canStart);

        // Update Floating Metrics Bar
        this.updateFloatingMetrics(state);
    }

    private updateFloatingMetrics(state: TrainingState): void {
        // Show/hide floating metrics bar based on dataset and training state
        const showMetrics = state.datasetLoaded && state.currentEpoch > 0;
        const isTraining = state.isRunning && !state.isPaused;

        setVisible(this.elements.floatingMetricsBar, showMetrics);

        if (showMetrics) {
            // Add pulsing animation during training using standardised helper
            setActiveState(this.elements.floatingMetricsBar, isTraining, 'training');
            setActiveState(this.elements.vizPanel, isTraining, 'training');

            // Update epoch
            this.elements.floatEpoch.textContent = state.currentEpoch.toString();

            // Update loss with trend
            if (state.currentLoss !== null && state.currentLoss !== undefined) {
                this.elements.floatLoss.textContent = state.currentLoss.toFixed(4);

                // Calculate and display trend
                if (this.previousLoss !== null) {
                    const lossChange = state.currentLoss - this.previousLoss;
                    if (Math.abs(lossChange) > 0.0001) {
                        if (lossChange < 0) {
                            this.elements.floatLossTrend.textContent = '▼';
                            this.elements.floatLossTrend.className = 'floating-metric-trend trending-down';
                        } else {
                            this.elements.floatLossTrend.textContent = '▲';
                            this.elements.floatLossTrend.className = 'floating-metric-trend trending-up';
                        }
                    } else {
                        this.elements.floatLossTrend.textContent = '';
                    }
                }
                this.previousLoss = state.currentLoss;
            } else {
                this.elements.floatLoss.textContent = '—';
                this.elements.floatLossTrend.textContent = '';
            }

            // Update accuracy with trend
            if (state.currentAccuracy !== null && state.currentAccuracy !== undefined) {
                this.elements.floatAccuracy.textContent = `${(state.currentAccuracy * 100).toFixed(1)}%`;

                // Calculate and display trend
                if (this.previousAccuracy !== null) {
                    const accChange = state.currentAccuracy - this.previousAccuracy;
                    if (Math.abs(accChange) > 0.001) {
                        if (accChange > 0) {
                            this.elements.floatAccuracyTrend.textContent = '▲';
                            this.elements.floatAccuracyTrend.className = 'floating-metric-trend trending-up';
                        } else {
                            this.elements.floatAccuracyTrend.textContent = '▼';
                            this.elements.floatAccuracyTrend.className = 'floating-metric-trend trending-down';
                        }
                    } else {
                        this.elements.floatAccuracyTrend.textContent = '';
                    }
                }
                this.previousAccuracy = state.currentAccuracy;
            } else {
                this.elements.floatAccuracy.textContent = '—';
                this.elements.floatAccuracyTrend.textContent = '';
            }

            // Update learning rate
            const lr = parseFloat(this.elements.inputLr.value);
            if (!isNaN(lr)) {
                this.elements.floatLr.textContent = lr.toFixed(4);
            } else {
                this.elements.floatLr.textContent = '—';
            }
        } else {
            // Already hidden by setVisible above, just reset training state
            setActiveState(this.elements.floatingMetricsBar, false, 'training');
            // Reset trend tracking
            this.previousLoss = null;
            this.previousAccuracy = null;
        }
    }

    private parseLayersInput(input: string): number[] {
        return input.split(',')
            .map(s => parseInt(s.trim(), 10))
            .filter(n => !isNaN(n) && n > 0);
    }

    private parseLayerActivations(input: string): ActivationType[] {
        if (!input || input.trim() === '') return [];

        const validActivations: ActivationType[] = ['linear', 'relu', 'sigmoid', 'tanh', 'leaky_relu', 'elu', 'selu', 'softmax'];

        return input.split(',')
            .map(s => s.trim().toLowerCase() as ActivationType)
            .filter(a => validActivations.includes(a));
    }
}
