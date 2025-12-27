# NeuroViz Architecture Documentation

## Table of Contents

- [Overview](#overview)
- [Hexagonal Architecture](#hexagonal-architecture)
- [Layer Breakdown](#layer-breakdown)
- [Design Patterns](#design-patterns)
- [Dependency Flow](#dependency-flow)
- [Module Organization](#module-organization)
- [Key Design Decisions](#key-design-decisions)
- [Data Flow](#data-flow)
- [Extensibility](#extensibility)

---

## Overview

NeuroViz implements **Hexagonal Architecture** (also known as Ports & Adapters) to achieve:

- **Complete decoupling** of business logic from infrastructure
- **Framework independence** - core logic has zero TensorFlow.js or D3.js dependencies
- **Testability** - easy to mock external dependencies
- **Maintainability** - changes to UI/infrastructure don't affect business rules
- **Swappability** - can replace TensorFlow.js with ONNX without touching core logic

### Architectural Goals

1. **Business Logic Isolation**: Core domain never imports infrastructure modules
2. **Dependency Inversion**: Abstractions (ports) defined in core, implementations (adapters) in infrastructure
3. **Single Responsibility**: Each module has one reason to change
4. **Explicit Contracts**: Interfaces define clear boundaries between layers

---

## Hexagonal Architecture

### The Hexagon Metaphor

```
                    Outside World (Infrastructure)
                              │
                    ┌─────────▼─────────┐
                    │                   │
         ┌──────────┤   Presentation    ├──────────┐
         │          │   Controllers     │          │
         │          │                   │          │
         │          └─────────┬─────────┘          │
         │                    │                    │
         │          ┌─────────▼─────────┐          │
         │          │                   │          │
    Adapters        │   Application     │      Adapters
   (Inbound)        │   Use Cases       │     (Outbound)
         │          │  TrainingSession  │          │
         │          │                   │          │
         │          └─────────┬─────────┘          │
         │                    │                    │
         │          ┌─────────▼─────────┐          │
         │          │                   │          │
         │          │   Core Domain     │          │
         │          │  Entities, Ports  │          │
         │          │  Business Rules   │          │
         │          │                   │          │
         │          └───────────────────┘          │
         │                                         │
         └─────────────────┬─────────────────────┘
                           │
                Infrastructure Adapters
            (TFNeuralNet, D3Chart, MockDataRepo)
```

### Port Types

**Inbound Ports (Primary/Driving)**:
- `ITrainingSession` - Exposed to UI controllers
- Entry points for user interactions

**Outbound Ports (Secondary/Driven)**:
- `INeuralNetworkService` - ML framework abstraction
- `IVisualizerService` - Charting library abstraction
- `IDatasetRepository` - Data source abstraction
- `IStorageService` - Persistence abstraction
- `ILogger` - Logging abstraction

---

## Layer Breakdown

### 1. Core/Domain Layer

**Location**: `src/core/`

**Purpose**: Framework-agnostic business logic and domain entities

**Dependencies**: NONE (zero imports from infrastructure or presentation)

**Structure**:
```
src/core/
├── domain/                     # Entities and value objects
│   ├── Point.ts               # (x, y, label) data point
│   ├── Prediction.ts          # Model output with confidence
│   ├── Hyperparameters.ts     # Network configuration
│   ├── TrainingHistory.ts     # Metrics over time
│   ├── TrainingConfig.ts      # Training loop settings
│   ├── VisualizationConfig.ts # Rendering preferences
│   ├── ModelComplexity.ts     # Complexity metrics
│   ├── AdversarialExample.ts  # Adversarial attack logic
│   ├── Tutorial.ts            # Tutorial definitions
│   ├── Challenge.ts           # Challenge definitions
│   └── Tooltip.ts             # Tooltip registry
│
├── ports/                      # Interfaces (contracts)
│   ├── INeuralNetworkService.ts  # ML abstraction
│   ├── IVisualizerService.ts     # Chart abstraction
│   ├── IDatasetRepository.ts     # Data source abstraction
│   ├── IStorageService.ts        # Persistence abstraction
│   └── ILogger.ts                # Logging abstraction
│
├── application/                # Use cases and orchestration
│   ├── TrainingSession.ts     # Main training orchestrator
│   ├── ITrainingSession.ts    # Public API interface
│   ├── ModelComparison.ts     # A/B testing logic
│   ├── ModelEnsemble.ts       # Ensemble management
│   ├── commands/              # Command pattern implementations
│   │   ├── CommandExecutor.ts
│   │   ├── InitializeNetworkCommand.ts
│   │   ├── StartTrainingCommand.ts
│   │   ├── StepTrainingCommand.ts
│   │   └── UpdateTrainingConfigCommand.ts
│   └── training/              # Training strategies
│       ├── LearningRateScheduler.ts
│       ├── EarlyStoppingStrategy.ts
│       └── TrainingDataSplitter.ts
│
└── research/                   # Advanced ML algorithms
    ├── LIMEExplainer.ts       # Local interpretability
    ├── SaliencyMaps.ts        # Gradient visualization
    ├── FeatureImportance.ts   # Feature ranking
    ├── AdversarialExamples.ts # Attack generation
    ├── BayesianNN.ts          # Uncertainty estimation
    └── NeuralArchitectureSearch.ts  # NAS implementation
```

**Key Principles**:
- **Immutability**: Domain entities are readonly
- **Pure Functions**: No side effects in domain logic
- **Validation**: Business rules enforced at construction time
- **No Framework Dependencies**: Can be tested without TensorFlow or D3

**Example Domain Entity**:
```typescript
// src/core/domain/Point.ts
export interface Point {
  readonly x: number;
  readonly y: number;
  readonly label: number;
  readonly isValidation?: boolean;
}

// Immutable by design - must create new instances for changes
```

---

### 2. Infrastructure Layer

**Location**: `src/infrastructure/`

**Purpose**: Framework-specific implementations (adapters)

**Dependencies**: External libraries (TensorFlow.js, D3.js, Three.js)

**Structure**:
```
src/infrastructure/
├── tensorflow/                # TensorFlow.js adapter
│   ├── TFNeuralNet.ts        # Implements INeuralNetworkService
│   └── errors.ts             # TF-specific errors
│
├── d3/                       # D3.js visualization adapters
│   ├── D3Chart.ts            # Implements IVisualizerService
│   ├── D3LossChart.ts        # Loss/accuracy over time
│   ├── D3ConfusionMatrix.ts  # Multi-class evaluation
│   ├── D3NetworkDiagram.ts   # Layer visualization
│   ├── D3ActivationHeatmap.ts # Neuron activations
│   ├── D3GradientFlow.ts     # Backprop visualization
│   ├── D3WeightHistogram.ts  # Weight distribution
│   ├── D3RocCurve.ts         # Binary classification ROC
│   ├── D3LRFinder.ts         # LR finder chart
│   └── D3VoronoiOverlay.ts   # Voronoi diagram
│
├── api/                      # Data repository adapters
│   ├── MockDataRepository.ts # Implements IDatasetRepository
│   └── RestAPI.ts            # Future real API adapter
│
├── storage/                  # Persistence adapters
│   └── LocalStorageService.ts # Implements IStorageService
│
├── logging/                  # Logging adapters
│   └── Logger.ts             # Implements ILogger
│
├── education/                # Educational services
│   ├── TutorialService.ts    # Tutorial orchestration
│   ├── TooltipService.ts     # Tooltip management
│   ├── ChallengeService.ts   # Challenge validation
│   └── ExplainMomentService.ts # Educational moments
│
├── ml/                       # Advanced ML features
│   └── AdvancedFeaturesService.ts # Adversarial, complexity, etc.
│
├── export/                   # Export services
│   ├── TrainingReport.ts     # HTML report generation
│   ├── PythonCodeGenerator.ts # Python export
│   ├── GifEncoder.ts         # Animated GIF export
│   └── onnxExport.ts         # ONNX conversion
│
├── three/                    # 3D visualization (experimental)
│   └── ThreeVisualization.ts # WebGL 3D network
│
├── webgl/                    # WebGL accelerated rendering
│   └── WebGLRenderer.ts      # GPU-accelerated charts
│
├── performance/              # Performance optimization
│   ├── ProgressiveRenderer.ts # Lazy rendering
│   └── FrameRateLimiter.ts   # FPS throttling
│
├── security/                 # Security utilities
│   └── htmlSanitizer.ts      # XSS prevention
│
├── plugins/                  # Plugin system
│   └── PluginManager.ts      # Dynamic extensions
│
├── realtime/                 # Real-time features
│   └── WebSocketManager.ts   # Live collaboration
│
└── errorHandling/            # Error boundaries
    └── ErrorBoundary.ts      # UI error handling
```

**Adapter Pattern Example**:
```typescript
// src/infrastructure/tensorflow/TFNeuralNet.ts
import * as tf from '@tensorflow/tfjs';
import type { INeuralNetworkService } from '../../core/ports';

// Encapsulates ALL TensorFlow.js logic
export class TFNeuralNet implements INeuralNetworkService {
  private model: tf.Sequential | null = null;

  async initialize(config: Hyperparameters): Promise<void> {
    this.model = tf.sequential();
    // Build model architecture...
  }

  async train(data: Point[]): Promise<TrainResult> {
    // TensorFlow-specific training logic
  }

  async predict(grid: Point[]): Promise<Prediction[]> {
    // TensorFlow-specific inference logic
  }

  dispose(): void {
    this.model?.dispose(); // TF memory management
  }
}
```

**Key Principles**:
- **Adapter Implementation**: Each adapter implements a core port interface
- **Encapsulation**: Framework details never leak outside adapter boundaries
- **Resource Management**: Adapters handle their own lifecycle (dispose, cleanup)
- **Error Translation**: Framework errors mapped to domain errors

---

### 3. Application Layer

**Location**: `src/core/application/`

**Purpose**: Orchestrates domain entities and coordinates infrastructure adapters

**Dependencies**: Core domain, core ports (NOT infrastructure implementations)

**Key Component: TrainingSession**

The `TrainingSession` class is the **main orchestrator** that:

1. **Accepts dependencies via constructor injection**:
   ```typescript
   constructor(
     private neuralNet: INeuralNetworkService,  // Port, not adapter
     private visualizer: IVisualizerService,    // Port, not adapter
     private dataRepo: IDatasetRepository,      // Port, not adapter
     config: TrainingSessionConfig
   )
   ```

2. **Implements use cases**:
   - `setHyperparameters()` - Configure network architecture
   - `loadData()` - Fetch and preprocess dataset
   - `start()` - Begin continuous training
   - `pause()` - Suspend training
   - `step()` - Train single epoch
   - `reset()` - Clear training state
   - `exportHistory()` - Generate reports

3. **Manages training loop**:
   ```typescript
   private async loop(): Promise<void> {
     // Guard-rail pattern prevents overlapping GPU calls
     if (!this.isTraining || this.isPaused) return;
     if (this.isProcessingStep) {
       requestAnimationFrame(() => void this.loop());
       return;
     }

     this.isProcessingStep = true;
     try {
       // Train one epoch
       const result = await this.neuralNet.train(batch);
       // Update visualizations
       await this.updateVisualisation();
       // Notify listeners
       this.notifyListeners();
     } finally {
       this.isProcessingStep = false;
     }

     requestAnimationFrame(() => void this.loop());
   }
   ```

4. **Provides state notifications**:
   ```typescript
   onStateChange(callback: (state: TrainingState) => void): void {
     this.stateListeners.add(callback);
   }
   ```

**Command Pattern Implementation**:

Commands encapsulate validation and execution logic:

```typescript
// src/core/application/commands/InitializeNetworkCommand.ts
export class InitializeNetworkCommand implements ICommand {
  execute(session: TrainingSession, config: InitializeNetworkConfig) {
    // Validate configuration
    const validation = this.validate(config);
    if (!validation.isValid) {
      return { success: false, validationResult: validation };
    }

    // Map to domain model
    const hyperparameters: Hyperparameters = {
      learningRate: config.learningRate,
      layers: config.layers,
      optimizer: config.optimizer,
      // ...
    };

    // Execute business logic
    await session.setHyperparameters(hyperparameters);

    return { success: true };
  }
}
```

---

### 4. Presentation Layer

**Location**: `src/presentation/`

**Purpose**: UI controllers that handle user interactions

**Dependencies**: Application layer (TrainingSession), infrastructure services

**Structure**:
```
src/presentation/
├── controllers/
│   ├── TrainingController.ts      # Training UI orchestration
│   ├── DatasetController.ts       # Dataset management UI
│   ├── VisualizationController.ts # Chart controls
│   ├── EducationController.ts     # Tutorial/challenge UI
│   ├── ExportController.ts        # Export functionality
│   ├── SessionController.ts       # Session persistence
│   ├── ResearchController.ts      # Advanced ML tools
│   └── ComparisonController.ts    # Model comparison UI
│
├── Sidebar.ts                     # Sidebar navigation
├── BottomSheet.ts                 # Mobile-friendly controls
├── Tutorial.ts                    # Tutorial overlay
├── Onboarding.ts                  # First-time user flow
├── toast.ts                       # Toast notifications
├── SuggestedFixes.ts              # Smart error suggestions
├── WhatIfAnalysis.ts              # Parameter simulation
├── ELI5Tooltips.ts                # Contextual help
└── TouchGestures.ts               # Mobile gesture handling
```

**Controller Responsibilities**:

1. **Bind UI events**:
   ```typescript
   private bindEvents(): void {
     this.elements.btnStart.addEventListener('click', () => {
       void this.handleStart();
     });
   }
   ```

2. **Translate user actions to commands**:
   ```typescript
   async handleInitialise(): Promise<void> {
     const config = this.buildConfig();
     const command = new InitializeNetworkCommand(session, config);
     const result = await commandExecutor.execute(command);

     if (!result.success) {
       toast.error(result.validationResult.message);
     }
   }
   ```

3. **Update UI based on state**:
   ```typescript
   updateUI(state: TrainingState): void {
     this.elements.epochValue.textContent = state.currentEpoch.toString();
     this.elements.lossValue.textContent = state.currentLoss?.toFixed(4) ?? '—';
     setEnabled(this.elements.btnStart, state.isInitialised);
   }
   ```

4. **Manage lifecycle**:
   ```typescript
   dispose(): void {
     // Clean up event listeners to prevent memory leaks
     for (const { element, event, handler } of this.eventCleanup) {
       element.removeEventListener(event, handler);
     }
   }
   ```

---

## Design Patterns

### 1. Hexagonal Architecture (Ports & Adapters)

**Intent**: Isolate core business logic from external dependencies

**Implementation**:
- Core defines **ports** (interfaces)
- Infrastructure provides **adapters** (implementations)
- Application orchestrates via dependency injection

**Example**:
```typescript
// Port (in core)
export interface INeuralNetworkService {
  initialize(config: Hyperparameters): Promise<void>;
  train(data: Point[]): Promise<TrainResult>;
  predict(grid: Point[]): Promise<Prediction[]>;
}

// Adapter (in infrastructure)
export class TFNeuralNet implements INeuralNetworkService {
  // TensorFlow.js implementation
}

// Composition Root (in main.ts)
const neuralNet = new TFNeuralNet();
const session = new TrainingSession(neuralNet, visualizer, dataRepo);
```

---

### 2. Command Pattern

**Intent**: Encapsulate requests as objects, enabling validation and undo/redo

**Implementation**:
```typescript
export interface ICommand {
  execute(session: TrainingSession, config: unknown): Promise<CommandResult>;
  validate(config: unknown): ValidationResult;
}

export class CommandExecutor {
  async execute(command: ICommand): Promise<CommandResult> {
    return await command.execute();
  }
}
```

**Benefits**:
- Validation logic co-located with business logic
- Commands are testable in isolation
- Enables command queuing, logging, undo/redo
- Reduces controller complexity

**Commands**:
- `InitializeNetworkCommand` - Network setup
- `StartTrainingCommand` - Begin training
- `StepTrainingCommand` - Single epoch
- `UpdateTrainingConfigCommand` - Runtime config changes

---

### 3. Strategy Pattern

**Intent**: Define family of algorithms, make them interchangeable

**Implementation**:

**Learning Rate Schedulers**:
```typescript
export class LearningRateScheduler {
  constructor(
    private initialLR: number,
    private schedule: LRScheduleConfig
  ) {}

  calculateLR(epoch: number, totalEpochs: number): number {
    switch (this.schedule.type) {
      case 'constant': return this.initialLR;
      case 'exponential': return this.exponentialDecay(epoch);
      case 'step': return this.stepDecay(epoch);
      case 'cosine': return this.cosineAnnealing(epoch, totalEpochs);
      // ...
    }
  }
}
```

**Early Stopping Strategies**:
```typescript
export class EarlyStoppingStrategy {
  shouldStop(valLoss: number | null): boolean {
    if (valLoss === null) return false;

    if (valLoss < this.bestValLoss) {
      this.bestValLoss = valLoss;
      this.epochsWithoutImprovement = 0;
    } else {
      this.epochsWithoutImprovement++;
    }

    return this.epochsWithoutImprovement >= this.patience;
  }
}
```

---

### 4. Observer Pattern

**Intent**: Notify dependents when state changes

**Implementation**:
```typescript
export class TrainingSession {
  private stateListeners = new Set<(state: TrainingState) => void>();

  onStateChange(callback: (state: TrainingState) => void): () => void {
    this.stateListeners.add(callback);
    return () => this.stateListeners.delete(callback); // Unsubscribe
  }

  private notifyListeners(): void {
    const state = this.getState();
    for (const listener of this.stateListeners) {
      listener(state);
    }
  }
}

// Usage in controller
session.onStateChange((state) => {
  trainingController.updateUI(state);
  lossChart.addDataPoint(state.currentLoss);
});
```

---

### 5. Factory Pattern

**Intent**: Centralize object creation with type safety

**Implementation**:
```typescript
// src/utils/UIFactory.ts
export class UIFactory {
  private static elementCache = new Map<string, HTMLElement>();

  static getElement<T extends HTMLElement>(id: string): T {
    const cached = this.elementCache.get(id);
    if (cached) return cached as T;

    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Element with ID "${id}" not found`);
    }

    this.elementCache.set(id, element);
    return element as T;
  }

  static getButton(id: string): HTMLButtonElement {
    return this.getElement<HTMLButtonElement>(id);
  }

  static getInput(id: string): HTMLInputElement {
    return this.getElement<HTMLInputElement>(id);
  }
}
```

**Benefits**:
- Type-safe DOM element retrieval
- Centralized error handling for missing elements
- Element caching for performance
- HMR support (cache invalidation on hot reload)

---

### 6. Repository Pattern

**Intent**: Abstract data access behind a uniform interface

**Implementation**:
```typescript
// Port (in core)
export interface IDatasetRepository {
  getDataset(type: string, options?: DatasetOptions): Promise<Point[]>;
}

// Mock Adapter (in infrastructure)
export class MockDataRepository implements IDatasetRepository {
  async getDataset(type: string): Promise<Point[]> {
    switch (type) {
      case 'circle': return this.generateCircleDataset();
      case 'xor': return this.generateXORDataset();
      // ...
    }
  }
}

// Future: Real API Adapter
export class RestAPIDataRepository implements IDatasetRepository {
  async getDataset(type: string): Promise<Point[]> {
    const response = await fetch(`/api/datasets/${type}`);
    return await response.json();
  }
}
```

---

## Dependency Flow

### Dependency Rule

**Dependencies point INWARD** (toward core domain):

```
Presentation → Application → Domain ← Infrastructure
     ↓              ↓           ↑           ↓
Controllers → TrainingSession → Ports ← Adapters
                              (Interfaces)
```

**Key Principles**:

1. **Core has ZERO infrastructure dependencies**:
   ```typescript
   // ❌ NEVER in core:
   import * as tf from '@tensorflow/tfjs';
   import * as d3 from 'd3';

   // ✅ ALWAYS in core:
   import type { INeuralNetworkService } from './ports';
   ```

2. **Infrastructure depends on core ports**:
   ```typescript
   // ✅ Infrastructure adapter
   import type { INeuralNetworkService } from '../../core/ports';
   import * as tf from '@tensorflow/tfjs';

   export class TFNeuralNet implements INeuralNetworkService {
     // Implementation using TensorFlow
   }
   ```

3. **Presentation depends on application**:
   ```typescript
   // ✅ Controller
   import { TrainingSession } from '../../core/application';
   import { CommandExecutor } from '../../core/application/commands';

   export class TrainingController {
     constructor(private session: TrainingSession) {}
   }
   ```

4. **Composition root wires everything**:
   ```typescript
   // main.ts - The ONLY place where adapters are instantiated
   const neuralNet = new TFNeuralNet();
   const visualizer = new D3Chart('viz-container');
   const dataRepo = new MockDataRepository();

   const session = new TrainingSession(neuralNet, visualizer, dataRepo);
   const controller = new TrainingController(session, elements);
   ```

---

## Module Organization

### Directory Structure Philosophy

**Co-location by Feature**:
```
src/core/domain/
├── Hyperparameters.ts       # Entity
├── TrainingHistory.ts       # Entity
├── ModelComplexity.ts       # Calculations
└── AdversarialExample.ts    # Logic
```

Not by type:
```
❌ src/entities/
❌ src/calculations/
❌ src/logic/
```

**Index Barrel Exports**:
```typescript
// src/core/domain/index.ts
export type { Point } from './Point';
export type { Prediction } from './Prediction';
export type { Hyperparameters } from './Hyperparameters';
export { DEFAULT_HYPERPARAMETERS } from './Hyperparameters';

// Usage:
import { Point, Prediction, DEFAULT_HYPERPARAMETERS } from '../core/domain';
```

---

## Key Design Decisions

### 1. Immutable Domain Entities

**Rationale**: Prevent accidental mutations, enable time-travel debugging

```typescript
export interface Point {
  readonly x: number;
  readonly y: number;
  readonly label: number;
}

// Must create new instances for changes
const updated: Point = { ...original, label: 1 };
```

---

### 2. Async Training Loop with Guard-Rail Pattern

**Problem**: TensorFlow.js operations are async, but `requestAnimationFrame` fires at 60fps

**Solution**: Mutex flag prevents overlapping GPU calls

```typescript
private isProcessingStep = false;

private async loop(): Promise<void> {
  if (this.isProcessingStep) {
    requestAnimationFrame(() => void this.loop());
    return; // Skip frame while GPU busy
  }

  this.isProcessingStep = true;
  try {
    await this.neuralNet.train(batch);
  } finally {
    this.isProcessingStep = false;
  }

  requestAnimationFrame(() => void this.loop());
}
```

**Benefits**:
- Prevents call stack pile-up
- Maintains 60fps UI responsiveness
- Safe GPU resource management

---

### 3. Constructor Injection

**All dependencies injected via constructor**:

```typescript
export class TrainingSession {
  constructor(
    private readonly neuralNet: INeuralNetworkService,
    private readonly visualizer: IVisualizerService,
    private readonly dataRepo: IDatasetRepository,
    config: TrainingSessionConfig = {}
  ) {
    // Dependencies are immutable (readonly)
  }
}
```

**Benefits**:
- Explicit dependencies (no hidden coupling)
- Easy to mock for testing
- Enforces dependency inversion principle

---

### 4. No Global State

**All state lives in classes or passed as parameters**:

```typescript
// ❌ Avoid global mutable state
let globalSession: TrainingSession;

// ✅ Encapsulate in classes
class Application {
  private session: TrainingSession;
  private controllers: Controllers;
}
```

**Exception**: Configuration constants

```typescript
// ✅ OK: Immutable constants
export const DEFAULT_HYPERPARAMETERS: Hyperparameters = {
  learningRate: 0.03,
  layers: [8, 4],
  // ...
};
```

---

### 5. Memory Management

**TensorFlow.js requires explicit disposal**:

```typescript
async train(data: Point[]): Promise<TrainResult> {
  const xs = tf.tensor2d(...);
  const ys = tf.tensor2d(...);

  try {
    const result = await model.trainOnBatch(xs, ys);
    return result;
  } finally {
    xs.dispose();  // CRITICAL: Prevent GPU memory leak
    ys.dispose();
  }
}
```

**D3.js resource cleanup**:

```typescript
dispose(): void {
  this.resizeObserver?.disconnect();
  this.tooltip?.remove();
  this.container.selectAll('*').remove();
}
```

---

## Data Flow

### Training Flow

```
1. User Action (UI)
   ↓
2. Controller receives event
   ↓
3. Controller creates Command
   ↓
4. Command validates input
   ↓
5. Command executes on TrainingSession
   ↓
6. TrainingSession orchestrates:
   - neuralNet.train(data)
   - visualizer.renderBoundary(predictions)
   ↓
7. TrainingSession notifies listeners
   ↓
8. Controllers update UI
```

### Detailed Example: Initialize Network

```typescript
// 1. User clicks "Initialize Network"
btnInit.addEventListener('click', async () => {

  // 2. Controller builds config from UI inputs
  const config = {
    learningRate: parseFloat(inputLR.value),
    layers: parseLayersInput(inputLayers.value),
    optimizer: inputOptimizer.value,
    // ...
  };

  // 3. Create command
  const command = new InitializeNetworkCommand(session, config);

  // 4. Execute command (validation happens inside)
  const result = await commandExecutor.execute(command);

  // 5. Handle result
  if (!result.success) {
    toast.error(result.validationResult.message);
    return;
  }

  // 6. Command internally calls:
  await session.setHyperparameters(hyperparameters);
    // Which calls:
    await neuralNet.initialize(config);
      // Which builds TensorFlow model

  // 7. State change notification triggers UI update
  session.notifyListeners();

  // 8. Controller updates UI
  toast.success('Network initialized!');
});
```

---

## Extensibility

### Adding a New ML Backend

**Example**: Replace TensorFlow.js with ONNX Runtime

**Step 1**: Create adapter in `src/infrastructure/onnx/`

```typescript
import * as ort from 'onnxruntime-web';
import type { INeuralNetworkService } from '../../core/ports';

export class ONNXNeuralNet implements INeuralNetworkService {
  private session: ort.InferenceSession | null = null;

  async initialize(config: Hyperparameters): Promise<void> {
    // Build ONNX model
  }

  async train(data: Point[]): Promise<TrainResult> {
    // ONNX training logic
  }

  async predict(grid: Point[]): Promise<Prediction[]> {
    // ONNX inference logic
  }

  dispose(): void {
    // ONNX cleanup
  }
}
```

**Step 2**: Swap adapter in `main.ts`

```typescript
// Before:
const neuralNet = new TFNeuralNet();

// After:
const neuralNet = new ONNXNeuralNet();

// TrainingSession code unchanged!
const session = new TrainingSession(neuralNet, visualizer, dataRepo);
```

**No changes required to**:
- Core domain logic
- TrainingSession
- Any controllers
- Any tests

---

### Adding a New Visualization Library

**Example**: Replace D3.js with Chart.js

**Step 1**: Create adapter in `src/infrastructure/chartjs/`

```typescript
import Chart from 'chart.js';
import type { IVisualizerService } from '../../core/ports';

export class ChartJSVisualizer implements IVisualizerService {
  private chart: Chart | null = null;

  renderData(points: Point[]): void {
    // Chart.js scatter plot
  }

  renderBoundary(predictions: Prediction[], gridSize: number): void {
    // Chart.js heatmap
  }

  clear(): void {
    this.chart?.destroy();
  }
}
```

**Step 2**: Swap adapter in `main.ts`

```typescript
// Before:
const visualizer = new D3Chart('viz-container');

// After:
const visualizer = new ChartJSVisualizer('viz-container');

// TrainingSession code unchanged!
const session = new TrainingSession(neuralNet, visualizer, dataRepo);
```

---

### Adding a New Feature

**Example**: Add batch normalization support

**Step 1**: Update domain model

```typescript
// src/core/domain/Hyperparameters.ts
export interface Hyperparameters {
  // ... existing fields
  readonly batchNorm?: boolean; // New field
}
```

**Step 2**: Update TensorFlow adapter

```typescript
// src/infrastructure/tensorflow/TFNeuralNet.ts
private buildModel(config: Hyperparameters): tf.Sequential {
  const model = tf.sequential();

  model.add(tf.layers.dense({ units: config.layers[0] }));

  if (config.batchNorm) {
    model.add(tf.layers.batchNormalization()); // New layer
  }

  // ... rest of model
}
```

**Step 3**: Update UI controller

```typescript
// src/presentation/controllers/TrainingController.ts
const config = {
  // ... existing fields
  batchNorm: elements.inputBatchNorm.checked, // New UI binding
};
```

**No changes required to**:
- TrainingSession orchestration logic
- Port interfaces (unless signature changes)
- Other adapters (D3Chart, MockDataRepository)

---

## Summary

NeuroViz's architecture achieves:

- **Maintainability**: Changes to infrastructure don't affect business logic
- **Testability**: Core logic tested without TensorFlow or D3
- **Swappability**: ML backend and visualization library are pluggable
- **Scalability**: New features added without modifying existing code
- **Clarity**: Explicit dependencies and clear layer boundaries

**Key Takeaways**:

1. Core domain is **framework-agnostic** (zero TensorFlow/D3 imports)
2. Infrastructure adapters **implement core ports** (dependency inversion)
3. Application layer **orchestrates via injected dependencies** (composition root)
4. Presentation layer **translates UI events to commands** (separation of concerns)
5. Design patterns **enforce architectural constraints** (hexagonal, command, strategy)

For practical examples, see:
- [API.md](./API.md) - Interface specifications
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Implementation guidelines
- [FEATURES.md](./FEATURES.md) - Feature walkthrough
