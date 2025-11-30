import * as tf from '@tensorflow/tfjs';
import type { INeuralNetworkService } from '../../core/ports';
import type { Hyperparameters, Point, Prediction } from '../../core/domain';
import { GradientExplosionError, ModelNotInitialisedError } from './errors';

/**
 * TensorFlow.js implementation of INeuralNetworkService.
 * Encapsulates all TF.js logic—no other module should import tensorflow directly.
 *
 * @remarks
 * Memory Management Strategy:
 * - `tf.tidy()` for synchronous tensor operations (predict)
 * - Manual `dispose()` in `finally` blocks for async operations (trainOnBatch)
 * - Model disposal on re-initialisation to prevent GPU memory leaks
 *
 * @example
 * ```ts
 * const net = new TFNeuralNet();
 * await net.initialize({ learningRate: 0.03, layers: [8, 4] });
 * const loss = await net.train(points);
 * const predictions = await net.predict(grid);
 * net.dispose(); // Clean up when done
 * ```
 */
export class TFNeuralNet implements INeuralNetworkService {
  private model: tf.Sequential | null = null;
  private config: Hyperparameters | null = null;

  /**
   * Initialises a new sequential model with the given hyperparameters.
   * Disposes any existing model to prevent memory leaks.
   *
   * @param config - Network architecture and training configuration
   */
  async initialize(config: Hyperparameters): Promise<void> {
    this.dispose();
    this.config = config;
    this.model = this.buildModel(config);
  }

  /**
   * Trains the model on a single batch of labelled data points.
   *
   * @param data - Array of labelled points for supervised learning
   * @returns The batch training loss value
   * @throws {ModelNotInitialisedError} If called before initialize()
   * @throws {GradientExplosionError} If loss is NaN (learning rate too high)
   *
   * @remarks
   * Uses `trainOnBatch` for single-step training, enabling:
   * - Real-time loss updates per epoch
   * - Non-blocking UI during training loops
   * - Fine-grained control over training flow
   *
   * Memory is manually managed via try/finally since `tf.tidy()`
   * cannot wrap async operations like `trainOnBatch`.
   */
  async train(data: Point[]): Promise<number> {
    const model = this.assertInitialised();

    // Create tensors outside tf.tidy() since trainOnBatch is async
    const xs = tf.tensor2d(data.map((p) => [p.x, p.y]));
    const ys = tf.tensor2d(data.map((p) => [p.label]));

    try {
      // trainOnBatch returns number | number[] in newer TF.js versions
      const result = await model.trainOnBatch(xs, ys);

      // Extract loss value (first element if array, otherwise number)
      const loss = Array.isArray(result) ? result[0] ?? 0 : result;

      // Check for gradient explosion
      if (Number.isNaN(loss)) {
        throw new GradientExplosionError();
      }

      return loss;
    } finally {
      // CRITICAL: Always dispose tensors to prevent GPU memory leaks
      xs.dispose();
      ys.dispose();
    }
  }

  /**
   * Generates predictions for a grid of points.
   * Batches all points in a single forward pass for GPU efficiency.
   *
   * @param grid - Array of points to classify (labels are ignored)
   * @returns Predictions with confidence scores [0, 1] for each point
   * @throws {ModelNotInitialisedError} If called before initialize()
   *
   * @remarks
   * Uses `tf.tidy()` for automatic memory cleanup of intermediate tensors.
   * Returns data asynchronously via `.data()` to keep UI responsive.
   */
  async predict(grid: Point[]): Promise<Prediction[]> {
    const model = this.assertInitialised();

    // Create input tensor (manual disposal since we need async .data())
    const inputTensor = tf.tensor2d(grid.map((p) => [p.x, p.y]));

    try {
      // Run inference
      const outputTensor = model.predict(inputTensor) as tf.Tensor;

      try {
        // Use async .data() to avoid blocking the UI thread
        const confidences = await outputTensor.data();

        return grid.map((point, index) => ({
          x: point.x,
          y: point.y,
          confidence: confidences[index] ?? 0.5,
        }));
      } finally {
        outputTensor.dispose();
      }
    } finally {
      inputTensor.dispose();
    }
  }

  /**
   * Disposes the current model and releases GPU memory.
   * Safe to call multiple times or when no model exists.
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.config = null;
  }

  /**
   * Returns the current number of tensors in GPU memory.
   * Useful for debugging memory leaks.
   */
  static getMemoryInfo(): { numTensors: number; numBytes: number } {
    const info = tf.memory();
    return {
      numTensors: info.numTensors,
      numBytes: info.numBytes,
    };
  }

  /**
   * Builds a sequential model with the specified architecture.
   *
   * Architecture:
   * - Input: 2 features (x, y coordinates)
   * - Hidden: ReLU activation, He Normal initialisation
   * - Output: 1 unit, Sigmoid activation (binary classification)
   */
  private buildModel(config: Hyperparameters): tf.Sequential {
    const model = tf.sequential();

    // Input layer (first hidden layer)
    model.add(
      tf.layers.dense({
        inputShape: [2],
        units: config.layers[0] ?? 4,
        activation: 'relu',
        kernelInitializer: 'heNormal',
      })
    );

    // Additional hidden layers
    for (let i = 1; i < config.layers.length; i++) {
      model.add(
        tf.layers.dense({
          units: config.layers[i] ?? 4,
          activation: 'relu',
          kernelInitializer: 'heNormal',
        })
      );
    }

    // Output layer (binary classification)
    model.add(
      tf.layers.dense({
        units: 1,
        activation: 'sigmoid',
      })
    );

    model.compile({
      optimizer: tf.train.adam(config.learningRate),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy'],
    });

    return model;
  }

  /**
   * Asserts the model has been initialised and returns it.
   * @throws {ModelNotInitialisedError} If model is null
   */
  private assertInitialised(): tf.Sequential {
    if (!this.model) {
      throw new ModelNotInitialisedError();
    }
    return this.model;
  }
}
