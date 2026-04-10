import type { Page } from '@playwright/test';

/**
 * Pre-sets the first-run-complete flag so the onboarding modal
 * does not appear during E2E tests.
 *
 * Call in beforeEach or at the top of each test, BEFORE navigating to the app.
 */
export async function skipOnboarding(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('neuroviz-first-run-complete', 'true');
  });
}
