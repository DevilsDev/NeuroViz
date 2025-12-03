import { TrainingSession } from '../../core/application/TrainingSession';
import { ModelComparison } from '../../core/application/ModelComparison';
import { ModelEnsemble } from '../../core/application/ModelEnsemble';
import { TFNeuralNet } from '../../infrastructure/tensorflow/TFNeuralNet';
import { toast } from '../toast';
import { ActivationType, OptimizerType } from '../../core/domain';

export interface ComparisonElements {
    // Baseline Comparison
    comparisonPanel: HTMLDivElement;
    baselineAccuracy: HTMLSpanElement;
    baselineLoss: HTMLSpanElement;
    baselineConfig: HTMLSpanElement;
    currentAccuracy: HTMLSpanElement;
    currentLoss: HTMLSpanElement;
    comparisonDiff: HTMLSpanElement;
    btnSaveBaseline: HTMLButtonElement;
    btnClearBaseline: HTMLButtonElement;
    comparisonMetrics: HTMLDivElement;
    baselineMetrics: HTMLDivElement;

    // Inputs for config summary
    inputLayers: HTMLInputElement;
    inputOptimizer: HTMLSelectElement;
    inputLr: HTMLInputElement;
    inputActivation: HTMLSelectElement;
    inputNumClasses: HTMLSelectElement;
    inputValSplit: HTMLInputElement;

    // A/B Testing
    abComparisonPanel: HTMLDivElement;
    abEpochA: HTMLSpanElement;
    abAccuracyA: HTMLSpanElement;
    abLossA: HTMLSpanElement;
    abEpochB: HTMLSpanElement;
    abAccuracyB: HTMLSpanElement;
    abLossB: HTMLSpanElement;
    abWinner: HTMLDivElement;

    abLrA: HTMLInputElement;
    abActivationA: HTMLSelectElement;
    abOptimizerA: HTMLSelectElement;
    abLrB: HTMLInputElement;
    abActivationB: HTMLSelectElement;
    abOptimizerB: HTMLSelectElement;
    abEpochs: HTMLInputElement;

    btnStartAbTest: HTMLButtonElement;
    btnStopAbTest: HTMLButtonElement;

    // Ensemble
    ensemblePanel: HTMLDivElement;
    ensembleMemberCount: HTMLSpanElement;
    ensembleEpoch: HTMLSpanElement;
    ensembleMembers: HTMLDivElement;

    btnAddEnsembleMember: HTMLButtonElement;
    btnTrainEnsemble: HTMLButtonElement;
    btnResetEnsemble: HTMLButtonElement;
}

interface BaselineData {
    accuracy: number;
    loss: number;
    config: string;
}

export class ComparisonController {
    private baseline: BaselineData | null = null;
    private abComparison: ModelComparison | null = null;
    private abTrainingInterval: ReturnType<typeof setInterval> | null = null;
    private abTargetEpochs: number = 100;

    private ensemble: ModelEnsemble | null = null;
    private ensembleTrainingInterval: ReturnType<typeof setInterval> | null = null;

    constructor(
        private session: TrainingSession,
        private elements: ComparisonElements
    ) {
        this.bindEvents();
    }

    private bindEvents(): void {
        // Baseline
        this.elements.btnSaveBaseline.addEventListener('click', () => this.handleSaveBaseline());
        this.elements.btnClearBaseline.addEventListener('click', () => this.handleClearBaseline());

        // A/B Testing
        this.elements.btnStartAbTest.addEventListener('click', () => void this.handleStartAbTest());
        this.elements.btnStopAbTest.addEventListener('click', () => this.stopAbTest());

        // Ensemble
        this.elements.btnAddEnsembleMember.addEventListener('click', () => void this.addEnsembleMember());
        this.elements.btnTrainEnsemble.addEventListener('click', () => void this.toggleEnsembleTraining());
        this.elements.btnResetEnsemble.addEventListener('click', () => this.resetEnsemble());
    }

    // =============================================================================
    // Baseline Comparison
    // =============================================================================

    private handleSaveBaseline(): void {
        const state = this.session.getState();
        if (state.currentAccuracy === null || state.currentLoss === null) {
            toast.warning('Train a model first to set baseline');
            return;
        }

        const configSummary = `${this.elements.inputLayers.value} | ${this.elements.inputOptimizer.value} | LR ${this.elements.inputLr.value}`;

        this.baseline = {
            accuracy: state.currentAccuracy,
            loss: state.currentLoss,
            config: configSummary,
        };

        this.elements.comparisonPanel.classList.remove('hidden');
        this.elements.baselineAccuracy.textContent = `${(this.baseline.accuracy * 100).toFixed(1)}%`;
        this.elements.baselineLoss.textContent = this.baseline.loss.toFixed(4);
        this.elements.baselineConfig.textContent = this.baseline.config;

        this.updateComparisonDisplay();
        toast.success('Baseline saved');
    }

