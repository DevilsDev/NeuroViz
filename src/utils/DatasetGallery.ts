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

  constructor() {
    this.cards = document.querySelectorAll('.dataset-preview-card');
    this.dropdown = document.getElementById('dataset-select') as HTMLSelectElement;
    this.toggleButton = document.getElementById('toggle-dataset-view');

    this.init();
  }

  private init(): void {
    // Add click handlers to all gallery cards
    this.cards.forEach((card) => {
      card.addEventListener('click', () => {
        const dataset = card.getAttribute('data-dataset');
        if (dataset) {
          this.selectDataset(dataset);
        }
      });
    });

    // Toggle dropdown visibility
    if (this.toggleButton) {
      this.toggleButton.addEventListener('click', () => {
        this.dropdown.classList.toggle('hidden');
        const isHidden = this.dropdown.classList.contains('hidden');
        if (this.toggleButton) {
          this.toggleButton.textContent = isHidden ? 'Show all datasets' : 'Hide dropdown';
        }
      });
    }

    // Sync gallery when dropdown changes
    this.dropdown.addEventListener('change', () => {
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
}