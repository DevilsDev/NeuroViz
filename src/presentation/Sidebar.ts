export function setupSidebarTabs(): void {
    const tabs = document.querySelectorAll('.sidebar-tab');
    const panels = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.getAttribute('data-tab');
            if (!targetId) return;

            // Update active tab styling
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update aria-selected for accessibility
            tabs.forEach(t => t.setAttribute('aria-selected', 'false'));
            tab.setAttribute('aria-selected', 'true');

            // Show only the target panel (CSS handles display:none/flex via .active class)
            panels.forEach(panel => {
                const panelTarget = panel.getAttribute('data-tab-content');
                if (panelTarget === targetId) {
                    panel.classList.add('active');
                } else {
                    panel.classList.remove('active');
                }
            });
        });
    });
}