    private handleClearBaseline(): void {
        this.baseline = null;
        this.elements.comparisonPanel.classList.add('hidden');
        toast.info('Baseline cleared');
    }

    public updateComparisonDisplay(): void {
        if (!this.baseline) return;

        const state = this.session.getState();

        if (state.currentAccuracy !== null) {
            this.elements.currentAccuracy.textContent = `${(state.currentAccuracy * 100).toFixed(1)}%`;
        }
        if (state.currentLoss !== null) {
            this.elements.currentLoss.textContent = state.currentLoss.toFixed(4);
        }

        // Calculate and display difference
        if (state.currentAccuracy !== null && state.currentLoss !== null) {
            const accDiff = (state.currentAccuracy - this.baseline.accuracy) * 100;
            const lossDiff = state.currentLoss - this.baseline.loss;

            const accClass = accDiff >= 0 ? 'text-green-400' : 'text-red-400';
            const lossClass = lossDiff <= 0 ? 'text-green-400' : 'text-red-400';
            const accSign = accDiff >= 0 ? '+' : '';
            const lossSign = lossDiff >= 0 ? '+' : '';

            this.elements.comparisonDiff.innerHTML = `
        <span class="${accClass}">${accSign}${accDiff.toFixed(1)}% acc</span> | 
        <span class="${lossClass}">${lossSign}${lossDiff.toFixed(4)} loss</span>
      `;
        }
    }

    // =============================================================================
    // A/B Testing
    // =============================================================================

    private async handleStartAbTest(): Promise<void> {
        const state = this.session.getState();
        if (!state.datasetLoaded) {
            toast.warning('Please load a dataset first');
            return;
        }

        // Stop any existing test
        this.stopAbTest();

        const layersA = this.elements.inputLayers.value.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n > 0);
        const layersB = [...layersA]; // Start with same architecture
        const numClasses = parseInt(this.elements.inputNumClasses.value, 10) || 2;

        const configA = {
            name: 'Model A',
            hyperparameters: {
                learningRate: parseFloat(this.elements.abLrA.value) || 0.03,
                layers: layersA,
                activation: this.elements.abActivationA.value as ActivationType,
                optimizer: this.elements.abOptimizerA.value as OptimizerType,
                numClasses,
            },
        };

        const configB = {
            name: 'Model B',
            hyperparameters: {
                learningRate: parseFloat(this.elements.abLrB.value) || 0.1,
                layers: layersB,
                activation: this.elements.abActivationB.value as ActivationType,
                optimizer: this.elements.abOptimizerB.value as OptimizerType,
                numClasses,
            },
        };

        this.abTargetEpochs = parseInt(this.elements.abEpochs.value, 10) || 100;

        // Create comparison instance
        this.abComparison = new ModelComparison(() => new TFNeuralNet());

