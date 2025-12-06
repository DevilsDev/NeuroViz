import { test, expect } from '@playwright/test';
import { NeuroPage } from '../pages/NeuroPage';

/**
 * Tab Content Organization Tests
 * Verifies each tab contains the correct sections and elements
 */
test.describe('Tab Content Organization', () => {
    let neuroPage: NeuroPage;

    test.beforeEach(async ({ page }) => {
        neuroPage = new NeuroPage(page);
        await neuroPage.goto();
    });

    test('Setup tab should contain all required sections', async ({ page }) => {
        // Setup tab should be active by default
        const setupTab = page.locator('button.sidebar-tab[data-tab="setup"]');
        await expect(setupTab).toHaveClass(/active/);

        // Quick Start section
        await expect(page.locator('#preset-select')).toBeVisible();
        await expect(page.locator('#btn-apply-preset')).toBeVisible();
        await expect(page.locator('#btn-save-bookmark')).toBeVisible();

        // Dataset gallery
        await expect(page.locator('.dataset-preview-card[data-dataset="circle"]')).toBeVisible();
        await expect(page.locator('.dataset-preview-card[data-dataset="xor"]')).toBeVisible();
        await expect(page.locator('.dataset-preview-card[data-dataset="spiral"]')).toBeVisible();
        await expect(page.locator('.dataset-preview-card[data-dataset="gaussian"]')).toBeVisible();
        await expect(page.locator('.dataset-preview-card[data-dataset="clusters"]')).toBeVisible();

        // Dataset Options  
        await expect(page.locator('#input-samples')).toBeVisible();
        await expect(page.locator('#input-noise')).toBeVisible();
        await expect(page.locator('#input-balance')).toBeVisible();
        await expect(page.locator('#btn-load-data')).toBeVisible();

        // Visualization controls
        await expect(page.locator('#input-colour-scheme')).toBeVisible();
        await expect(page.locator('#input-point-size')).toBeVisible();
        await expect(page.locator('#input-opacity')).toBeVisible();

        // Hyperparameters
        await expect(page.locator('#input-lr')).toBeVisible();
        await expect(page.locator('#input-optimizer')).toBeVisible();
        await expect(page.locator('#input-layers')).toBeVisible();
        await expect(page.locator('#input-activation')).toBeVisible();
        await expect(page.locator('#btn-init')).toBeVisible();
    });

    test('Train tab should contain all required sections', async ({ page }) => {
        // Click Train tab
        const trainTab = page.locator('button.sidebar-tab[data-tab="train"]');
        await trainTab.click();
        await expect(trainTab).toHaveClass(/active/);

        // Keyboard shortcuts hint
        await expect(page.locator('.kbd').first()).toBeVisible();

        // Metrics section
        await expect(page.locator('#status-epoch')).toBeVisible();
        await expect(page.locator('#status-loss')).toBeVisible();
        await expect(page.locator('#status-accuracy')).toBeVisible();
        await expect(page.locator('#status-state')).toBeVisible();

        // Training History
        await expect(page.locator('#stat-best-loss')).toBeVisible();
        await expect(page.locator('#stat-best-epoch')).toBeVisible();
        await expect(page.locator('#loss-chart-container')).toBeVisible();
    });

    test('Analyse tab should contain all required sections', async ({ page }) => {
        // Click Analyse tab
        const analyseTab = page.locator('button.sidebar-tab[data-tab="analyse"]');
        await analyseTab.click();
        await expect(analyseTab).toHaveClass(/active/);

        // What-If Analysis (always visible)
        await expect(page.locator('#whatif-parameter')).toBeVisible();
        await expect(page.locator('#btn-whatif')).toBeVisible();

        // Classification section header exists
        await expect(page.locator('[data-collapsible="classification-metrics"]')).toBeAttached();

        // Model Internals section header exists
        await expect(page.locator('[data-collapsible="model-internals"]')).toBeAttached();
    });

    test('Tab switching should work correctly', async ({ page }) => {
        // Start on Setup
        const setupPanel = page.locator('[data-tab-content="setup"]');
        const trainPanel = page.locator('[data-tab-content="train"]');
        const analysePanel = page.locator('[data-tab-content="analyse"]');

        await expect(setupPanel).toHaveClass(/active/);
        await expect(trainPanel).not.toHaveClass(/active/);
        await expect(analysePanel).not.toHaveClass(/active/);

        // Switch to Train
        await page.locator('button.sidebar-tab[data-tab="train"]').click();
        await expect(trainPanel).toHaveClass(/active/);
        await expect(setupPanel).not.toHaveClass(/active/);

        // Switch to Analyse
        await page.locator('button.sidebar-tab[data-tab="analyse"]').click();
        await expect(analysePanel).toHaveClass(/active/);
        await expect(trainPanel).not.toHaveClass(/active/);

        // Back to Setup
        await page.locator('button.sidebar-tab[data-tab="setup"]').click();
        await expect(setupPanel).toHaveClass(/active/);
        await expect(analysePanel).not.toHaveClass(/active/);
    });
});
