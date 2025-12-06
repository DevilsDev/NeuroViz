import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object Model for NeuroViz application.
 * Decouples test logic from DOM selectors following SOLID principles.
 *
 * @remarks
 * All locators are defined once here. Tests interact only through methods,
 * making selector changes a single-point update.
 */
export class NeuroPage {
  readonly page: Page;

  // =========================================================================
  // Locators - Dataset Controls
  // =========================================================================
  readonly datasetSelect: Locator;
  readonly loadDataButton: Locator;
  readonly loadingOverlay: Locator;

  // =========================================================================
  // Locators - Hyperparameter Controls
  // =========================================================================
  readonly learningRateInput: Locator;
  readonly layersInput: Locator;
  readonly initButton: Locator;

  // =========================================================================
  // Locators - Training Controls
  // =========================================================================
  readonly startButton: Locator;
  readonly pauseButton: Locator;
  readonly stepButton: Locator;
  readonly resetButton: Locator;

  // =========================================================================
  // Locators - Status Display
  // =========================================================================
  readonly epochCounter: Locator;
  readonly lossDisplay: Locator;
  readonly stateDisplay: Locator;

  // =========================================================================
  // Locators - Visualisation
  // =========================================================================
  readonly vizContainer: Locator;
  readonly svgElement: Locator;
  readonly dataPoints: Locator;
  readonly boundaryPaths: Locator;

  constructor(page: Page) {
    this.page = page;

    // Dataset controls
    this.datasetSelect = page.locator('#dataset-select');
    this.loadDataButton = page.locator('#btn-load-data');
    this.loadingOverlay = page.locator('#loading-overlay');

    // Hyperparameter controls
    this.learningRateInput = page.locator('#input-lr');
    this.layersInput = page.locator('#input-layers');
    this.initButton = page.locator('#btn-init');

    // Training controls (using sticky footer buttons which are visible)
    this.startButton = page.locator('#btn-start-sticky');
    this.pauseButton = page.locator('#btn-pause-sticky');
    this.stepButton = page.locator('#btn-step-sticky');
    this.resetButton = page.locator('#btn-reset-sticky');

    // Status display
    this.epochCounter = page.locator('#status-epoch');
    this.lossDisplay = page.locator('#status-loss');
    this.stateDisplay = page.locator('#status-state');

    // Visualisation
    this.vizContainer = page.locator('#viz-container');
    this.svgElement = page.locator('#viz-container svg');
    this.dataPoints = page.locator('#viz-container .data-point');
    this.boundaryPaths = page.locator('#viz-container .boundary path');
  }

  // =========================================================================
  // Navigation
  // =========================================================================

  /**
   * Disable the onboarding tutorial for E2E tests.
   * Sets localStorage flag to skip tutorial on page load.
   */
  async disableOnboarding(): Promise<void> {
    await this.page.addInitScript(() => {
      localStorage.setItem('neuroviz-has-visited', 'true');
    });
  }

  /**
   * Navigate to the application root.
   * Automatically disables onboarding to prevent tutorial overlay from blocking tests.
   */
  async goto(): Promise<void> {
    // Disable onboarding before navigation
    await this.disableOnboarding();
    await this.page.goto('/');
    await expect(this.vizContainer).toBeVisible();
    // Wait for TensorFlow.js to be ready (check for tf global)
    await this.waitForTensorFlowReady();
  }

  /**
   * Wait for TensorFlow.js to be loaded and ready.
   * This is critical for Firefox and WebKit compatibility.
   */
  async waitForTensorFlowReady(): Promise<void> {
    await this.page.waitForFunction(
      () => {
        // Check if TensorFlow.js is loaded
        return typeof (window as unknown as { tf?: unknown }).tf !== 'undefined';
      },
      { timeout: 30000 }
    );
  }

  // =========================================================================
  // Dataset Actions
  // =========================================================================

  /**
   * Select a dataset by clicking on its visual gallery card.
   * @param name - Dataset value (circle, xor, spiral, gaussian, clusters)
   */
  async selectDataset(name: string): Promise<void> {
    // Use visual gallery card instead of hidden dropdown
    const card = this.page.locator(`.dataset-preview-card[data-dataset="${name}"]`);
    await card.click();
  }

  /**
   * Load the currently selected dataset.
   * Waits for the loading overlay to appear and disappear.
   */
  async loadDataset(): Promise<void> {
    await this.loadDataButton.click();
    // Wait for loading to start
    await expect(this.loadingOverlay).toBeVisible();
    // Wait for loading to complete (500ms simulated latency + buffer)
    await expect(this.loadingOverlay).toBeHidden({ timeout: 5000 });
  }

  /**
   * Select and load a dataset in one action.
   */
  async selectAndLoadDataset(name: string): Promise<void> {
    await this.selectDataset(name);
    await this.loadDataset();
  }

  // =========================================================================
  // Hyperparameter Actions
  // =========================================================================

