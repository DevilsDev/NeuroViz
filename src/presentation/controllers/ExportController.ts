import { TrainingSession } from '../../core/application/TrainingSession';
import { D3Chart } from '../../infrastructure/d3/D3Chart';
import { TFNeuralNet } from '../../infrastructure/tensorflow/TFNeuralNet';
import { toast } from '../toast';
import { generatePythonCode, generateONNXModel, downloadONNXPythonScript } from '../../infrastructure/export';
import { OptimizerType, ActivationType, LRScheduleType } from '../../core/domain';

export interface ExportElements {
    btnExportJson: HTMLButtonElement;
    btnExportCsv: HTMLButtonElement;
    btnExportPng: HTMLButtonElement;
    btnExportSvg: HTMLButtonElement;
    btnScreenshot: HTMLButtonElement;
    btnExportModel: HTMLButtonElement;
    btnExportPython: HTMLButtonElement;
    btnExportOnnx: HTMLButtonElement;
    inputLoadModel: HTMLInputElement;
    inputLoadWeights: HTMLInputElement;

    // Inputs needed for export config generation
    inputLayers: HTMLInputElement;
    inputLayerActivations: HTMLInputElement;
    inputLr: HTMLInputElement;
    inputOptimizer: HTMLSelectElement;
    inputMomentum: HTMLInputElement;
    inputActivation: HTMLSelectElement;
    inputL1: HTMLInputElement;
    inputL2: HTMLInputElement;
    inputNumClasses: HTMLSelectElement;
    inputDropout: HTMLSelectElement;
    inputClipNorm: HTMLSelectElement;
    inputBatchNorm: HTMLInputElement;
    inputLrSchedule: HTMLSelectElement;
    inputWarmup: HTMLInputElement;
    inputCycleLength: HTMLInputElement;
    inputMinLr: HTMLInputElement;
    inputSamples: HTMLInputElement;
    inputNoise: HTMLInputElement;
    datasetSelect: HTMLSelectElement;
    inputBatchSize: HTMLInputElement;
    inputMaxEpochs: HTMLInputElement;
    inputValSplit: HTMLSelectElement;
}

export class ExportController {
    private pendingModelJson: File | null = null;

    constructor(
        private session: TrainingSession,
        private neuralNetService: TFNeuralNet,
        private visualizerService: D3Chart,
        private elements: ExportElements,
        private callbacks: {
            onModelLoaded: () => void;
        }
    ) {
        this.bindEvents();
    }

    private bindEvents(): void {
        this.elements.btnExportJson.addEventListener('click', () => this.handleExportJson());
        this.elements.btnExportCsv.addEventListener('click', () => this.handleExportCsv());
        this.elements.btnExportPng.addEventListener('click', () => this.handleExportPng());
        this.elements.btnExportSvg.addEventListener('click', () => this.handleExportSvg());
        this.elements.btnScreenshot.addEventListener('click', () => this.handleScreenshot());
        this.elements.btnExportModel.addEventListener('click', () => void this.handleExportModel());
        this.elements.btnExportPython.addEventListener('click', () => this.handleExportPython());
        this.elements.btnExportOnnx.addEventListener('click', () => this.handleExportOnnx());

        this.elements.inputLoadModel.addEventListener('change', (e) => this.handleLoadModelJson(e));
        this.elements.inputLoadWeights.addEventListener('change', (e) => void this.handleLoadModelWeights(e));
    }

    private handleExportJson(): void {
        const data = this.session.exportHistory('json');
        this.downloadFile(data, 'training-history.json', 'application/json');
        toast.success('Training history exported as JSON');
    }

    private handleExportCsv(): void {
        const data = this.session.exportHistory('csv');
        this.downloadFile(data, 'training-history.csv', 'text/csv');
        toast.success('Training history exported as CSV');
    }

    private handleExportPng(): void {
        this.visualizerService.exportAsPNG('neuroviz-boundary');
        toast.success('Decision boundary exported as PNG');
    }

    private handleExportSvg(): void {
        this.visualizerService.exportAsSVG('neuroviz-boundary');
        toast.success('Decision boundary exported as SVG');
    }

    private handleScreenshot(): void {
        const state = this.session.getState();

        // Build metadata from current config
        const metadata: Record<string, string> = {
            'Epoch': state.currentEpoch.toString(),
            'Loss': state.currentLoss?.toFixed(4) ?? '—',
            'Accuracy': state.currentAccuracy ? `${(state.currentAccuracy * 100).toFixed(1)}%` : '—',
            'LR': this.elements.inputLr.value,
            'Layers': this.elements.inputLayers.value,
            'Optimizer': this.elements.inputOptimizer.value,
            'Activation': this.elements.inputActivation.value,
            'Batch': this.elements.inputBatchSize.value || 'all',
            'Dropout': this.elements.inputDropout.value === '0' ? 'none' : this.elements.inputDropout.value,
            'L1': this.elements.inputL1.value || '0',
            'L2': this.elements.inputL2.value || '0',
            'Val Split': `${this.elements.inputValSplit.value}%`,
        };

        this.visualizerService.exportAsPNGWithMetadata('neuroviz-screenshot', metadata);
        toast.success('Screenshot with metadata exported');
    }

