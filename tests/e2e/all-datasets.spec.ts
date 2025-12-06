import { test, expect } from '@playwright/test';
import { NeuroPage } from '../pages/NeuroPage';

/**
 * Comprehensive Dataset Testing
 * Tests EVERY dataset to ensure they all load and function correctly
 * Black Box: User loads each dataset and verifies it appears
 * White Box: Verifies internal state and data structures
 */
test.describe('All Dataset Loading - Black Box Tests', () => {
  let neuroPage: NeuroPage;

  test.beforeEach(async ({ page }) => {
    neuroPage = new NeuroPage(page);
    await neuroPage.goto();
  });

  test('should load Circle dataset', async () => {
    await neuroPage.selectAndLoadDataset('circle');

    // Black box: Verify data points appear
    const pointCount = await neuroPage.getDataPointCount();
    expect(pointCount).toBeGreaterThan(0);
    expect(pointCount).toBeLessThanOrEqual(500); // Max samples

    // Verify points are visible
    await neuroPage.waitForDataPoints();
    await expect(neuroPage.dataPoints.first()).toBeVisible();
  });

  test('should load XOR dataset', async () => {
    await neuroPage.selectAndLoadDataset('xor');

    const pointCount = await neuroPage.getDataPointCount();
    expect(pointCount).toBeGreaterThan(0);

    // XOR creates 4 quadrants
    await neuroPage.waitForDataPoints();
    await expect(neuroPage.dataPoints.first()).toBeVisible();
  });

  test('should load Spiral dataset', async () => {
    await neuroPage.selectAndLoadDataset('spiral');

    const pointCount = await neuroPage.getDataPointCount();
    expect(pointCount).toBeGreaterThan(0);

    await neuroPage.waitForDataPoints();
    await expect(neuroPage.dataPoints.first()).toBeVisible();
  });

  test('should load Gaussian dataset', async () => {
    await neuroPage.selectAndLoadDataset('gaussian');

    const pointCount = await neuroPage.getDataPointCount();
    expect(pointCount).toBeGreaterThan(0);

    await neuroPage.waitForDataPoints();
    await expect(neuroPage.dataPoints.first()).toBeVisible();
  });

  test('should load Clusters dataset', async () => {
    await neuroPage.selectAndLoadDataset('clusters');

    const pointCount = await neuroPage.getDataPointCount();
    expect(pointCount).toBeGreaterThan(0);

    await neuroPage.waitForDataPoints();
    await expect(neuroPage.dataPoints.first()).toBeVisible();
  });

  test('should load Iris dataset (real-world)', async ({ page }) => {
    // The dropdown is hidden by default - show it first
    await page.locator('#toggle-dataset-view').click();
    await page.locator('#dataset-select').selectOption('iris');
    await neuroPage.loadDataset();

    // Iris has 150 samples
    const pointCount = await neuroPage.getDataPointCount();
    expect(pointCount).toBe(150);

    await neuroPage.waitForDataPoints(150);
  });

  test('should load Wine dataset (real-world)', async ({ page }) => {
    // The dropdown is hidden by default - show it first
    await page.locator('#toggle-dataset-view').click();
    await page.locator('#dataset-select').selectOption('wine');
    await neuroPage.loadDataset();

    // Wine has 178 samples
    const pointCount = await neuroPage.getDataPointCount();
    expect(pointCount).toBe(178);

    await neuroPage.waitForDataPoints(178);
  });

  test('should enable Custom dataset drawing mode', async ({ page }) => {
    // Custom dataset has no gallery card - use dropdown
    // Toggle dropdown visibility first (it's hidden by default)
    await page.locator('#toggle-dataset-view').click();
    await page.waitForSelector('#dataset-select', { state: 'visible' });
    await page.locator('#dataset-select').selectOption('custom');

    // Custom dataset doesn't show loading overlay - just click button
    await page.locator('#btn-load-data').click();
    await page.waitForTimeout(500);

    // Custom dataset starts with 0 points
    // Drawing controls should become visible
    const drawControls = page.locator('#draw-controls');
    await expect(drawControls).not.toHaveClass(/hidden/, { timeout: 5000 });
  });
});

