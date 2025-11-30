import type { Point } from '../domain';

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
   * @returns Array of labelled points for the requested dataset
   * @throws If the dataset type is unknown or retrieval fails
   */
  getDataset(type: string): Promise<Point[]>;
}
