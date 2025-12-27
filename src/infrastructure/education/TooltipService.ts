/**
 * Tooltip Service
 * 
 * Manages contextual tooltips for UI controls.
 * Provides accessible, non-intrusive explanations on hover/focus.
 */

import {
  TooltipDefinition,
  getAllTooltips,
  getTooltipForTarget,
} from '../../core/domain/Tooltip';

interface TooltipState {
  isVisible: boolean;
  currentTarget: HTMLElement | null;
  currentDefinition: TooltipDefinition | null;
}

/**
 * Service for managing educational tooltips
 */
export class TooltipService {
  private state: TooltipState = {
    isVisible: false,
    currentTarget: null,
    currentDefinition: null,
  };

  private tooltipElement: HTMLElement | null = null;
  private showTimeout: number | null = null;
  private hideTimeout: number | null = null;
  private boundListeners: Map<HTMLElement, { enter: () => void; leave: () => void; focus: () => void; blur: () => void }> = new Map();

  /** Delay before showing tooltip (ms) */
  private showDelay = 500;
  /** Delay before hiding tooltip (ms) */
  private hideDelay = 100;

  constructor() {
    this.createTooltipElement();
  }

  /**
   * Initialises tooltips for all registered targets
   */
  initialise(): void {
    const tooltips = getAllTooltips();

    for (const tooltip of tooltips) {
      const element = document.querySelector(tooltip.target) as HTMLElement;
      if (element) {
        this.attachToElement(element, tooltip);
      }
    }

    // Also attach to elements with data-tooltip attribute
    const dataTooltipElements = document.querySelectorAll('[data-tooltip]');
    dataTooltipElements.forEach(el => {
      const target = el.id ? `#${el.id}` : el.getAttribute('data-tooltip');
      if (target) {
        const tooltip = getTooltipForTarget(target);
        if (tooltip) {
          this.attachToElement(el as HTMLElement, tooltip);
        }
      }
    });
  }

  /**
   * Attaches tooltip behaviour to an element
   */
  attachToElement(element: HTMLElement, definition: TooltipDefinition): void {
    // Skip if already attached
    if (this.boundListeners.has(element)) return;

    // Add accessibility attributes
    element.setAttribute('aria-describedby', 'neuroviz-tooltip');
    element.setAttribute('tabindex', element.getAttribute('tabindex') ?? '0');
    const enter = (): void => this.scheduleShow(element, definition);
    const leave = (): void => this.scheduleHide();
    const focus = (): void => this.show(element, definition);
    const blur = (): void => this.hide();

    element.addEventListener('mouseenter', enter);
    element.addEventListener('mouseleave', leave);
    element.addEventListener('focus', focus);
    element.addEventListener('blur', blur);

    // Touch support - tap to toggle
    element.addEventListener('touchstart', (e) => {
      if (this.state.currentTarget === element && this.state.isVisible) {
        this.hide();
      } else {
        e.preventDefault();
        this.show(element, definition);
      }
    }, { passive: false });

    this.boundListeners.set(element, { enter, leave, focus, blur });
  }

  /**
   * Detaches tooltip behaviour from an element
   */
  detachFromElement(element: HTMLElement): void {
    const listeners = this.boundListeners.get(element);
    if (!listeners) return;

    element.removeEventListener('mouseenter', listeners.enter);
    element.removeEventListener('mouseleave', listeners.leave);
    element.removeEventListener('focus', listeners.focus);
    element.removeEventListener('blur', listeners.blur);
    element.removeAttribute('aria-describedby');

    this.boundListeners.delete(element);
  }

  /**
   * Shows tooltip for a specific element
   */
  show(target: HTMLElement, definition: TooltipDefinition): void {
    this.cancelTimers();

    this.state = {
      isVisible: true,
      currentTarget: target,
      currentDefinition: definition,
    };

    this.renderTooltip(definition);
    this.positionTooltip(target, definition.position ?? 'auto');
    this.tooltipElement?.classList.remove('hidden');
    this.tooltipElement?.classList.add('tooltip-visible');
  }

  /**
   * Hides the tooltip
   */
  hide(): void {
    this.cancelTimers();

    this.state = {
      isVisible: false,
      currentTarget: null,
      currentDefinition: null,
    };

    this.tooltipElement?.classList.add('hidden');
    this.tooltipElement?.classList.remove('tooltip-visible');
  }

  /**
   * Disposes the service
   */
  dispose(): void {
    this.cancelTimers();

    // Remove all listeners
    for (const [element] of this.boundListeners) {
      this.detachFromElement(element);
    }

    // Remove tooltip element
    if (this.tooltipElement?.parentNode) {
      this.tooltipElement.parentNode.removeChild(this.tooltipElement);
    }
  }

  // =========================================================================
  // Private Methods
  // =========================================================================

