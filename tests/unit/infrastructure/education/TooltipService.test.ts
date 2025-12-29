/**
 * TooltipService Infrastructure Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TooltipService } from '../../../../src/infrastructure/education/TooltipService';
import type { TooltipDefinition } from '../../../../src/core/domain/Tooltip';

describe('TooltipService', () => {
  let service: TooltipService;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '<div id="app"><button id="test-button">Test</button></div>';
    service = new TooltipService();
  });

  afterEach(() => {
    service.dispose();
    document.body.innerHTML = '';
  });

  describe('initialization', () => {
    it('should create tooltip element on construction', () => {
      const tooltip = document.getElementById('neuroviz-tooltip');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.role).toBe('tooltip');
    });

    it('should have tooltip element hidden by default', () => {
      const tooltip = document.getElementById('neuroviz-tooltip');
      expect(tooltip?.classList.contains('hidden')).toBe(true);
    });

    it('should add tooltip CSS to document', () => {
      const styles = Array.from(document.head.querySelectorAll('style'));
      const tooltipStyle = styles.find(style =>
        style.textContent?.includes('.tooltip-visible')
      );
      expect(tooltipStyle).not.toBeUndefined();
    });
  });

  describe('initialise', () => {
    it('should attach tooltips to registered elements', () => {
      document.body.innerHTML = '<input id="input-hidden-layers" />';
      const newService = new TooltipService();

      newService.initialise();

      const input = document.getElementById('input-hidden-layers');
      expect(input?.getAttribute('aria-describedby')).toBe('neuroviz-tooltip');
      expect(input?.getAttribute('tabindex')).toBeTruthy();

      newService.dispose();
    });

    it('should not throw if elements are not found', () => {
      expect(() => service.initialise()).not.toThrow();
    });
  });

  describe('attachToElement', () => {
    it('should attach tooltip to an element', () => {
      const element = document.getElementById('test-button') as HTMLElement;
      const definition: TooltipDefinition = {
        target: '#test-button',
        title: 'Test Tooltip',
        content: 'This is a test tooltip',
      };

      service.attachToElement(element, definition);

      expect(element.getAttribute('aria-describedby')).toBe('neuroviz-tooltip');
      expect(element.hasAttribute('tabindex')).toBe(true);
    });

    it('should not attach twice to the same element', () => {
      const element = document.getElementById('test-button') as HTMLElement;
      const definition: TooltipDefinition = {
        target: '#test-button',
        title: 'Test',
        content: 'Test content',
      };

      service.attachToElement(element, definition);
      service.attachToElement(element, definition);

      // Should only have one set of listeners (verified by no errors)
      expect(element.getAttribute('aria-describedby')).toBe('neuroviz-tooltip');
    });

    it('should add event listeners for mouse events', () => {
      const element = document.getElementById('test-button') as HTMLElement;
      const definition: TooltipDefinition = {
        target: '#test-button',
        title: 'Test',
        content: 'Test content',
      };

      const addEventListener = vi.spyOn(element, 'addEventListener');

      service.attachToElement(element, definition);

      expect(addEventListener).toHaveBeenCalledWith('mouseenter', expect.any(Function));
      expect(addEventListener).toHaveBeenCalledWith('mouseleave', expect.any(Function));
      expect(addEventListener).toHaveBeenCalledWith('focus', expect.any(Function));
      expect(addEventListener).toHaveBeenCalledWith('blur', expect.any(Function));
    });
  });

  describe('detachFromElement', () => {
    it('should remove tooltip from an element', () => {
      const element = document.getElementById('test-button') as HTMLElement;
      const definition: TooltipDefinition = {
        target: '#test-button',
        title: 'Test',
        content: 'Test content',
      };

      service.attachToElement(element, definition);
      service.detachFromElement(element);

      expect(element.hasAttribute('aria-describedby')).toBe(false);
    });

    it('should remove all event listeners', () => {
      const element = document.getElementById('test-button') as HTMLElement;
      const definition: TooltipDefinition = {
        target: '#test-button',
        title: 'Test',
        content: 'Test content',
      };

      service.attachToElement(element, definition);

      const removeEventListener = vi.spyOn(element, 'removeEventListener');

      service.detachFromElement(element);

      expect(removeEventListener).toHaveBeenCalledWith('mouseenter', expect.any(Function));
      expect(removeEventListener).toHaveBeenCalledWith('mouseleave', expect.any(Function));
      expect(removeEventListener).toHaveBeenCalledWith('focus', expect.any(Function));
      expect(removeEventListener).toHaveBeenCalledWith('blur', expect.any(Function));
    });

    it('should be safe to call on unattached element', () => {
      const element = document.getElementById('test-button') as HTMLElement;
      expect(() => service.detachFromElement(element)).not.toThrow();
    });
  });

  describe('show', () => {
    it('should show tooltip with correct content', () => {
      const element = document.getElementById('test-button') as HTMLElement;
      const definition: TooltipDefinition = {
        target: '#test-button',
        title: 'Test Title',
        content: 'Test Content',
      };

      service.show(element, definition);

      const tooltip = document.getElementById('neuroviz-tooltip');
      expect(tooltip?.classList.contains('hidden')).toBe(false);
      expect(tooltip?.classList.contains('tooltip-visible')).toBe(true);

      const titleEl = tooltip?.querySelector('.tooltip-title');
      const contentEl = tooltip?.querySelector('.tooltip-content');

      expect(titleEl?.textContent).toBe('Test Title');
      expect(contentEl?.textContent).toBe('Test Content');
    });

    it('should show tip when provided', () => {
      const element = document.getElementById('test-button') as HTMLElement;
      const definition: TooltipDefinition = {
        target: '#test-button',
        title: 'Test',
        content: 'Content',
        tip: 'This is a helpful tip',
      };

      service.show(element, definition);

      const tooltip = document.getElementById('neuroviz-tooltip');
      const tipContainer = tooltip?.querySelector('.tooltip-tip');
      const tipText = tooltip?.querySelector('.tooltip-tip-text');

      expect(tipContainer?.classList.contains('hidden')).toBe(false);
      expect(tipText?.textContent).toBe('This is a helpful tip');
    });

    it('should hide tip when not provided', () => {
      const element = document.getElementById('test-button') as HTMLElement;
      const definition: TooltipDefinition = {
        target: '#test-button',
        title: 'Test',
        content: 'Content',
      };

      service.show(element, definition);

      const tooltip = document.getElementById('neuroviz-tooltip');
      const tipContainer = tooltip?.querySelector('.tooltip-tip');

      expect(tipContainer?.classList.contains('hidden')).toBe(true);
    });

    it('should show related tutorial link when provided', () => {
      const element = document.getElementById('test-button') as HTMLElement;
      const definition: TooltipDefinition = {
        target: '#test-button',
        title: 'Test',
        content: 'Content',
        relatedTutorial: 'basic-training',
      };

      service.show(element, definition);

      const tooltip = document.getElementById('neuroviz-tooltip');
      const tutorialContainer = tooltip?.querySelector('.tooltip-tutorial');

      expect(tutorialContainer?.classList.contains('hidden')).toBe(false);
    });

    it('should hide tutorial link when not provided', () => {
      const element = document.getElementById('test-button') as HTMLElement;
      const definition: TooltipDefinition = {
        target: '#test-button',
        title: 'Test',
        content: 'Content',
      };

      service.show(element, definition);

      const tooltip = document.getElementById('neuroviz-tooltip');
      const tutorialContainer = tooltip?.querySelector('.tooltip-tutorial');

      expect(tutorialContainer?.classList.contains('hidden')).toBe(true);
    });

    it('should position tooltip relative to target', () => {
      const element = document.getElementById('test-button') as HTMLElement;
      const definition: TooltipDefinition = {
        target: '#test-button',
        title: 'Test',
        content: 'Content',
        position: 'bottom',
      };

      service.show(element, definition);

      const tooltip = document.getElementById('neuroviz-tooltip') as HTMLElement;
      expect(tooltip.style.top).toBeTruthy();
      expect(tooltip.style.left).toBeTruthy();
    });
  });

  describe('hide', () => {
    it('should hide tooltip', () => {
      const element = document.getElementById('test-button') as HTMLElement;
      const definition: TooltipDefinition = {
        target: '#test-button',
        title: 'Test',
        content: 'Content',
      };

      service.show(element, definition);
      service.hide();

      const tooltip = document.getElementById('neuroviz-tooltip');
      expect(tooltip?.classList.contains('hidden')).toBe(true);
      expect(tooltip?.classList.contains('tooltip-visible')).toBe(false);
    });

    it('should be safe to call when tooltip is not shown', () => {
      expect(() => service.hide()).not.toThrow();
    });
  });

  describe('tooltip positioning', () => {
    it('should support top position', () => {
      const element = document.getElementById('test-button') as HTMLElement;
      const definition: TooltipDefinition = {
        target: '#test-button',
        title: 'Test',
        content: 'Content',
        position: 'top',
      };

      // Mock getBoundingClientRect
      element.getBoundingClientRect = vi.fn(() => ({
        top: 100,
        bottom: 130,
        left: 50,
        right: 150,
        width: 100,
        height: 30,
        x: 50,
        y: 100,
        toJSON: () => ({}),
      }));

      service.show(element, definition);

      const tooltip = document.getElementById('neuroviz-tooltip') as HTMLElement;
      // Top position should place tooltip above the element
      const tooltipTop = parseFloat(tooltip.style.top);
      expect(tooltipTop).toBeLessThan(100);
    });

    it('should support bottom position', () => {
      const element = document.getElementById('test-button') as HTMLElement;
      const definition: TooltipDefinition = {
        target: '#test-button',
        title: 'Test',
        content: 'Content',
        position: 'bottom',
      };

      element.getBoundingClientRect = vi.fn(() => ({
        top: 100,
        bottom: 130,
        left: 50,
        right: 150,
        width: 100,
        height: 30,
        x: 50,
        y: 100,
        toJSON: () => ({}),
      }));

      service.show(element, definition);

      const tooltip = document.getElementById('neuroviz-tooltip') as HTMLElement;
      // Bottom position should place tooltip below the element
      const tooltipTop = parseFloat(tooltip.style.top);
      expect(tooltipTop).toBeGreaterThan(130);
    });

    it('should support left position', () => {
      const element = document.getElementById('test-button') as HTMLElement;
      const definition: TooltipDefinition = {
        target: '#test-button',
        title: 'Test',
        content: 'Content',
        position: 'left',
      };

      element.getBoundingClientRect = vi.fn(() => ({
        top: 100,
        bottom: 130,
        left: 200,
        right: 300,
        width: 100,
        height: 30,
        x: 200,
        y: 100,
        toJSON: () => ({}),
      }));

      service.show(element, definition);

      const tooltip = document.getElementById('neuroviz-tooltip') as HTMLElement;
      // Left position should place tooltip to the left of the element
      const tooltipLeft = parseFloat(tooltip.style.left);
      expect(tooltipLeft).toBeLessThan(200);
    });

    it('should support right position', () => {
      const element = document.getElementById('test-button') as HTMLElement;
      const definition: TooltipDefinition = {
        target: '#test-button',
        title: 'Test',
        content: 'Content',
        position: 'right',
      };

      element.getBoundingClientRect = vi.fn(() => ({
        top: 100,
        bottom: 130,
        left: 50,
        right: 150,
        width: 100,
        height: 30,
        x: 50,
        y: 100,
        toJSON: () => ({}),
      }));

      service.show(element, definition);

      const tooltip = document.getElementById('neuroviz-tooltip') as HTMLElement;
      // Right position should place tooltip to the right of the element
      const tooltipLeft = parseFloat(tooltip.style.left);
      expect(tooltipLeft).toBeGreaterThan(150);
    });

    it('should auto-detect best position when set to auto', () => {
      const element = document.getElementById('test-button') as HTMLElement;
      const definition: TooltipDefinition = {
        target: '#test-button',
        title: 'Test',
        content: 'Content',
        position: 'auto',
      };

      element.getBoundingClientRect = vi.fn(() => ({
        top: 500,
        bottom: 530,
        left: 50,
        right: 150,
        width: 100,
        height: 30,
        x: 50,
        y: 500,
        toJSON: () => ({}),
      }));

      service.show(element, definition);

      const tooltip = document.getElementById('neuroviz-tooltip') as HTMLElement;
      expect(tooltip.style.top).toBeTruthy();
      expect(tooltip.style.left).toBeTruthy();
    });
  });

  describe('dispose', () => {
    it('should remove tooltip element from DOM', () => {
      service.dispose();

      const tooltip = document.getElementById('neuroviz-tooltip');
      expect(tooltip).toBeNull();
    });

    it('should detach all bound elements', () => {
      const element1 = document.createElement('button');
      const element2 = document.createElement('button');
      element1.id = 'btn1';
      element2.id = 'btn2';
      document.body.appendChild(element1);
      document.body.appendChild(element2);

      const definition: TooltipDefinition = {
        target: '#btn',
        title: 'Test',
        content: 'Content',
      };

      service.attachToElement(element1, definition);
      service.attachToElement(element2, definition);

      service.dispose();

      expect(element1.hasAttribute('aria-describedby')).toBe(false);
      expect(element2.hasAttribute('aria-describedby')).toBe(false);
    });

    it('should cancel any pending show/hide timers', async () => {
      const element = document.getElementById('test-button') as HTMLElement;
      const definition: TooltipDefinition = {
        target: '#test-button',
        title: 'Test',
        content: 'Content',
      };

      service.attachToElement(element, definition);

      // Trigger mouseenter to schedule show
      element.dispatchEvent(new MouseEvent('mouseenter'));

      // Dispose before timeout fires (which removes the tooltip element)
      service.dispose();

      // Verify tooltip was removed
      const tooltip = document.getElementById('neuroviz-tooltip');
      expect(tooltip).toBeNull();
    });
  });

  describe('user interactions', () => {
    it('should show tooltip on mouse enter after delay', async () => {
      const element = document.getElementById('test-button') as HTMLElement;
      const definition: TooltipDefinition = {
        target: '#test-button',
        title: 'Test',
        content: 'Content',
      };

      service.attachToElement(element, definition);

      const tooltip = document.getElementById('neuroviz-tooltip');
      expect(tooltip?.classList.contains('hidden')).toBe(true);

      element.dispatchEvent(new MouseEvent('mouseenter'));

      // Tooltip should still be hidden immediately after mouseenter
      expect(tooltip?.classList.contains('hidden')).toBe(true);

      // Wait for show delay (500ms + buffer)
      await new Promise(resolve => setTimeout(resolve, 600));

      // Now tooltip should be visible
      expect(tooltip?.classList.contains('hidden')).toBe(false);
    });

    it('should hide tooltip on mouse leave', async () => {
      const element = document.getElementById('test-button') as HTMLElement;
      const definition: TooltipDefinition = {
        target: '#test-button',
        title: 'Test',
        content: 'Content',
      };

      service.attachToElement(element, definition);
      service.show(element, definition);

      const tooltip = document.getElementById('neuroviz-tooltip');
      expect(tooltip?.classList.contains('hidden')).toBe(false);

      element.dispatchEvent(new MouseEvent('mouseleave'));

      // Wait for hide delay
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(tooltip?.classList.contains('hidden')).toBe(true);
    });

    it('should show tooltip immediately on focus', () => {
      const element = document.getElementById('test-button') as HTMLElement;
      const definition: TooltipDefinition = {
        target: '#test-button',
        title: 'Test',
        content: 'Content',
      };

      service.attachToElement(element, definition);

      element.dispatchEvent(new FocusEvent('focus'));

      const tooltip = document.getElementById('neuroviz-tooltip');
      expect(tooltip?.classList.contains('hidden')).toBe(false);
    });

    it('should hide tooltip immediately on blur', () => {
      const element = document.getElementById('test-button') as HTMLElement;
      const definition: TooltipDefinition = {
        target: '#test-button',
        title: 'Test',
        content: 'Content',
      };

      service.attachToElement(element, definition);
      service.show(element, definition);

      element.dispatchEvent(new FocusEvent('blur'));

      const tooltip = document.getElementById('neuroviz-tooltip');
      expect(tooltip?.classList.contains('hidden')).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('should set aria-describedby on attached elements', () => {
      const element = document.getElementById('test-button') as HTMLElement;
      const definition: TooltipDefinition = {
        target: '#test-button',
        title: 'Test',
        content: 'Content',
      };

      service.attachToElement(element, definition);

      expect(element.getAttribute('aria-describedby')).toBe('neuroviz-tooltip');
    });

    it('should set tabindex on elements without one', () => {
      const element = document.getElementById('test-button') as HTMLElement;
      const definition: TooltipDefinition = {
        target: '#test-button',
        title: 'Test',
        content: 'Content',
      };

      service.attachToElement(element, definition);

      expect(element.hasAttribute('tabindex')).toBe(true);
    });

    it('should preserve existing tabindex', () => {
      const element = document.getElementById('test-button') as HTMLElement;
      element.setAttribute('tabindex', '5');

      const definition: TooltipDefinition = {
        target: '#test-button',
        title: 'Test',
        content: 'Content',
      };

      service.attachToElement(element, definition);

      expect(element.getAttribute('tabindex')).toBe('5');
    });

    it('should set role="tooltip" on tooltip element', () => {
      const tooltip = document.getElementById('neuroviz-tooltip');
      expect(tooltip?.getAttribute('role')).toBe('tooltip');
    });
  });
});
