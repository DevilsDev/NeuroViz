import { TrainingSession } from '../../core/application/TrainingSession';
import { toast } from '../toast';
import { Hyperparameters, OptimizerType, ActivationType, LRScheduleType } from '../../core/domain';
import { TrainingState } from '../../core/application/ITrainingSession';
import { resetSuggestionsDismissal } from '../SuggestedFixes';

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
    inputTargetFps: HTMLSelectElement; // Added

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
    suggestionsPanel: HTMLDivElement;
    suggestionsList: HTMLDivElement;
}

export class TrainingController {
    constructor(
        private session: TrainingSession,
        private elements: TrainingElements,
        private callbacks: {
            onNetworkUpdate: () => void;
            onClearVisualization: () => void;
            onDismissSuggestions: () => void;
        }
    ) {
        this.bindEvents();
    }

    private bindEvents(): void {
        this.elements.btnInit.addEventListener('click', () => void this.handleInitialise());

        // Training controls
        this.elements.btnStart.addEventListener('click', () => this.handleStart());
        this.elements.btnPause.addEventListener('click', () => this.handlePause());
        this.elements.btnStep.addEventListener('click', () => void this.handleStep());
        this.elements.btnReset.addEventListener('click', () => this.handleReset());

        // Sticky footer controls
        this.elements.btnStartSticky.addEventListener('click', () => this.handleStart());
        this.elements.btnPauseSticky.addEventListener('click', () => this.handlePause());
        this.elements.btnStepSticky.addEventListener('click', () => void this.handleStep());
        this.elements.btnResetSticky.addEventListener('click', () => this.handleReset());

        // Mobile FAB
        this.elements.fabStart.addEventListener('click', () => this.handleStart());
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

    public async handleInitialise(): Promise<void> {
        const learningRate = parseFloat(this.elements.inputLr.value);

        if (isNaN(learningRate) || learningRate <= 0) {
            toast.warning('Please enter a valid learning rate (positive number).');
            return;
        }

        let layers: number[];
        try {
            layers = this.parseLayersInput(this.elements.inputLayers.value);
        } catch (error) {
            toast.warning(error instanceof Error ? error.message : 'Invalid layer configuration');
            return;
        }

        const optimizer = this.elements.inputOptimizer.value as OptimizerType;
        const momentum = parseFloat(this.elements.inputMomentum.value) || 0.9;
        const activation = this.elements.inputActivation.value as ActivationType;
        const l1Regularization = parseFloat(this.elements.inputL1.value) || 0;
        const l2Regularization = parseFloat(this.elements.inputL2.value) || 0;
        const numClasses = parseInt(this.elements.inputNumClasses.value, 10) || 2;
        const dropoutRate = parseFloat(this.elements.inputDropout.value) || 0;
        const clipNorm = parseFloat(this.elements.inputClipNorm.value) || 0;
        const batchNorm = this.elements.inputBatchNorm.checked;

        // Parse per-layer activations (optional)
        const layerActivations = this.parseLayerActivations(this.elements.inputLayerActivations.value);

        const config: Hyperparameters = {
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

        this.elements.btnInit.disabled = true;
        this.elements.btnInit.textContent = 'Initialising...';

        try {
            await this.session.setHyperparameters(config);

            // Apply training config
            this.applyTrainingConfig();

            // Update network diagram
            this.callbacks.onNetworkUpdate();

            toast.success(`Network initialized with ${optimizer.toUpperCase()} optimizer!`);
        } catch (error) {
            console.error('Failed to initialise network:', error);
            toast.error(
                `Failed to initialise network: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        } finally {
            this.elements.btnInit.disabled = false;
            this.elements.btnInit.textContent = 'Initialise Network';
        }
    }

    public applyTrainingConfig(): void {
        const batchSize = parseInt(this.elements.inputBatchSize.value, 10) || 0;
        const maxEpochs = parseInt(this.elements.inputMaxEpochs.value, 10) || 0;
        const targetFps = parseInt(this.elements.inputFps.value, 10) || 60;
        const lrScheduleType = this.elements.inputLrSchedule.value as LRScheduleType;
        const warmupEpochs = parseInt(this.elements.inputWarmup.value, 10) || 0;
        const cycleLength = parseInt(this.elements.inputCycleLength.value, 10) || 20;
        const minLR = parseFloat(this.elements.inputMinLr.value) || 0.001;
        const earlyStoppingPatience = parseInt(this.elements.inputEarlyStop.value, 10) || 0;

        this.session.setTrainingConfig({
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
        });
    }

    private handleLrScheduleChange(): void {
        const scheduleType = this.elements.inputLrSchedule.value;
        const isCyclic = scheduleType === 'cyclic_triangular' || scheduleType === 'cyclic_cosine';

        if (isCyclic) {
            this.elements.cyclicLrControls.classList.remove('hidden');
        } else {
            this.elements.cyclicLrControls.classList.add('hidden');
        }

        this.applyTrainingConfig();
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

    public handleStart(): void {
        try {
            resetSuggestionsDismissal('suggestions-panel');
            this.session.start();
        } catch (error) {
            console.error('Failed to start training:', error);
            toast.error(`Failed to start: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    public handlePause(): void {
        this.session.pause();
    }

    public async handleStep(): Promise<void> {
        // Guard against rapid clicks while processing
        if (this.elements.btnStep.disabled) {
            return;
        }

        this.elements.btnStep.disabled = true;

        try {
            await this.session.step();
            // Wait a frame for state notification to complete
            await new Promise((resolve) => requestAnimationFrame(resolve));
        } catch (error) {
            console.error('Step failed:', error);
            toast.error(`Step failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            // Re-enable only if state is valid for stepping
            const state = this.session.getState();
            this.elements.btnStep.disabled = !state.isInitialised || !state.datasetLoaded || state.isRunning;
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

        // Update button states
        if (state.isRunning && !state.isPaused) {
            this.elements.btnStart.classList.add('hidden');
            this.elements.btnPause.classList.remove('hidden');
            this.elements.btnStep.disabled = true;

            this.elements.btnStartSticky.classList.add('hidden');
            this.elements.btnPauseSticky.classList.remove('hidden');
            this.elements.btnStepSticky.disabled = true;

            this.elements.fabStart.classList.add('hidden');
            this.elements.fabPause.classList.remove('hidden');
        } else {
            this.elements.btnStart.classList.remove('hidden');
            this.elements.btnPause.classList.add('hidden');
            this.elements.btnStep.disabled = false;

            this.elements.btnStartSticky.classList.remove('hidden');
            this.elements.btnPauseSticky.classList.add('hidden');
            this.elements.btnStepSticky.disabled = false;

            this.elements.fabStart.classList.remove('hidden');
            this.elements.fabPause.classList.add('hidden');
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
