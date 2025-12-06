/**
 * DatasetGallery - Visual dataset selector with preview cards
 *
 * Provides an interactive gallery view for dataset selection with:
 * - Click to select datasets
 * - Visual preview icons
 * - Difficulty badges
 * - Sync with traditional dropdown
 */

export class DatasetGallery {
  private cards: NodeListOf<Element>;
  private dropdown: HTMLSelectElement;
  private toggleButton: HTMLElement | null;
  private selectedDataset: string = 'circle';

  // Event cleanup tracking for proper disposal
  private eventCleanup: Array<{ element: Element; event: string; handler: EventListener }> = [];

  constructor() {
    this.cards = document.querySelectorAll('.dataset-preview-card');
    this.dropdown = document.getElementById('dataset-select') as HTMLSelectElement;
    this.toggleButton = document.getElementById('toggle-dataset-view');

    this.init();
  }

  /**
   * Helper to add event listener and track for cleanup
   */
  private addTrackedListener(element: Element, event: string, handler: EventListener): void {
    element.addEventListener(event, handler);
    this.eventCleanup.push({ element, event, handler });
  }

  private init(): void {
    // Add click handlers to all gallery cards
    this.cards.forEach((card) => {
      this.addTrackedListener(card, 'click', () => {
        const dataset = card.getAttribute('data-dataset');
        if (dataset) {
          this.selectDataset(dataset);
        }
      });
    });

    // Toggle dropdown visibility
    if (this.toggleButton) {
      this.addTrackedListener(this.toggleButton, 'click', () => {
        this.dropdown.classList.toggle('hidden');
        const isHidden = this.dropdown.classList.contains('hidden');
        if (this.toggleButton) {
          this.toggleButton.textContent = isHidden ? 'Show all datasets' : 'Hide dropdown';
        }
      });
    }

    // Sync gallery when dropdown changes
    this.addTrackedListener(this.dropdown, 'change', () => {
      this.selectDataset(this.dropdown.value);
    });

    // Set initial selection
    this.selectDataset(this.dropdown.value || 'circle');
  }

  /**
   * Select a dataset in both gallery and dropdown
   */
  public selectDataset(dataset: string): void {
    this.selectedDataset = dataset;

    // Update gallery selection
    this.cards.forEach((card) => {
      if (card.getAttribute('data-dataset') === dataset) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });

    // Update dropdown if needed
    if (this.dropdown.value !== dataset) {
      this.dropdown.value = dataset;
      // Trigger change event to notify other components
      this.dropdown.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  /**
   * Get the currently selected dataset
   */
  public getSelectedDataset(): string {
    return this.selectedDataset;
  }

  /**
   * Clean up all event listeners to prevent memory leaks.
   * Call this before re-instantiating the gallery.
   */
  public dispose(): void {
    for (const { element, event, handler } of this.eventCleanup) {
      element.removeEventListener(event, handler);
    }
    this.eventCleanup = [];
  }
}