  /**
   * Set hyperparameters and initialise the network.
   */
  async initialiseNetwork(learningRate = 0.003, layers = '8, 4'): Promise<void> {
    await this.learningRateInput.fill(learningRate.toString());
    await this.layersInput.fill(layers);
    await this.initButton.click();
    // Wait for initialisation to complete (TensorFlow.js initialization can take time)
    await expect(this.startButton).toBeEnabled({ timeout: 15000 });
  }

  // =========================================================================
  // Training Actions
  // =========================================================================

  /**
   * Click the start button to begin training.
   */
  async startTraining(): Promise<void> {
    await expect(this.startButton).toBeEnabled();
    await this.startButton.click();
    // Wait for training to actually start
    await expect(this.stateDisplay).toHaveText('Training', { timeout: 2000 });
  }

  /**
   * Pause the training loop.
   */
  async pauseTraining(): Promise<void> {
    await this.pauseButton.click();
    await expect(this.stateDisplay).toHaveText('Paused', { timeout: 2000 });
  }

  /**
   * Execute a single training step and wait for it to complete.
   */
  async stepTraining(): Promise<void> {
    const currentEpoch = await this.getEpochCount();
    await this.stepButton.click();
    // Wait for epoch to increment (async training step)
    await this.page.waitForFunction(
      ({ selector, expected }: { selector: string; expected: number }) => {
        const el = document.querySelector(selector);
        return el && parseInt(el.textContent ?? '0', 10) > expected;
      },
      { selector: '#status-epoch', expected: currentEpoch },
      { timeout: 10000 }
    );
  }

  /**
   * Reset the training session.
   */
  async resetTraining(): Promise<void> {
    await this.resetButton.click();
    await expect(this.epochCounter).toHaveText('0', { timeout: 2000 });
  }

  // =========================================================================
  // Status Queries
  // =========================================================================

  /**
   * Get the current epoch count as an integer.
   */
  async getEpochCount(): Promise<number> {
    const text = await this.epochCounter.textContent();
    return parseInt(text ?? '0', 10);
  }

  /**
   * Get the current loss value as a number.
   * Returns null if loss is not yet available.
   */
  async getLossValue(): Promise<number | null> {
    const text = await this.lossDisplay.textContent();
    if (!text || text === '—') {
      return null;
    }
    const value = parseFloat(text);
    return isNaN(value) ? null : value;
  }

  /**
   * Get the current training state text.
   */
  async getStateText(): Promise<string> {
    return (await this.stateDisplay.textContent()) ?? '';
  }

  // =========================================================================
  // Visualisation Queries
  // =========================================================================

  /**
   * Get the count of rendered data points.
   */
  async getDataPointCount(): Promise<number> {
    return await this.dataPoints.count();
  }

  /**
   * Get the count of boundary contour paths.
   */
  async getBoundaryPathCount(): Promise<number> {
    return await this.boundaryPaths.count();
  }

  // =========================================================================
  // Intelligent Waits (No hard timeouts)
  // =========================================================================

  /**
   * Wait for the D3 SVG to contain at least one boundary path.
   * Uses polling instead of hard timeout.
   */
  async waitForVisualUpdate(): Promise<void> {
    await expect(this.boundaryPaths.first()).toBeVisible({ timeout: 10000 });
  }

  /**
   * Wait for epoch counter to reach a minimum value.
   * @param minEpoch - Minimum epoch to wait for
   * @param timeout - Maximum wait time in ms (default 30s for slow browsers like WebKit)
   */
  async waitForEpoch(minEpoch: number, timeout = 30000): Promise<void> {
    await this.page.waitForFunction(
      ({ selector, target }: { selector: string; target: number }) => {
        const element = document.querySelector(selector);
        if (!element) return false;
        const value = parseInt(element.textContent ?? '0', 10);
        return value >= target;
      },
      { selector: '#status-epoch', target: minEpoch },
      { timeout }
    );
  }

  /**
   * Wait for data points to be rendered.
   * @param expectedCount - Optional exact count to wait for
   */
  async waitForDataPoints(expectedCount?: number): Promise<void> {
    if (expectedCount !== undefined) {
      await expect(this.dataPoints).toHaveCount(expectedCount, { timeout: 5000 });
    } else {
      await expect(this.dataPoints.first()).toBeVisible({ timeout: 5000 });
    }
  }

  /**
   * Wait for loss to be a valid number (not "—").
   */
  async waitForLossValue(): Promise<void> {
    await this.page.waitForFunction(
      (selector: string) => {
        const element = document.querySelector(selector);
        if (!element) return false;
        const text = element.textContent ?? '';
        return text !== '—' && !isNaN(parseFloat(text));
      },
      '#status-loss',
      { timeout: 10000 }
    );
  }

  // =========================================================================
  // Full Workflow Helpers
  // =========================================================================

  /**
   * Complete setup: load dataset and initialise network.
   * Prepares the app for training.
   */
  async setupForTraining(
    dataset = 'circle',
    learningRate = 0.003,
    layers = '8, 4'
  ): Promise<void> {
    await this.goto();
    await this.selectAndLoadDataset(dataset);
    await this.initialiseNetwork(learningRate, layers);
  }
}