        try {
            await this.abComparison.setupModelA(configA);
            await this.abComparison.setupModelB(configB);

            // Get training data from session
            const data = this.session.getData();
            const valSplit = parseFloat(this.elements.inputValSplit.value) / 100 || 0.2;
            const splitIdx = Math.floor(data.length * (1 - valSplit));
            const shuffled = [...data].sort(() => Math.random() - 0.5);
            const trainingData = shuffled.slice(0, splitIdx);
            const validationData = shuffled.slice(splitIdx);

            // Set data for comparison
            this.abComparison.setData(trainingData, validationData);

            this.elements.abComparisonPanel.classList.remove('hidden');
            toast.info('Starting A/B test...');

            // Start training loop
            let epoch = 0;
            this.abTrainingInterval = setInterval(async () => {
                if (epoch >= this.abTargetEpochs) {
                    this.stopAbTest();
                    this.determineAbWinner();
                    return;
                }

                epoch++;
                const result = await this.abComparison?.trainStep();

                if (result) {
                    this.updateAbDisplay(result, epoch);
                }
            }, 100); // 100ms per epoch

        } catch (error) {
            console.error('Failed to start A/B test:', error);
            toast.error('Failed to start A/B test');
        }
    }

    private stopAbTest(): void {
        if (this.abTrainingInterval) {
            clearInterval(this.abTrainingInterval);
            this.abTrainingInterval = null;
        }
        this.elements.abComparisonPanel.classList.add('hidden');
    }

    private updateAbDisplay(result: { modelA: any; modelB: any }, epoch: number): void {
        this.elements.abEpochA.textContent = epoch.toString();
        this.elements.abEpochB.textContent = epoch.toString();

        this.elements.abAccuracyA.textContent = `${(result.modelA.valAccuracy * 100).toFixed(1)}%`;
        this.elements.abLossA.textContent = result.modelA.valLoss.toFixed(4);

        this.elements.abAccuracyB.textContent = `${(result.modelB.valAccuracy * 100).toFixed(1)}%`;
        this.elements.abLossB.textContent = result.modelB.valLoss.toFixed(4);
    }

    private determineAbWinner(): void {
        if (!this.abComparison) return;

        const results = this.abComparison.getComparison();
        if (!results) return;

        const accA = results.modelA.valAccuracy ?? 0;
        const accB = results.modelB.valAccuracy ?? 0;

        let winnerText = '';
        if (accA > accB) {
            winnerText = `🏆 Model A Wins! (+${((accA - accB) * 100).toFixed(1)}%)`;
            this.elements.abWinner.className = 'mt-4 p-3 bg-blue-900/30 border border-blue-500/50 rounded text-center font-bold text-blue-300';
        } else if (accB > accA) {
            winnerText = `🏆 Model B Wins! (+${((accB - accA) * 100).toFixed(1)}%)`;
            this.elements.abWinner.className = 'mt-4 p-3 bg-purple-900/30 border border-purple-500/50 rounded text-center font-bold text-purple-300';
        } else {
            winnerText = 'It\'s a Tie!';
            this.elements.abWinner.className = 'mt-4 p-3 bg-gray-800 border border-gray-600 rounded text-center font-bold text-gray-300';
        }

        this.elements.abWinner.textContent = winnerText;
        this.elements.abWinner.classList.remove('hidden');
        toast.success(winnerText);
    }

    // =============================================================================
    // Ensemble
    // =============================================================================

    private async addEnsembleMember(): Promise<void> {
        if (!this.ensemble) {
            this.ensemble = new ModelEnsemble(() => new TFNeuralNet());
        }

        const layers = this.elements.inputLayers.value.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n > 0);
        const numClasses = parseInt(this.elements.inputNumClasses.value, 10) || 2;

        const config = {
            learningRate: parseFloat(this.elements.inputLr.value) || 0.03,
            layers,
            activation: this.elements.inputActivation.value as ActivationType,
            optimizer: this.elements.inputOptimizer.value as OptimizerType,
            numClasses,
        };

        await this.ensemble.addMember(`Member ${this.ensemble.getMemberCount() + 1}`, config);
        this.updateEnsembleDisplay();
        toast.success(`Added ensemble member ${this.ensemble.getMemberCount()}`);
    }

    private async toggleEnsembleTraining(): Promise<void> {
        if (this.ensembleTrainingInterval) {
            clearInterval(this.ensembleTrainingInterval);
            this.ensembleTrainingInterval = null;
            this.elements.btnTrainEnsemble.textContent = 'Train Ensemble';
            return;
        }

        if (!this.ensemble || this.ensemble.getMemberCount() === 0) {
            toast.warning('Add ensemble members first');
            return;
        }

        const state = this.session.getState();
        if (!state.datasetLoaded) {
            toast.warning('Please load a dataset first');
            return;
        }

        // Get data
        const data = this.session.getData();
        const valSplit = parseFloat(this.elements.inputValSplit.value) / 100 || 0.2;
        const splitIdx = Math.floor(data.length * (1 - valSplit));
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        const trainingData = shuffled.slice(0, splitIdx);
        const validationData = shuffled.slice(splitIdx);

        // Set data for ensemble
        this.ensemble.setData(trainingData, validationData);

        this.elements.btnTrainEnsemble.textContent = 'Stop Training';
        let epoch = 0;

        this.ensembleTrainingInterval = setInterval(async () => {
            epoch++;
            this.elements.ensembleEpoch.textContent = epoch.toString();

            const results = await this.ensemble?.trainStep();

            // Update UI for each member could go here
            if (epoch % 10 === 0) {
                toast.info(`Ensemble Epoch ${epoch} complete`);
            }
        }, 100);
    }

    private resetEnsemble(): void {
        if (this.ensembleTrainingInterval) {
            clearInterval(this.ensembleTrainingInterval);
            this.ensembleTrainingInterval = null;
        }
        this.ensemble = null;
        this.updateEnsembleDisplay();
        toast.info('Ensemble reset');
    }

    private updateEnsembleDisplay(): void {
        const count = this.ensemble ? this.ensemble.getMemberCount() : 0;
        this.elements.ensembleMemberCount.textContent = count.toString();

        if (count > 0) {
            this.elements.ensemblePanel.classList.remove('hidden');
        } else {
            this.elements.ensemblePanel.classList.add('hidden');
        }
    }
}
