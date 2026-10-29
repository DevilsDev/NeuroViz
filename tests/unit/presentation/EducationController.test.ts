/**
 * EducationController tests: listener cleanup, a11y wiring, escaping.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const MARKUP = `
  <button id="btn-learn-menu">Learn</button>
  <div id="learn-menu-dropdown" class="hidden">
    <button id="btn-open-tutorials">Tutorials</button>
    <button id="btn-open-challenges">Challenges</button>
    <button id="btn-open-help">Help</button>
  </div>
  <button id="outside">outside</button>
  <div id="help-modal" class="hidden" role="dialog" aria-modal="true"><button id="help-close">x</button></div>
  <div id="tutorials-modal" class="hidden" role="dialog" aria-modal="true">
    <button id="tutorials-close">x</button>
    <div id="tutorials-list"></div>
  </div>
  <div id="challenges-modal" class="hidden" role="dialog" aria-modal="true">
    <button id="challenges-close">x</button>
    <span id="challenge-total-points"></span>
    <button class="challenge-tab" data-tab="challenges">Challenges</button>
    <button class="challenge-tab" data-tab="leaderboard">Leaderboard</button>
    <div id="challenges-list"></div>
    <div id="leaderboard-content" class="hidden"><div id="leaderboard-list"></div></div>
  </div>
  <div id="challenge-banner" class="hidden">
    <span id="challenge-banner-name"></span><span id="challenge-banner-status"></span>
    <button id="challenge-banner-abandon">abandon</button>
  </div>
  <span id="challenge-completion-badge"></span>
`;

describe('EducationController', () => {
  type Ctor = typeof import('../../../src/presentation/controllers/EducationController').EducationController;
  let EducationController: Ctor;
  let controller: InstanceType<Ctor>;

  beforeEach(async () => {
    localStorage.clear();
    document.head.innerHTML = '';
    document.body.innerHTML = MARKUP;
    vi.resetModules();
    ({ EducationController } = await import('../../../src/presentation/controllers/EducationController'));
  });

  afterEach(() => {
    controller?.dispose();
    vi.restoreAllMocks();
    localStorage.clear();
    document.body.innerHTML = '';
  });

  it('injects no <style> element on import', () => {
    expect(document.head.querySelectorAll('style')).toHaveLength(0);
  });

  it('dispose() removes every document/window listener it added', () => {
    const docAdd = vi.spyOn(document, 'addEventListener');
    const docRemove = vi.spyOn(document, 'removeEventListener');
    const winAdd = vi.spyOn(window, 'addEventListener');
    const winRemove = vi.spyOn(window, 'removeEventListener');
    const menuBtn = document.getElementById('btn-learn-menu')!;
    const btnAdd = vi.spyOn(menuBtn, 'addEventListener');
    const btnRemove = vi.spyOn(menuBtn, 'removeEventListener');

    controller = new EducationController();
    controller.initialise();
    controller.dispose();

    expect(docAdd.mock.calls.some(([t]) => t === 'click')).toBe(true);
    for (const spies of [[docAdd, docRemove], [winAdd, winRemove], [btnAdd, btnRemove]] as const) {
      for (const [type, handler, opts] of spies[0].mock.calls) {
        expect(spies[1]).toHaveBeenCalledWith(type, handler, ...(opts === undefined ? [] : [opts]));
      }
    }
  });

  it('keeps aria-expanded on the Learn menu button in sync', () => {
    controller = new EducationController();
    controller.initialise();
    const btn = document.getElementById('btn-learn-menu')!;
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(btn.getAttribute('aria-controls')).toBe('learn-menu-dropdown');

    btn.click();
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    document.getElementById('outside')!.click();
    expect(btn.getAttribute('aria-expanded')).toBe('false');

    btn.click();
    document.getElementById('btn-open-help')!.click();
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(document.getElementById('help-modal')!.classList.contains('hidden')).toBe(false);
  });

  it('renders keyboard-operable tutorial cards (Enter starts the tutorial)', () => {
    controller = new EducationController();
    controller.initialise();
    document.getElementById('btn-open-tutorials')!.click();

    const card = document.querySelector<HTMLElement>('.tutorial-card')!;
    expect(card.getAttribute('role')).toBe('button');
    expect(card.getAttribute('tabindex')).toBe('0');

    card.focus();
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    expect(document.getElementById('tutorials-modal')!.classList.contains('hidden')).toBe(true);
    expect(controller.getTutorialService().getCurrentTutorial()?.id).toBe(card.dataset.tutorialId);
  });

  it('closes the tutorials modal on Escape and returns focus to the Learn button', () => {
    controller = new EducationController();
    controller.initialise();
    document.getElementById('btn-learn-menu')!.click();
    const opener = document.getElementById('btn-open-tutorials')!;
    opener.focus();
    opener.click();
    const modal = document.getElementById('tutorials-modal')!;
    expect(modal.contains(document.activeElement)).toBe(true);

    document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    expect(modal.classList.contains('hidden')).toBe(true);
    // The opener now sits in the closed (hidden) dropdown, so focus falls back
    expect(document.activeElement?.id).toBe('btn-learn-menu');
  });

  it('Space on a tutorial card starts it without triggering the start/pause shortcut', async () => {
    const { KeyboardShortcuts } = await import('../../../src/utils/KeyboardShortcuts');
    const onStartPause = vi.fn();
    const shortcuts = new KeyboardShortcuts({
      onStartPause, onStep: vi.fn(), onReset: vi.fn(), onPause: vi.fn(),
      onToggleFullscreen: vi.fn(), onToggleHelp: vi.fn(),
    });
    controller = new EducationController();
    controller.initialise();
    document.getElementById('btn-open-tutorials')!.click();

    const card = document.querySelector<HTMLElement>('.tutorial-card')!;
    card.focus();
    card.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));

    expect(controller.getTutorialService().getCurrentTutorial()?.id).toBe(card.dataset.tutorialId);
    expect(onStartPause).not.toHaveBeenCalled();
    shortcuts.dispose();
  });

  it('escapes stored leaderboard data before rendering', () => {
    localStorage.setItem('neuroviz-challenge-leaderboard', JSON.stringify([{
      challengeId: '<img src=x id=pwn1>',
      rank: 1,
      configName: '<img src=x id=pwn2>',
      score: 10,
      metrics: { accuracy: 0.5, loss: 0.1, epochs: 3 },
      achievedAt: 1,
    }]));
    controller = new EducationController();
    controller.initialise();
    document.querySelector<HTMLElement>('.challenge-tab[data-tab="leaderboard"]')!.click();

    const list = document.getElementById('leaderboard-list')!;
    expect(list.querySelector('img')).toBeNull();
    expect(list.textContent).toContain('<img src=x id=pwn2>');
  });
});
