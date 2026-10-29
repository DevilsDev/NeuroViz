/**
 * Listener teardown tests for small presentation modules.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { setupBottomSheet } from '../../../src/presentation/BottomSheet';
import { setupTouchGestures } from '../../../src/presentation/TouchGestures';
import { TooltipService } from '../../../src/infrastructure/education/TooltipService';
import { MetricsController, type MetricsElements } from '../../../src/presentation/controllers/MetricsController';

type AnySpy = ReturnType<typeof vi.spyOn>;

function expectAllRemoved(add: AnySpy, remove: AnySpy): void {
  expect(add.mock.calls.length).toBeGreaterThan(0);
  for (const [type, handler] of add.mock.calls) {
    expect(remove).toHaveBeenCalledWith(type, handler);
  }
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('setupBottomSheet', () => {
  it('returns a teardown that removes document and element listeners', () => {
    document.body.innerHTML = `
      <div id="bottom-sheet"></div><div id="bottom-sheet-handle"></div><div id="bottom-sheet-overlay"></div>`;
    const docAdd = vi.spyOn(document, 'addEventListener');
    const docRemove = vi.spyOn(document, 'removeEventListener');
    const handle = document.getElementById('bottom-sheet-handle')!;
    const hAdd = vi.spyOn(handle, 'addEventListener');
    const hRemove = vi.spyOn(handle, 'removeEventListener');

    const teardown = setupBottomSheet();
    teardown();

    expectAllRemoved(docAdd, docRemove);
    expectAllRemoved(hAdd, hRemove);
  });

  it('tears down the previous wiring when called twice', () => {
    document.body.innerHTML = `
      <div id="bottom-sheet"></div><div id="bottom-sheet-handle"></div><div id="bottom-sheet-overlay"></div>`;
    const docRemove = vi.spyOn(document, 'removeEventListener');
    setupBottomSheet();
    const teardown = setupBottomSheet();
    expect(docRemove.mock.calls.map(([t]) => t)).toEqual(['touchmove', 'touchend']);
    teardown();
  });

  it('returns a no-op teardown when the sheet markup is missing', () => {
    expect(() => setupBottomSheet()()).not.toThrow();
  });
});

describe('setupTouchGestures', () => {
  it('returns a teardown that removes its document listeners', () => {
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    const teardown = setupTouchGestures();
    teardown();
    expectAllRemoved(add, remove);
  });

  it('is idempotent across repeated setup', () => {
    const remove = vi.spyOn(document, 'removeEventListener');
    setupTouchGestures();
    const teardown = setupTouchGestures();
    expect(remove).toHaveBeenCalledTimes(2);
    teardown();
  });
});

describe('TooltipService.detachFromElement', () => {
  it('removes the touchstart handler too', () => {
    const service = new TooltipService();
    const el = document.createElement('button');
    document.body.appendChild(el);
    const add = vi.spyOn(el, 'addEventListener');
    const remove = vi.spyOn(el, 'removeEventListener');

    service.attachToElement(el, { id: 't', target: '#x', title: 'T', content: 'C' } as never);
    service.dispose();

    expectAllRemoved(add, remove);
    expect(add.mock.calls.some(([t]) => t === 'touchstart')).toBe(true);
  });

  it('swaps tooltip-hidden/tooltip-visible so a shown tooltip is not left at opacity 0', () => {
    const service = new TooltipService();
    const el = document.createElement('button');
    document.body.appendChild(el);
    const def = { id: 't', target: '#x', title: 'T', content: 'C' } as never;
    const tip = document.getElementById('neuroviz-tooltip')!;

    service.show(el, def);
    expect(tip.classList.contains('tooltip-hidden')).toBe(false);
    expect(tip.classList.contains('tooltip-visible')).toBe(true);

    service.hide();
    expect(tip.classList.contains('tooltip-hidden')).toBe(true);
    expect(tip.classList.contains('tooltip-visible')).toBe(false);
    service.dispose();
  });
});

describe('MetricsController.dispose', () => {
  it('removes button listeners and unsubscribes from the session', () => {
    const save = document.createElement('button');
    const clear = document.createElement('button');
    const elements = {
      precisionEl: null, recallEl: null, f1El: null, confusionMatrixEmpty: null,
      speedCurrent: null, speedComparisonContainer: null, speedBaseline: null,
      speedComparisonResult: null, saveSpeedBaselineBtn: save, clearSpeedBaselineBtn: clear,
    } as unknown as MetricsElements;
    const unsubscribe = vi.fn();
    const session = { onStateChange: vi.fn(() => unsubscribe), getState: vi.fn() };
    const saveAdd = vi.spyOn(save, 'addEventListener');
    const saveRemove = vi.spyOn(save, 'removeEventListener');
    const clearAdd = vi.spyOn(clear, 'addEventListener');
    const clearRemove = vi.spyOn(clear, 'removeEventListener');

    const controller = new MetricsController(session as never, {} as never, {} as never, elements);
    controller.initialize();
    controller.dispose();

    expectAllRemoved(saveAdd, saveRemove);
    expectAllRemoved(clearAdd, clearRemove);
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('does not stack listeners when initialize() is called twice', () => {
    const session = { onStateChange: vi.fn(() => vi.fn()), getState: vi.fn() };
    const save = document.createElement('button');
    const elements = { saveSpeedBaselineBtn: save } as unknown as MetricsElements;
    const add = vi.spyOn(save, 'addEventListener');
    const remove = vi.spyOn(save, 'removeEventListener');
    const controller = new MetricsController(session as never, {} as never, {} as never, elements);
    controller.initialize();
    controller.initialize();
    expect(add).toHaveBeenCalledTimes(2);
    expect(remove).toHaveBeenCalledTimes(1);
    controller.dispose();
  });
});
