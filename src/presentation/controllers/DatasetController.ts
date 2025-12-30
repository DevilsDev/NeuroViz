import { TrainingSession } from '../../core/application/TrainingSession';
import { logger } from '../../infrastructure/logging/Logger';
import { D3Chart } from '../../infrastructure/d3/D3Chart';
import { toast } from '../toast';
import { Point, MULTI_CLASS_COLOURS } from '../../core/domain';
import { PreprocessingType } from '../../core/ports';
import { setVisible } from '../../utils/dom';

export interface DatasetElements {
  datasetSelect: HTMLSelectElement;
  btnLoadData: HTMLButtonElement;
  loadingOverlay: HTMLDivElement;
  drawControls: HTMLDivElement;
  btnClearCustom: HTMLButtonElement;
  datasetOptions: HTMLDivElement;
  inputSamples: HTMLInputElement;
  samplesValue: HTMLSpanElement;
  inputNoise: HTMLInputElement;
  noiseValue: HTMLSpanElement;
  inputBalance: HTMLInputElement;
  balanceValue: HTMLSpanElement;
  inputPreprocessing: HTMLSelectElement;
  inputNumClasses: HTMLSelectElement;
  drawClassButtons: HTMLDivElement;
  inputCsvUpload: HTMLInputElement;
  btnDownloadDataset: HTMLButtonElement;
}

export class DatasetController {
  private customDataPoints: Point[] = [];
  private currentDrawLabel: number = 0;
  private boundHandlers = new Map<string, EventListener>();
  /** Cleanup functions for dynamically created button listeners */
  private drawButtonCleanup: Array<() => void> = [];

  constructor(
    private session: TrainingSession,
    private visualizerService: D3Chart,
    private elements: DatasetElements
  ) {
    this.bindEvents();
  }

  private bindEvents(): void {
    const loadDataHandler = (): void => void this.handleLoadData();
    const datasetChangeHandler = (): void => this.handleDatasetSelectChange();
    const clearCustomHandler = (): void => this.handleClearCustomData();
    const samplesChangeHandler = (): void => this.handleSamplesChange();
    const noiseChangeHandler = (): void => this.handleNoiseChange();
    const balanceChangeHandler = (): void => this.handleBalanceChange();
    const csvUploadHandler = (e: Event): void => this.handleCsvUpload(e);
    const downloadHandler = (): void => this.handleDownloadDataset();

    this.elements.btnLoadData.addEventListener('click', loadDataHandler);
    this.elements.datasetSelect.addEventListener('change', datasetChangeHandler);
    this.elements.btnClearCustom.addEventListener('click', clearCustomHandler);
    this.elements.inputSamples.addEventListener('input', samplesChangeHandler);
    this.elements.inputNoise.addEventListener('input', noiseChangeHandler);
    this.elements.inputBalance.addEventListener('input', balanceChangeHandler);
    this.elements.inputCsvUpload.addEventListener('change', csvUploadHandler);
    this.elements.btnDownloadDataset.addEventListener('click', downloadHandler);

    this.boundHandlers.set('loadData', loadDataHandler);
    this.boundHandlers.set('datasetChange', datasetChangeHandler);
    this.boundHandlers.set('clearCustom', clearCustomHandler);
    this.boundHandlers.set('samplesChange', samplesChangeHandler);
    this.boundHandlers.set('noiseChange', noiseChangeHandler);
    this.boundHandlers.set('balanceChange', balanceChangeHandler);
    this.boundHandlers.set('csvUpload', csvUploadHandler);
    this.boundHandlers.set('download', downloadHandler);
  }

  /**
   * Clean up event listeners to prevent memory leaks
   */
  public dispose(): void {
    // Clean up static event listeners
    this.elements.btnLoadData.removeEventListener('click', this.boundHandlers.get('loadData')!);
    this.elements.datasetSelect.removeEventListener('change', this.boundHandlers.get('datasetChange')!);
    this.elements.btnClearCustom.removeEventListener('click', this.boundHandlers.get('clearCustom')!);
    this.elements.inputSamples.removeEventListener('input', this.boundHandlers.get('samplesChange')!);
    this.elements.inputNoise.removeEventListener('input', this.boundHandlers.get('noiseChange')!);
    this.elements.inputBalance.removeEventListener('input', this.boundHandlers.get('balanceChange')!);
    this.elements.inputCsvUpload.removeEventListener('change', this.boundHandlers.get('csvUpload')!);
    this.elements.btnDownloadDataset.removeEventListener('click', this.boundHandlers.get('download')!);
    this.boundHandlers.clear();
    
    // Clean up dynamically created button listeners
    this.cleanupDrawButtons();
  }

