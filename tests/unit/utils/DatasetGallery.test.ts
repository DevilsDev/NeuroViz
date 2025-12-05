import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DatasetGallery } from '../../../src/utils/DatasetGallery';

describe('DatasetGallery', () => {
  let container: HTMLElement;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div class="dataset-preview-card" data-dataset="circle"></div>
      <div class="dataset-preview-card" data-dataset="xor"></div>
      <div class="dataset-preview-card" data-dataset="spiral"></div>
      <select id="dataset-select">
        <option value="circle">Circle</option>
        <option value="xor">XOR</option>
        <option value="spiral">Spiral</option>
      </select>
      <button id="toggle-dataset-view">Show all datasets</button>
    `;
    container = document.body;
  });

  it('should initialize with default dataset', () => {
    const gallery = new DatasetGallery();
    expect(gallery.getSelectedDataset()).toBe('circle');
  });

  it('should select dataset when card is clicked', () => {
    const gallery = new DatasetGallery();
    const xorCard = document.querySelector('[data-dataset="xor"]') as HTMLElement;

    xorCard.click();

    expect(gallery.getSelectedDataset()).toBe('xor');
    expect(xorCard.classList.contains('selected')).toBe(true);
  });

  it('should sync with dropdown when dropdown changes', () => {
    const gallery = new DatasetGallery();
    const dropdown = document.getElementById('dataset-select') as HTMLSelectElement;

    dropdown.value = 'spiral';
    dropdown.dispatchEvent(new Event('change'));

    expect(gallery.getSelectedDataset()).toBe('spiral');
  });

  it('should toggle dropdown visibility', () => {
    new DatasetGallery();
    const dropdown = document.getElementById('dataset-select') as HTMLSelectElement;
    const toggleBtn = document.getElementById('toggle-dataset-view') as HTMLButtonElement;

    expect(dropdown.classList.contains('hidden')).toBe(false);

    toggleBtn.click();

    expect(dropdown.classList.contains('hidden')).toBe(true);
  });

  it('should update card selection state', () => {
    const gallery = new DatasetGallery();
    const circleCard = document.querySelector('[data-dataset="circle"]') as HTMLElement;
    const xorCard = document.querySelector('[data-dataset="xor"]') as HTMLElement;

    gallery.selectDataset('xor');

    expect(circleCard.classList.contains('selected')).toBe(false);
    expect(xorCard.classList.contains('selected')).toBe(true);
  });
});
