import type { Point } from '../domain';

/**
 * Options for dataset generation.
 */
export interface DatasetOptions {
  /** Number of samples to generate. Default: 200 */
  readonly samples?: number;
  /** Noise level (0-1). Default: 0.1 */
  readonly noise?: number;
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
