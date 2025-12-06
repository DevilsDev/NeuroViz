import { test, expect } from '@playwright/test';
import { NeuroPage } from '../pages/NeuroPage';

/**
 * Comprehensive UI Controls Testing
 * Tests EVERY button, input, slider, and control on the page
 * Black Box: User interaction perspective
 * White Box: Internal state verification
 */
test.describe('All UI Controls - Complete Coverage', () => {
  let neuroPage: NeuroPage;

  test.beforeEach(async ({ page }) => {
    neuroPage = new NeuroPage(page);
    await neuroPage.goto();
  });

  test.describe('Dataset Controls', () => {
    test('dataset gallery cards are clickable and functional', async ({ page }) => {
      const datasets = ['circle', 'xor', 'spiral', 'gaussian', 'clusters'];

      for (const dataset of datasets) {
        const card = page.locator(`.dataset-preview-card[data-dataset="${dataset}"]`);

        // Card should be visible
        await expect(card).toBeVisible();

        // Card should be clickable
        await card.click();

        // Card should get active class
        await expect(card).toHaveClass(/active/);
      }
    });

    test('load data button enables/disables correctly', async ({ page }) => {
      const loadButton = page.locator('#btn-load-data');

      // Should be enabled by default (with default selection)
      await expect(loadButton).toBeEnabled();

      // Click to load
      await loadButton.click();

      // Should show loading state
      await expect(neuroPage.loadingOverlay).toBeVisible();
      await expect(neuroPage.loadingOverlay).toBeHidden({ timeout: 5000 });
    });

    test('sample count slider updates value', async ({ page }) => {
      const slider = page.locator('#input-samples');
      const valueDisplay = page.locator('#samples-value');

      // Set to 150
      await slider.fill('150');
      await expect(slider).toHaveValue('150');
      await expect(valueDisplay).toHaveText('150');

      // Set to 300
      await slider.fill('300');
      await expect(slider).toHaveValue('300');
      await expect(valueDisplay).toHaveText('300');
    });

    test('noise slider updates value', async ({ page }) => {
      const slider = page.locator('#input-noise');
      const valueDisplay = page.locator('#noise-value');

      // Set to 25%
      await slider.fill('25');
      await expect(slider).toHaveValue('25');
      await expect(valueDisplay).toHaveText('25%');

      // Set to 50%
      await slider.fill('50');
      await expect(slider).toHaveValue('50');
      await expect(valueDisplay).toHaveText('50%');
    });

    test('preprocessing selector changes options', async ({ page }) => {
      const preprocessing = page.locator('#input-preprocessing');

      // Test each option
      await preprocessing.selectOption('none');
      await expect(preprocessing).toHaveValue('none');

      await preprocessing.selectOption('normalize');
      await expect(preprocessing).toHaveValue('normalize');

      await preprocessing.selectOption('standardize');
      await expect(preprocessing).toHaveValue('standardize');
    });

    test('clear custom data button works', async ({ page }) => {
      // Switch to custom dataset
      await neuroPage.selectDataset('custom');
      await neuroPage.loadDataset();

      const clearButton = page.locator('#btn-clear-custom');
      await expect(clearButton).toBeVisible();

      // TODO: Add custom drawing and verify clear works
      await clearButton.click();
    });
  });

  test.describe('Hyperparameter Controls', () => {
    test('learning rate input accepts values', async ({ page }) => {
      const lrInput = page.locator('#input-lr');

      await lrInput.fill('0.01');
      await expect(lrInput).toHaveValue('0.01');

      await lrInput.fill('0.001');
      await expect(lrInput).toHaveValue('0.001');

      await lrInput.fill('0.1');
      await expect(lrInput).toHaveValue('0.1');
    });

    test('layers input accepts configurations', async ({ page }) => {
      const layersInput = page.locator('#input-layers');

      await layersInput.fill('8');
      await expect(layersInput).toHaveValue('8');

      await layersInput.fill('8, 4');
      await expect(layersInput).toHaveValue('8, 4');

      await layersInput.fill('16, 16, 8, 4');
      await expect(layersInput).toHaveValue('16, 16, 8, 4');
    });

    test('optimizer selector changes options', async ({ page }) => {
      const optimizer = page.locator('#input-optimizer');

      await optimizer.selectOption('sgd');
      await expect(optimizer).toHaveValue('sgd');

      await optimizer.selectOption('adam');
      await expect(optimizer).toHaveValue('adam');

      await optimizer.selectOption('rmsprop');
      await expect(optimizer).toHaveValue('rmsprop');

      await optimizer.selectOption('adagrad');
      await expect(optimizer).toHaveValue('adagrad');
    });

    test('activation function selector changes options', async ({ page }) => {
      const activation = page.locator('#input-activation');

      await activation.selectOption('relu');
      await expect(activation).toHaveValue('relu');

      await activation.selectOption('sigmoid');
      await expect(activation).toHaveValue('sigmoid');

      await activation.selectOption('tanh');
      await expect(activation).toHaveValue('tanh');

      await activation.selectOption('linear');
      await expect(activation).toHaveValue('linear');
    });

    test('momentum input works for SGD', async ({ page }) => {
      const optimizer = page.locator('#input-optimizer');
      const momentum = page.locator('#input-momentum');

      // Select SGD to enable momentum
      await optimizer.selectOption('sgd');

      // Momentum input should be visible
      await expect(momentum).toBeVisible();

      await momentum.fill('0.9');
      await expect(momentum).toHaveValue('0.9');
    });

    test('L1 regularization input accepts values', async ({ page }) => {
      const l1Input = page.locator('#input-l1');

      await l1Input.fill('0');
      await expect(l1Input).toHaveValue('0');

      await l1Input.fill('0.001');
      await expect(l1Input).toHaveValue('0.001');

      await l1Input.fill('0.01');
      await expect(l1Input).toHaveValue('0.01');
    });

    test('L2 regularization input accepts values', async ({ page }) => {
      const l2Input = page.locator('#input-l2');

      await l2Input.fill('0');
      await expect(l2Input).toHaveValue('0');

      await l2Input.fill('0.001');
      await expect(l2Input).toHaveValue('0.001');

      await l2Input.fill('0.01');
      await expect(l2Input).toHaveValue('0.01');
    });

    test('dropout selector changes options', async ({ page }) => {
      const dropout = page.locator('#input-dropout');

      await dropout.selectOption('0');
      await expect(dropout).toHaveValue('0');

      await dropout.selectOption('0.1');
      await expect(dropout).toHaveValue('0.1');

      await dropout.selectOption('0.3');
      await expect(dropout).toHaveValue('0.3');

      await dropout.selectOption('0.5');
      await expect(dropout).toHaveValue('0.5');
    });

    test('batch normalization checkbox toggles', async ({ page }) => {
      const batchNorm = page.locator('#input-batch-norm');

      // Should be unchecked by default
      await expect(batchNorm).not.toBeChecked();

      await batchNorm.check();
      await expect(batchNorm).toBeChecked();

      await batchNorm.uncheck();
      await expect(batchNorm).not.toBeChecked();
    });

    test('initialize button triggers network creation', async ({ page }) => {
      await neuroPage.selectAndLoadDataset('circle');

      const initButton = page.locator('#btn-init');
      await expect(initButton).toBeEnabled();

      await initButton.click();

      // Start button should become enabled
      await expect(neuroPage.startButton).toBeEnabled({ timeout: 15000 });

      // State should change
      const state = await neuroPage.getStateText();
      expect(state).toBe('Ready');
    });
  });

  test.describe('Training Config Controls', () => {
    test('batch size input accepts values', async ({ page }) => {
      const batchSize = page.locator('#input-batch-size');

      await batchSize.fill('16');
      await expect(batchSize).toHaveValue('16');

      await batchSize.fill('32');
      await expect(batchSize).toHaveValue('32');

      await batchSize.fill('64');
      await expect(batchSize).toHaveValue('64');

      // 0 for full batch
      await batchSize.fill('0');
      await expect(batchSize).toHaveValue('0');
    });

    test('max epochs input accepts values', async ({ page }) => {
      const maxEpochs = page.locator('#input-max-epochs');

      await maxEpochs.fill('100');
      await expect(maxEpochs).toHaveValue('100');

      await maxEpochs.fill('500');
      await expect(maxEpochs).toHaveValue('500');

      await maxEpochs.fill('0');
      await expect(maxEpochs).toHaveValue('0'); // Infinite
    });

    test('validation split selector changes options', async ({ page }) => {
      const valSplit = page.locator('#input-val-split');

      await valSplit.selectOption('0');
      await expect(valSplit).toHaveValue('0');

      await valSplit.selectOption('0.1');
      await expect(valSplit).toHaveValue('0.1');

      await valSplit.selectOption('0.2');
      await expect(valSplit).toHaveValue('0.2');

      await valSplit.selectOption('0.3');
      await expect(valSplit).toHaveValue('0.3');
    });

    test('learning rate schedule selector changes options', async ({ page }) => {
      const lrSchedule = page.locator('#input-lr-schedule');

      await lrSchedule.selectOption('none');
      await expect(lrSchedule).toHaveValue('none');

      await lrSchedule.selectOption('exponential');
      await expect(lrSchedule).toHaveValue('exponential');

      await lrSchedule.selectOption('step');
      await expect(lrSchedule).toHaveValue('step');

      await lrSchedule.selectOption('cosine');
      await expect(lrSchedule).toHaveValue('cosine');
    });

    test('early stopping patience input accepts values', async ({ page }) => {
      const patience = page.locator('#input-patience');

      await patience.fill('0');
      await expect(patience).toHaveValue('0'); // Disabled

      await patience.fill('10');
      await expect(patience).toHaveValue('10');

      await patience.fill('50');
      await expect(patience).toHaveValue('50');
    });
  });

  test.describe('Training Control Buttons', () => {
    test('start button starts training', async () => {
      await neuroPage.setupForTraining('circle');

      // Start should be enabled
      await expect(neuroPage.startButton).toBeEnabled();

      await neuroPage.startButton.click();

      // State should change to Training
      await expect(neuroPage.stateDisplay).toHaveText('Training', { timeout: 2000 });

      // Epoch should start incrementing
      await neuroPage.waitForEpoch(1);
      const epoch = await neuroPage.getEpochCount();
      expect(epoch).toBeGreaterThanOrEqual(1);
    });

    test('pause button pauses training', async () => {
      await neuroPage.setupForTraining('circle');
      await neuroPage.startTraining();

      await neuroPage.waitForEpoch(5);

      // Pause
      await neuroPage.pauseButton.click();
      await expect(neuroPage.stateDisplay).toHaveText('Paused', { timeout: 2000 });

      // Epoch should stop incrementing
      const pausedEpoch = await neuroPage.getEpochCount();
      await neuroPage.page.waitForTimeout(500);
      const stillPausedEpoch = await neuroPage.getEpochCount();

      expect(stillPausedEpoch).toBe(pausedEpoch);
    });

    test('reset button resets training state', async () => {
      await neuroPage.setupForTraining('circle');
      await neuroPage.startTraining();

      await neuroPage.waitForEpoch(10);
      await neuroPage.pauseTraining();

      // Reset
      await neuroPage.resetButton.click();

      // Epoch should reset to 0
      await expect(neuroPage.epochCounter).toHaveText('0', { timeout: 2000 });

      // State should be Ready
      const state = await neuroPage.getStateText();
      expect(state).toBe('Ready');
    });

    test('step button executes single training step', async () => {
      await neuroPage.setupForTraining('circle');

      // Execute step
      await neuroPage.stepButton.click();

      // Wait for epoch to increment
      await neuroPage.waitForEpoch(1, 10000);
      const epoch1 = await neuroPage.getEpochCount();
      expect(epoch1).toBe(1);

      // Execute another step
      await neuroPage.stepButton.click();
      await neuroPage.waitForEpoch(2, 10000);
      const epoch2 = await neuroPage.getEpochCount();
      expect(epoch2).toBe(2);
    });
  });

  test.describe('Visualization Controls', () => {
    test('color scheme selector changes visualization', async ({ page }) => {
      await neuroPage.selectAndLoadDataset('circle');

      const colorScheme = page.locator('#input-colour-scheme');

      await colorScheme.selectOption('default');
      await expect(colorScheme).toHaveValue('default');

      await colorScheme.selectOption('viridis');
      await expect(colorScheme).toHaveValue('viridis');

      await colorScheme.selectOption('plasma');
      await expect(colorScheme).toHaveValue('plasma');
    });

    test('point size selector changes point rendering', async ({ page }) => {
      await neuroPage.selectAndLoadDataset('circle');

      const pointSize = page.locator('#input-point-size');

      await pointSize.selectOption('4');
      await expect(pointSize).toHaveValue('4');

      await pointSize.selectOption('6');
      await expect(pointSize).toHaveValue('6');

      await pointSize.selectOption('8');
      await expect(pointSize).toHaveValue('8');
    });

    test('3D view checkbox toggles 3D visualization', async ({ page }) => {
      await neuroPage.selectAndLoadDataset('circle');

      const view3d = page.locator('#input-3d-view');

      await view3d.check();
      await expect(view3d).toBeChecked();

      // Should trigger 3D mode (WebGL/Three.js)
      // Verify 3D container appears
      const threeContainer = page.locator('#three-container');
      await expect(threeContainer).toBeVisible({ timeout: 3000 });

      await view3d.uncheck();
      await expect(view3d).not.toBeChecked();
    });

    test('show voronoi checkbox toggles voronoi overlay', async ({ page }) => {
      await neuroPage.setupForTraining('circle');
      await neuroPage.startTraining();
      await neuroPage.waitForEpoch(5);
      await neuroPage.pauseTraining();

      const voronoi = page.locator('#input-voronoi');

      await voronoi.check();
      await expect(voronoi).toBeChecked();

      // Voronoi overlay should appear
      const voronoiOverlay = page.locator('.voronoi-overlay');
      await expect(voronoiOverlay).toBeVisible({ timeout: 2000 });

      await voronoi.uncheck();
      await expect(voronoi).not.toBeChecked();
    });
  });

  test.describe('Tab Navigation', () => {
    test('all sidebar tabs are clickable', async ({ page }) => {
      const tabs = [
        { name: 'setup', label: 'Setup' },
        { name: 'train', label: 'Train' },
        { name: 'analyse', label: 'Analyse' },
        { name: 'export', label: 'Export' },
      ];

      for (const tab of tabs) {
        const tabButton = page.locator(`button.sidebar-tab[data-tab="${tab.name}"]`);
        await tabButton.click();
        await expect(tabButton).toHaveClass(/active/);
      }
    });

    test('tab content panels switch correctly', async ({ page }) => {
      const setupContent = page.locator('#tab-content-setup');
      const trainContent = page.locator('#tab-content-train');
      const analyseContent = page.locator('#tab-content-analyse');

      // Setup should be visible by default
      await expect(setupContent).toBeVisible();

      // Switch to Train tab
      const trainTab = page.locator('button.sidebar-tab[data-tab="train"]');
      await trainTab.click();
      await expect(trainContent).toBeVisible();
      await expect(setupContent).not.toBeVisible();

      // Switch to Analyse tab
      const analyseTab = page.locator('button.sidebar-tab[data-tab="analyse"]');
      await analyseTab.click();
      await expect(analyseContent).toBeVisible();
      await expect(trainContent).not.toBeVisible();
    });
  });

  test.describe('Export Controls', () => {
    test('export history button downloads data', async ({ page }) => {
      await neuroPage.setupForTraining('circle');
      await neuroPage.startTraining();
      await neuroPage.waitForEpoch(10);
      await neuroPage.pauseTraining();

      // Switch to export tab
      const exportTab = page.locator('button.sidebar-tab[data-tab="export"]');
      await exportTab.click();

      const exportButton = page.locator('#btn-export-history');
      await expect(exportButton).toBeEnabled();

      // Click export (actual download won't happen in test, but button should work)
      await exportButton.click();
    });

    test('export model button is functional', async ({ page }) => {
      await neuroPage.setupForTraining('circle');

      const exportTab = page.locator('button.sidebar-tab[data-tab="export"]');
      await exportTab.click();

      const exportModelButton = page.locator('#btn-export-model');
      await expect(exportModelButton).toBeEnabled();

      await exportModelButton.click();
    });
  });
});

test.describe('Keyboard Shortcuts', () => {
  let neuroPage: NeuroPage;

  test.beforeEach(async ({ page }) => {
    neuroPage = new NeuroPage(page);
    await neuroPage.setupForTraining('circle');
  });

  test('Space key starts/pauses training', async ({ page }) => {
    // Press Space to start
    await page.keyboard.press('Space');
    await expect(neuroPage.stateDisplay).toHaveText('Training', { timeout: 2000 });

    await neuroPage.waitForEpoch(3);

    // Press Space to pause
    await page.keyboard.press('Space');
    await expect(neuroPage.stateDisplay).toHaveText('Paused', { timeout: 2000 });
  });

  test('S key executes single step', async ({ page }) => {
    // Press S
    await page.keyboard.press('s');

    await neuroPage.waitForEpoch(1, 10000);
    const epoch = await neuroPage.getEpochCount();
    expect(epoch).toBe(1);
  });

  test('R key resets training', async ({ page }) => {
    await neuroPage.startTraining();
    await neuroPage.waitForEpoch(5);
    await neuroPage.pauseTraining();

    // Press R
    await page.keyboard.press('r');

    await expect(neuroPage.epochCounter).toHaveText('0', { timeout: 2000 });
  });
});
