import { TrainingSession } from '../../core/application/TrainingSession';
import { toast } from '../toast';
import { logger, type LogContext } from '../../infrastructure/logging/Logger';
import { TrainingState } from '../../core/application/ITrainingSession';
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
    parseLossType,
    performanceModeToFps,
    fpsToPerformanceMode,
} from '../../utils/validation';
import { setVisible, setEnabled } from '../../utils/dom';

export interface TrainingElements {
    inputLr: HTMLInputElement;
    inputLayers: HTMLInputElement;
    inputOptimizer: HTMLSelectElement;
    inputActivation: HTMLSelectElement;
    inputL1: HTMLInputElement;
    inputL2: HTMLInputElement;
    inputNumClasses: HTMLSelectElement;
    inputDropout: HTMLSelectElement;
    inputBatchNorm: HTMLInputElement;
    inputLossFunction: HTMLSelectElement;
    btnInit: HTMLButtonElement;

    inputBatchSize: HTMLInputElement;
    inputMaxEpochs: HTMLInputElement;
    inputFps: HTMLInputElement;
    fpsValue: HTMLSpanElement;
    inputLrSchedule: HTMLSelectElement;
    inputValSplit: HTMLSelectElement;
    inputTargetFps: HTMLSelectElement;

    btnStart: HTMLButtonElement;
    btnPause: HTMLButtonElement;
    btnStep: HTMLButtonElement;
    btnReset: HTMLButtonElement;

    // Toolbar metrics
    epochValue: HTMLElement;
    lossValue: HTMLElement;
    accuracyValue: HTMLElement;
    valLossValue: HTMLElement;
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
    private commandExecutor: CommandExecutor;

    // Event cleanup tracking for proper disposal
    private eventCleanup: Array<{ element: HTMLElement; event: string; handler: EventListener }> = [];

    // Stale-model detection: snapshot of last-initialised hyperparams
    private lastInitConfig: string | null = null;

