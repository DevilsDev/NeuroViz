# NeuroViz

[![CI/CD](https://github.com/DevilsDev/NeuroViz/actions/workflows/ci.yml/badge.svg)](https://github.com/DevilsDev/NeuroViz/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

**Interactive neural network decision-boundary visualiser.** Build, train and
inspect small neural networks in the browser. Watch the decision boundary
take shape epoch by epoch, replay it afterwards, see how well the model
classifies, and export the result. Built with **Hexagonal Architecture**
(Ports & Adapters): the domain model, ports and training services have no
dependency on TensorFlow.js, D3 or the DOM.

🔗 **[Live Demo](https://devilsdev.github.io/NeuroViz/)**
📘 **[Feature Guide](docs/FEATURES.md)** · **[Architecture](docs/ARCHITECTURE.md)** · **[Roadmap](docs/ROADMAP.md)**

> **Status.** The 2026 UI redesign is complete: a three-column workspace, a
> four-step workflow (Data → Model → Train → Evaluate) and new features for
> reproducibility, overfitting risk, learning-rate finding and training
> replay. Some features exist as code but are not reachable from the UI; they
> are listed under
> [Implemented but not yet in the app](#implemented-but-not-yet-in-the-app).

---

## The workspace

The app is a three-column workspace that stacks into a single column on
tablets and phones:

- **Left: the workflow.** Four steps, each marked as done, current or to do:
  1. **Data:** pick a dataset from cards with point previews.
  2. **Model:** build the network.
  3. **Train:** training settings, regularisation and reproducibility.
  4. **Evaluate:** how well the model classifies.
- **Centre: the decision boundary.** The plot, with a legend kept in sync
  with what is drawn. Below it are the transport bar (train, step, reset,
  epoch progress, undo/redo) and the training timeline.
- **Right: live metrics.** Epoch, accuracy, training and validation loss,
  loss/accuracy curves, the learning rate, and plain-language notes on what
  the model is doing.

A mode switch (**Guided**, **Standard**, **Expert**) controls how many
settings are shown. Guided is the default and shows a calm subset with short
explanations; Expert shows everything.

---

## What ships today

### Data
- **Built-in patterns:** Circle, XOR, Gaussian, Spiral and four-class
  Clusters, each shown as a card with a point preview and a difficulty badge
- **Real-world samples:** Iris and Wine (PCA-reduced to 2D, bundled)
- **Your own data:** draw points by clicking, or upload a CSV; download the
  current dataset as CSV
- **Controls:** sample count, noise, class balance, normalise/standardise
  preprocessing, validation split

### Model
- **Visual layer editor:** add or remove hidden layers (up to 6) and change
  neurons with − / +, with a live `2 → 8 → 4 → 1 · 65 parameters` summary;
  the comma-separated field still works for typing
- **Optimizers:** Adam, SGD, RMSprop
- **Activations:** ReLU, Tanh, Sigmoid
- **Loss functions:** cross-entropy, MSE, hinge
- **Outputs:** binary (sigmoid) or 3–4 classes (softmax)
- **Learning-rate finder:** sweeps learning rates on a throwaway copy of the
  model, plots loss against rate and suggests one with a **Use** button

### Training
- **Training loop:** batch size, epoch limit, speed (FPS) cap, single-epoch
  stepping, keyboard control
- **Learning-rate schedules:** step, exponential and cosine decay
- **Regularisation:** L1, L2, dropout, batch normalisation
- **Overfitting-risk meter:** compares model size with training-set size
  (adjusted for noise and regularisation) before you train, with a
  suggestion
- **Reproducible runs:** lock a seed to repeat the data, the
  train/validation split, the starting weights and the batch order exactly;
  choose He, Glorot or LeCun weight initialisation. Dropout masks stay random
  on purpose.

### Visualisation
- **Real-time decision boundary:** confidence shading, misclassified-point
  highlighting, validation points marked, x₁/x₂ axes and a legend
- **Training timeline:** every run records the boundary; once paused, scrub
  back through it, jump back to live, or download it as an animated GIF
- **3D view** (Three.js): height encodes prediction confidence
- **Voronoi overlay** and a **weight-change view** of training
- **Network diagram:** D3 node graph coloured by weight sign and size
- **Weight distribution** and **layer activation** histograms
- **Dropout visualisation:** which neurons are dropped

### Evaluation
- **"How well does it classify?" summary:** accuracy, macro F1, a verdict
  (good fit, fair, underfitting or overfitting) and per-class precision,
  recall, F1 and point counts
- **Confusion matrix**, open in every mode
- **Loss and accuracy curves** for training and validation
- **Insights:** plain-language notes on progress and over/underfitting
- **Model complexity:** parameters, FLOPs and memory
- **Training-speed comparison** against a saved baseline
- **Adversarial examples:** FGSM or gradient-free search for points that
  fool the model

### Export & persistence
- **Model download** in TensorFlow.js format
- **Training history** export (JSON) and an **HTML training report**
- **Training GIF** from the timeline
- **Session save/load** in browser storage

### Learning & UX
- **Presets:** Quick Demo, Deep Network, High Accuracy and Overfit Demo
- **Guided tutorials** and **challenges**
- **Hyperparameter tooltips**
- **Keyboard shortcuts:** Space (train/pause), S (step), R (reset),
  F (fullscreen), Esc (pause), ? (help), 1–5 (datasets), Ctrl+Z / Ctrl+Y
  (undo/redo settings)
- **Light and dark themes**, fullscreen, responsive layout down to phone
  width

### Implemented but not yet in the app

These exist as code, but nothing in the running app exposes them.

In [`src/`](src/), built and tested but with no UI yet:
- ONNX export and Python (Keras) code generation
  (`src/infrastructure/export/`)
- Boundary image export (PNG, SVG, PNG with metadata) in `D3Chart`
- Training-history CSV export (the UI exports JSON)
- Live activation heatmap (`D3ActivationHeatmap`)
- Early stopping, gradient clipping, learning-rate warmup and cyclic
  schedules (supported by the training engine, no controls yet)
- Chart zoom/pan (`zoomEnabled: false` by default)

In [`archive/`](archive/README.md), outside `src/`, so not built, type-checked
or tested (the archive README explains how to revive one):
- Model comparison (A/B), model ensembles, permutation feature importance
- Web-Worker-backed training, progressive grid rendering
- LIME-style explanations, saliency maps, Bayesian NNs (MC Dropout),
  neural architecture search, WebGL renderer, REST API
  (`window.neurovizAPI`), WebSocket collaboration, plugin system

A per-feature reference lives in [`docs/FEATURES.md`](docs/FEATURES.md).

---

## How to use

1. **Data:** pick a dataset card, or draw your own points. Adjust samples
   and noise if you like.
2. **Model:** shape the hidden layers with the layer editor and choose the
   optimizer, activation and learning rate. **Find a good learning rate**
   suggests one.
3. **Train:** press **Train** (or Space) to run, or **Step** (S) for one epoch
   at a time. Watch the boundary, the curves and the notes on the right.
   Check the overfitting-risk meter, and lock the seed if you want to repeat
   the run.
4. **Evaluate:** see accuracy, F1, the verdict, the per-class table and the
   confusion matrix. Pause and drag the timeline to replay training, or
   download it as a GIF.
5. **Export:** download the model, the training history or a report.

Changing a model setting after building marks the model as stale; it is
rebuilt automatically when you next train.

---

## Architecture

NeuroViz follows **Hexagonal Architecture** (Ports & Adapters). The domain
model (`core/domain`), ports (`core/ports`) and training services
(`core/application/training`, `commands`, `TrainingSession`) have no
dependency on TensorFlow.js, D3, Three.js or the DOM. Adapters live at the
edges and are wired up in a composition root.

> **Known boundary exceptions.** The composition root (`ApplicationBuilder`)
> and the UI coordinator (`Application`) live in `src/core/application/` and
> import TensorFlow.js, the D3 adapters, presentation controllers and the
> DOM. `TrainingSession` also uses the infrastructure logger and
> `requestAnimationFrame` directly. Moving these out of `core/` is planned.

```text
┌─────────────────────────────────────────────────────────────────┐
│                        Presentation                             │
│   controllers, workflow nav, metrics panel, step panels, toasts │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Composition Root                           │
│                (main.ts + ApplicationBuilder)                   │
│         Wires adapters to ports via dependency injection        │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   TFNeuralNet   │ │    D3Chart      │ │ DatasetRepo     │
│  (TensorFlow.js)│ │ (D3 + Three.js) │ │  (mock + real)  │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │ implements        │ implements        │ implements
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ INeuralNetwork  │ │  IVisualizer    │ │ IDatasetRepo    │
│    Service      │ │    Service      │ │                 │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         └───────────────────┼───────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Core                                   │
│   Domain (entities)  ·  Ports (interfaces)  ·  Application      │
│   TrainingSession facade → SessionStateStore,                   │
│   DatasetPreparationService, ExperimentService, LRFinderService │
└─────────────────────────────────────────────────────────────────┘
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full layer
breakdown, port contracts and extension points.

### Project structure

```text
src/
├── core/                    # Framework-agnostic business logic
│   ├── domain/              # Point, Prediction, Hyperparameters, Random,
│   │                        # OverfittingRisk, ...
│   ├── ports/               # INeuralNetworkService, IVisualizerService, ...
│   └── application/         # TrainingSession facade + commands
│       └── training/        # SessionStateStore, DatasetPreparation,
│                            # Experiment (timeline), LRFinder, ...
│
├── infrastructure/          # Framework-specific adapters
│   ├── tensorflow/          # TFNeuralNet (TensorFlow.js)
│   ├── d3/                  # D3Chart, legend, loss chart, confusion matrix
│   ├── three/               # 3D boundary view (Three.js)
│   ├── api/                 # Dataset repositories
│   ├── export/              # GIF encoder, report, ONNX, Python codegen
│   └── education/           # Tutorials, challenges, explain-this-moment
│
├── presentation/            # Controllers, workflow nav, metrics panel,
│                            # layer editor, timeline, LR finder, ...
└── main.ts                  # Entry point (builds via ApplicationBuilder)
```

### Key design decisions

| Decision | Rationale |
|----------|-----------|
| **Ports & Adapters** | Domain, ports and training services never import TensorFlow.js, D3 or Three.js (see boundary exceptions above). |
| **Constructor injection** | Adapters reach `TrainingSession` and the controllers through the composition root. |
| **Service extraction** | `TrainingSession` delegates state, data preparation, experiments and LR finding to focused services. |
| **Async training loop** | A guard prevents overlapping GPU calls; a generation counter discards stale steps. |
| **Seedable randomness** | One seedable stream drives data, split and batch order, so a locked seed repeats a run. |
| **Immutable domain** | `Point`, `Prediction`, `Hyperparameters` are readonly. |
| **Observer state fan-out** | Controllers subscribe via `onStateChange`; they never poll. |

---

## Getting started

### Prerequisites

- **Node.js** 22+ (matches CI; semantic-release requires 22+)
- **npm** 10+

### Installation

```bash
git clone https://github.com/DevilsDev/NeuroViz.git
cd NeuroViz
npm install
npm run dev
```

The app opens at `http://localhost:3000`.

### Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Lint `src/` with ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:coverage` | Run unit tests with a coverage report |
| `npm run test:e2e` | Run E2E tests (Playwright) |
| `npm run test:e2e:ui` | Run E2E tests in Playwright's UI |

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **ML framework** | [TensorFlow.js](https://www.tensorflow.org/js) 4 |
| **2D visualisation** | [D3.js](https://d3js.org/) 7 |
| **3D visualisation** | [Three.js](https://threejs.org/) |
| **Styling** | CSS variables + [Tailwind CSS](https://tailwindcss.com/) 3 |
| **Build tool** | [Vite](https://vitejs.dev/) 6 |
| **Unit testing** | [Vitest](https://vitest.dev/) 4 + jsdom |
| **E2E testing** | [Playwright](https://playwright.dev/) |
| **Language** | TypeScript 6 (strict) |

---

## Testing

### Unit tests (Vitest)

```bash
npm test
```

About 1,250 tests covering:
- `TrainingSession` orchestration, lifecycle, concurrency and the timeline
- Port contract compliance and domain logic (seeding, overfitting risk, ...)
- Application services (early stopping, LR scheduling, data split, LR finder)
- TensorFlow.js adapter behaviour, including seeded initialisation
- Presentation controllers and panels, with mocked ports

### E2E tests (Playwright)

```bash
npm run test:e2e
```

Locally the suite runs in Chromium, Firefox and WebKit; CI runs Chromium
against the production build. It covers:
- **Happy path:** full training cycle, pause/resume, step, reset
- **All datasets and UI controls**, tab content and mode switching
- **Visual regression** of the plot (initial, loaded, trained)
- **Error handling** and **accessibility** (labels, status indicators)

---

## CI/CD pipeline

Runs on every push and pull request to `main`:

1. **Lint, type check and unit tests** with coverage
2. **Build:** Vite production build with a bundle-size report
3. **E2E tests:** Playwright (Chromium) against the built app
4. **Deploy:** GitHub Pages, on pushes to `main`
5. **Release:** semantic-release versions from conventional commits,
   updates `CHANGELOG.md` and attaches `neuroviz-dist.zip` to the GitHub
   release

Security scanning and Lighthouse checks run alongside.

---

## Roadmap

Done:
- **Feature phases 1–9:** training, metrics, visualisation, data
  management, model capabilities, UX, education, performance, research
- **Improvement phases:** repo hygiene, state cues, onboarding and Learn
  Mode, `TrainingSession` service extraction
- **2026 codebase review:** critical, high, medium and low findings fixed
- **2026 UI redesign:**
  1. Palette, plot legend and axis titles
  2. Three-column workspace with workflow nav, transport bar and metrics
     column
  3. Dataset cards, visual layer editor and the Evaluate summary
  4. Overfitting risk, reproducibility, training timeline and the
     learning-rate finder

Candidates next: a neuron inspector, engineered input features
(x₁², x₂², x₁x₂, sin), run comparison and a regression mode.

Per-feature status lives in [`docs/ROADMAP.md`](docs/ROADMAP.md);
historical audit reports are in [`docs/archive/`](docs/archive/).

---

## Extending the application

### Adding a new ML backend

1. Create an adapter implementing `INeuralNetworkService`:

```typescript
// src/infrastructure/onnx/ONNXNeuralNet.ts
export class ONNXNeuralNet implements INeuralNetworkService {
  async initialize(config: Hyperparameters): Promise<void> { /* ... */ }
  async train(data: Point[]): Promise<TrainResult> { /* ... */ }
  async predict(grid: Point[]): Promise<Prediction[]> { /* ... */ }
  // ...plus evaluate, updateLearningRate, isReady, dispose and the
  // inspection methods; see src/core/ports/INeuralNetworkService.ts
}
```

2. Swap the adapter in `ApplicationBuilder`:

```typescript
// const neuralNet = new TFNeuralNet();
const neuralNet = new ONNXNeuralNet();
```

No changes are needed in `TrainingSession` or any core logic.

### Adding a new visualisation

1. Implement `IVisualizerService`:

```typescript
// src/infrastructure/canvas/CanvasChart.ts
export class CanvasChart implements IVisualizerService {
  renderData(points: Point[]): void { /* ... */ }
  renderBoundary(predictions: Prediction[], gridSize: number): void { /* ... */ }
  // ...see src/core/ports/IVisualizerService.ts for the full contract
}
```

2. Inject it in `ApplicationBuilder` in place of `D3Chart`.

---

## License

Apache 2.0 · [DevilsDev](https://github.com/DevilsDev)

See [LICENSE](LICENSE) for details.
