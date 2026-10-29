import * as tf from '@tensorflow/tfjs';
import type { INeuralNetworkService, TrainResult } from '../../core/ports';
import type { Hyperparameters, Point, Prediction, OptimizerType, ActivationType, LossType } from '../../core/domain';
import { DEFAULT_HYPERPARAMETERS } from '../../core/domain';
import { GradientExplosionError, ModelNotInitialisedError } from './errors';

/** Argument accepted by `tf.Optimizer.applyGradients`. */
type GradientsArg = Parameters<tf.Optimizer['applyGradients']>[0];
/** A single named gradient (tf-core's `NamedTensor`, not re-exported by tfjs). */
type NamedGradient = Extract<GradientsArg, unknown[]>[number];

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
  private isDisposed = false;

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
    this.isDisposed = false;
  }

  /**
   * Updates the learning rate of the current model WITHOUT destroying trained weights.
   * Preserves all learned weights by saving and restoring them during optimizer update.
   *
   * @param newLearningRate - The new learning rate to apply
   * @throws {ModelNotInitialisedError} If called before initialize()
   *
   * @remarks
   * TensorFlow.js has no public learning-rate setter on every optimizer, so the
   * compiled optimizer is updated in place rather than replaced.
   */
  updateLearningRate(newLearningRate: number): void {
    const model = this.assertInitialised();
    if (!this.config || this.isDisposed) {
      throw new ModelNotInitialisedError();
    }

    this.config = { ...this.config, learningRate: newLearningRate };

    // Mutate the live optimizer instead of recompiling: this keeps the weights
    // untouched and preserves optimizer state (Adam moments, momentum buffers).
    // Note: model.getWeights() returns the live variables, not copies, so the
    // old get/recompile/set/dispose approach destroyed the model's weights.
    // `instanceof` can't be used here: tf.Optimizer overrides Symbol.hasInstance
    // with duck typing, so every optimizer passes `instanceof tf.SGDOptimizer`.
    const optimizer = model.optimizer as unknown as {
      learningRate: number;
      setLearningRate?: (lr: number) => void;
    };
    if (typeof optimizer.setLearningRate === 'function') {
      // SGD and Momentum cache the LR in a scalar tensor; setLearningRate refreshes it
      optimizer.setLearningRate(newLearningRate);
    } else {
      // Adam, RMSprop and Adagrad read `learningRate` on every applyGradients call
      optimizer.learningRate = newLearningRate;
    }
  }

  /**
   * Trains the model on a single batch of labelled data points.
   *
   * @param data - Array of labelled points for supervised learning
   * @returns The batch training loss value
   * @throws {ModelNotInitialisedError} If called before initialize()
   * @throws {GradientExplosionError} If loss is NaN or Infinity (learning rate too high)
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
    this.assertInitialised();

    // Guard against empty data
    if (data.length === 0) {
      return { loss: 0, accuracy: 0 };
    }

    // Create tensors outside tf.tidy() since trainOnBatch is async
    const xs = tf.tensor2d(data.map((p) => [p.x, p.y]), [data.length, 2]);
    const ys = this.createLabelTensor(data);

    try {
      // trainOnBatch returns loss (metrics are not computed for trainOnBatch)
      // Re-read this.model after each await to avoid using a disposed reference
      const result = await this.model!.trainOnBatch(xs, ys);

      // Extract loss value
      const loss = Array.isArray(result) ? (result[0] ?? 0) : result;

      // Check for gradient explosion (NaN or +/-Infinity)
      if (!Number.isFinite(loss)) {
        throw new GradientExplosionError(
          `Training produced ${Number.isNaN(loss) ? 'NaN' : 'infinite'} loss. Try lowering the learning rate.`
        );
      }

      // Model may have been disposed during the await above
      if (!this.model || this.isDisposed) {
        return { loss, accuracy: 0 };
      }

      // Compute accuracy manually since trainOnBatch doesn't compute metrics
      const predictions = this.model.predict(xs) as tf.Tensor;
      try {
        const accuracy = await this.computeAccuracy(predictions, ys, data);
        return { loss, accuracy };
      } finally {
        predictions.dispose();
      }
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
    this.assertInitialised();

    // Guard against empty data
    if (data.length === 0) {
      return { loss: 0, accuracy: 0 };
    }

    const xs = tf.tensor2d(data.map((p) => [p.x, p.y]), [data.length, 2]);
    const ys = this.createLabelTensor(data);

    try {
      // evaluate returns [loss, ...metrics] as scalars
      // Re-read this.model to avoid using a disposed reference
      const result = this.model!.evaluate(xs, ys) as tf.Scalar[];

      try {
        // Extract loss and accuracy
        const lossValue = await result[0]?.data();
        const accuracyValue = await result[1]?.data();

        return {
          loss: lossValue?.[0] ?? 0,
          accuracy: accuracyValue?.[0] ?? 0,
        };
      } finally {
        // Dispose result tensors even if a readback fails
        tf.dispose(result);
      }
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
    this.assertInitialised();

    // Guard against empty grid
    if (grid.length === 0) {
      return [];
    }

    // Create input tensor (manual disposal since we need async .data())
    const inputTensor = tf.tensor2d(grid.map((p) => [p.x, p.y]), [grid.length, 2]);

    try {
      // Run inference — re-read this.model to avoid using a disposed reference
      const outputTensor = this.model!.predict(inputTensor) as tf.Tensor;

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
      // Optimizers passed to compile() are not owned by the model, so
      // model.dispose() leaves their slot variables (e.g. Adam moments) alive.
      this.model.optimizer?.dispose();
      this.model.dispose();
      this.model = null;
    }
    this.config = null;
    this.isDisposed = true;
  }

  /**
   * Exports the trained model as downloadable Blobs.
   * Uses TensorFlow.js model serialization format.
   */
  async exportModel(): Promise<{ modelJson: Blob; weightsBlob: Blob }> {
    this.assertInitialised();

    // Use custom IOHandler to capture the model data
    const modelArtifacts = await new Promise<tf.io.ModelArtifacts>((resolve, reject) => {
      const saveHandler: tf.io.IOHandler = {
        save: async (artifacts) => {
          resolve(artifacts);
          return { modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: 'JSON' } };
        },
      };
      this.model!.save(saveHandler).catch(reject);
    });

    // Create model.json blob
    const modelTopology = modelArtifacts.modelTopology;
    const weightsManifest = [{
      paths: ['weights.bin'],
      weights: modelArtifacts.weightSpecs ?? [],
    }];

    const modelJson = JSON.stringify({
      modelTopology,
      weightsManifest,
      format: 'layers-model',
      generatedBy: 'NeuroViz',
      convertedBy: null,
    });

    const modelJsonBlob = new Blob([modelJson], { type: 'application/json' });

    // Create weights.bin blob
    const weightsData = modelArtifacts.weightData;
    let weightsBlob: Blob;
    if (weightsData) {
      // Handle both ArrayBuffer and ArrayBuffer[] cases
      const buffers = Array.isArray(weightsData) ? weightsData : [weightsData];
      weightsBlob = new Blob(buffers, { type: 'application/octet-stream' });
    } else {
      weightsBlob = new Blob([], { type: 'application/octet-stream' });
    }

    return { modelJson: modelJsonBlob, weightsBlob };
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
   * Gets all weights from the model as a flat array.
   * Used for weight histogram visualization.
   */
  getWeights(): number[] {
    if (!this.model || this.isDisposed) {
      return [];
    }

    try {
      const allWeights: number[] = [];
      const weights = this.model.getWeights();

      for (const tensor of weights) {
        const data = tensor.dataSync();
        for (let i = 0; i < data.length; i++) {
          const value = data[i];
          if (value !== undefined) {
            allWeights.push(value);
          }
        }
      }

      return allWeights;
    } catch (error) {
      // Model was disposed during execution, return empty array
      console.warn('Failed to get weights - model may have been disposed:', error);
      return [];
    }
  }

  /**
   * Gets weight matrices for each layer connection.
   * Used for network diagram weight visualization.
   * @returns Array of weight matrices [layer][fromNode][toNode]
   */
  getWeightMatrices(): number[][][] {
    if (!this.model || this.isDisposed) {
      return [];
    }

    try {
      const matrices: number[][][] = [];
      const weights = this.model.getWeights();

      // Weights come in pairs: [kernel, bias, kernel, bias, ...]
      // We only want the kernels (even indices)
      for (let i = 0; i < weights.length; i += 2) {
        const kernel = weights[i];
        if (!kernel) continue;

        const shape = kernel.shape;
        const data = kernel.dataSync();
        const [inputSize, outputSize] = shape;

        if (inputSize === undefined || outputSize === undefined) continue;

        const matrix: number[][] = [];
        for (let from = 0; from < inputSize; from++) {
          const row: number[] = [];
          for (let to = 0; to < outputSize; to++) {
            const idx = from * outputSize + to;
            row.push(data[idx] ?? 0);
          }
          matrix.push(row);
        }
        matrices.push(matrix);
      }

      return matrices;
    } catch {
      // Model was disposed during execution, return empty array silently
      // This is expected during reinitialisation
      return [];
    }
  }

  /**
   * Gets activations for each layer given an input point.
   * Used for neuron activation visualization.
   * @param point - Input point to get activations for
   * @returns Array of activation arrays per layer
   */
  getLayerActivations(point: Point): number[][] {
    if (!this.model || this.isDisposed) {
      return [];
    }

    // Contract: returns one entry per layer in structure.layers, in order:
    //   [0]      raw input coordinates (input layer)
    //   [1..N-1] output of each logical (Dense) layer
    //
    // TF.js Keras sequential models do NOT expose the input as a layer, so the
    // raw [x, y] is prepended to keep callers' index math aligned with
    // structure.layers.
    //
    // model.layers also contains helper layers (BatchNormalization, Activation,
    // Dropout) that structure.layers does not report. A logical layer is a
    // Dense layer plus the helpers that follow it, so its activation is the
    // running output just before the next Dense layer (or at the end). Every
    // layer is still applied, so batch norm and the post-norm activation take
    // effect; Dropout is the identity at inference time.
    const model = this.model;

    try {
      return tf.tidy(() => {
        const activations: number[][] = [[point.x, point.y]];
        let current: tf.Tensor = tf.tensor2d([[point.x, point.y]]);

        model.layers.forEach((layer, index) => {
          if (index > 0 && layer.getClassName() === 'Dense') {
            activations.push(Array.from(current.dataSync()));
          }
          current = layer.apply(current) as tf.Tensor;
        });
        activations.push(Array.from(current.dataSync()));

        return activations;
      });
    } catch {
      // Model was disposed during execution, return empty array silently
      // This is expected during reinitialisation
      return [];
    }
  }

  /**
   * Returns the current network structure (layers and activations).
   */
  getStructure(): { layers: number[]; activations: string[] } | null {
    if (!this.config) return null;

    // Reconstruct full layer sizes including input and output
    const layers = [2, ...this.config.layers, this.numClasses];

    // Reconstruct activations
    const defaultActivation = this.config.activation ?? DEFAULT_HYPERPARAMETERS.activation;
    const layerActivations = this.config.layerActivations ?? [];

    const activations = ['linear']; // Input layer
    for (let i = 0; i < this.config.layers.length; i++) {
      activations.push(layerActivations[i] ?? defaultActivation);
    }
    activations.push(this.numClasses === 2 ? 'sigmoid' : 'softmax'); // Output layer

    return { layers, activations };
  }

  /**
   * Generates a simulated dropout mask for visualization purposes.
   * Returns which neurons would be "dropped" in each hidden layer.
   * @param dropoutRate - The dropout rate (0-1)
   * @returns Array of boolean arrays, one per hidden layer. true = active, false = dropped
   */
  generateDropoutMask(dropoutRate: number): boolean[][] {
    if (!this.config || dropoutRate <= 0) return [];

    const masks: boolean[][] = [];

    for (const layerSize of this.config.layers) {
      const mask: boolean[] = [];
      for (let i = 0; i < layerSize; i++) {
        // Each neuron has (1 - dropoutRate) probability of being active
        mask.push(Math.random() > dropoutRate);
      }
      masks.push(mask);
    }

    return masks;
  }

  /**
   * Gets the current configuration.
   */
  getConfig(): Hyperparameters | null {
    return this.config;
  }

  /**
   * Checks if the model is ready for use (initialised and not disposed).
   */
  isReady(): boolean {
    return this.model !== null && !this.isDisposed;
  }

  /**
   * Builds a sequential model with the specified architecture.
   *
   * Architecture:
   * - Input: 2 features (x, y coordinates)
   * - Hidden: Configurable activation (per-layer or global), He Normal initialisation
   * - Output: 1 unit sigmoid (binary) or N units softmax (multi-class)
   */
  private buildModel(config: Hyperparameters): tf.Sequential {
    const model = tf.sequential();
    const defaultActivation = config.activation ?? DEFAULT_HYPERPARAMETERS.activation;
    const layerActivations = config.layerActivations ?? [];
    const regularizer = this.createRegularizer(
      config.l1Regularization ?? 0,
      config.l2Regularization ?? 0
    );
    const numClasses = config.numClasses ?? 2;
    const dropoutRate = config.dropoutRate ?? 0;
    const useBatchNorm = config.batchNorm ?? false;

    // Helper to get activation for a specific layer index
    const getActivation = (layerIndex: number): 'relu' | 'sigmoid' | 'tanh' | 'elu' => {
      const act = layerActivations[layerIndex] ?? defaultActivation;
      return this.mapActivation(act);
    };

    // Input layer (first hidden layer)
    // When using batch norm, apply activation after batch norm
    model.add(
      tf.layers.dense({
        inputShape: [2],
        units: config.layers[0] ?? 4,
        activation: useBatchNorm ? 'linear' : getActivation(0),
        kernelInitializer: 'heNormal',
        kernelRegularizer: regularizer,
      })
    );

    // Add batch normalization then activation if enabled
    if (useBatchNorm) {
      model.add(tf.layers.batchNormalization());
      model.add(tf.layers.activation({ activation: getActivation(0) }));
    }

    // Add dropout after first hidden layer if enabled
    if (dropoutRate > 0) {
      model.add(tf.layers.dropout({ rate: dropoutRate }));
    }

    // Additional hidden layers
    for (let i = 1; i < config.layers.length; i++) {
      model.add(
        tf.layers.dense({
          units: config.layers[i] ?? 4,
          activation: useBatchNorm ? 'linear' : getActivation(i),
          kernelInitializer: 'heNormal',
          kernelRegularizer: regularizer,
        })
      );

      // Add batch normalization then activation if enabled
      if (useBatchNorm) {
        model.add(tf.layers.batchNormalization());
        model.add(tf.layers.activation({ activation: getActivation(i) }));
      }

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
      config.learningRate,
      config.momentum ?? DEFAULT_HYPERPARAMETERS.momentum,
      config.clipNorm ?? 0
    );

    // Get loss function based on config
    const lossType = config.lossFunction ?? DEFAULT_HYPERPARAMETERS.lossFunction;
    const loss = this.getLossFunction(lossType, numClasses);

    model.compile({
      optimizer,
      loss,
      metrics: ['accuracy'],
    });

    return model;
  }

  /**
   * Maps LossType to TensorFlow.js loss function string.
   */
  private getLossFunction(lossType: LossType, numClasses: number): string {
    switch (lossType) {
      case 'crossEntropy':
        return numClasses === 2 ? 'binaryCrossentropy' : 'categoricalCrossentropy';
      case 'mse':
        return 'meanSquaredError';
      case 'hinge':
        return numClasses === 2 ? 'hinge' : 'categoricalHinge';
      default:
        return numClasses === 2 ? 'binaryCrossentropy' : 'categoricalCrossentropy';
    }
  }

  /**
   * Creates label tensor appropriate for binary or multi-class classification.
   */
  private createLabelTensor(data: Point[]): tf.Tensor {
    if (this.numClasses === 2) {
      // Binary: single column with 0 or 1
      return tf.tensor2d(data.map((p) => [p.label]));
    } else {
      // Multi-class: one-hot encoded (tidy frees the intermediate index tensor)
      return tf.tidy(() =>
        tf.oneHot(tf.tensor1d(data.map((p) => p.label), 'int32'), this.numClasses)
      );
    }
  }

  /**
   * Computes accuracy by comparing predictions to actual labels.
   */
  private async computeAccuracy(predictions: tf.Tensor, labels: tf.Tensor, data: Point[]): Promise<number> {
    const predData = await predictions.data();
    
    let correct = 0;
    const total = data.length;
    
    if (this.numClasses === 2) {
      // Binary classification: sigmoid output
      for (let i = 0; i < total; i++) {
        const predicted = (predData[i] ?? 0) >= 0.5 ? 1 : 0;
        const actual = data[i]?.label ?? 0;
        if (predicted === actual) correct++;
      }
    } else {
      // Multi-class: softmax output
      for (let i = 0; i < total; i++) {
        const startIdx = i * this.numClasses;
        let maxProb = 0;
        let predicted = 0;
        for (let c = 0; c < this.numClasses; c++) {
          const prob = predData[startIdx + c] ?? 0;
          if (prob > maxProb) {
            maxProb = prob;
            predicted = c;
          }
        }
        const actual = data[i]?.label ?? 0;
        if (predicted === actual) correct++;
      }
    }
    
    return total > 0 ? correct / total : 0;
  }

  /**
   * Creates a TensorFlow.js optimizer based on the specified type.
   * Applies gradient clipping if clipNorm > 0.
   */
  private createOptimizer(
    type: OptimizerType,
    learningRate: number,
    momentum: number,
    clipNorm: number
  ): tf.Optimizer {
    let optimizer: tf.Optimizer;
    switch (type) {
      case 'sgd':
        optimizer = tf.train.momentum(learningRate, momentum);
        break;
      case 'adam':
        optimizer = tf.train.adam(learningRate);
        break;
      case 'rmsprop':
        optimizer = tf.train.rmsprop(learningRate);
        break;
      case 'adagrad':
        optimizer = tf.train.adagrad(learningRate);
        break;
      default:
        optimizer = tf.train.adam(learningRate);
    }

    if (clipNorm > 0) {
      TFNeuralNet.applyGlobalNormClipping(optimizer, clipNorm);
    }
    return optimizer;
  }

  /**
   * Makes `optimizer` clip gradients by their global L2 norm before applying
   * them: when ||g|| > clipNorm every gradient is scaled by clipNorm / ||g||.
   *
   * @remarks
   * TF.js optimizers have no clipnorm option. `model.trainOnBatch()` ends in
   * `optimizer.minimize()`, which computes the gradients and then calls
   * `applyGradients()`. Wrapping that method on this instance clips every
   * training step while keeping trainOnBatch's handling of regularisation
   * losses and batch-norm moving statistics. The scale factor stays a tensor,
   * so no GPU readback is added. `minimize()` disposes the original gradients;
   * the scaled copies are disposed here.
   */
  private static applyGlobalNormClipping(optimizer: tf.Optimizer, clipNorm: number): void {
    const applyGradients = optimizer.applyGradients.bind(optimizer);

    optimizer.applyGradients = (variableGradients: GradientsArg): void => {
      const named: NamedGradient[] = Array.isArray(variableGradients)
        ? variableGradients
        : Object.entries(variableGradients).map(([name, tensor]) => ({ name, tensor }));

      const clipped = tf.tidy(() => {
        const globalNorm = tf.sqrt(tf.addN(named.map(({ tensor }) => tf.sum(tf.square(tensor)))));
        // scale = clipNorm / max(||g||, clipNorm), i.e. min(1, clipNorm / ||g||)
        const scale = tf.div(clipNorm, tf.maximum(globalNorm, clipNorm));
        return named.map(({ tensor }) => tf.mul(tensor, scale));
      });

      try {
        if (Array.isArray(variableGradients)) {
          applyGradients(named.map(({ name }, i) => ({ name, tensor: clipped[i]! })));
        } else {
          const map: tf.NamedTensorMap = {};
          named.forEach(({ name }, i) => {
            map[name] = clipped[i]!;
          });
          applyGradients(map);
        }
      } finally {
        tf.dispose(clipped);
      }
    };
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
   * Creates a regularizer combining L1 and L2 if either strength > 0.
   */
  private createRegularizer(l1Strength: number, l2Strength: number): ReturnType<typeof tf.regularizers.l1l2> | undefined {
    if (l1Strength > 0 || l2Strength > 0) {
      return tf.regularizers.l1l2({ l1: l1Strength, l2: l2Strength });
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
