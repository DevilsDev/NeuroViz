# NeuroViz API Reference

Complete API documentation for NeuroViz's core interfaces, classes, and types.

## Table of Contents

- [Core Ports (Interfaces)](#core-ports-interfaces)
  - [INeuralNetworkService](#ineuralnetworkservice)
  - [IVisualizerService](#ivisualizerservice)
  - [IDatasetRepository](#idatasetrepository)
  - [IStorageService](#istorageservice)
  - [ITrainingSession](#itrainingsession)
- [Domain Models](#domain-models)
  - [Point](#point)
  - [Prediction](#prediction)
  - [Hyperparameters](#hyperparameters)
  - [TrainingConfig](#trainingconfig)
  - [TrainingHistory](#traininghistory)
  - [TrainingState](#trainingstate)
- [Application Classes](#application-classes)
  - [TrainingSession](#trainingsession)
  - [LearningRateScheduler](#learningratescheduler)
  - [EarlyStoppingStrategy](#earlystoppingstrategy)
  - [TrainingDataSplitter](#trainingdatasplitter)
- [Infrastructure Adapters](#infrastructure-adapters)
  - [TFNeuralNet](#tfneuralnet)
  - [D3Chart](#d3chart)
  - [MockDataRepository](#mockdatarepository)
  - [LocalStorageService](#localstorageservice)
- [Commands](#commands)
  - [InitializeNetworkCommand](#initializenetworkcommand)
  - [StartTrainingCommand](#starttrainingcommand)
  - [StepTrainingCommand](#steptrainingcommand)
  - [UpdateTrainingConfigCommand](#updatetrainingconfigcommand)

---

## Core Ports (Interfaces)

### INeuralNetworkService

Abstracts ML framework operations (TensorFlow.js, ONNX, etc.).

**Location**: `src/core/ports/INeuralNetworkService.ts`

#### Interface Definition

```typescript
interface INeuralNetworkService {
  initialize(config: Hyperparameters): Promise<void>;
  updateLearningRate(newLearningRate: number): void;
  train(data: Point[]): Promise<TrainResult>;
  evaluate(data: Point[]): Promise<TrainResult>;
  predict(grid: Point[]): Promise<Prediction[]>;
  getWeightMatrices(): number[][][];
  getLayerActivations(point: Point): number[][];
  getStructure(): { layers: number[]; activations: string[] } | null;
  isReady(): boolean;
  loadModel(modelJson: File, weightsBlob: File): Promise<void>;
}
```

#### Methods

##### `initialize(config: Hyperparameters): Promise<void>`

Initializes the neural network with given architecture and hyperparameters.

**Parameters**:
- `config: Hyperparameters` - Network configuration (layers, learning rate, optimizer, etc.)

**Throws**:
- If configuration is invalid (e.g., empty layers array)

**Example**:
```typescript
await neuralNet.initialize({
  learningRate: 0.03,
  layers: [8, 4],
  optimizer: 'adam',
  activation: 'relu',
  numClasses: 2
});
```

---

##### `updateLearningRate(newLearningRate: number): void`

Updates learning rate without destroying trained weights. Used for LR scheduling.

**Parameters**:
- `newLearningRate: number` - New learning rate value

**Throws**:
- `ModelNotInitialisedError` if called before `initialize()`

**Example**:
```typescript
neuralNet.updateLearningRate(0.01);
```

---

##### `train(data: Point[]): Promise<TrainResult>`

Trains the network on a batch of labeled points.

**Parameters**:
- `data: Point[]` - Training batch

**Returns**:
- `TrainResult` - Object with `loss` and `accuracy`

**Throws**:
- `ModelNotInitialisedError` if not initialized
- `GradientExplosionError` if loss becomes NaN

**Example**:
```typescript
const result = await neuralNet.train(trainingData);
console.log(`Loss: ${result.loss}, Accuracy: ${result.accuracy}`);
```

---

##### `evaluate(data: Point[]): Promise<TrainResult>`

Evaluates model on validation data without updating weights.

**Parameters**:
- `data: Point[]` - Validation dataset

**Returns**:
- `TrainResult` - Object with `loss` and `accuracy`

**Example**:
```typescript
const valResult = await neuralNet.evaluate(validationData);
```

---

##### `predict(grid: Point[]): Promise<Prediction[]>`

Generates predictions for a grid of points (for decision boundary visualization).

**Parameters**:
- `grid: Point[]` - Points to classify (labels ignored)

**Returns**:
- `Prediction[]` - Array of predictions with confidence scores

**Example**:
```typescript
const predictions = await neuralNet.predict(gridPoints);
visualizer.renderBoundary(predictions, 50);
```

---

##### `getWeightMatrices(): number[][][]`

Returns weight matrices for each layer connection.

**Returns**:
- `number[][][]` - Array of matrices `[layer][fromNode][toNode]`

**Example**:
```typescript
const weights = neuralNet.getWeightMatrices();
// weights[0] = first layer weights
// weights[0][2][5] = weight from input node 2 to hidden node 5
```

---

##### `getLayerActivations(point: Point): number[][]`

Gets activations for each layer given an input point.

**Parameters**:
- `point: Point` - Input to forward-propagate

**Returns**:
- `number[][]` - Activations per layer

**Example**:
```typescript
const activations = neuralNet.getLayerActivations({ x: 0.5, y: -0.3, label: 0 });
// activations[0] = first hidden layer activations
// activations[1] = second hidden layer activations
```

---

##### `getStructure(): { layers: number[]; activations: string[] } | null`

Returns current network architecture.

**Returns**:
- `{ layers, activations }` - Layer sizes and activation functions
- `null` if not initialized

**Example**:
```typescript
const structure = neuralNet.getStructure();
// { layers: [2, 8, 4, 1], activations: ['linear', 'relu', 'relu', 'sigmoid'] }
```

---

##### `isReady(): boolean`

Checks if model is initialized and ready to use.

**Returns**:
- `boolean` - `true` if ready, `false` otherwise

**Example**:
```typescript
if (neuralNet.isReady()) {
  await neuralNet.train(data);
}
```

---

##### `loadModel(modelJson: File, weightsBlob: File): Promise<void>`

Loads a previously exported model.

**Parameters**:
- `modelJson: File` - Model topology file
- `weightsBlob: File` - Model weights file

**Example**:
```typescript
await neuralNet.loadModel(modelJsonFile, weightsFile);
```

---

### IVisualizerService

Abstracts chart rendering (D3.js, Chart.js, Three.js, etc.).

**Location**: `src/core/ports/IVisualizerService.ts`

#### Interface Definition

```typescript
interface IVisualizerService {
  renderData(points: Point[]): void;
  renderBoundary(predictions: Prediction[], gridSize: number): void;
  clear(): void;
  setConfig(config: Partial<VisualizationConfig>): void;
  getConfig(): VisualizationConfig;
  setTheme(theme: ColourScheme): void;
  setPointPredictions(predictions: Prediction[]): void;
  highlightMisclassified(predictions: Prediction[]): void;
  clearMisclassifiedHighlight(): void;
  renderConfidenceCircles(predictions: Prediction[]): void;
  clearConfidenceCircles(): void;
  enableDrawMode(label: number, callback: PointAddedCallback): void;
  disableDrawMode(): void;
  isDrawModeEnabled(): boolean;
  onPointClick(callback: (point: Point) => void): void;
  exportAsPNG(filename?: string): void;
  exportAsSVG(filename?: string): void;
  setVoronoiOverlay(enabled: boolean): void;
  isVoronoiEnabled(): boolean;
  renderAdversarialPoints(points: Array<Point & { isAdversarial: boolean }>): void;
  clearAdversarialPoints(): void;
  dispose(): void;
}
```

#### Methods

##### `renderData(points: Point[]): void`

Renders data points as circles on the visualization.

**Parameters**:
- `points: Point[]` - Data points to render

**Example**:
```typescript
visualizer.renderData([
  { x: 0.5, y: 0.3, label: 0 },
  { x: -0.2, y: 0.8, label: 1 }
]);
```

---

##### `renderBoundary(predictions: Prediction[], gridSize: number): void`

Renders decision boundary as a heatmap or contour plot.

**Parameters**:
- `predictions: Prediction[]` - Grid predictions
- `gridSize: number` - Grid resolution (e.g., 50 for 50x50 grid)

**Example**:
```typescript
const grid = createGrid(50);
const predictions = await neuralNet.predict(grid);
visualizer.renderBoundary(predictions, 50);
```

---

##### `clear(): void`

Clears all rendered content.

**Example**:
```typescript
visualizer.clear();
```

---

##### `setConfig(config: Partial<VisualizationConfig>): void`

Updates visualization settings.

**Parameters**:
- `config: Partial<VisualizationConfig>` - Configuration updates

**Example**:
```typescript
visualizer.setConfig({
  boundaryOpacity: 0.5,
  pointRadius: 5,
  contourCount: 15
});
```

---

##### `enableDrawMode(label: number, callback: PointAddedCallback): void`

Enables click-to-draw mode for custom dataset creation.

**Parameters**:
- `label: number` - Class label for new points
- `callback: PointAddedCallback` - Called when point is added

**Example**:
```typescript
visualizer.enableDrawMode(1, (point) => {
  dataset.push(point);
  visualizer.renderData(dataset);
});
```

---

##### `highlightMisclassified(predictions: Prediction[]): void`

Highlights misclassified points with red outline.

**Parameters**:
- `predictions: Prediction[]` - Predictions for current data points

**Example**:
```typescript
const predictions = await neuralNet.predict(dataPoints);
visualizer.highlightMisclassified(predictions);
```

---

##### `exportAsPNG(filename?: string): void`

Exports visualization as PNG image.

**Parameters**:
- `filename?: string` - Download filename (default: 'neuroviz-boundary')

**Example**:
```typescript
visualizer.exportAsPNG('my-decision-boundary');
```

---

### IDatasetRepository

Abstracts dataset retrieval (API, mock data, CSV files, etc.).

**Location**: `src/core/ports/IDatasetRepository.ts`

#### Interface Definition

```typescript
interface IDatasetRepository {
  getDataset(type: string, options?: DatasetOptions): Promise<Point[]>;
}
```

#### Methods

##### `getDataset(type: string, options?: DatasetOptions): Promise<Point[]>`

Fetches a dataset by type.

**Parameters**:
- `type: string` - Dataset type ('circle', 'xor', 'spiral', 'gaussian', 'iris', 'wine')
- `options?: DatasetOptions` - Configuration (sample count, noise, preprocessing)

**Returns**:
- `Promise<Point[]>` - Array of labeled data points

**Example**:
```typescript
const data = await dataRepo.getDataset('spiral', {
  sampleCount: 200,
  noiseLevel: 0.1,
  preprocessing: 'normalize'
});
```

---

### IStorageService

Abstracts persistence (LocalStorage, IndexedDB, backend API, etc.).

**Location**: `src/core/ports/IStorageService.ts`

#### Interface Definition

```typescript
interface IStorageService {
  save(key: string, value: unknown): Promise<void>;
  load<T>(key: string): Promise<T | null>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}
```

#### Methods

##### `save(key: string, value: unknown): Promise<void>`

Saves data to persistent storage.

**Parameters**:
- `key: string` - Storage key
- `value: unknown` - Data to save (will be JSON-serialized)

**Example**:
```typescript
await storage.save('session', {
  hyperparameters: config,
  dataset: dataPoints,
  history: trainingHistory
});
```

---

##### `load<T>(key: string): Promise<T | null>`

Loads data from persistent storage.

**Parameters**:
- `key: string` - Storage key

**Returns**:
- `Promise<T | null>` - Loaded data or null if not found

**Example**:
```typescript
const session = await storage.load<SessionData>('session');
if (session) {
  // Restore session
}
```

---

### ITrainingSession

Public API for training orchestration.

**Location**: `src/core/application/ITrainingSession.ts`

#### Interface Definition

```typescript
interface ITrainingSession {
  setHyperparameters(config: Hyperparameters): Promise<void>;
  setTrainingConfig(config: Partial<TrainingConfig>): void;
  loadData(datasetType: string, options?: DatasetOptions): Promise<void>;
  setCustomData(points: Point[]): void;

  start(): void;
  pause(): void;
  step(): Promise<void>;
  reset(): void;

  getState(): TrainingState;
  onStateChange(callback: (state: TrainingState) => void): () => void;

  exportHistory(format: ExportFormat): string;
  runLRFinder(minLR?: number, maxLR?: number, steps?: number): Promise<Array<{ lr: number; loss: number }>>;

  undoConfig(): Promise<boolean>;
  redoConfig(): Promise<boolean>;
  canUndo(): boolean;
  canRedo(): boolean;

  dispose(): void;
}
```

See [TrainingSession](#trainingsession) for detailed method documentation.

---

## Domain Models

### Point

Represents a 2D data point with class label.

**Location**: `src/core/domain/Point.ts`

```typescript
interface Point {
  readonly x: number;           // X coordinate
  readonly y: number;           // Y coordinate
  readonly label: number;       // Class label (0, 1, 2, ...)
  readonly isValidation?: boolean;  // Validation set flag
}
```

**Example**:
```typescript
const point: Point = { x: 0.5, y: -0.3, label: 1 };
```

---

### Prediction

Model output with confidence scores.

**Location**: `src/core/domain/Prediction.ts`

```typescript
interface Prediction {
  readonly x: number;
  readonly y: number;
  readonly confidence: number;       // Confidence in predicted class (0-1)
  readonly predictedClass: number;   // Predicted class label
  readonly probabilities: number[];  // Class probabilities (softmax output)
}
```

**Example**:
```typescript
const prediction: Prediction = {
  x: 0.5,
  y: -0.3,
  confidence: 0.92,
  predictedClass: 1,
  probabilities: [0.08, 0.92]  // Binary classification
};

// Multi-class:
const multiClass: Prediction = {
  x: 0.0,
  y: 0.0,
  confidence: 0.75,
  predictedClass: 2,
  probabilities: [0.15, 0.10, 0.75]  // 3-class
};
```

---

### Hyperparameters

Network architecture and training configuration.

**Location**: `src/core/domain/Hyperparameters.ts`

```typescript
interface Hyperparameters {
  readonly learningRate: number;        // 0.001 - 1.0
  readonly layers: number[];            // Hidden layer sizes [8, 4]
  readonly optimizer: OptimizerType;    // 'sgd' | 'adam' | 'rmsprop' | 'adagrad'
  readonly activation: ActivationType;  // 'relu' | 'sigmoid' | 'tanh' | 'elu'
  readonly momentum?: number;           // 0.0 - 1.0 (for SGD)
  readonly l1Regularization?: number;   // L1 penalty strength
  readonly l2Regularization?: number;   // L2 penalty strength
  readonly numClasses?: number;         // Number of output classes (default: 2)
  readonly dropoutRate?: number;        // 0.0 - 0.5
  readonly clipNorm?: number;           // Gradient clipping threshold
  readonly batchNorm?: boolean;         // Batch normalization
  readonly lossFunction?: LossType;     // 'crossEntropy' | 'mse' | 'hinge'
  readonly layerActivations?: ActivationType[];  // Per-layer activations
}
```

**Default Values**:
```typescript
const DEFAULT_HYPERPARAMETERS: Hyperparameters = {
  learningRate: 0.03,
  layers: [8, 4],
  optimizer: 'adam',
  activation: 'relu',
  momentum: 0.9,
  l1Regularization: 0,
  l2Regularization: 0,
  numClasses: 2,
  dropoutRate: 0,
  clipNorm: 0,
  batchNorm: false,
  lossFunction: 'crossEntropy'
};
```

---

### TrainingConfig

Runtime training loop configuration.

**Location**: `src/core/domain/Hyperparameters.ts`

```typescript
interface TrainingConfig {
  readonly batchSize?: number;          // 0 = full batch
  readonly maxEpochs?: number;          // 0 = unlimited
  readonly targetFps?: number;          // Training speed (15-120)
  readonly validationSplit?: number;    // 0.0 - 0.5
  readonly lrSchedule?: LRScheduleConfig;
  readonly earlyStoppingPatience?: number;  // 0 = disabled
  readonly epochDelayMs?: number;       // Delay between epochs
}
```

**Learning Rate Schedule**:
```typescript
interface LRScheduleConfig {
  readonly type: LRScheduleType;  // 'constant' | 'exponential' | 'step' | 'cosine' | 'cyclic_triangular' | 'cyclic_cosine'
  readonly decayRate?: number;    // For exponential/step
  readonly decaySteps?: number;   // For step decay
  readonly warmupEpochs?: number; // For all types
  readonly cycleLength?: number;  // For cyclic schedules
  readonly minLR?: number;        // Minimum learning rate
}
```

**Example**:
```typescript
const config: TrainingConfig = {
  batchSize: 32,
  maxEpochs: 500,
  targetFps: 60,
  validationSplit: 0.2,
  lrSchedule: {
    type: 'cosine',
    warmupEpochs: 10,
    minLR: 0.001
  },
  earlyStoppingPatience: 20
};
```

---

### TrainingHistory

Metrics recorded over time.

**Location**: `src/core/domain/TrainingHistory.ts`

```typescript
interface TrainingHistory {
  readonly records: TrainingRecord[];
  readonly startTime: number;
}

interface TrainingRecord {
  readonly epoch: number;
  readonly loss: number;
  readonly accuracy: number;
  readonly valLoss: number | null;
  readonly valAccuracy: number | null;
  readonly timestamp: number;
  readonly learningRate: number;
}
```

**Example**:
```typescript
const history = session.getHistory();

// Export as JSON
const json = exportHistory(history, 'json');

// Export as CSV
const csv = exportHistory(history, 'csv');

// Export as formatted text
const text = exportHistory(history, 'text');
```

---

### TrainingState

Current training state snapshot.

**Location**: `src/core/application/ITrainingSession.ts`

```typescript
interface TrainingState {
  readonly currentEpoch: number;
  readonly currentLoss: number | null;
  readonly currentAccuracy: number | null;
  readonly currentValLoss: number | null;
  readonly currentValAccuracy: number | null;
  readonly isRunning: boolean;
  readonly isPaused: boolean;
  readonly isProcessing: boolean;
  readonly isInitialised: boolean;
  readonly datasetLoaded: boolean;
  readonly maxEpochs: number;
  readonly batchSize: number;
  readonly targetFps: number;
  readonly validationSplit: number;
  readonly history: TrainingHistory;
}
```

**Example**:
```typescript
const state = session.getState();

if (state.isRunning && !state.isPaused) {
  console.log(`Epoch ${state.currentEpoch}: Loss ${state.currentLoss}`);
}
```

---

## Application Classes

### TrainingSession

Main orchestrator for neural network training.

**Location**: `src/core/application/TrainingSession.ts`

#### Constructor

```typescript
constructor(
  neuralNet: INeuralNetworkService,
  visualizer: IVisualizerService,
  dataRepo: IDatasetRepository,
  config?: Partial<TrainingSessionConfig>
)
```

**Parameters**:
- `neuralNet: INeuralNetworkService` - ML framework adapter
- `visualizer: IVisualizerService` - Visualization adapter
- `dataRepo: IDatasetRepository` - Dataset adapter
- `config?: TrainingSessionConfig` - Optional configuration

**Example**:
```typescript
const session = new TrainingSession(
  new TFNeuralNet(),
  new D3Chart('viz-container'),
  new MockDataRepository(),
  { renderInterval: 10, gridSize: 50 }
);
```

#### Methods

##### `async setHyperparameters(config: Hyperparameters): Promise<void>`

Initializes network with given configuration.

**Example**:
```typescript
await session.setHyperparameters({
  learningRate: 0.03,
  layers: [16, 8],
  optimizer: 'adam',
  activation: 'relu'
});
```

---

##### `setTrainingConfig(config: Partial<TrainingConfig>): void`

Updates runtime training configuration.

**Example**:
```typescript
session.setTrainingConfig({
  batchSize: 64,
  maxEpochs: 1000,
  targetFps: 60,
  validationSplit: 0.25
});
```

---

##### `async loadData(datasetType: string, options?: DatasetOptions): Promise<void>`

Loads a dataset from the repository.

**Example**:
```typescript
await session.loadData('spiral', {
  sampleCount: 300,
  noiseLevel: 0.15,
  preprocessing: 'standardize'
});
```

---

##### `setCustomData(points: Point[]): void`

Sets custom data points (for draw mode or CSV upload).

**Example**:
```typescript
session.setCustomData([
  { x: 0.5, y: 0.3, label: 0 },
  { x: -0.2, y: 0.8, label: 1 }
]);
```

---

##### `start(): void`

Starts continuous training.

**Example**:
```typescript
session.start();
```

---

##### `pause(): void`

Pauses training (can be resumed with `start()`).

**Example**:
```typescript
session.pause();
```

---

##### `async step(): Promise<void>`

Executes a single training epoch.

**Example**:
```typescript
await session.step();
```

---

##### `reset(): void`

Resets training state to epoch 0.

**Example**:
```typescript
session.reset();
```

---

##### `getState(): TrainingState`

Returns current training state.

**Example**:
```typescript
const state = session.getState();
console.log(`Epoch ${state.currentEpoch}, Loss: ${state.currentLoss}`);
```

---

##### `onStateChange(callback: (state: TrainingState) => void): () => void`

Registers a state change listener.

**Returns**:
- Unsubscribe function

**Example**:
```typescript
const unsubscribe = session.onStateChange((state) => {
  updateUI(state);
});

// Later:
unsubscribe();
```

---

##### `exportHistory(format: ExportFormat): string`

Exports training history.

**Parameters**:
- `format: 'json' | 'csv' | 'text'`

**Returns**:
- Formatted history string

**Example**:
```typescript
const json = session.exportHistory('json');
const csv = session.exportHistory('csv');
```

---

##### `async runLRFinder(minLR = 1e-7, maxLR = 1, steps = 100): Promise<Array<{ lr: number; loss: number }>>`

Runs learning rate finder to discover optimal LR.

**Returns**:
- Array of LR/loss pairs

**Example**:
```typescript
const results = await session.runLRFinder(1e-6, 0.1, 100);
const optimalLR = findOptimalLR(results);
```

---

##### `getCurrentLearningRate(): number`

Gets current learning rate (after schedule adjustments).

**Example**:
```typescript
const lr = session.getCurrentLearningRate();
```

---

##### `async undoConfig(): Promise<boolean>`

Reverts to previous hyperparameter configuration.

**Returns**:
- `true` if undo successful, `false` if no history

**Example**:
```typescript
if (await session.undoConfig()) {
  console.log('Reverted to previous config');
}
```

---

##### `async redoConfig(): Promise<boolean>`

Re-applies next configuration in history.

**Example**:
```typescript
if (await session.redoConfig()) {
  console.log('Re-applied config');
}
```

---

##### `canUndo(): boolean` / `canRedo(): boolean`

Checks if undo/redo is available.

**Example**:
```typescript
const undoBtn = document.getElementById('undo');
undoBtn.disabled = !session.canUndo();
```

---

##### `dispose(): void`

Cleans up resources and stops training.

**Example**:
```typescript
session.dispose();
```

---

### LearningRateScheduler

Manages learning rate schedules.

**Location**: `src/core/application/training/LearningRateScheduler.ts`

#### Methods

```typescript
class LearningRateScheduler {
  constructor(initialLR: number, schedule: LRScheduleConfig);

  calculateLR(epoch: number, totalEpochs: number): number;
  getCurrentLR(): number;
  setSchedule(schedule: LRScheduleConfig): void;
  setInitialLR(lr: number): void;
  hasSignificantChange(previousLR: number, threshold: number): boolean;
}
```

**Example**:
```typescript
const scheduler = new LearningRateScheduler(0.03, {
  type: 'cosine',
  warmupEpochs: 10,
  minLR: 0.001
});

const lr = scheduler.calculateLR(50, 500);
```

---

### EarlyStoppingStrategy

Implements early stopping logic.

**Location**: `src/core/application/training/EarlyStoppingStrategy.ts`

#### Methods

```typescript
class EarlyStoppingStrategy {
  constructor(patience: number);

  shouldStop(valLoss: number | null): boolean;
  reset(): void;
  setPatience(patience: number): void;
  getBestValLoss(): number;
  getEpochsWithoutImprovement(): number;
}
```

**Example**:
```typescript
const earlyStop = new EarlyStoppingStrategy(20);

if (earlyStop.shouldStop(valLoss)) {
  console.log('Early stopping triggered!');
  session.pause();
}
```

---

### TrainingDataSplitter

Splits data into training/validation sets.

**Location**: `src/core/application/training/TrainingDataSplitter.ts`

#### Methods

```typescript
class TrainingDataSplitter {
  split(
    data: Point[],
    validationSplit: number,
    stratify: boolean
  ): { training: Point[]; validation: Point[]; all: Point[] };
}
```

**Example**:
```typescript
const splitter = new TrainingDataSplitter();
const { training, validation } = splitter.split(allData, 0.2, true);
```

---

## Infrastructure Adapters

### TFNeuralNet

TensorFlow.js implementation of `INeuralNetworkService`.

**Location**: `src/infrastructure/tensorflow/TFNeuralNet.ts`

#### Additional Methods

```typescript
class TFNeuralNet implements INeuralNetworkService {
  // ... interface methods ...

  async exportModel(): Promise<{ modelJson: Blob; weightsBlob: Blob }>;
  getWeights(): number[];
  getConfig(): Hyperparameters | null;
  setLearningRate(lr: number): void;
  generateDropoutMask(dropoutRate: number): boolean[][];

  static getMemoryInfo(): { numTensors: number; numBytes: number };
}
```

**Example**:
```typescript
const { modelJson, weightsBlob } = await tfNet.exportModel();

const memInfo = TFNeuralNet.getMemoryInfo();
console.log(`GPU Memory: ${memInfo.numBytes} bytes, ${memInfo.numTensors} tensors`);
```

---

### D3Chart

D3.js implementation of `IVisualizerService`.

**Location**: `src/infrastructure/d3/D3Chart.ts`

#### Constructor

```typescript
constructor(containerId: string)
```

**Parameters**:
- `containerId: string` - DOM element ID for chart container

#### Additional Methods

```typescript
class D3Chart implements IVisualizerService {
  // ... interface methods ...

  resize(width: number, height: number): void;
  exportAsPNGWithMetadata(filename: string, metadata: Record<string, string>): void;
}
```

**Example**:
```typescript
const chart = new D3Chart('viz-container');

chart.exportAsPNGWithMetadata('training-result', {
  'Learning Rate': '0.03',
  'Architecture': '8-4-1',
  'Final Loss': '0.042'
});
```

---

### MockDataRepository

Mock dataset generator implementing `IDatasetRepository`.

**Location**: `src/infrastructure/api/MockDataRepository.ts`

#### Supported Datasets

- `circle` - Circular decision boundary
- `xor` - XOR problem (not linearly separable)
- `spiral` - Two intertwined spirals
- `gaussian` - Two Gaussian clusters
- `iris` - Iris flower dataset (3 classes)
- `wine` - Wine quality dataset (3 classes)

**Example**:
```typescript
const repo = new MockDataRepository();
const data = await repo.getDataset('spiral', {
  sampleCount: 200,
  noiseLevel: 0.1
});
```

---

### LocalStorageService

Browser LocalStorage implementation of `IStorageService`.

**Location**: `src/infrastructure/storage/LocalStorageService.ts`

**Example**:
```typescript
const storage = new LocalStorageService();

await storage.save('session', sessionData);
const loaded = await storage.load<SessionData>('session');
```

---

## Commands

### InitializeNetworkCommand

Initializes neural network with validation.

**Location**: `src/core/application/commands/InitializeNetworkCommand.ts`

```typescript
class InitializeNetworkCommand implements ICommand {
  execute(
    session: TrainingSession,
    config: InitializeNetworkConfig
  ): Promise<CommandResult>;
}
```

**Example**:
```typescript
const command = new InitializeNetworkCommand(session, {
  learningRate: 0.03,
  layers: [8, 4],
  optimizer: 'adam',
  activation: 'relu'
});

const result = await commandExecutor.execute(command);
```

---

### StartTrainingCommand

Validates and starts training.

**Location**: `src/core/application/commands/StartTrainingCommand.ts`

```typescript
class StartTrainingCommand implements ICommand {
  execute(session: TrainingSession): Promise<CommandResult>;
}
```

**Example**:
```typescript
const command = new StartTrainingCommand(session);
const result = await commandExecutor.execute(command);

if (!result.success) {
  console.error(result.validationResult.message);
}
```

---

### StepTrainingCommand

Executes single training step with validation.

**Location**: `src/core/application/commands/StepTrainingCommand.ts`

```typescript
class StepTrainingCommand implements ICommand {
  execute(session: TrainingSession): Promise<CommandResult>;
}
```

---

### UpdateTrainingConfigCommand

Updates runtime training configuration.

**Location**: `src/core/application/commands/UpdateTrainingConfigCommand.ts`

```typescript
class UpdateTrainingConfigCommand implements ICommand {
  constructor(
    session: TrainingSession,
    config: Partial<TrainingConfig>
  );

  execute(): Promise<CommandResult>;
}
```

**Example**:
```typescript
const command = new UpdateTrainingConfigCommand(session, {
  batchSize: 64,
  maxEpochs: 1000
});

await commandExecutor.execute(command);
```

---

## Type Definitions

### Enumerations

```typescript
type OptimizerType = 'sgd' | 'adam' | 'rmsprop' | 'adagrad';

type ActivationType =
  | 'linear'
  | 'relu'
  | 'sigmoid'
  | 'tanh'
  | 'leaky_relu'
  | 'elu'
  | 'selu'
  | 'softmax';

type LossType = 'crossEntropy' | 'mse' | 'hinge';

type LRScheduleType =
  | 'constant'
  | 'exponential'
  | 'step'
  | 'cosine'
  | 'warmup_cosine'
  | 'cyclic_triangular'
  | 'cyclic_cosine';

type ExportFormat = 'json' | 'csv' | 'text';

type ColourScheme =
  | 'default'
  | 'viridis'
  | 'plasma'
  | 'warm'
  | 'cool'
  | 'rainbow';
```

---

## Error Handling

### Custom Errors

```typescript
// src/infrastructure/tensorflow/errors.ts

class GradientExplosionError extends Error {
  constructor() {
    super('Training diverged: Loss became NaN. Try reducing learning rate.');
  }
}

class ModelNotInitialisedError extends Error {
  constructor() {
    super('Model not initialized. Call initialize() first.');
  }
}
```

**Handling**:
```typescript
try {
  await neuralNet.train(data);
} catch (error) {
  if (error instanceof GradientExplosionError) {
    toast.error('Training diverged! Try reducing learning rate.');
    session.reset();
  }
}
```

---

## Best Practices

### 1. Always Check Initialization

```typescript
if (!neuralNet.isReady()) {
  await neuralNet.initialize(config);
}
```

### 2. Subscribe to State Changes

```typescript
session.onStateChange((state) => {
  updateUI(state);
  if (state.currentLoss && state.currentLoss < 0.01) {
    session.pause();
    toast.success('Target loss reached!');
  }
});
```

### 3. Dispose Resources

```typescript
// On component unmount or page unload
session.dispose();
visualizer.dispose();
neuralNet.dispose();
```

### 4. Use Commands for Complex Operations

```typescript
// ❌ Don't: Direct method calls without validation
await session.setHyperparameters(config);

// ✅ Do: Use commands for validation and error handling
const command = new InitializeNetworkCommand(session, config);
const result = await commandExecutor.execute(command);

if (!result.success) {
  handleError(result.validationResult);
}
```

### 5. Handle Async Operations

```typescript
// ❌ Don't: Forget to await
session.step();  // Step won't complete!

// ✅ Do: Await async operations
await session.step();
```

---

## See Also

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture deep dive
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development guide
- [FEATURES.md](./FEATURES.md) - Feature documentation
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) - TypeScript reference