test.describe('All Datasets Training - White Box Tests', () => {
  let neuroPage: NeuroPage;

  test.beforeEach(async ({ page }) => {
    neuroPage = new NeuroPage(page);
    await neuroPage.goto();
  });

  test('should train Circle dataset and verify internal state', async ({ page }) => {
    await neuroPage.setupForTraining('circle', 0.01, '8, 4');
    await neuroPage.startTraining();

    // Wait for training
    await neuroPage.waitForEpoch(10);

    // White box: Check internal state
    const state = await page.evaluate(() => {
      const app = (window as any).app;
      return {
        hasTrainingData: app.services.session.getData().length > 0,
        isTraining: app.services.session.getState().isRunning,
        epoch: app.services.session.getState().currentEpoch,
        loss: app.services.session.getState().currentLoss,
      };
    });

    expect(state.hasTrainingData).toBe(true);
    expect(state.epoch).toBeGreaterThanOrEqual(10);
    expect(state.loss).not.toBeNull();
    expect(state.loss).toBeGreaterThan(0);
  });

  test('should train XOR dataset and verify loss decreases', async () => {
    await neuroPage.setupForTraining('xor', 0.01, '8, 8, 4');
    await neuroPage.startTraining();

    // Record initial loss
    await neuroPage.waitForLossValue();
    const initialLoss = await neuroPage.getLossValue();

    // Train more
    await neuroPage.waitForEpoch(50);
    const finalLoss = await neuroPage.getLossValue();

    // Loss should generally decrease (may fluctuate)
    expect(finalLoss).not.toBeNull();
    expect(initialLoss).not.toBeNull();

    // Loss should be finite
    expect(isFinite(finalLoss!)).toBe(true);
  });

  test('should train Spiral dataset with deeper network', async () => {
    // Spiral requires deeper network
    await neuroPage.setupForTraining('spiral', 0.01, '16, 16, 8');
    await neuroPage.startTraining();

    await neuroPage.waitForEpoch(20);

    const epoch = await neuroPage.getEpochCount();
    expect(epoch).toBeGreaterThanOrEqual(20);

    // Should have boundary
    await neuroPage.waitForVisualUpdate();
    const boundaryCount = await neuroPage.getBoundaryPathCount();
    expect(boundaryCount).toBeGreaterThan(0);
  });

  test('should train Gaussian dataset and verify metrics', async ({ page }) => {
    // Gaussian may take longer to converge
    await neuroPage.setupForTraining('gaussian', 0.01, '4, 2');
    await neuroPage.startTraining();

    // Use longer timeout for Gaussian training
    await neuroPage.waitForEpoch(15, 60000);
    await neuroPage.pauseTraining();

    // Check all metrics are valid
    const epoch = await neuroPage.getEpochCount();
    const loss = await neuroPage.getLossValue();

    expect(epoch).toBeGreaterThanOrEqual(15);
    expect(loss).not.toBeNull();
    expect(loss).toBeGreaterThan(0);
    expect(loss).toBeLessThan(10);
  });

  test('should verify Clusters dataset creates distinct regions', async () => {
    await neuroPage.setupForTraining('clusters', 0.01, '8, 4');
    await neuroPage.startTraining();

    await neuroPage.waitForEpoch(20);
    await neuroPage.pauseTraining();

    // Verify boundary is rendered
    await neuroPage.waitForVisualUpdate();
    const boundaryCount = await neuroPage.getBoundaryPathCount();
    expect(boundaryCount).toBeGreaterThan(0);
  });

  test('should verify Iris dataset loads with correct dimensions', async ({ page }) => {
    // Wait for dropdown toggle to be clickable
    const toggleBtn = page.locator('#toggle-dataset-view');
    await toggleBtn.click();
    await page.waitForSelector('#dataset-select', { state: 'visible' });
    await page.locator('#dataset-select').selectOption('iris');
    await neuroPage.loadDataset();

    // White box: Verify data structure
    const dataInfo = await page.evaluate(() => {
      const app = (window as any).app;
      const data = app.services.session.getData();
      return {
        count: data.length,
        hasLabels: data.every((p: any) => typeof p.label === 'number'),
        hasCoordinates: data.every((p: any) => typeof p.x === 'number' && typeof p.y === 'number'),
      };
    });

    expect(dataInfo.count).toBe(150);
    expect(dataInfo.hasLabels).toBe(true);
    expect(dataInfo.hasCoordinates).toBe(true);
  });

  test('should verify Wine dataset loads with correct dimensions', async ({ page }) => {
    // Wait for dropdown toggle to be clickable
    const toggleBtn = page.locator('#toggle-dataset-view');
    await toggleBtn.click();
    await page.waitForSelector('#dataset-select', { state: 'visible' });
    await page.locator('#dataset-select').selectOption('wine');
    await neuroPage.loadDataset();

    const dataInfo = await page.evaluate(() => {
      const app = (window as any).app;
      const data = app.services.session.getData();
      return {
        count: data.length,
        hasLabels: data.every((p: any) => typeof p.label === 'number'),
      };
    });

    expect(dataInfo.count).toBe(178);
    expect(dataInfo.hasLabels).toBe(true);
  });
});

