import * as tf from '@tensorflow/tfjs';
import type { INeuralNetworkService } from '../../core/ports';
import type { Hyperparameters, Point, Prediction } from '../../core/domain';

/**
 * TensorFlow.js implementation of INeuralNetworkService.
 * Encapsulates all TF.js logic—no other module should import tensorflow directly.
 *
 * @remarks
 * - Uses tf.tidy() for automatic memory management
 * - Batches predictions for GPU efficiency
 * - Disposes model on re-initialisation to prevent memory leaks
 */
export class TFNeuralNet implements INeuralNetworkService {
  private model: tf.Sequential | null = null;
  private config: Hyperparameters | null = null;

  /**
   * Initialises a new sequential model with the given hyperparameters.
   * Disposes any existing model to prevent memory leaks.
   */
  async initialize(config: Hyperparameters): Promise<void> {
    this.dispose();
    this.config = config;
    this.model = this.buildModel(config);
  }

  /**
   * Trains the model on labelled data points.
   * @returns Final training loss value
   */
  async train(data: Point[]): Promise<number> {
    this.assertInitialised();

    const { xs, ys } = this.prepareTrainingData(data);

    try {
      const history = await this.model!.fit(xs, ys, {
        epochs: 100,
        batchSize: 32,
        shuffle: true,
        verbose: 0,
      });

      const finalLoss = history.history.loss.at(-1);
      return typeof finalLoss === 'number' ? finalLoss : 0;
    } finally {
      xs.dispose();
      ys.dispose();
    }
  }

  /**
   * Generates predictions for a grid of points.
   * Batches all points in a single forward pass for GPU efficiency.
   */
  async predict(grid: Point[]): Promise<Prediction[]> {
    this.assertInitialised();

    return tf.tidy(() => {
      const inputTensor = tf.tensor2d(grid.map((p) => [p.x, p.y]));
      const outputTensor = this.model!.predict(inputTensor) as tf.Tensor;
      const confidences = outputTensor.dataSync();

      return grid.map((point, index) => ({
        x: point.x,
        y: point.y,
        confidence: confidences[index],
      }));
    });
  }

  /**
   * Disposes the current model and releases GPU memory.
   * Safe to call even if no model exists.
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }

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
          units: config.layers[i],
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

  private prepareTrainingData(data: Point[]): { xs: tf.Tensor2D; ys: tf.Tensor2D } {
    const xs = tf.tensor2d(data.map((p) => [p.x, p.y]));
    const ys = tf.tensor2d(data.map((p) => [p.label]));
    return { xs, ys };
  }

  private assertInitialised(): void {
    if (!this.model) {
      throw new Error('Model not initialised. Call initialize() before train() or predict().');
    }
  }
}
