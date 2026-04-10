import { TrainingSession } from '../../core/application/TrainingSession';
import { TFNeuralNet } from '../../infrastructure/tensorflow/TFNeuralNet';
import { toast } from '../toast';

export interface ExportElements {
    btnExportHistorySticky: HTMLButtonElement;
    btnExportModelSticky: HTMLButtonElement;
}

export class ExportController {
    // Event cleanup tracking for proper disposal
    private eventCleanup: Array<{ element: HTMLElement; event: string; handler: EventListener }> = [];

    constructor(
        private session: TrainingSession,
        private neuralNetService: TFNeuralNet,
        private elements: ExportElements
    ) {
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
        this.addTrackedListener(this.elements.btnExportHistorySticky, 'click', () => this.handleExportJson());
        this.addTrackedListener(this.elements.btnExportModelSticky, 'click', () => void this.handleExportModel());
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

    private buildExportPrefix(): string {
        const state = this.session.getState();
        const epoch = state.currentEpoch;
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        return `epoch-${epoch}-${ts}`;
    }

    private handleExportJson(): void {
        const data = this.session.exportHistory('json');
        const prefix = this.buildExportPrefix();
        this.downloadFile(data, `${prefix}-training-history.json`, 'application/json');
        toast.success('Training history exported as JSON');
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
            const prefix = this.buildExportPrefix();
            modelLink.download = `${prefix}-model.json`;
            modelLink.click();
            URL.revokeObjectURL(modelUrl);

            // Download weights.bin
            const weightsUrl = URL.createObjectURL(weightsBlob);
            const weightsLink = document.createElement('a');
            weightsLink.href = weightsUrl;
            weightsLink.download = `${prefix}-weights.bin`;
            weightsLink.click();
            URL.revokeObjectURL(weightsUrl);

            toast.success('Model exported (model.json + weights.bin)');
        } catch (error) {
            console.error('Failed to export model:', error);
            toast.error('Failed to export model');
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
}