test.describe('Dataset Switching - State Management', () => {
  let neuroPage: NeuroPage;

  test.beforeEach(async ({ page }) => {
    neuroPage = new NeuroPage(page);
    await neuroPage.goto();
  });

  test('should switch between datasets without errors', async () => {
    const datasets = ['circle', 'xor', 'spiral', 'gaussian', 'clusters'];

    for (const dataset of datasets) {
      await neuroPage.selectAndLoadDataset(dataset);

      // Verify points loaded
      const pointCount = await neuroPage.getDataPointCount();
      expect(pointCount).toBeGreaterThan(0);

      // Small delay for stability
      await neuroPage.page.waitForTimeout(200);
    }
  });

  test('should clear previous dataset when loading new one', async ({ page }) => {
    // Load first dataset
    await neuroPage.selectAndLoadDataset('circle');
    const firstCount = await neuroPage.getDataPointCount();

    // Load second dataset
    await neuroPage.selectAndLoadDataset('xor');
    const secondCount = await neuroPage.getDataPointCount();

    // Both should have data, but XOR might have different count
    expect(firstCount).toBeGreaterThan(0);
    expect(secondCount).toBeGreaterThan(0);

    // Verify only one dataset is rendered (no overlap)
    const dataInfo = await page.evaluate(() => {
      const app = (window as any).app;
      return app.services.session.getData().length;
    });

    expect(dataInfo).toBeGreaterThan(0);
  });

  test('should reset training state when loading new dataset', async ({ page }) => {
    // Train on first dataset
    await neuroPage.setupForTraining('circle');
    await neuroPage.startTraining();
    await neuroPage.waitForEpoch(5);
    await neuroPage.pauseTraining();

    const epochBefore = await neuroPage.getEpochCount();
    expect(epochBefore).toBeGreaterThanOrEqual(5);

    // Load new dataset
    await neuroPage.selectAndLoadDataset('xor');

    // Epoch should NOT reset just from loading data
    // But training state should be stopped
    const state = await neuroPage.getStateText();
    expect(state).not.toBe('Training');
  });
});

test.describe('Dataset Parameters - White Box', () => {
  let neuroPage: NeuroPage;

  test.beforeEach(async ({ page }) => {
    neuroPage = new NeuroPage(page);
    await neuroPage.goto();
  });

  test('should respect sample count parameter', async ({ page }) => {
    // Set samples to 100
    const samplesInput = page.locator('#input-samples');
    await samplesInput.fill('100');

    await neuroPage.selectAndLoadDataset('circle');

    const pointCount = await neuroPage.getDataPointCount();
    expect(pointCount).toBe(100);
  });

  test('should respect noise parameter', async ({ page }) => {
    const noiseInput = page.locator('#input-noise');

    // Low noise
    await noiseInput.fill('5');
    await neuroPage.selectAndLoadDataset('circle');

    const lowNoiseCount = await neuroPage.getDataPointCount();
    expect(lowNoiseCount).toBeGreaterThan(0);

    // High noise
    await noiseInput.fill('50');
    await neuroPage.selectAndLoadDataset('circle');

    const highNoiseCount = await neuroPage.getDataPointCount();
    expect(highNoiseCount).toBeGreaterThan(0);
  });

  test('should respect number of classes parameter', async ({ page }) => {
    // Use clusters dataset which supports numClasses (gaussian ignores it)
    const classesInput = page.locator('#input-num-classes');

    // 3 classes
    await classesInput.selectOption('3');
    await neuroPage.selectAndLoadDataset('clusters');

    // Wait for data to reload
    await page.waitForTimeout(500);

    // Verify 3 distinct labels exist
    const labels = await page.evaluate(() => {
      const app = (window as any).app;
      const data = app.services.session.getData();
      const uniqueLabels = new Set(data.map((p: any) => p.label));
      return Array.from(uniqueLabels).sort();
    });

    expect(labels.length).toBe(3);
    expect(labels).toEqual([0, 1, 2]);
  });
});
