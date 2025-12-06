/**
 * KeyboardShortcuts - Global keyboard shortcuts handler
 *
 * Provides keyboard shortcuts for common actions:
 * - Space: Start/Pause training
 * - S: Step
 * - R: Reset
 * - Esc: Pause
 * - F: Toggle fullscreen
 * - ?: Toggle help modal
 */

export interface KeyboardShortcutsCallbacks {
    onStartPause: () => void;
    onStep: () => void;
    onReset: () => void;
    onPause: () => void;
    onToggleFullscreen: () => void;
    onToggleHelp: () => void;
}

export class KeyboardShortcuts {
    private enabled = true;
    private callbacks: KeyboardShortcutsCallbacks;
    private boundHandler: (e: KeyboardEvent) => void;

    constructor(callbacks: KeyboardShortcutsCallbacks) {
        this.callbacks = callbacks;
        // Store bound handler reference for proper cleanup
        this.boundHandler = (e: KeyboardEvent) => this.handleKeydown(e);
        this.bindEvents();
    }

    private bindEvents(): void {
        document.addEventListener('keydown', this.boundHandler);
    }

    /**
     * Remove event listener and clean up resources.
     * Call this when the keyboard shortcuts are no longer needed.
     */
    public dispose(): void {
        document.removeEventListener('keydown', this.boundHandler);
        this.enabled = false;
    }

    private handleKeydown(e: KeyboardEvent): void {
        // Don't trigger shortcuts if user is typing in an input field
        if (this.isTyping(e.target as Element)) {
            return;
        }

        // Don't trigger shortcuts if disabled
        if (!this.enabled) {
            return;
        }

        const key = e.key.toLowerCase();

        switch (key) {
            case ' ':
                e.preventDefault();
                this.callbacks.onStartPause();
                break;

            case 's':
                e.preventDefault();
                this.callbacks.onStep();
                break;

            case 'r':
                e.preventDefault();
                this.callbacks.onReset();
                break;

            case 'escape':
                e.preventDefault();
                this.callbacks.onPause();
                break;

            case 'f':
                e.preventDefault();
                this.callbacks.onToggleFullscreen();
                break;

            case '?':
                e.preventDefault();
                this.callbacks.onToggleHelp();
                break;
        }
    }

    /**
     * Check if the user is currently typing in an input field
     */
    private isTyping(target: Element | null): boolean {
        if (!target || !target.tagName) return false;

        const tagName = target.tagName.toLowerCase();
        const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';
        const isContentEditable = target.getAttribute('contenteditable') === 'true';

        return isInput || isContentEditable;
    }

    /**
     * Enable keyboard shortcuts
     */
    public enable(): void {
        this.enabled = true;
    }

    /**
     * Disable keyboard shortcuts
     */
    public disable(): void {
        this.enabled = false;
    }

    /**
     * Check if keyboard shortcuts are enabled
     */
    public isEnabled(): boolean {
        return this.enabled;
    }
}