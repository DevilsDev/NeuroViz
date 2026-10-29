let teardownBottomSheet: (() => void) | null = null;

/**
 * Wires drag-to-dismiss for the mobile bottom sheet.
 *
 * @returns A teardown function that removes every listener added. Calling
 *          setupBottomSheet() again tears down the previous wiring first.
 */
export function setupBottomSheet(): () => void {
    teardownBottomSheet?.();
    teardownBottomSheet = null;

    const sheet = document.getElementById('bottom-sheet');
    const handle = document.getElementById('bottom-sheet-handle');
    const overlay = document.getElementById('bottom-sheet-overlay');

    if (!sheet || !handle || !overlay) return () => {};

    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    const onTouchStart = (e: TouchEvent): void => {
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            if (touch) {
                startY = touch.clientY;
                isDragging = true;
                sheet.style.transition = 'none';
            }
        }
    };

    const onTouchMove = (e: TouchEvent): void => {
        if (!isDragging) return;
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            if (touch) {
                currentY = touch.clientY;
                const diff = currentY - startY;

                if (diff > 0) {
                    sheet.style.transform = `translateY(${diff}px)`;
                }
            }
        }
    };

    const onTouchEnd = (): void => {
        if (!isDragging) return;
        isDragging = false;
        sheet.style.transition = 'transform 0.3s ease-out';

        const diff = currentY - startY;
        if (diff > 100) {
            // Close sheet
            closeBottomSheet();
        } else {
            // Reset
            sheet.style.transform = 'translateY(0)';
        }
    };

    handle.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd);
    overlay.addEventListener('click', closeBottomSheet);

    const teardown = (): void => {
        handle.removeEventListener('touchstart', onTouchStart);
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
        overlay.removeEventListener('click', closeBottomSheet);
        if (teardownBottomSheet === teardown) teardownBottomSheet = null;
    };
    teardownBottomSheet = teardown;
    return teardown;
}

export function openBottomSheet(): void {
    const sheet = document.getElementById('bottom-sheet');
    const overlay = document.getElementById('bottom-sheet-overlay');

    if (sheet && overlay) {
        sheet.classList.remove('translate-y-full');
        overlay.classList.remove('hidden');
    }
}

export function closeBottomSheet(): void {
    const sheet = document.getElementById('bottom-sheet');
    const overlay = document.getElementById('bottom-sheet-overlay');

    if (sheet && overlay) {
        sheet.classList.add('translate-y-full');
        sheet.style.transform = '';
        overlay.classList.add('hidden');
    }
}
