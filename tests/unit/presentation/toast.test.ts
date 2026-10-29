import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { showPersistentBanner, clearPersistentBanner } from '../../../src/presentation/toast';

describe('Persistent Banner helpers', () => {
  let banner: HTMLDivElement;

  beforeEach(() => {
    banner = document.createElement('div');
    banner.id = 'test-banner';
    banner.classList.add('hidden');
    document.body.appendChild(banner);
  });

  afterEach(() => {
    banner.remove();
  });

  it('showPersistentBanner removes hidden class', () => {
    showPersistentBanner('test-banner');
    expect(banner.classList.contains('hidden')).toBe(false);
  });

  it('showPersistentBanner sets the message as text, never as HTML', () => {
    showPersistentBanner('test-banner', 'Something went <img src=x onerror="alert(1)">');
    expect(banner.textContent).toBe('Something went <img src=x onerror="alert(1)">');
    expect(banner.querySelector('img')).toBeNull();
    expect(banner.classList.contains('hidden')).toBe(false);
  });

  it('showPersistentBanner is a no-op for non-existent id', () => {
    // Should not throw
    showPersistentBanner('does-not-exist');
  });

  it('clearPersistentBanner adds hidden class', () => {
    banner.classList.remove('hidden');
    clearPersistentBanner('test-banner');
    expect(banner.classList.contains('hidden')).toBe(true);
  });

  it('clearPersistentBanner is a no-op for non-existent id', () => {
    clearPersistentBanner('does-not-exist');
  });
});
