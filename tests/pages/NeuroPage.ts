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
  readonly datasetGalleryFirstCard: Locator;

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
  readonly accuracyDisplay: Locator;
  /** Messages of currently shown toast notifications */
  readonly toastMessages: Locator;

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
    // DatasetGallery renders preview cards during initializeUIComponents(),
    // which runs after ApplicationBuilder.build() resolves. Using the first
    // card as the readiness probe guarantees the full init pipeline has
    // completed before any test interacts with the app.
    this.datasetGalleryFirstCard = page.locator('.dataset-preview-card').first();

    // Hyperparameter controls
    this.learningRateInput = page.locator('#input-lr');
    this.layersInput = page.locator('#input-layers');
    this.initButton = page.locator('#btn-init');

    // Training controls (toolbar above the chart)
    this.startButton = page.locator('#btn-start');
    this.pauseButton = page.locator('#btn-pause');
    this.stepButton = page.locator('#btn-step');
    this.resetButton = page.locator('#btn-reset');

    // Status display (toolbar metrics)
    this.epochCounter = page.locator('#status-epoch');
    this.lossDisplay = page.locator('#status-loss');
    this.accuracyDisplay = page.locator('#status-accuracy');
    this.toastMessages = page.locator('#toast-container .toast-message');

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
   * Disable the onboarding tutorial for E2E tests and start in Advanced mode.
   *
   * The Learn/Experiment/Advanced selector hides controls marked with
   * `data-min-mode`; Advanced shows all of them so every control is testable.
   */
  async disableOnboarding(): Promise<void> {
    await this.page.addInitScript(() => {
      localStorage.setItem('neuroviz-has-visited', 'true');
      localStorage.setItem('neuroviz-first-run-complete', 'true');
      localStorage.setItem('neuroviz-ui-mode', 'advanced');
    });
  }

  /**
   * Whether white-box tests can inspect the app: main.ts exposes `window.app`
   * only in dev/test builds, not in the production bundle CI serves.
   */
  async hasAppHandle(): Promise<boolean> {
    return this.page.evaluate(() => 'app' in window);
  }

  // =========================================================================
  // Sidebar navigation
  // =========================================================================

  /**
   * Activate a sidebar tab (Data, Model, Train, Analyze).
   */
  async openTab(tab: 'data' | 'model' | 'train' | 'analyze'): Promise<void> {
    const button = this.page.locator(`.sidebar-tab[data-tab="tab-${tab}"]`);
    await button.click();
    await expect(this.page.locator(`#tab-${tab}`)).toHaveClass(/active/);
  }

  /**
   * Make a sidebar control interactable: activate the tab panel that contains
   * it and expand any collapsed <details> sections around it.
   */
  async reveal(locator: Locator): Promise<Locator> {
    const tabId = await locator.evaluate((el) => {
      let node: Element | null = el.parentElement;
      while (node) {
        if (node instanceof HTMLDetailsElement) node.open = true;
        node = node.parentElement;
      }
      return el.closest('[data-tab-content]')?.getAttribute('data-tab-content') ?? null;
    });
    if (tabId) {
      await this.openTab(tabId.replace('tab-', '') as 'data' | 'model' | 'train' | 'analyze');
    }
    await expect(locator).toBeVisible();
    return locator;
  }

  /**
   * Shorthand: locate a sidebar control by CSS selector and reveal it.
   */
  async control(selector: string): Promise<Locator> {
    return this.reveal(this.page.locator(selector));
  }

  /**
   * Navigate to the application root and wait until the app is fully initialised.
   *
   * Readiness contract: the first dataset-preview-card is rendered only after
   * ApplicationBuilder.build() resolves and initializeUIComponents() runs, so
   * waiting for it guarantees services, controllers, and the UI layer are all
   * wired up. This is a black-box probe that works against production builds
   * (unlike the previous window.tf / window.app globals, which are gated on
   * import.meta.env.DEV and are therefore absent in production bundles).
   */
  async goto(): Promise<void> {
    await this.disableOnboarding();
    // Absolute path so the test is resilient to baseURL trailing-slash quirks
    // (Playwright resolves relative paths against baseURL via URL(), which
    // collapses "/" to the server root rather than preserving "/NeuroViz/").
    await this.page.goto('/NeuroViz/');
    await expect(this.vizContainer).toBeVisible();
    await expect(this.datasetGalleryFirstCard).toBeVisible({ timeout: 30000 });
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
    await (await this.reveal(card)).click();
  }

  /**
   * Load the currently selected dataset and wait until its points are drawn.
   *
   * Waits on the outcome rather than on the loading overlay appearing: a fast
   * load can show and hide the overlay before Playwright ever observes it.
   */
  async loadDataset(): Promise<void> {
    await (await this.reveal(this.loadDataButton)).click();
    await expect(this.loadingOverlay).toBeHidden({ timeout: 10000 });
    await expect(this.dataPoints.first()).toBeVisible({ timeout: 10000 });
    await expect(this.startButton).toBeEnabled({ timeout: 10000 });
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
    await (await this.reveal(this.learningRateInput)).fill(learningRate.toString());
    await (await this.reveal(this.layersInput)).fill(layers);
    await (await this.reveal(this.initButton)).click();
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
    await this.expectRunning();
  }

  /**
   * Pause the training loop.
   */
  async pauseTraining(): Promise<void> {
    await this.pauseButton.click();
    await this.expectStopped();
  }

  /**
   * Training is running: the toolbar swaps Train for Pause.
   */
  async expectRunning(timeout = 5000): Promise<void> {
    await expect(this.pauseButton).toBeVisible({ timeout });
    await expect(this.startButton).toBeHidden({ timeout });
  }

  /**
   * Training is not running (idle, paused or stopped): Train is shown again.
   */
  async expectStopped(timeout = 5000): Promise<void> {
    await expect(this.startButton).toBeVisible({ timeout });
    await expect(this.pauseButton).toBeHidden({ timeout });
  }

  /**
   * Execute a single training step and wait for it to complete.
   */
  async stepTraining(): Promise<void> {
    const currentEpoch = await this.getEpochCount();
    // Ensure button is enabled before clicking (allow time for async UI update)
    await expect(this.stepButton).toBeEnabled({ timeout: 10000 });
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