    private handleExportPython(): void {
        const state = this.session.getState();
        if (!state.isInitialised) {
            toast.warning('Please initialise a model first');
            return;
        }

        // Build hyperparameters from current config
        const layers = this.parseLayersInput(this.elements.inputLayers.value);
        const layerActivations = this.parseLayerActivations(this.elements.inputLayerActivations.value);

        const hyperparams = {
            learningRate: parseFloat(this.elements.inputLr.value),
            layers,
            optimizer: this.elements.inputOptimizer.value as OptimizerType,
            momentum: parseFloat(this.elements.inputMomentum.value) || 0.9,
            activation: this.elements.inputActivation.value as ActivationType,
            layerActivations: layerActivations.length > 0 ? layerActivations : undefined,
            l1Regularization: parseFloat(this.elements.inputL1.value) || 0,
            l2Regularization: parseFloat(this.elements.inputL2.value) || 0,
            numClasses: parseInt(this.elements.inputNumClasses.value, 10) || 2,
            dropoutRate: parseFloat(this.elements.inputDropout.value) || 0,
            clipNorm: parseFloat(this.elements.inputClipNorm.value) || 0,
            batchNorm: this.elements.inputBatchNorm.checked,
        };

        const lrSchedule = {
            type: this.elements.inputLrSchedule.value as LRScheduleType,
            warmupEpochs: parseInt(this.elements.inputWarmup.value, 10) || 0,
            cycleLength: parseInt(this.elements.inputCycleLength.value, 10) || 20,
            minLR: parseFloat(this.elements.inputMinLr.value) || 0.001,
        };

        const datasetInfo = {
            samples: parseInt(this.elements.inputSamples.value, 10) || 200,
            noise: (parseInt(this.elements.inputNoise.value, 10) || 10) / 100,
            datasetType: this.elements.datasetSelect.value,
        };

        const code = generatePythonCode(hyperparams, lrSchedule, datasetInfo);

        // Download as .py file
        const blob = new Blob([code], { type: 'text/x-python' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `neuroviz-model-${Date.now()}.py`;
        link.click();
        URL.revokeObjectURL(url);

        toast.success('Python code exported');
    }

    private handleExportOnnx(): void {
        const state = this.session.getState();
        if (!state.isInitialised) {
            toast.warning('Please initialise a model first');
            return;
        }

        // Get layer configuration
        const layers = this.parseLayersInput(this.elements.inputLayers.value);
        const numClasses = parseInt(this.elements.inputNumClasses.value, 10) || 2;
        const fullLayers = [2, ...layers, numClasses]; // Input (2D) + hidden + output

        // Get activations
        const layerActivations = this.parseLayerActivations(this.elements.inputLayerActivations.value);
        const defaultActivation = this.elements.inputActivation.value;
        const activations = ['linear', ...layers.map((_, i) => layerActivations[i] ?? defaultActivation), numClasses > 2 ? 'softmax' : 'sigmoid'];

        // Get weights from model
        const weightMatrices = this.neuralNetService.getWeightMatrices();

        // Extract biases (simplified - assumes biases follow weights)
        const biases: number[][] = weightMatrices.map(matrix => {
            // For now, use zeros as we don't have direct bias access
            const outputSize = matrix[0]?.length ?? 1;
            return Array(outputSize).fill(0);
        });

        // Generate ONNX model info
        const modelInfo = generateONNXModel(fullLayers, activations, weightMatrices, biases);

        // Download Python script that generates ONNX
        downloadONNXPythonScript(modelInfo, `neuroviz-onnx-${Date.now()}.py`);

        toast.success('ONNX export script downloaded. Run with Python to generate .onnx file.');
    }

    private async handleExportModel(): Promise<void> {
        const state = this.session.getState();
        if (!state.isInitialised) {
            toast.warning('Please initialise a model first');
            return;
        }

        try {
            const { modelJson, weightsBlob } = await this.neuralNetService.exportModel();

            // Download model.json
            const modelUrl = URL.createObjectURL(modelJson);
            const modelLink = document.createElement('a');
            modelLink.href = modelUrl;
            modelLink.download = 'model.json';
            modelLink.click();
            URL.revokeObjectURL(modelUrl);

            // Download weights.bin
            const weightsUrl = URL.createObjectURL(weightsBlob);
            const weightsLink = document.createElement('a');
            weightsLink.href = weightsUrl;
            weightsLink.download = 'weights.bin';
            weightsLink.click();
            URL.revokeObjectURL(weightsUrl);

            toast.success('Model exported (model.json + weights.bin)');
        } catch (error) {
            console.error('Failed to export model:', error);
            toast.error('Failed to export model');
        }
    }

    private handleLoadModelJson(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        this.pendingModelJson = file;
        // Trigger weights file selection
        this.elements.inputLoadWeights.click();

        // Reset the input so the same file can be selected again
        input.value = '';
    }

    private async handleLoadModelWeights(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        const weightsFile = input.files?.[0];

        if (!weightsFile || !this.pendingModelJson) {
            this.pendingModelJson = null;
            return;
        }

        try {
            toast.info('Loading model...');
            await this.neuralNetService.loadModel(this.pendingModelJson, weightsFile);

            toast.success('Model loaded successfully');
            this.callbacks.onModelLoaded();
        } catch (error) {
            console.error('Failed to load model:', error);
            toast.error('Failed to load model. Ensure files are valid TF.js format.');
        } finally {
            this.pendingModelJson = null;
            input.value = '';
        }
    }

    private downloadFile(content: string, filename: string, mimeType: string): void {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
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
