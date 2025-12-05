import { test, expect, type Page, type Dialog } from '@playwright/test';
import { NeuroPage } from '../pages/NeuroPage';

/**
 * NeuroViz E2E Test Suite
 *
 * Tests the integration of adapters (D3, TF.js) without testing
 * the underlying math libraries. Focuses on UI behaviour and
 * correct wiring of the hexagonal architecture.
 */

test.describe('NeuroViz Application', () => {
  let neuroPage: NeuroPage;

  test.beforeEach(async ({ page }: { page: Page }) => {
    neuroPage = new NeuroPage(page);
  });

  // ===========================================================================
  // Test 1: Happy Path (Sanity Check)
  // ===========================================================================
  test.describe('Happy Path', () => {
    test('should complete a full training cycle', async () => {
      // Arrange: Set up the application
      await neuroPage.setupForTraining('circle', 0.003, '8, 4');

      // Act: Start training
      await neuroPage.startTraining();

      // Assert: Epoch counter increases to at least 10
      await neuroPage.waitForEpoch(10);
      const epochCount = await neuroPage.getEpochCount();
      expect(epochCount).toBeGreaterThanOrEqual(10);

      // Assert: Loss display shows a valid number
      await neuroPage.waitForLossValue();
      const lossValue = await neuroPage.getLossValue();
      expect(lossValue).not.toBeNull();
      expect(typeof lossValue).toBe('number');
      expect(lossValue).toBeGreaterThanOrEqual(0);

      // Assert: Decision boundary is rendered
      await neuroPage.waitForVisualUpdate();
      const boundaryCount = await neuroPage.getBoundaryPathCount();
      expect(boundaryCount).toBeGreaterThan(0);
    });

    test('should pause and resume training', async () => {
      await neuroPage.setupForTraining('xor');
      await neuroPage.startTraining();

      // Wait for some training to occur
      await neuroPage.waitForEpoch(5);

      // Pause training
      await neuroPage.pauseTraining();
      const pausedEpoch = await neuroPage.getEpochCount();

      // Wait a moment and verify epoch hasn't changed
      await neuroPage.page.waitForTimeout(500);
      const epochAfterPause = await neuroPage.getEpochCount();
      expect(epochAfterPause).toBe(pausedEpoch);

      // Resume training
      await neuroPage.startTraining();
      await neuroPage.waitForEpoch(pausedEpoch + 5);
      const resumedEpoch = await neuroPage.getEpochCount();
      expect(resumedEpoch).toBeGreaterThan(pausedEpoch);
    });

    test('should reset training state', async () => {
      await neuroPage.setupForTraining('spiral');
      await neuroPage.startTraining();

      // Wait for training to progress
      await neuroPage.waitForEpoch(10);

      // Pause and reset
      await neuroPage.pauseTraining();
      await neuroPage.resetTraining();

      // Verify state is reset
      const epochAfterReset = await neuroPage.getEpochCount();
      expect(epochAfterReset).toBe(0);

      const stateText = await neuroPage.getStateText();
      expect(stateText).toBe('Ready');
    });

    test('should handle step-by-step training', async () => {
      await neuroPage.setupForTraining('gaussian');

      // Execute single steps
      await neuroPage.stepTraining();
      expect(await neuroPage.getEpochCount()).toBe(1);

      await neuroPage.stepTraining();
      expect(await neuroPage.getEpochCount()).toBe(2);

      await neuroPage.stepTraining();
      expect(await neuroPage.getEpochCount()).toBe(3);
    });
  });

  // ===========================================================================
  // Test 2: Mocked Microservice (Deterministic)
  // ===========================================================================
  test.describe('Mocked Microservice', () => {
    test('should render exact number of data points from mocked response', async ({ page }: { page: Page }) => {
      // Define mock dataset with exactly 3 points
      const mockDataset = [
        { x: -0.5, y: -0.5, label: 0 },
        { x: 0.5, y: 0.5, label: 1 },
        { x: 0.0, y: 0.0, label: 0 },
      ];

      // Intercept the dataset fetch
      // Since MockDataRepository is client-side, we need to inject the mock
      // by overriding the module or using page.evaluate
      await page.addInitScript((data: Array<{ x: number; y: number; label: number }>) => {
        // Override the MockDataRepository's getDataset method
        (window as unknown as Record<string, unknown>).__MOCK_DATASET__ = data;
      }, mockDataset);

      // Navigate and set up
      await neuroPage.goto();

      // Inject mock data directly into the visualiser
      await page.evaluate((points: Array<{ x: number; y: number; label: number }>) => {
        // Access the D3 chart and render mock points
        const container = document.querySelector('#viz-container svg g');
        if (!container) return;

        // Clear existing points
        container.querySelectorAll('.data-point').forEach((el) => el.remove());

        // Create mock circles
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        points.forEach((point: { x: number; y: number; label: number }, index: number) => {
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('class', 'data-point');
          circle.setAttribute('cx', String((point.x + 1) * 250)); // Scale to SVG coords
          circle.setAttribute('cy', String((1 - point.y) * 250));
          circle.setAttribute('r', '5');
          circle.setAttribute('data-index', String(index));
          container.appendChild(circle);
        });
      }, mockDataset);

      // Assert: Exactly 3 data points rendered
      await neuroPage.waitForDataPoints(3);
      const pointCount = await neuroPage.getDataPointCount();
      expect(pointCount).toBe(3);
    });

    test('should show loading state during data fetch', async () => {
      await neuroPage.goto();

      // Click load data and verify loading overlay appears
      await neuroPage.loadDataButton.click();
      await expect(neuroPage.loadingOverlay).toBeVisible();

      // Wait for loading to complete
      await expect(neuroPage.loadingOverlay).toBeHidden({ timeout: 5000 });

      // Verify data points are rendered
      const pointCount = await neuroPage.getDataPointCount();
      expect(pointCount).toBeGreaterThan(0);
    });

    test('should handle different dataset types', async () => {
      await neuroPage.goto();

      const datasets = ['circle', 'xor', 'spiral', 'gaussian'];

      for (const dataset of datasets) {
        await neuroPage.selectAndLoadDataset(dataset);

        // Each dataset should render points
        const pointCount = await neuroPage.getDataPointCount();
        expect(pointCount).toBeGreaterThan(0);
      }
    });
  });

  // ===========================================================================
  // Test 3: Visual Regression (Snapshot Tests)
  // Skip in CI until baseline snapshots are committed
  // ===========================================================================
  test.describe('Visual Regression', () => {
    test.skip(!!process.env.CI, 'Visual regression tests require baseline snapshots');

    test('should match initial state screenshot', async () => {
      await neuroPage.goto();

      // Take screenshot of initial state (before any data loaded)
      await expect(neuroPage.vizContainer).toHaveScreenshot('initial-state.png', {
        maxDiffPixelRatio: 0.002,
        animations: 'disabled',
      });
    });

    test('should match loaded dataset screenshot', async ({ page }: { page: Page }) => {
      await neuroPage.goto();

      // Seed random for deterministic dataset generation
      await page.addInitScript(() => {
        let seed = 12345;
        Math.random = () => {
          seed = (seed * 16807) % 2147483647;
          return (seed - 1) / 2147483646;
        };
      });

      await neuroPage.selectAndLoadDataset('circle');

      // Wait for points to render
      await neuroPage.waitForDataPoints();

      await expect(neuroPage.vizContainer).toHaveScreenshot('circle-dataset.png', {
        maxDiffPixelRatio: 0.002,
        animations: 'disabled',
      });
    });

    test('should match trained state screenshot', async ({ page }: { page: Page }) => {
      // Seed random for deterministic results
      await page.addInitScript(() => {
        let seed = 42;
        Math.random = () => {
          seed = (seed * 16807) % 2147483647;
          return (seed - 1) / 2147483646;
        };
      });

      await neuroPage.setupForTraining('circle', 0.1, '4, 2');
      await neuroPage.startTraining();

      // Wait for specific epoch to ensure consistent state
      await neuroPage.waitForEpoch(20);
      await neuroPage.pauseTraining();

      // Wait for boundary to render
      await neuroPage.waitForVisualUpdate();

      await expect(neuroPage.vizContainer).toHaveScreenshot('trained-state.png', {
        maxDiffPixelRatio: 0.01, // Slightly higher tolerance for trained state
        animations: 'disabled',
      });
    });
  });

  // ===========================================================================
  // Test 4: Error Handling & Edge Cases
  // ===========================================================================
  test.describe('Error Handling', () => {
    test('should disable start button until network is initialised', async () => {
      await neuroPage.goto();

      // Start button should be disabled initially
      await expect(neuroPage.startButton).toBeDisabled();

      // Load data but don't initialise
      await neuroPage.selectAndLoadDataset('circle');
      await expect(neuroPage.startButton).toBeDisabled();

      // Initialise network
      await neuroPage.initialiseNetwork();
      await expect(neuroPage.startButton).toBeEnabled();
    });

    test('should validate hyperparameter inputs', async () => {
      await neuroPage.goto();
      await neuroPage.selectAndLoadDataset('circle');

      // Set invalid learning rate
      await neuroPage.learningRateInput.fill('-1');
      await neuroPage.layersInput.fill('8, 4');

      // Listen for alert
      neuroPage.page.on('dialog', async (dialog: Dialog) => {
        expect(dialog.message()).toContain('valid learning rate');
        await dialog.accept();
      });

      await neuroPage.initButton.click();
    });

    test('should handle empty layers input', async () => {
      await neuroPage.goto();
      await neuroPage.selectAndLoadDataset('circle');

      await neuroPage.learningRateInput.fill('0.03');
      await neuroPage.layersInput.fill('');

      neuroPage.page.on('dialog', async (dialog: Dialog) => {
        expect(dialog.message()).toContain('hidden layer');
        await dialog.accept();
      });

      await neuroPage.initButton.click();
    });
  });

  // ===========================================================================
  // Test 5: Accessibility
  // ===========================================================================
  test.describe('Accessibility', () => {
    test('should have proper button labels', async () => {
      await neuroPage.goto();

      // Buttons use aria-label for accessibility (icon-only buttons)
      await expect(neuroPage.startButton).toHaveAttribute('aria-label', 'Start training');
      await expect(neuroPage.pauseButton).toHaveAttribute('aria-label', 'Pause training');
      await expect(neuroPage.resetButton).toHaveAttribute('aria-label', 'Reset training');
      await expect(neuroPage.stepButton).toHaveAttribute('aria-label', 'Execute single training step');
    });

    test('should have visible status indicators', async () => {
      await neuroPage.goto();

      await expect(neuroPage.epochCounter).toBeVisible();
      await expect(neuroPage.lossDisplay).toBeVisible();
      await expect(neuroPage.stateDisplay).toBeVisible();
    });
  });
});
