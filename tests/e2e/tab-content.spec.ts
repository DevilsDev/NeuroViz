import { test, expect, type Page } from '@playwright/test';
import { NeuroPage } from '../pages/NeuroPage';

/**
 * Tab Content Organization Tests
 * Verifies each sidebar tab (Data, Model, Train, Analyze) contains the
 * expected controls. Placement is checked with toBeAttached() inside the
 * tab panel because some controls live in collapsed <details> sections.
 */
test.describe('Tab Content Organization', () => {
    let neuroPage: NeuroPage;

    test.beforeEach(async ({ page }) => {
        neuroPage = new NeuroPage(page);
        await neuroPage.goto();
    });

    async function expectInTab(page: Page, tab: string, selectors: string[]): Promise<void> {
        const panel = page.locator(`#tab-${tab}`);
        await expect(panel).toBeVisible();
        for (const selector of selectors) {
            await expect(panel.locator(selector), `${selector} should be in the ${tab} tab`).toBeAttached();
        }
    }

    test('Data tab should contain all required sections', async ({ page }) => {
        // Data tab is active by default
        await expect(page.locator('button.sidebar-tab[data-tab="tab-data"]')).toHaveClass(/active/);

        await expectInTab(page, 'data', [
            // Quick start presets
            '#preset-select',
            '#btn-apply-preset',
            // Dataset options
            '#input-samples',
            '#input-noise',
            '#input-balance',
            '#input-preprocessing',
            '#btn-load-data',
            // Session
            '#btn-save-session',
            '#btn-load-session',
        ]);
        await expect(page.locator('#btn-load-data')).toBeVisible();

        // The dataset gallery chips sit above the tabs and are always visible
        for (const dataset of ['circle', 'xor', 'spiral', 'gaussian', 'clusters', 'iris', 'wine', 'custom']) {
            await expect(page.locator(`.dataset-preview-card[data-dataset="${dataset}"]`)).toBeVisible();
        }
    });

    test('Model tab should contain all required sections', async ({ page }) => {
        await neuroPage.openTab('model');

        await expectInTab(page, 'model', [
            '#input-lr',
            '#input-optimizer',
            '#input-loss-function',
            '#input-layers',
            '#input-activation',
            '#input-batch-norm',
            '#btn-init',
        ]);
        await expect(page.locator('#btn-init')).toBeVisible();
    });

    test('Train tab should contain all required sections', async ({ page }) => {
        await neuroPage.openTab('train');

        await expectInTab(page, 'train', [
            '#input-batch-size',
            '#input-max-epochs',
            '#input-lr-schedule',
            '#input-val-split',
            '#input-fps',
            '#input-l1',
            '#input-l2',
            '#input-dropout',
        ]);
    });

    test('Analyze tab should contain all required sections', async ({ page }) => {
        await neuroPage.openTab('analyze');

        await expectInTab(page, 'analyze', [
            '#network-diagram',
            '#weight-histogram',
            '#confusion-matrix-container',
            '#btn-generate-adversarial',
            '#btn-export-model-sticky',
            '#btn-export-history-sticky',
            '#btn-export-report',
        ]);
    });

    test('Training metrics stay visible in the toolbar on every tab', async ({ page }) => {
        for (const tab of ['data', 'model', 'train', 'analyze'] as const) {
            await neuroPage.openTab(tab);
            await expect(page.locator('#status-epoch')).toBeVisible();
            await expect(page.locator('#status-loss')).toBeVisible();
            await expect(page.locator('#status-accuracy')).toBeVisible();
            await expect(page.locator('#loss-chart-container')).toBeVisible();
        }
    });

    test('Tab switching should work correctly', async ({ page }) => {
        const tabs = ['data', 'model', 'train', 'analyze'] as const;

        // Data is active by default; the others are not
        await expect(page.locator('#tab-data')).toHaveClass(/active/);
        for (const other of tabs.slice(1)) {
            await expect(page.locator(`#tab-${other}`)).not.toHaveClass(/active/);
        }

        // Each tab activates its own panel and deactivates the rest
        for (const tab of [...tabs.slice(1), 'data' as const]) {
            await neuroPage.openTab(tab);
            await expect(page.locator(`button.sidebar-tab[data-tab="tab-${tab}"]`)).toHaveAttribute('aria-selected', 'true');
            for (const other of tabs.filter((t) => t !== tab)) {
                await expect(page.locator(`#tab-${other}`)).not.toHaveClass(/active/);
            }
        }
    });
});
