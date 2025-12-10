import { TrainingSession } from '../../core/application/TrainingSession';
import { TFNeuralNet } from '../../infrastructure/tensorflow/TFNeuralNet';
import { D3Chart } from '../../infrastructure/d3/D3Chart';
import { D3GradientFlow, estimateGradients } from '../../infrastructure/d3/D3GradientFlow';
import { D3ActivationHeatmap } from '../../infrastructure/d3/D3ActivationHeatmap';
import { toast } from '../toast';
import { Point, ColourScheme } from '../../core/domain';
import { APP_CONFIG } from '../../config/app.config';
import type { ThreeVisualization, Prediction3D, Point3D } from '../../infrastructure/three';

export interface VisualizationElements {
    inputColourScheme: HTMLSelectElement;
    inputPointSize: HTMLInputElement;
    inputOpacity: HTMLInputElement;
    opacityValue: HTMLSpanElement;
    inputContours: HTMLInputElement;
    contourValue: HTMLSpanElement;
    inputZoom: HTMLInputElement;
    inputTooltips: HTMLInputElement;
    inputHighlightErrors: HTMLInputElement;
    inputConfidenceCircles: HTMLInputElement;
    inputNotifications: HTMLInputElement;
    inputRecordEvolution: HTMLInputElement;
    inputShowGrid: HTMLInputElement;
    inputShowDiscretized: HTMLInputElement;
    inputVoronoi: HTMLInputElement;
    inputMisclassified: HTMLInputElement;
    inputConfidence: HTMLInputElement;

    // Charts
    gradientFlowChart: HTMLDivElement;
    // activationHeatmap: HTMLDivElement; // Removed duplicate
    confusionMatrix: HTMLDivElement;
    weightHistogram: HTMLDivElement;
    rocCurve: HTMLDivElement;

    // 3D View (Optional - if not present, 3D features disabled)
    input3dView?: HTMLInputElement;
    threeContainer?: HTMLDivElement;
    btn3dReset?: HTMLButtonElement;
    btn3dTop?: HTMLButtonElement;
    btn3dSide?: HTMLButtonElement;

    // Gradient Flow (Optional)
    inputShowGradients?: HTMLInputElement;
    gradientFlowContainer?: HTMLDivElement;
    inputLr?: HTMLInputElement;

    // Activation Heatmap (Optional)
    inputShowActivations?: HTMLInputElement;
    activationHeatmap?: HTMLDivElement;
    activationHint?: HTMLParagraphElement;
    inputLayers?: HTMLInputElement;
}

export class VisualizationController {
    private gradientFlow: D3GradientFlow | null = null;
    private activationHeatmap: D3ActivationHeatmap | null = null;
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
        this.addTrackedListener(this.elements.inputColourScheme, 'change', () => this.handleColourSchemeChange());
        this.addTrackedListener(this.elements.inputPointSize, 'change', () => this.handlePointSizeChange());
        this.addTrackedListener(this.elements.inputOpacity, 'input', () => this.handleOpacityChange());
        this.addTrackedListener(this.elements.inputContours, 'input', () => this.handleContourChange());
        this.addTrackedListener(this.elements.inputZoom, 'change', () => this.handleZoomToggle());
        this.addTrackedListener(this.elements.inputTooltips, 'change', () => this.handleTooltipsToggle());

        // 3D View
        if (this.elements.input3dView) {
            this.addTrackedListener(this.elements.input3dView, 'change', () => void this.handle3dViewToggle());
        }
        if (this.elements.btn3dReset) {
            this.addTrackedListener(this.elements.btn3dReset, 'click', () => this.threeViz?.resetCamera());
        }
        if (this.elements.btn3dTop) {
            this.addTrackedListener(this.elements.btn3dTop, 'click', () => this.threeViz?.setTopView());
        }
        if (this.elements.btn3dSide) {
            this.addTrackedListener(this.elements.btn3dSide, 'click', () => this.threeViz?.setSideView());
        }

        // Gradient Flow
        if (this.elements.inputShowGradients) {
            this.addTrackedListener(this.elements.inputShowGradients, 'change', () => this.handleGradientToggle());
        }

        // Activation Heatmap
        if (this.elements.inputShowActivations) {
            this.addTrackedListener(this.elements.inputShowActivations, 'change', () => this.handleActivationToggle());
        }

