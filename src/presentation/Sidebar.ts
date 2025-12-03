export function setupSidebarTabs(): void {
    const tabs = document.querySelectorAll('.sidebar-tab');
    const panels = document.querySelectorAll('.sidebar-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.getAttribute('data-target');
            if (!targetId) return;

            // Update active tab
            tabs.forEach(t => t.classList.remove('active', 'bg-navy-700', 'text-white'));
            tab.classList.add('active', 'bg-navy-700', 'text-white');

            // Show target panel
            panels.forEach(panel => {
                if (panel.id === targetId) {
                    panel.classList.remove('hidden');
                } else {
                    panel.classList.add('hidden');
                }
            });
        });
    });
}
