import * as tf from '@tensorflow/tfjs';
import type { INeuralNetworkService, TrainResult } from '../../core/ports';
import type { Hyperparameters, Point, Prediction, OptimizerType, ActivationType } from '../../core/domain';
import { DEFAULT_HYPERPARAMETERS } from '../../core/domain';
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
  private numClasses = 2;

  /**
   * Initialises a new sequential model with the given hyperparameters.
   * Disposes any existing model to prevent memory leaks.
   *
   * @param config - Network architecture and training configuration
   */
  async initialize(config: Hyperparameters): Promise<void> {
    this.dispose();
    this.config = config;
    this.numClasses = config.numClasses ?? 2;
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
  async train(data: Point[]): Promise<TrainResult> {
    const model = this.assertInitialised();

    // Create tensors outside tf.tidy() since trainOnBatch is async
    const xs = tf.tensor2d(data.map((p) => [p.x, p.y]));
    const ys = this.createLabelTensor(data);

    try {
      // trainOnBatch returns [loss, accuracy] when metrics are configured
      const result = await model.trainOnBatch(xs, ys);

      // Extract loss and accuracy values
      let loss: number;
      let accuracy: number;

      if (Array.isArray(result)) {
        loss = result[0] ?? 0;
        accuracy = result[1] ?? 0;
      } else {
        loss = result;
        accuracy = 0;
      }

      // Check for gradient explosion
      if (Number.isNaN(loss)) {
        throw new GradientExplosionError();
      }

      return { loss, accuracy };
    } finally {
      // CRITICAL: Always dispose tensors to prevent GPU memory leaks
      xs.dispose();
      ys.dispose();
    }
  }

  /**
   * Evaluates the model on a dataset without updating weights.
   * Used for validation loss calculation.
   *
   * @param data - Array of labelled points for evaluation
   * @returns Evaluation result with loss and accuracy
   * @throws {ModelNotInitialisedError} If called before initialize()
   */
  async evaluate(data: Point[]): Promise<TrainResult> {
    const model = this.assertInitialised();

    const xs = tf.tensor2d(data.map((p) => [p.x, p.y]));
    const ys = this.createLabelTensor(data);

    try {
      // evaluate returns [loss, ...metrics] as scalars
      const result = model.evaluate(xs, ys) as tf.Scalar[];

      // Extract loss and accuracy
      const lossValue = await result[0]?.data();
      const accuracyValue = await result[1]?.data();

      // Dispose result tensors
      result.forEach((t) => t.dispose());

      return {
        loss: lossValue?.[0] ?? 0,
        accuracy: accuracyValue?.[0] ?? 0,
      };
    } finally {
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
        const outputData = await outputTensor.data();

        return grid.map((point, index) => {
          if (this.numClasses === 2) {
            // Binary classification: single sigmoid output
            const confidence = outputData[index] ?? 0.5;
            return {
              x: point.x,
              y: point.y,
              confidence,
              predictedClass: confidence >= 0.5 ? 1 : 0,
              probabilities: [1 - confidence, confidence],
            };
          } else {
            // Multi-class: softmax output
            const startIdx = index * this.numClasses;
            const probs: number[] = [];
            let maxProb = 0;
            let predictedClass = 0;

            for (let c = 0; c < this.numClasses; c++) {
              const prob = outputData[startIdx + c] ?? 0;
              probs.push(prob);
              if (prob > maxProb) {
                maxProb = prob;
                predictedClass = c;
              }
            }

            return {
              x: point.x,
              y: point.y,
              confidence: maxProb,
              predictedClass,
              probabilities: probs,
            };
          }
        });
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
   * - Hidden: Configurable activation, He Normal initialisation
   * - Output: 1 unit sigmoid (binary) or N units softmax (multi-class)
   */
  private buildModel(config: Hyperparameters): tf.Sequential {
    const model = tf.sequential();
    const activation = this.mapActivation(config.activation ?? DEFAULT_HYPERPARAMETERS.activation);
    const regularizer = this.createRegularizer(config.l2Regularization ?? 0);
    const numClasses = config.numClasses ?? 2;
    const dropoutRate = config.dropoutRate ?? 0;

    // Input layer (first hidden layer)
    model.add(
      tf.layers.dense({
        inputShape: [2],
        units: config.layers[0] ?? 4,
        activation,
        kernelInitializer: 'heNormal',
        kernelRegularizer: regularizer,
      })
    );

    // Add dropout after first hidden layer if enabled
    if (dropoutRate > 0) {
      model.add(tf.layers.dropout({ rate: dropoutRate }));
    }

    // Additional hidden layers
    for (let i = 1; i < config.layers.length; i++) {
      model.add(
        tf.layers.dense({
          units: config.layers[i] ?? 4,
          activation,
          kernelInitializer: 'heNormal',
          kernelRegularizer: regularizer,
        })
      );

      // Add dropout after each hidden layer if enabled
      if (dropoutRate > 0) {
        model.add(tf.layers.dropout({ rate: dropoutRate }));
      }
    }

    // Output layer - binary or multi-class (no dropout before output)
    if (numClasses === 2) {
      // Binary classification: single sigmoid output
      model.add(
        tf.layers.dense({
          units: 1,
          activation: 'sigmoid',
        })
      );
    } else {
      // Multi-class classification: softmax output
      model.add(
        tf.layers.dense({
          units: numClasses,
          activation: 'softmax',
        })
      );
    }

    const optimizer = this.createOptimizer(
      config.optimizer ?? DEFAULT_HYPERPARAMETERS.optimizer,
      config.learningRate
    );

    // Loss function depends on number of classes
    const loss = numClasses === 2 ? 'binaryCrossentropy' : 'categoricalCrossentropy';

    model.compile({
      optimizer,
      loss,
      metrics: ['accuracy'],
    });

    return model;
  }

  /**
   * Creates label tensor appropriate for binary or multi-class classification.
   */
  private createLabelTensor(data: Point[]): tf.Tensor {
    if (this.numClasses === 2) {
      // Binary: single column with 0 or 1
      return tf.tensor2d(data.map((p) => [p.label]));
    } else {
      // Multi-class: one-hot encoded
      return tf.oneHot(
        tf.tensor1d(data.map((p) => p.label), 'int32'),
        this.numClasses
      );
    }
  }

  /**
   * Creates a TensorFlow.js optimizer based on the specified type.
   */
  private createOptimizer(type: OptimizerType, learningRate: number): tf.Optimizer {
    switch (type) {
      case 'sgd':
        return tf.train.sgd(learningRate);
      case 'adam':
        return tf.train.adam(learningRate);
      case 'rmsprop':
        return tf.train.rmsprop(learningRate);
      case 'adagrad':
        return tf.train.adagrad(learningRate);
      default:
        return tf.train.adam(learningRate);
    }
  }

  /**
   * Maps activation type to TensorFlow.js activation identifier.
   * Returns a string literal that TensorFlow.js accepts.
   */
  private mapActivation(type: ActivationType): 'relu' | 'sigmoid' | 'tanh' | 'elu' {
    switch (type) {
      case 'relu':
        return 'relu';
      case 'sigmoid':
        return 'sigmoid';
      case 'tanh':
        return 'tanh';
      case 'elu':
        return 'elu';
      default:
        return 'relu';
    }
  }

  /**
   * Creates an L2 regularizer if strength > 0.
   */
  private createRegularizer(l2Strength: number): ReturnType<typeof tf.regularizers.l2> | undefined {
    if (l2Strength > 0) {
      return tf.regularizers.l2({ l2: l2Strength });
    }
    return undefined;
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
