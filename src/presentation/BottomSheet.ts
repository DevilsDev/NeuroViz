export function setupBottomSheet(): void {
    const sheet = document.getElementById('bottom-sheet');
    const handle = document.getElementById('bottom-sheet-handle');
    const overlay = document.getElementById('bottom-sheet-overlay');

    if (!sheet || !handle || !overlay) return;

    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    handle.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            if (touch) {
                startY = touch.clientY;
                isDragging = true;
                sheet.style.transition = 'none';
            }
        }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
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
    }, { passive: true });

    document.addEventListener('touchend', () => {
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
    });

    overlay.addEventListener('click', closeBottomSheet);
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
