import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Tutorial before importing Onboarding
vi.mock('../../../src/presentation/Tutorial', () => ({
  tutorialManager: {
    start: vi.fn(),
  },
}));

// Mock logger
vi.mock('../../../src/infrastructure/logging/Logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Onboarding', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up any modal elements
    document.querySelectorAll('.onboarding-overlay').forEach(el => el.remove());
    localStorage.clear();
  });

  it('shouldShow returns true on first run', async () => {
    const { Onboarding } = await import('../../../src/presentation/Onboarding');
    const onboarding = new Onboarding();
    expect(onboarding.shouldShow()).toBe(true);
  });

  it('shouldShow returns false after dismissal', async () => {
    localStorage.setItem('neuroviz-first-run-complete', 'true');
    const { Onboarding } = await import('../../../src/presentation/Onboarding');
    const onboarding = new Onboarding();
    expect(onboarding.shouldShow()).toBe(false);
  });

  it('show() creates the modal overlay', async () => {
    const { Onboarding } = await import('../../../src/presentation/Onboarding');
    const onboarding = new Onboarding();
    onboarding.show();

    const overlay = document.querySelector('.onboarding-overlay');
    expect(overlay).not.toBeNull();
    expect(overlay?.getAttribute('role')).toBe('dialog');
  });

  it('show() does nothing if already dismissed', async () => {
    localStorage.setItem('neuroviz-first-run-complete', 'true');
    const { Onboarding } = await import('../../../src/presentation/Onboarding');
    const onboarding = new Onboarding();
    onboarding.show();

    const overlay = document.querySelector('.onboarding-overlay');
    expect(overlay).toBeNull();
  });

  it('clicking preset button dismisses modal and sets localStorage', async () => {
    const { Onboarding } = await import('../../../src/presentation/Onboarding');
    const onboarding = new Onboarding();
    onboarding.show();

    const presetBtn = document.querySelector('[data-action="preset"]') as HTMLElement;
    expect(presetBtn).not.toBeNull();
    presetBtn.click();

    expect(localStorage.getItem('neuroviz-first-run-complete')).toBe('true');
    expect(document.querySelector('.onboarding-overlay')).toBeNull();
  });

  it('clicking tutorial button starts the getting-started tutorial', async () => {
    const { tutorialManager } = await import('../../../src/presentation/Tutorial');
    const { Onboarding } = await import('../../../src/presentation/Onboarding');
    const onboarding = new Onboarding();
    onboarding.show();

    const tutorialBtn = document.querySelector('[data-action="tutorial"]') as HTMLElement;
    tutorialBtn.click();

    expect(tutorialManager.start).toHaveBeenCalledWith('getting-started', expect.any(Function));
    expect(localStorage.getItem('neuroviz-first-run-complete')).toBe('true');
  });

  it('clicking lab button sets localStorage and dismisses', async () => {
    const { Onboarding } = await import('../../../src/presentation/Onboarding');
    const onboarding = new Onboarding();
    onboarding.show();

    const labBtn = document.querySelector('[data-action="lab"]') as HTMLElement;
    labBtn.click();

    expect(localStorage.getItem('neuroviz-first-run-complete')).toBe('true');
    expect(document.querySelector('.onboarding-overlay')).toBeNull();
  });

  it('has three entry point buttons', async () => {
    const { Onboarding } = await import('../../../src/presentation/Onboarding');
    const onboarding = new Onboarding();
    onboarding.show();

    const buttons = document.querySelectorAll('.onboarding-btn');
    expect(buttons.length).toBe(3);
  });
});
