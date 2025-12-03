import { TrainingSession } from '../../core/application/TrainingSession';
import { D3LRFinder, findOptimalLR } from '../../infrastructure/d3/D3LRFinder';
import { toast } from '../toast';

export interface ResearchElements {
    btnLrFinder: HTMLButtonElement;
    btnStopLrFinder: HTMLButtonElement;
    lrFinderContainer: HTMLDivElement;
    lrFinderResult: HTMLDivElement;
    lrFinderPanel: HTMLDivElement;
    inputLr: HTMLInputElement;
}

export class ResearchController {
    private lrFinderViz: D3LRFinder;

    constructor(
        private session: TrainingSession,
        private elements: ResearchElements
    ) {
        this.lrFinderViz = new D3LRFinder(elements.lrFinderContainer);
        this.bindEvents();
    }

    private bindEvents(): void {
        this.elements.btnLrFinder.addEventListener('click', () => void this.handleLRFinder());
        if (this.elements.btnStopLrFinder) {
            this.elements.btnStopLrFinder.addEventListener('click', () => this.handleStopLRFinder());
        }
    }

    private async handleLRFinder(): Promise<void> {
        const state = this.session.getState();
        if (!state.datasetLoaded) {
            toast.warning('Please load a dataset first');
            return;
        }

        if (state.isRunning) {
            toast.warning('Please stop training first');
            return;
        }

        // Show container
        this.elements.lrFinderContainer.classList.remove('hidden');
        this.elements.lrFinderResult.classList.add('hidden');
        if (this.elements.lrFinderPanel) {
            this.elements.lrFinderPanel.classList.remove('hidden');
        }

        toast.info('Running Learning Rate Finder...');

        try {
            const history = await this.session.runLRFinder(1e-5, 1.0, 50);

            // Visualize
            this.lrFinderViz.render(history);

            // Find optimal LR
            const optimalLR = findOptimalLR(history);

            if (optimalLR) {
                this.elements.lrFinderResult.classList.remove('hidden');
                this.elements.lrFinderResult.innerHTML = `
          <div class="flex items-center justify-between">
            <span>Optimal LR found: <strong>${optimalLR.toExponential(2)}</strong></span>
            <button id="btn-apply-lr" class="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 rounded text-white">
              Apply
            </button>
          </div>
        `;

                // Bind apply button
                const btnApply = document.getElementById('btn-apply-lr');
                if (btnApply) {
                    btnApply.addEventListener('click', () => {
                        this.elements.inputLr.value = optimalLR.toString();
                        toast.success(`Applied learning rate: ${optimalLR.toExponential(2)}`);
                    });
                }

                toast.success(`LR Finder complete. Optimal: ${optimalLR.toExponential(2)}`);
            } else {
                toast.warning('Could not determine optimal LR');
            }

        } catch (error) {
            console.error('LR Finder failed:', error);
            toast.error('LR Finder failed');
        }
    }

    private handleStopLRFinder(): void {
        // In a real implementation, we would cancel the LR finder process
        this.clear();
        toast.info('LR Finder stopped');
    }

    public clear(): void {
        this.elements.lrFinderContainer.classList.add('hidden');
        this.elements.lrFinderResult.classList.add('hidden');
        if (this.elements.lrFinderPanel) {
            this.elements.lrFinderPanel.classList.add('hidden');
        }
        this.lrFinderViz.clear();
    }
}
