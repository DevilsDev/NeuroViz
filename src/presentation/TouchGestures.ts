let teardownTouchGestures: (() => void) | null = null;

/**
 * Emits swipe-left/right/up/down CustomEvents on document.
 *
 * @returns A teardown function that removes the listeners. Calling
 *          setupTouchGestures() again tears down the previous wiring first.
 */
export function setupTouchGestures(): () => void {
    teardownTouchGestures?.();
    teardownTouchGestures = null;

    let touchStartX = 0;
    let touchStartY = 0;

    const onTouchStart = (e: TouchEvent): void => {
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            if (touch) {
                touchStartX = touch.screenX;
                touchStartY = touch.screenY;
            }
        }
    };

    const onTouchEnd = (e: TouchEvent): void => {
        if (e.changedTouches.length > 0) {
            const touch = e.changedTouches[0];
            if (touch) {
                const touchEndX = touch.screenX;
                const touchEndY = touch.screenY;
                handleGesture(touchStartX, touchStartY, touchEndX, touchEndY);
            }
        }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });

    const teardown = (): void => {
        document.removeEventListener('touchstart', onTouchStart);
        document.removeEventListener('touchend', onTouchEnd);
        if (teardownTouchGestures === teardown) teardownTouchGestures = null;
    };
    teardownTouchGestures = teardown;
    return teardown;
}

function handleGesture(startX: number, startY: number, endX: number, endY: number): void {
    const diffX = endX - startX;
    const diffY = endY - startY;
    const threshold = 50;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if (Math.abs(diffX) > threshold) {
            if (diffX > 0) {
                // Swipe Right
                document.dispatchEvent(new CustomEvent('swipe-right'));
            } else {
                // Swipe Left
                document.dispatchEvent(new CustomEvent('swipe-left'));
            }
        }
    } else {
        // Vertical swipe
        if (Math.abs(diffY) > threshold) {
            if (diffY > 0) {
                // Swipe Down
                document.dispatchEvent(new CustomEvent('swipe-down'));
            } else {
                // Swipe Up
                document.dispatchEvent(new CustomEvent('swipe-up'));
            }
        }
    }
}
