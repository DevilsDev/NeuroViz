import { TrainingSession } from '../../core/application/TrainingSession';
import { TFNeuralNet } from '../../infrastructure/tensorflow/TFNeuralNet';
import { D3Chart } from '../../infrastructure/d3/D3Chart';
import { D3GradientFlow, estimateGradients } from '../../infrastructure/d3/D3GradientFlow';
import { toast } from '../toast';
import { Point } from '../../core/domain';
import { APP_CONFIG } from '../../config/app.config';
import type { ThreeVisualization, Prediction3D, Point3D } from '../../infrastructure/three';

export interface VisualizationElements {
    inputVoronoi: HTMLInputElement;

    // Gradient Flow chart host
    gradientFlowChart: HTMLDivElement;

    // 3D View
    input3dView: HTMLInputElement;
    threeContainer: HTMLDivElement;

    // Gradient Flow
    inputShowGradients: HTMLInputElement;
    gradientFlowContainer: HTMLDivElement;
}

export class VisualizationController {
    private gradientFlow: D3GradientFlow | null = null;
    private threeViz: ThreeVisualization | null = null;
    private previousWeights: number[][][] = [];

    // Event cleanup tracking for proper disposal
    private eventCleanup: Array<{ element: HTMLElement; event: string; handler: EventListener }> = [];

    constructor(
        private session: TrainingSession,
        private neuralNetService: TFNeuralNet,
        private visualizerService: D3Chart,
        private elements: VisualizationElements
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
        this.addTrackedListener(this.elements.input3dView, 'change', () => void this.handle3dViewToggle());
        this.addTrackedListener(this.elements.inputShowGradients, 'change', () => this.handleGradientToggle());
        this.addTrackedListener(this.elements.inputVoronoi, 'change', () => this.handleVoronoiToggle());
    }

    /**
     * Clears all visualization state without disposing resources.
     * Call this on reset to clear displayed data while keeping the controller active.
     */
    public clear(): void {
        this.threeViz?.clear();
        this.gradientFlow?.clear();
        this.previousWeights = [];
    }

    /**
     * Clean up all event listeners and resources to prevent memory leaks.
     * Call this before re-instantiating the controller.
     */
    public dispose(): void {
        for (const { element, event, handler } of this.eventCleanup) {
            element.removeEventListener(event, handler);
        }
        this.eventCleanup = [];

        this.threeViz?.dispose();
        this.threeViz = null;
        this.gradientFlow = null;
    }

    private handleVoronoiToggle(): void {
        this.visualizerService.setVoronoiOverlay(this.elements.inputVoronoi.checked);
    }

    public async handle3dViewToggle(): Promise<void> {
        if (this.elements.input3dView.checked) {
            this.elements.threeContainer.classList.remove('hidden');

            // Lazy load Three.js
            if (!this.threeViz) {
                try {
                    const { ThreeVisualization } = await import('../../infrastructure/three');
                    this.threeViz = new ThreeVisualization(this.elements.threeContainer);
                    toast.success('3D view enabled');
                } catch (error) {
                    console.error('Failed to load 3D visualization:', error);
                    toast.error('Failed to load 3D visualization');
                    this.elements.input3dView.checked = false;
                    this.elements.threeContainer.classList.add('hidden');
                    return;
                }
            }

            // Update 3D view with current data
            await this.update3dView();
        } else {
            this.elements.threeContainer.classList.add('hidden');
        }
    }

    public async update3dView(): Promise<void> {
        if (!this.threeViz || !this.elements.input3dView.checked) return;

        const state = this.session.getState();
        if (!state.isInitialised || !state.datasetLoaded) return;

        try {
            // Get predictions for grid
            const gridSize = APP_CONFIG.visualization.gridSize;
            const gridPoints: Point[] = [];

            for (let i = 0; i < gridSize; i++) {
                for (let j = 0; j < gridSize; j++) {
                    gridPoints.push({
                        x: -1 + (2 * j) / (gridSize - 1),
                        y: -1 + (2 * i) / (gridSize - 1),
                        label: 0,
                    });
                }
            }

            const predictions = await this.neuralNetService.predict(gridPoints);

            // Convert to 3D format
            const predictions3d: Prediction3D[] = predictions.map(p => ({
                x: p.x,
                y: p.y,
                confidence: p.confidence,
                predictedClass: p.predictedClass,
            }));

            this.threeViz.renderSurface(predictions3d, gridSize);

            // Render data points
            const data = this.session.getData();
            const points3d: Point3D[] = data.map(p => ({
                x: p.x,
                y: p.y,
                label: p.label,
            }));
            this.threeViz.renderPoints(points3d);

        } catch (error) {
            console.error('Failed to update 3D view:', error);
        }
    }

    private handleGradientToggle(): void {
        if (this.elements.inputShowGradients.checked) {
            this.elements.gradientFlowContainer.classList.remove('hidden');
            if (!this.gradientFlow) {
                this.gradientFlow = new D3GradientFlow(this.elements.gradientFlowChart);
            }
            // Store current weights as baseline (guard against disposed model)
            if (this.neuralNetService.isReady()) {
                this.previousWeights = this.neuralNetService.getWeightMatrices();
            }
        } else {
            this.elements.gradientFlowContainer.classList.add('hidden');
        }
    }

    public updateGradientFlow(): void {
        if (!this.elements.inputShowGradients.checked || !this.gradientFlow) return;

        // Guard against disposed model
        if (!this.neuralNetService.isReady()) return;

        const currentWeights = this.neuralNetService.getWeightMatrices();
        if (currentWeights.length === 0) return;

        // Initialize previousWeights if empty
        if (this.previousWeights.length === 0) {
            this.previousWeights = currentWeights;
            const learningRate = this.session.getCurrentLearningRate();
            const zeroGradients = estimateGradients(currentWeights, currentWeights, learningRate);
            this.gradientFlow.render(zeroGradients);
            return;
        }

        // Estimate gradients based on weight changes (simplified)
        const learningRate = this.session.getCurrentLearningRate();
        const gradients = estimateGradients(this.previousWeights, currentWeights, learningRate);

        this.gradientFlow.render(gradients);
        this.previousWeights = currentWeights;
    }
}
