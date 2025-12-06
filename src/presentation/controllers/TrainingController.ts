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

    // Sticky footer controls
    btnStartSticky: HTMLButtonElement;
    btnPauseSticky: HTMLButtonElement;
    btnStepSticky: HTMLButtonElement;
    btnResetSticky: HTMLButtonElement;

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

    private bindEvents(): void {
        this.elements.btnInit.addEventListener('click', () => void this.handleInitialise());

        // Training controls
        this.elements.btnStart.addEventListener('click', () => void this.handleStart());
        this.elements.btnPause.addEventListener('click', () => this.handlePause());
        this.elements.btnStep.addEventListener('click', () => void this.handleStep());
        this.elements.btnReset.addEventListener('click', () => this.handleReset());

        // Sticky footer controls
        this.elements.btnStartSticky.addEventListener('click', () => void this.handleStart());
        this.elements.btnPauseSticky.addEventListener('click', () => this.handlePause());
        this.elements.btnStepSticky.addEventListener('click', () => void this.handleStep());
        this.elements.btnResetSticky.addEventListener('click', () => this.handleReset());

        // Mobile FAB
        this.elements.fabStart.addEventListener('click', () => void this.handleStart());
        this.elements.fabPause.addEventListener('click', () => this.handlePause());

        // Config changes
        this.elements.inputLrSchedule.addEventListener('change', () => this.handleLrScheduleChange());
        this.elements.inputFps.addEventListener('input', () => this.handleFpsChange());
        this.elements.inputBatchSize.addEventListener('change', () => this.handleBatchSizeChange());
        this.elements.inputMaxEpochs.addEventListener('change', () => this.handleMaxEpochsChange());
        this.elements.inputValSplit.addEventListener('change', () => this.handleValSplitChange());
        this.elements.inputTargetFps.addEventListener('change', () => this.handleFpsChange());

        // Optimizer change to toggle momentum
        this.elements.inputOptimizer.addEventListener('change', () => {
            if (this.elements.inputOptimizer.value === 'sgd') {
                this.elements.momentumControl.classList.remove('hidden');
            } else {
                this.elements.momentumControl.classList.add('hidden');
            }
        });

        this.elements.inputMomentum.addEventListener('input', () => {
            this.elements.momentumValue.textContent = this.elements.inputMomentum.value;
        });
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
     * Builds InitializeNetworkConfig from UI inputs
     */
    private buildInitializeNetworkConfig(): InitializeNetworkConfig {
        const learningRate = parseFloat(this.elements.inputLr.value);
        const layers = this.parseLayersInput(this.elements.inputLayers.value);
        const optimizer = this.elements.inputOptimizer.value as OptimizerType;
        const momentum = parseFloat(this.elements.inputMomentum.value) || 0.9;
        const activation = this.elements.inputActivation.value as ActivationType;
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
     * Builds training configuration from UI inputs
     */
    private buildTrainingConfig() {
        const batchSize = parseInt(this.elements.inputBatchSize.value, 10) || 0;
        const maxEpochs = parseInt(this.elements.inputMaxEpochs.value, 10) || 0;
        const targetFps = parseInt(this.elements.inputFps.value, 10) || 60;
        const lrScheduleType = this.elements.inputLrSchedule.value as LRScheduleType;
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

    private handleFpsChange(): void {
        const fps = parseInt(this.elements.inputFps.value, 10) || 60;
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
        this.elements.btnStepSticky.disabled = true;

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
            this.elements.btnStepSticky.disabled = !canStep;
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

        // Update button states
        if (state.isRunning && !state.isPaused) {
            // Training is running - show Pause, hide Start
            this.elements.btnStart.classList.add('hidden');
            this.elements.btnPause.classList.remove('hidden');
            this.elements.btnPause.disabled = false;
            this.elements.btnStep.disabled = true;

            this.elements.btnStartSticky.classList.add('hidden');
            this.elements.btnPauseSticky.classList.remove('hidden');
            this.elements.btnPauseSticky.disabled = false;
            this.elements.btnStepSticky.disabled = true;

            this.elements.fabStart.classList.add('hidden');
            this.elements.fabPause.classList.remove('hidden');
        } else {
            // Training is paused or stopped - show Start, hide Pause
            this.elements.btnStart.classList.remove('hidden');
            this.elements.btnPause.classList.add('hidden');
            this.elements.btnPause.disabled = true;
            this.elements.btnStep.disabled = !canStart || state.isProcessing;

            this.elements.btnStartSticky.classList.remove('hidden');
            this.elements.btnPauseSticky.classList.add('hidden');
            this.elements.btnPauseSticky.disabled = true;
            this.elements.btnStepSticky.disabled = !canStart || state.isProcessing;

            this.elements.fabStart.classList.remove('hidden');
            this.elements.fabPause.classList.add('hidden');
        }

        // Enable Reset button if initialized and not running (or paused)
        const canReset = state.isInitialised && (!state.isRunning || state.isPaused);
        this.elements.btnReset.disabled = !canReset;
        this.elements.btnResetSticky.disabled = !canReset;

        // Enable/disable Start buttons based on readiness
        this.elements.btnStart.disabled = !canStart;
        this.elements.btnStartSticky.disabled = !canStart;
        this.elements.fabStart.classList.toggle('opacity-50', !canStart);
        this.elements.fabStart.classList.toggle('pointer-events-none', !canStart);

        // Update Floating Metrics Bar
        this.updateFloatingMetrics(state);
    }

    private updateFloatingMetrics(state: TrainingState): void {
        // Show/hide floating metrics bar based on dataset and training state
        const showMetrics = state.datasetLoaded && state.currentEpoch > 0;

        if (showMetrics) {
            this.elements.floatingMetricsBar.classList.remove('hidden');

            // Add pulsing animation during training
            if (state.isRunning && !state.isPaused) {
                this.elements.floatingMetricsBar.classList.add('training');
                this.elements.vizPanel.classList.add('training');
            } else {
                this.elements.floatingMetricsBar.classList.remove('training');
                this.elements.vizPanel.classList.remove('training');
            }

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
            this.elements.floatingMetricsBar.classList.add('hidden');
            this.elements.floatingMetricsBar.classList.remove('training');
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
