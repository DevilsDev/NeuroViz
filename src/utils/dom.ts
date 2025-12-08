/**
 * Safe DOM element utilities
 * Provides defensive element access to prevent crashes from missing elements
 */

/**
 * Safely get an element by ID with type checking and logging
 */
export function safeGetElement<T extends HTMLElement>(
    id: string,
    elementType?: string
): T | null {
    const element = document.getElementById(id);

    if (!element) {
        console.warn(`[DOM] Missing element: #${id}${elementType ? ` (expected ${elementType})` : ''}`);
        return null;
    }

    return element as T;
}

/**
 * Get element or throw error if critical
 */
export function getRequiredElement<T extends HTMLElement>(
    id: string,
    elementType?: string
): T {
    const element = safeGetElement<T>(id, elementType);

    if (!element) {
        throw new Error(`Critical element missing: #${id}`);
    }

    return element;
}

/**
 * Batch get elements with validation
 */
export function getElements<T extends Record<string, HTMLElement>>(
    elementMap: Record<keyof T, string>,
    required: (keyof T)[] = []
): Partial<T> {
    const elements: Partial<T> = {};
    const missing: string[] = [];

    for (const [key, id] of Object.entries(elementMap)) {
        const element = document.getElementById(id);

        if (!element) {
            if (required.includes(key as keyof T)) {
                missing.push(id);
            }
            console.warn(`[DOM] Missing element: #${id} (${String(key)})`);
        } else {
            elements[key as keyof T] = element as T[keyof T];
        }
    }

    if (missing.length > 0) {
        throw new Error(`Critical elements missing: ${missing.join(', ')}`);
    }

    return elements;
}

/**
 * Check if element exists without retrieving it
 */
export function elementExists(id: string): boolean {
    return document.getElementById(id) !== null;
}

// =============================================================================
// Visibility & Interactivity Helpers
// =============================================================================

/**
 * Sets the visibility of an element using Tailwind's 'hidden' class.
 * Tolerant of null/undefined elements for test environments.
 * 
 * @param element - The element to show/hide (can be null)
 * @param visible - Whether the element should be visible
 */
export function setVisible(element: HTMLElement | null | undefined, visible: boolean): void {
    if (!element) return;
    element.classList.toggle('hidden', !visible);
}

/**
 * Sets the enabled state of a button or input element.
 * Applies consistent styling for disabled state.
 * 
 * @param element - The element to enable/disable (can be null)
 * @param enabled - Whether the element should be enabled
 */
export function setEnabled(
    element: HTMLButtonElement | HTMLInputElement | HTMLSelectElement | null | undefined,
    enabled: boolean
): void {
    if (!element) return;
    element.disabled = !enabled;
    element.classList.toggle('opacity-50', !enabled);
    element.classList.toggle('pointer-events-none', !enabled);
}

/**
 * Sets both visibility and enabled state for an interactive element.
 * 
 * @param element - The element to configure
 * @param options - Configuration options
 */
export function setInteractive(
    element: HTMLButtonElement | HTMLInputElement | HTMLSelectElement | null | undefined,
    options: { visible?: boolean; enabled?: boolean }
): void {
    if (!element) return;
    if (options.visible !== undefined) {
        setVisible(element, options.visible);
    }
    if (options.enabled !== undefined) {
        setEnabled(element, options.enabled);
    }
}

/**
 * Adds a CSS class indicating active/training state with animation.
 * 
 * @param element - The element to animate
 * @param active - Whether the element should show active state
 * @param className - The class to toggle (default: 'training')
 */
export function setActiveState(
    element: HTMLElement | null | undefined,
    active: boolean,
    className = 'training'
): void {
    if (!element) return;
    element.classList.toggle(className, active);
}
