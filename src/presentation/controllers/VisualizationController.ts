import { TrainingSession } from '../../core/application/TrainingSession';
import { D3Chart } from '../../infrastructure/d3/D3Chart';
import { D3GradientFlow, estimateGradients } from '../../infrastructure/d3/D3GradientFlow';
import { D3ActivationHeatmap } from '../../infrastructure/d3/D3ActivationHeatmap';
import { TFNeuralNet } from '../../infrastructure/tensorflow/TFNeuralNet';
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

    constructor(
        private session: TrainingSession,
        private neuralNetService: TFNeuralNet,
        private visualizerService: D3Chart,
        private elements: VisualizationElements
    ) {
        this.bindEvents();
    }

    private bindEvents(): void {
        this.elements.inputColourScheme.addEventListener('change', () => this.handleColourSchemeChange());
        this.elements.inputPointSize.addEventListener('change', () => this.handlePointSizeChange());
        this.elements.inputOpacity.addEventListener('input', () => this.handleOpacityChange());
        this.elements.inputContours.addEventListener('input', () => this.handleContourChange());
        this.elements.inputZoom.addEventListener('change', () => this.handleZoomToggle());
        this.elements.inputTooltips.addEventListener('change', () => this.handleTooltipsToggle());

        // 3D View
        if (this.elements.input3dView) {
            this.elements.input3dView.addEventListener('change', () => void this.handle3dViewToggle());
        }
        if (this.elements.btn3dReset) {
            this.elements.btn3dReset.addEventListener('click', () => this.threeViz?.resetCamera());
        }
        if (this.elements.btn3dTop) {
            this.elements.btn3dTop.addEventListener('click', () => this.threeViz?.setTopView());
        }
        if (this.elements.btn3dSide) {
            this.elements.btn3dSide.addEventListener('click', () => this.threeViz?.setSideView());
        }

        // Gradient Flow
        if (this.elements.inputShowGradients) {
            this.elements.inputShowGradients.addEventListener('change', () => this.handleGradientToggle());
        }

        // Activation Heatmap
        if (this.elements.inputShowActivations) {
            this.elements.inputShowActivations.addEventListener('change', () => this.handleActivationToggle());
        }

        // Voronoi Overlay
        this.elements.inputVoronoi.addEventListener('change', () => this.handleVoronoiToggle());
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
                this.gradientFlow = new D3GradientFlow(this.elements.gradientFlowContainer);
            }
            // Store current weights as baseline
            this.previousWeights = this.neuralNetService.getWeightMatrices();
        } else {
            this.elements.gradientFlowContainer.classList.add('hidden');
        }
    }

    public updateGradientFlow(): void {
        if (!this.elements.inputShowGradients?.checked || !this.gradientFlow) return;

        const currentWeights = this.neuralNetService.getWeightMatrices();
        if (this.previousWeights.length === 0 || currentWeights.length === 0) {
            this.previousWeights = currentWeights;
            return;
        }

        // Estimate gradients based on weight changes (simplified)
        // In a real app, we'd get gradients from the backend/TF.js
        const learningRate = this.session.getCurrentLearningRate();
        const gradients = estimateGradients(this.previousWeights, currentWeights, learningRate);

        this.gradientFlow.render(gradients);
        this.previousWeights = currentWeights;
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

    public updateActivationHeatmap(): void {
        if (!this.elements.inputShowActivations?.checked || !this.activationHeatmap) return;

        const structure = this.neuralNetService.getStructure();
        if (!structure) return;

        // Visualize activations (simplified - using random data for demo if real not available)
        // In real app, we'd hook into the forward pass
        const activations = structure.layers.map((size, _i) => {
            return Array(size).fill(0).map(() => Math.random());
        });

        this.activationHeatmap.render(activations);
    }
}