    constructor(
        private session: TrainingSession,
        private elements: TrainingElements,
        private callbacks: {
            onNetworkUpdate: () => void;
            onClearVisualization: () => void;
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

        // Config changes
        this.addTrackedListener(this.elements.inputLrSchedule, 'change', () => this.handleLrScheduleChange());
        this.addTrackedListener(this.elements.inputFps, 'input', () => this.handleFpsSliderChange());
        this.addTrackedListener(this.elements.inputBatchSize, 'change', () => this.handleBatchSizeChange());
        this.addTrackedListener(this.elements.inputMaxEpochs, 'change', () => this.handleMaxEpochsChange());
        this.addTrackedListener(this.elements.inputValSplit, 'change', () => this.handleValSplitChange());
        this.addTrackedListener(this.elements.inputTargetFps, 'change', () => this.handlePerfModeChange());

        // Model-defining inputs that make an existing model stale when changed
        const staleInputs: HTMLElement[] = [
            this.elements.inputLr, this.elements.inputLayers,
            this.elements.inputOptimizer, this.elements.inputActivation,
            this.elements.inputLossFunction, this.elements.inputBatchNorm,
            this.elements.inputL1, this.elements.inputL2,
            this.elements.inputDropout, this.elements.inputNumClasses,
        ];
        for (const el of staleInputs) {
            this.addTrackedListener(el, 'change', () => this.updateStaleBadge());
            this.addTrackedListener(el, 'input', () => this.updateStaleBadge());
        }
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
        logger.debug('[TrainingController] handleInitialise called');

        // Build configuration from UI inputs
        const config = this.buildInitializeNetworkConfig();
        logger.debug('[TrainingController] Config built', config as unknown as LogContext);

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
            logger.debug('[TrainingController] Initialize result', result as unknown as LogContext);

            if (!result.success) {
                if (result.validationResult) {
                    logger.debug('[TrainingController] Validation errors:', {
                        message: result.validationResult.message,
                        errors: result.validationResult.errors,
                        isValid: result.validationResult.isValid
                    });
                    toast.warning(result.validationResult.message);
                } else if (result.error) {
                    console.error('[TrainingController] Execution error:', result.error);
                    toast.error(`Failed to initialise: ${result.error.message}`);
                }
                return;
            }

            // Apply training config after successful initialization
            await this.applyTrainingConfig();

            // Snapshot config so we can detect staleness on future changes
            this.lastInitConfig = this.currentConfigHash();
            this.updateStaleBadge();

            const optimizer = this.elements.inputOptimizer.value.toUpperCase();
            toast.success(`Network initialized with ${optimizer} optimizer!`);
            logger.debug('[TrainingController] Initialization completed successfully');
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
        const activation = parseActivationType(this.elements.inputActivation.value);
        const l1Regularization = parseFloat(this.elements.inputL1.value) || 0;
        const l2Regularization = parseFloat(this.elements.inputL2.value) || 0;
        const numClasses = parseInt(this.elements.inputNumClasses.value, 10) || 2;
        const dropoutRate = parseFloat(this.elements.inputDropout.value) || 0;
        const batchNorm = this.elements.inputBatchNorm.checked;
        const lossFunction = parseLossType(this.elements.inputLossFunction.value);

        return {
            learningRate,
            layers,
            optimizer,
            activation,
            l1Regularization,
            l2Regularization,
            numClasses,
            dropoutRate,
            batchNorm,
            lossFunction,
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
    private buildTrainingConfig(): UpdateTrainingConfigCommand['config'] {
        const batchSize = parseInt(this.elements.inputBatchSize.value, 10) || 0;
        const maxEpochs = parseInt(this.elements.inputMaxEpochs.value, 10) || 0;
        const targetFps = parseInt(this.elements.inputFps.value, 10) || 60;
        const validationSplit = parseInt(this.elements.inputValSplit.value, 10) / 100;
        // Validate LR schedule type at runtime
        const lrScheduleType = parseLRScheduleType(this.elements.inputLrSchedule.value);

        return {
            batchSize,
            maxEpochs,
            targetFps,
            validationSplit,
            lrSchedule: {
                type: lrScheduleType,
                decayRate: 0.95,
                decaySteps: 10,
            },
        };
    }

    private currentConfigHash(): string {
        return [
            this.elements.inputLr.value,
            this.elements.inputLayers.value,
            this.elements.inputOptimizer.value,
            this.elements.inputActivation.value,
            this.elements.inputLossFunction.value,
            this.elements.inputBatchNorm.checked,
            this.elements.inputL1.value,
            this.elements.inputL2.value,
            this.elements.inputDropout.value,
            this.elements.inputNumClasses.value,
        ].join('|');
    }

    private updateStaleBadge(): void {
        const badge = document.getElementById('badge-model-stale');
        if (!badge) return;
        const isStale = this.lastInitConfig !== null
            && this.currentConfigHash() !== this.lastInitConfig;
        badge.classList.toggle('hidden', !isStale);
    }

    private handleLrScheduleChange(): void {
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
        logger.debug('[TrainingController] handleStart called');

        // Auto-initialize if network hasn't been set up yet
        const state = this.session.getState();
        if (!state.isInitialised) {
            logger.debug('[TrainingController] Auto-initializing network before training');
            await this.handleInitialise();
            // Re-check — initialization may have failed
            if (!this.session.getState().isInitialised) {
                return;
            }
        }

        const command = new StartTrainingCommand(this.session);
        const result = await this.commandExecutor.execute(command);
        logger.debug('[TrainingController] Start result', result as unknown as LogContext);

        if (!result.success) {
            if (result.validationResult) {
                toast.warning(result.validationResult.message);
            } else if (result.error) {
                toast.error(`Failed to start: ${result.error.message}`);
            }
        } else {
            logger.debug('[TrainingController] Training started successfully');
        }
    }

    public handlePause(): void {
        logger.debug('[TrainingController] handlePause called');
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
    }

    public updateUI(state: TrainingState): void {
        this.elements.epochValue.textContent = state.currentEpoch.toString();
        this.elements.lossValue.textContent = state.currentLoss !== null ? state.currentLoss.toFixed(4) : '—';
        this.elements.accuracyValue.textContent = state.currentAccuracy !== null ? `${(state.currentAccuracy * 100).toFixed(1)}%` : '—';
        this.elements.valLossValue.textContent = state.currentValLoss !== null ? state.currentValLoss.toFixed(4) : '—';

        // Determine if training can be started (or resumed from pause)
        // Allow start when dataset is loaded even if not yet initialized — handleStart() will auto-init
        const canStart = state.datasetLoaded && (!state.isRunning || state.isPaused);
        const isTraining = state.isRunning && !state.isPaused;

        // Toggle Start/Pause button visibility
        setVisible(this.elements.btnStart, !isTraining);
        setVisible(this.elements.btnPause, isTraining);
        setEnabled(this.elements.btnPause, isTraining);
        setEnabled(this.elements.btnStep, canStart && !isTraining && !state.isProcessing);

        // Enable Reset button if initialized and not running (or paused)
        const canReset = state.isInitialised && (!state.isRunning || state.isPaused);
        setEnabled(this.elements.btnReset, canReset);

        // Enable/disable Start button based on readiness
        setEnabled(this.elements.btnStart, canStart);
    }

    private parseLayersInput(input: string): number[] {
        return input.split(',')
            .map(s => parseInt(s.trim(), 10))
            .filter(n => !isNaN(n) && n > 0);
    }
}
