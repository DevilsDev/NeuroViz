import { tutorialManager } from './Tutorial';
import { logger } from '../infrastructure/logging/Logger';

export function setupOnboardingWizard(): void {
    // Check if user has visited before
    const hasVisited = localStorage.getItem('neuroviz-has-visited');

    if (!hasVisited) {
        // Mark as visited
        localStorage.setItem('neuroviz-has-visited', 'true');

        // Show wizard after a short delay
        setTimeout(() => {
            showOnboardingWizard();
        }, 1000);
    }
}

export function showOnboardingWizard(): void {
    tutorialManager.start('getting-started', () => {
        logger.info('Onboarding completed', { component: 'Onboarding' });
    });
}
