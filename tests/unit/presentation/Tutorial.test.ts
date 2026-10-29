/**
 * Onboarding tour (presentation/Tutorial.ts) tests
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('presentation TutorialManager', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('does not touch the DOM at import time', async () => {
    await import('../../../src/presentation/Tutorial');
    expect(document.body.children.length).toBe(0);
  });

  it('creates its DOM lazily with ids that do not collide with TutorialService', async () => {
    const { tutorialManager } = await import('../../../src/presentation/Tutorial');
    expect(tutorialManager.start('getting-started')).toBe(true);

    expect(document.getElementById('tutorial-overlay')).toBeNull();
    expect(document.getElementById('onboarding-tutorial-overlay')).not.toBeNull();
    const tooltip = document.getElementById('onboarding-tutorial-tooltip')!;
    expect(tooltip.classList.contains('hidden')).toBe(false);
    expect(document.getElementById('onboarding-tutorial-title')?.textContent).toBeTruthy();
  });

  it('gives the icon-only close button an accessible name and closes the tour', async () => {
    const { tutorialManager } = await import('../../../src/presentation/Tutorial');
    tutorialManager.start('getting-started');
    const close = document.getElementById('onboarding-tutorial-close') as HTMLButtonElement;
    expect(close.getAttribute('aria-label')).toBe('Close tutorial');
    close.click();
    expect(document.getElementById('onboarding-tutorial-tooltip')?.classList.contains('hidden')).toBe(true);
  });

  it('builds the DOM only once across starts and calls onComplete on finish', async () => {
    const { tutorialManager } = await import('../../../src/presentation/Tutorial');
    const done = vi.fn();
    tutorialManager.start('getting-started', done);
    tutorialManager.stop();
    tutorialManager.start('getting-started', done);
    expect(document.querySelectorAll('#onboarding-tutorial-tooltip').length).toBe(1);

    const steps = tutorialManager.getTutorials().find(t => t.id === 'getting-started')!.steps.length;
    for (let i = 0; i < steps; i++) tutorialManager.next();
    expect(done).toHaveBeenCalledTimes(1);
  });
});