        // Voronoi Overlay
        this.addTrackedListener(this.elements.inputVoronoi, 'change', () => this.handleVoronoiToggle());
    }

    /**
     * Clears all visualization state without disposing resources.
     * Call this on reset to clear displayed data while keeping the controller active.
     */
    public clear(): void {
        // Clear 3D view
        this.threeViz?.clear();
        
        // Clear gradient flow
        this.gradientFlow?.clear();
        
        // Clear activation heatmap
        this.activationHeatmap?.clear();
        
        // Reset previous weights baseline
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

        // Clean up visualization resources
        this.threeViz?.dispose();
        this.threeViz = null;
        this.gradientFlow = null;
        this.activationHeatmap = null;
    }


    private handleColourSchemeChange(): void {
        const scheme = this.elements.inputColourScheme.value as ColourScheme;
        this.visualizerService.setConfig({ colourScheme: scheme });
    }

    private handlePointSizeChange(): void {
        const size = parseInt(this.elements.inputPointSize.value, 10) || 5;
        this.visualizerService.setConfig({ pointRadius: size });
    }

    private handleOpacityChange(): void {
        const opacity = parseInt(this.elements.inputOpacity.value, 10) / 100;
        this.elements.opacityValue.textContent = this.elements.inputOpacity.value;
        this.visualizerService.setConfig({ boundaryOpacity: opacity });
    }

    private handleContourChange(): void {
        const count = parseInt(this.elements.inputContours.value, 10);
        this.elements.contourValue.textContent = this.elements.inputContours.value;
        this.visualizerService.setConfig({ contourCount: count });
    }

    private handleZoomToggle(): void {
        this.visualizerService.setConfig({ zoomEnabled: this.elements.inputZoom.checked });
    }

    private handleTooltipsToggle(): void {
        this.visualizerService.setConfig({ tooltipsEnabled: this.elements.inputTooltips.checked });
    }

    private handleVoronoiToggle(): void {
        this.visualizerService.setVoronoiOverlay(this.elements.inputVoronoi.checked);
    }

    public async handle3dViewToggle(): Promise<void> {
        if (!this.elements.input3dView || !this.elements.threeContainer) return;

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
        if (!this.threeViz || !this.elements.input3dView?.checked) return;

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
        if (!this.elements.inputShowGradients || !this.elements.gradientFlowContainer) return;

        if (this.elements.inputShowGradients.checked) {
            this.elements.gradientFlowContainer.classList.remove('hidden');
            if (!this.gradientFlow) {
                // Use the inner chart div, not the outer container with title
                const chartElement = this.elements.gradientFlowChart;
                if (chartElement) {
                    this.gradientFlow = new D3GradientFlow(chartElement);
                }
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
        if (!this.elements.inputShowGradients?.checked || !this.gradientFlow) return;

        // Guard against disposed model
        if (!this.neuralNetService.isReady()) return;

        const currentWeights = this.neuralNetService.getWeightMatrices();
        if (this.previousWeights.length === 0 || currentWeights.length === 0) {
            this.previousWeights = currentWeights;
            return;
        }

        // Estimate gradients based on weight changes (simplified)
        // In a real app, we'd get gradients from the backend/TF.js
        const learningRate = this.session.getCurrentLearningRate();
        const gradients = estimateGradients(this.previousWeights, currentWeights, learningRate);

        // Only update if there are actual weight changes (training is active)
        // This preserves the last gradient visualization when training stops
        const hasChanges = gradients.maxGradient > 0.0001;
        if (hasChanges) {
            this.gradientFlow.render(gradients);
            this.previousWeights = currentWeights;
        }
    }

    private handleActivationToggle(): void {
        if (!this.elements.inputShowActivations || !this.elements.activationHeatmap) return;

        if (this.elements.inputShowActivations.checked) {
            this.elements.activationHeatmap.classList.remove('hidden');
            if (this.elements.activationHint) {
                this.elements.activationHint.classList.remove('hidden');
            }

            if (!this.activationHeatmap) {
                this.activationHeatmap = new D3ActivationHeatmap(this.elements.activationHeatmap);
            }

            this.updateActivationHeatmap();
        } else {
            this.elements.activationHeatmap.classList.add('hidden');
            if (this.elements.activationHint) {
                this.elements.activationHint.classList.add('hidden');
            }
        }
    }

    /**
     * Updates the activation heatmap with real layer activations from the neural network.
     * 
     * @param inputPoint - Optional input point to compute activations for.
     *                     If not provided, uses a default point at origin.
     */
    public updateActivationHeatmap(inputPoint?: Point): void {
        if (!this.elements.inputShowActivations?.checked || !this.activationHeatmap) return;

        const structure = this.neuralNetService.getStructure();
        if (!structure) return;

        // Use provided point or default to origin
        const point = inputPoint ?? { x: 0, y: 0, label: 0 };

        // Get real activations from the neural network service
        const activations = this.neuralNetService.getLayerActivations(point);

        // Guard against empty activations (model not initialised or disposed)
        if (!activations || activations.length === 0) {
            console.warn('[VisualizationController] No activations available from neural network');
            return;
        }

        this.activationHeatmap.render(activations);
    }


}

