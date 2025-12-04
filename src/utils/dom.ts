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
