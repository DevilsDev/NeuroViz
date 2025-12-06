import { test, expect } from '@playwright/test';
import { NeuroPage } from '../pages/NeuroPage';

/**
 * Comprehensive UI Feature Tests
 * Tests all major UI controls that aren't covered by the main E2E suite
 */
test.describe('Comprehensive UI Features', () => {
    let neuroPage: NeuroPage;

    test.beforeEach(async ({ page }) => {
        neuroPage = new NeuroPage(page);
        await neuroPage.goto();
    });

    test('should test all hyperparameter controls', async ({ page }) => {
        // Dataset
        await neuroPage.selectAndLoadDataset('spiral');

        // Learning Rate
        const lrInput = page.locator('#input-lr');
        await lrInput.fill('0.01');
        await expect(lrInput).toHaveValue('0.01');

        // Optimizer
        const optimizer = page.locator('#input-optimizer');
        await optimizer.selectOption('sgd');
        await expect(optimizer).toHaveValue('sgd');

        // Hidden Layers
        const layers = page.locator('#input-layers');
        await layers.fill('16, 8');
        await expect(layers).toHaveValue('16, 8');

        // Activation
        const activation = page.locator('#input-activation');
        await activation.selectOption('tanh');
        await expect(activation).toHaveValue('tanh');

        // Classes
        const classes = page.locator('#input-num-classes');
        await classes.selectOption('3');
        await expect(classes).toHaveValue('3');

        // L1/L2 Regularization
        const l1 = page.locator('#input-l1');
        await l1.fill('0.001');
        await expect(l1).toHaveValue('0.001');

        const l2 = page.locator('#input-l2');
        await l2.fill('0.001');
        await expect(l2).toHaveValue('0.001');

        // Dropout
        const dropout = page.locator('#input-dropout');
        await dropout.selectOption('0.1');
        await expect(dropout).toHaveValue('0.1');

        // Initialize Network
        await neuroPage.initButton.click();
        await expect(neuroPage.startButton).toBeEnabled({ timeout: 10000 });
    });

    test('should test all training config controls', async ({ page }) => {
        await neuroPage.selectAndLoadDataset('circle');

        // Batch Size
        const batchSize = page.locator('#input-batch-size');
        await batchSize.fill('32');
        await expect(batchSize).toHaveValue('32');

        // Max Epochs
        const maxEpochs = page.locator('#input-max-epochs');
        await maxEpochs.fill('100');
        await expect(maxEpochs).toHaveValue('100');

        // Validation Split
        const valSplit = page.locator('#input-val-split');
        await valSplit.selectOption('0.1');
        await expect(valSplit).toHaveValue('0.1');

        // LR Schedule
        const lrSchedule = page.locator('#input-lr-schedule');
        await lrSchedule.selectOption('step');
        await expect(lrSchedule).toHaveValue('step');
    });

    test('should test visualization controls', async ({ page }) => {
        await neuroPage.selectAndLoadDataset('xor');

        // Color Scheme
        const colorScheme = page.locator('#input-colour-scheme');
        await colorScheme.selectOption('viridis');
        await expect(colorScheme).toHaveValue('viridis');

        // Point Size
        const pointSize = page.locator('#input-point-size');
        await pointSize.selectOption('8');
        await expect(pointSize).toHaveValue('8');

        // 3D View checkbox
        const view3d = page.locator('#input-3d-view');
        await view3d.check();
        await expect(view3d).toBeChecked();
        await view3d.uncheck();
        await expect(view3d).not.toBeChecked();

        // Voronoi checkbox
        const voronoi = page.locator('#input-voronoi');
        await voronoi.check();
        await expect(voronoi).toBeChecked();
    });

    test('should test full training cycle with metrics', async ({ page }) => {
        await neuroPage.setupForTraining('circle', 0.003, '8, 4');

        // Start training
        await neuroPage.startTraining();

        // Wait for training to progress
        await neuroPage.waitForEpoch(20, 30000);

        // Verify epoch increased
        const epoch = await neuroPage.getEpochCount();
        expect(epoch).toBeGreaterThanOrEqual(20);

        // Verify loss is a number
        await neuroPage.waitForLossValue();
        const loss = await neuroPage.getLossValue();
        expect(loss).not.toBeNull();
        expect(typeof loss).toBe('number');

        // Pause and step
        await neuroPage.pauseTraining();
        const pausedEpoch = await neuroPage.getEpochCount();

        await neuroPage.stepTraining();
        const afterStep = await neuroPage.getEpochCount();
        expect(afterStep).toBe(pausedEpoch + 1);

        // Reset
        await neuroPage.resetTraining();
        const resetEpoch = await neuroPage.getEpochCount();
        expect(resetEpoch).toBe(0);
    });

    test('should test sidebar tabs', async ({ page }) => {
        // Setup tab (default) - using button.sidebar-tab selector
        const setupTab = page.locator('button.sidebar-tab[data-tab="setup"]');
        await expect(setupTab).toHaveClass(/active/);

        // Train tab
        const trainTab = page.locator('button.sidebar-tab[data-tab="train"]');
        await trainTab.click();
        await expect(trainTab).toHaveClass(/active/);

        // Analyse tab
        const analyseTab = page.locator('button.sidebar-tab[data-tab="analyse"]');
        await analyseTab.click();
        await expect(analyseTab).toHaveClass(/active/);

        // Back to Setup
        await setupTab.click();
        await expect(setupTab).toHaveClass(/active/);
    });
});
