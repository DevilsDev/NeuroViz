import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for NeuroViz E2E tests.
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './tests/results',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry once on CI to absorb genuine flakes without tripling wall-clock on real failures */
  retries: process.env.CI ? 1 : 0,

  /* Two workers on CI: TF.js + chromium fits in a 7 GB runner and halves wall-clock */
  workers: process.env.CI ? 2 : undefined,

  /* Reporter to use */
  reporter: process.env.CI
    ? [
        ['html', { outputFolder: './tests/reports', open: 'never' }],
        ['github'],
        ['dot'],
      ]
    : [
        ['html', { outputFolder: './tests/reports' }],
        ['list'],
      ],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL. Trailing slash matters: Playwright resolves relative paths via
       new URL(path, baseURL), so a missing slash collapses "/" to the server
       root and loses the /NeuroViz/ sub-path. */
    baseURL: process.env.CI ? 'http://localhost:5173/NeuroViz/' : 'http://localhost:3000/',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Capture screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'on-first-retry',

    /* Generous but bounded — TF.js init + D3 rendering must fit inside */
    actionTimeout: 20000,
    navigationTimeout: 20000,
  },

  /* Configure projects for major browsers */
  projects: process.env.CI
    ? [
        // Only run chromium in CI for speed and compatibility
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
      ]
    : [
        // Run all browsers locally for comprehensive testing
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] },
        },
        {
          name: 'webkit',
          use: {
            ...devices['Desktop Safari'],
            // WebKit + TensorFlow.js is slower, increase timeouts
            actionTimeout: 30000,
            navigationTimeout: 30000,
          },
        },
      ],

  /* Per-test budget. 60s is ample for TF.js init + any multi-step test; any
     test that legitimately needs more should opt in with test.setTimeout(). */
  timeout: process.env.CI ? 60000 : 60000,

  /* Run local dev server before starting the tests */
  webServer: process.env.CI
    ? undefined  // CI workflow starts server separately
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120 * 1000,
      },

  /* Snapshot configuration for visual regression tests */
  expect: {
    toHaveScreenshot: {
      /* Allow 0.2% pixel difference for cross-machine consistency */
      maxDiffPixelRatio: 0.002,
      /* Animation tolerance */
      animations: 'disabled',
    },
  },
});