  public async handleLoadData(): Promise<void> {
    const datasetType = this.elements.datasetSelect.value;
    logger.debug(`[DatasetController] handleLoadData called for dataset: ${datasetType}`);

    // Handle custom dataset differently
    if (datasetType === 'custom') {
      this.customDataPoints = [];
      this.visualizerService.renderData([]);
      // Show draw controls and enable draw mode
      this.elements.drawControls.classList.remove('hidden');
      this.elements.datasetOptions.classList.add('hidden');
      this.updateDrawClassButtons();
      this.enableDrawMode();
      logger.debug('[DatasetController] Custom draw mode enabled');
      return;
    }

    this.showLoading(true);
    this.elements.btnLoadData.disabled = true;

    // Real-world datasets have fixed parameters
    const isRealWorld = datasetType === 'iris' || datasetType === 'wine';

    // Get dataset options from sliders (ignored for real-world datasets)
    const samples = parseInt(this.elements.inputSamples.value, 10) || 200;
    const noise = (parseInt(this.elements.inputNoise.value, 10) || 10) / 100;
    const numClasses = parseInt(this.elements.inputNumClasses.value, 10) || 2;
    const classBalance = (parseInt(this.elements.inputBalance.value, 10) || 50) / 100;
    const preprocessing = this.elements.inputPreprocessing.value as PreprocessingType;

    logger.debug('[DatasetController] Loading dataset with options', {
      datasetType,
      samples,
      noise,
      numClasses,
      classBalance,
      preprocessing
    });

    try {
      await this.session.loadData(datasetType, { samples, noise, numClasses, classBalance, preprocessing });
      logger.debug('[DatasetController] session.loadData completed');

      // Get the actual number of classes detected in the data
      const detectedClasses = this.session.getDetectedNumClasses();
      const loadedData = this.session.getData();

      logger.debug('[DatasetController] Data loaded successfully', {
        detectedClasses,
        dataPoints: loadedData.length,
        datasetLoaded: this.session.getState().datasetLoaded
      });

      // Auto-update the numClasses dropdown to match the data
      this.elements.inputNumClasses.value = detectedClasses.toString();
      this.updateDrawClassButtons();

      if (isRealWorld) {
        const datasetInfo = datasetType === 'iris'
          ? 'Iris (150 samples, 3 classes)'
          : 'Wine (178 samples, 3 classes)';
        toast.success(`${datasetInfo} loaded`);
        logger.debug(`[DatasetController] Toast shown: ${datasetInfo}`);
      } else {
        toast.success(`Dataset "${datasetType}" loaded (${samples} samples, ${detectedClasses} classes)`);
        logger.debug(`[DatasetController] Toast shown: Dataset loaded with ${samples} samples`);
      }

      // Update visualization
      this.visualizerService.renderData(loadedData);
      logger.debug(`[DatasetController] Visualization updated with ${loadedData.length} points`);

      // Disable draw mode
      this.visualizerService.disableDrawMode();
      this.elements.drawControls.classList.add('hidden');

    } catch (error) {
      console.error('[DatasetController] Failed to load dataset:', error);
      toast.error(`Failed to load dataset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.showLoading(false);
      this.elements.btnLoadData.disabled = false;
      logger.debug('[DatasetController] handleLoadData finished');
    }
  }

  private handleDatasetSelectChange(): void {
    const datasetType = this.elements.datasetSelect.value;
    const isCustom = datasetType === 'custom';
    const isRealWorld = datasetType === 'iris' || datasetType === 'wine';

    // Toggle visibility of controls
    if (isCustom) {
      this.elements.drawControls.classList.remove('hidden');
      this.elements.datasetOptions.classList.add('hidden');
      this.updateDrawClassButtons();
      this.enableDrawMode();
    } else {
      this.elements.drawControls.classList.add('hidden');
      this.elements.datasetOptions.classList.remove('hidden');
      this.visualizerService.disableDrawMode();

      // Disable options for real-world datasets
      if (isRealWorld) {
        this.elements.datasetOptions.classList.add('opacity-50', 'pointer-events-none');
      } else {
        this.elements.datasetOptions.classList.remove('opacity-50', 'pointer-events-none');
      }
    }
  }

  private handleClearCustomData(): void {
    this.customDataPoints = [];
    this.visualizerService.renderData([]);
    this.session.setCustomData([]);
    toast.info('Custom data cleared');
  }

  private handleSamplesChange(): void {
    this.elements.samplesValue.textContent = this.elements.inputSamples.value;
  }

  private handleNoiseChange(): void {
    this.elements.noiseValue.textContent = this.elements.inputNoise.value;
  }

  private handleBalanceChange(): void {
    this.elements.balanceValue.textContent = `${this.elements.inputBalance.value}%`;
  }

  private enableDrawMode(): void {
    this.visualizerService.enableDrawMode(this.currentDrawLabel, (point) => this.handlePointAdded(point));
    toast.info('Draw mode enabled - click on chart to add points');
  }

  private handlePointAdded(point: Point): void {
    this.customDataPoints.push(point);
    this.visualizerService.renderData(this.customDataPoints);

    // Update session with custom data
    this.session.setCustomData(this.customDataPoints);
  }

  private updateDrawClassButtons(): void {
    const numClasses = parseInt(this.elements.inputNumClasses.value, 10) || 2;

    // Clean up previous button listeners to prevent memory leaks
    this.cleanupDrawButtons();

    // Clear existing buttons
    this.elements.drawClassButtons.innerHTML = '';

    // Create buttons for each class
    for (let i = 0; i < numClasses; i++) {
      const colour = MULTI_CLASS_COLOURS[i % MULTI_CLASS_COLOURS.length];
      const button = document.createElement('button');
      button.className = `btn-draw${i === 0 ? ' active' : ''}`;
      button.dataset.class = String(i);
      button.innerHTML = `
        <span class="w-3 h-3 rounded-full inline-block" style="background-color: ${colour}"></span>
        Class ${i}
      `;
      
      // Track listener for cleanup
      const handler = (): void => this.handleDrawClassSelect(i);
      button.addEventListener('click', handler);
      this.drawButtonCleanup.push(() => button.removeEventListener('click', handler));
      
      this.elements.drawClassButtons.appendChild(button);
    }

    // Reset to class 0
    this.currentDrawLabel = 0;
  }

  /**
   * Cleans up dynamically created button listeners.
   */
  private cleanupDrawButtons(): void {
    this.drawButtonCleanup.forEach(cleanup => cleanup());
    this.drawButtonCleanup = [];
  }

  private handleDrawClassSelect(label: number): void {
    this.currentDrawLabel = label;

    // Update button states
    const buttons = this.elements.drawClassButtons.querySelectorAll('.btn-draw');
    buttons.forEach((btn, index) => {
      btn.classList.toggle('active', index === label);
    });

    // Update draw mode with new label
    if (this.visualizerService.isDrawModeEnabled()) {
      this.visualizerService.enableDrawMode(label, (point) => this.handlePointAdded(point));
    }
  }

  private showLoading(show: boolean): void {
    setVisible(this.elements.loadingOverlay, show);
  }

  // CSV Upload & Download

  private handleCsvUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      try {
        const points = this.parseCsvData(text);
        if (points.length === 0) {
          throw new Error('No valid data points found in CSV');
        }

        this.customDataPoints = points;
        this.session.setCustomData(points);
        this.visualizerService.renderData(points);

        // Switch to custom mode
        this.elements.datasetSelect.value = 'custom';
        this.handleDatasetSelectChange();

        toast.success(`Loaded ${points.length} points from CSV`);
      } catch (error) {
        console.error('CSV Parse Error:', error);
        toast.error('Failed to parse CSV file. Check format (x,y,label)');
      }

      // Reset input
      input.value = '';
    };

    reader.readAsText(file);
  }

  private parseCsvData(text: string): Point[] {
    const lines = text.split('\n');
    const points: Point[] = [];

    // Check for header
    let startIndex = 0;
    if (lines[0] && (lines[0].toLowerCase().includes('x') || lines[0].toLowerCase().includes('label'))) {
      startIndex = 1;
    }

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i]!.trim();
      if (!line) continue;

      const parts = line.split(',');
      if (parts.length < 3) continue;

      // Try to detect format: x,y,label OR label,x,y
      let x: number, y: number, label: number;

      if (parts.length === 3) {
        // Assume x,y,label
        x = parseFloat(parts[0]!);
        y = parseFloat(parts[1]!);
        label = parseInt(parts[2]!, 10);

        // If label is NaN, maybe it's label,x,y?
        if (isNaN(label) && !isNaN(parseFloat(parts[0]!))) {
          // Try label,x,y
          label = parseInt(parts[0]!, 10);
          x = parseFloat(parts[1]!);
          y = parseFloat(parts[2]!);
        }
      } else {
        // Default to x,y,label
        x = parseFloat(parts[0]!);
        y = parseFloat(parts[1]!);
        label = parseInt(parts[parts.length - 1]!, 10);
      }

      if (!isNaN(x) && !isNaN(y) && !isNaN(label)) {
        points.push({ x, y, label });
      }
    }

    return points;
  }

  private handleDownloadDataset(): void {
    const data = this.session.getData();
    if (data.length === 0) {
      toast.warning('No dataset to download');
      return;
    }

    let csvContent = 'x,y,label\n';
    data.forEach(p => {
      csvContent += `${p.x.toFixed(6)},${p.y.toFixed(6)},${p.label}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'neuroviz_dataset.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
