import type { Point } from '../domain';

/**
 * Options for dataset generation.
 */
export interface DatasetOptions {
  /** Number of samples to generate. Default: 200 */
  readonly samples?: number;
  /** Noise level (0-1). Default: 0.1 */
  readonly noise?: number;
  /** Number of classes for multi-class datasets. Default: 2 */
  readonly numClasses?: number;
  /** Class balance ratio for class 0 (0.1-0.9). Default: 0.5 (balanced) */
  readonly classBalance?: number;
}

/**
 * Port for dataset retrieval.
 * Abstracts data source (API, local storage, generated) from the core domain.
 *
 * @remarks
 * Implementations may cache datasets or generate them on-demand.
 */
export interface IDatasetRepository {
  /**
   * Retrieves a dataset by type identifier.
   *
   * @param type - Dataset identifier (e.g., 'circle', 'xor', 'spiral', 'gaussian')
   * @param options - Optional generation parameters
   * @returns Array of labelled points for the requested dataset
   * @throws If the dataset type is unknown or retrieval fails
   */
  getDataset(type: string, options?: DatasetOptions): Promise<Point[]>;
}