  private createTooltipElement(): void {
    this.tooltipElement = document.createElement('div');
    this.tooltipElement.id = 'neuroviz-tooltip';
    this.tooltipElement.role = 'tooltip';
    this.tooltipElement.className = `
      fixed z-[200] max-w-xs p-3 rounded-lg shadow-xl
      bg-navy-900 border border-cyan-500/30
      text-sm text-slate-300
      pointer-events-none
      hidden
      transition-opacity duration-150
      tooltip-hidden
    `.trim().replace(/\s+/g, ' ');

    this.tooltipElement.innerHTML = `
      <div class="tooltip-title font-bold text-white mb-1"></div>
      <div class="tooltip-content text-slate-300 text-xs leading-relaxed"></div>
      <div class="tooltip-tip hidden mt-2 pt-2 border-t border-white/10">
        <div class="flex items-start gap-1.5">
          <span class="text-cyan-400 text-[10px]">💡</span>
          <span class="tooltip-tip-text text-[10px] text-cyan-300"></span>
        </div>
      </div>
      <div class="tooltip-tutorial hidden mt-2">
        <button class="tooltip-tutorial-link text-[10px] text-cyan-400 hover:text-cyan-300 underline">
          Learn more →
        </button>
      </div>
      <div class="tooltip-arrow absolute w-2 h-2 bg-navy-900 border-cyan-500/30 transform rotate-45"></div>
    `;

    document.body.appendChild(this.tooltipElement);

    // Handle tutorial link clicks
    const tutorialLink = this.tooltipElement.querySelector('.tooltip-tutorial-link');
    tutorialLink?.addEventListener('click', () => {
      if (this.state.currentDefinition?.relatedTutorial) {
        // Dispatch custom event for tutorial start
        window.dispatchEvent(new CustomEvent('start-tutorial', {
          detail: { tutorialId: this.state.currentDefinition.relatedTutorial }
        }));
        this.hide();
      }
    });
  }

  private renderTooltip(definition: TooltipDefinition): void {
    if (!this.tooltipElement) return;

    const title = this.tooltipElement.querySelector('.tooltip-title');
    const content = this.tooltipElement.querySelector('.tooltip-content');
    const tipContainer = this.tooltipElement.querySelector('.tooltip-tip');
    const tipText = this.tooltipElement.querySelector('.tooltip-tip-text');
    const tutorialContainer = this.tooltipElement.querySelector('.tooltip-tutorial');

    if (title) title.textContent = definition.title;
    if (content) content.textContent = definition.content;

    if (tipContainer && tipText) {
      if (definition.tip) {
        tipContainer.classList.remove('hidden');
        tipText.textContent = definition.tip;
      } else {
        tipContainer.classList.add('hidden');
      }
    }

    if (tutorialContainer) {
      if (definition.relatedTutorial) {
        tutorialContainer.classList.remove('hidden');
      } else {
        tutorialContainer.classList.add('hidden');
      }
    }
  }

  private positionTooltip(target: HTMLElement, preferredPosition: TooltipDefinition['position']): void {
    if (!this.tooltipElement) return;

    const targetRect = target.getBoundingClientRect();
    const tooltipRect = this.tooltipElement.getBoundingClientRect();
    const arrow = this.tooltipElement.querySelector('.tooltip-arrow') as HTMLElement;

    const padding = 8;
    const arrowSize = 8;

    let position = preferredPosition;
    if (position === 'auto') {
      // Determine best position based on available space
      const spaceAbove = targetRect.top;
      const spaceBelow = window.innerHeight - targetRect.bottom;
      const _spaceLeft = targetRect.left;
      const spaceRight = window.innerWidth - targetRect.right;

      if (spaceBelow >= tooltipRect.height + padding) {
        position = 'bottom';
      } else if (spaceAbove >= tooltipRect.height + padding) {
        position = 'top';
      } else if (spaceRight >= tooltipRect.width + padding) {
        position = 'right';
      } else {
        position = 'left';
      }
    }

    let top = 0;
    let left = 0;
    let arrowTop = '';
    let arrowLeft = '';
    let arrowBorder = '';

    switch (position) {
      case 'top':
        top = targetRect.top - tooltipRect.height - padding - arrowSize;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        arrowTop = '100%';
        arrowLeft = '50%';
        arrowBorder = 'border-b border-r';
        break;
      case 'bottom':
        top = targetRect.bottom + padding + arrowSize;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        arrowTop = `-${arrowSize / 2}px`;
        arrowLeft = '50%';
        arrowBorder = 'border-t border-l';
        break;
      case 'left':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.left - tooltipRect.width - padding - arrowSize;
        arrowTop = '50%';
        arrowLeft = '100%';
        arrowBorder = 'border-t border-r';
        break;
      case 'right':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.right + padding + arrowSize;
        arrowTop = '50%';
        arrowLeft = `-${arrowSize / 2}px`;
        arrowBorder = 'border-b border-l';
        break;
    }

    // Clamp to viewport
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));

    this.tooltipElement.style.top = `${top}px`;
    this.tooltipElement.style.left = `${left}px`;

    if (arrow) {
      arrow.style.top = arrowTop;
      arrow.style.left = arrowLeft;
      arrow.style.transform = `translate(-50%, -50%) rotate(45deg)`;
      arrow.className = `tooltip-arrow absolute w-2 h-2 bg-navy-900 ${arrowBorder} transform`;
    }
  }

  private scheduleShow(target: HTMLElement, definition: TooltipDefinition): void {
    this.cancelTimers();
    this.showTimeout = window.setTimeout(() => {
      this.show(target, definition);
    }, this.showDelay);
  }

  private scheduleHide(): void {
    this.cancelTimers();
    this.hideTimeout = window.setTimeout(() => {
      this.hide();
    }, this.hideDelay);
  }

  private cancelTimers(): void {
    if (this.showTimeout !== null) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
    if (this.hideTimeout !== null) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }
}

// Add tooltip CSS
const tooltipStyle = document.createElement('style');
tooltipStyle.textContent = `
  .tooltip-visible {
    opacity: 1;
  }
  .tooltip-hidden {
    opacity: 0;
  }
  #neuroviz-tooltip {
    transition: opacity 0.15s ease-in-out;
  }
`;
document.head.appendChild(tooltipStyle);
