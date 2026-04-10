# NeuroViz

[![CI/CD](https://github.com/DevilsDev/NeuroViz/actions/workflows/ci.yml/badge.svg)](https://github.com/DevilsDev/NeuroViz/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

**Interactive neural network decision-boundary visualiser.** Build, train, and
inspect small neural networks in the browser — watch the decision boundary
evolve epoch by epoch, flip between 2D and 3D views, follow gradient flow,
and export trained models. Built with **Hexagonal Architecture** (Ports &
Adapters) so the ML core has no dependency on TensorFlow.js, D3, or the DOM.

🔗 **[Live Demo](https://devilsdev.github.io/NeuroViz/)**
📘 **[Feature Guide](docs/FEATURES.md)** · **[Architecture](docs/ARCHITECTURE.md)** · **[Roadmap](docs/ROADMAP.md)**

> **Status.** All 9 feature phases and the 5-phase improvement roadmap are
> complete (99 features shipped, architecture consolidated). See
> [`docs/ROADMAP.md`](docs/ROADMAP.md) for the full delivery status and
> [`docs/archive/`](docs/archive/) for historical audit reports.

---

## What ships today

### Training & model
- **Optimizers** — SGD (with momentum), Adam, RMSprop, Adagrad
- **Regularisation** — L1, L2, dropout (per-layer), batch normalisation,
  gradient clipping
- **Learning-rate control** — exponential / step / cosine schedules, warmup,
  cyclic LR (triangle + cosine), LR finder with sensitivity curve
- **Training flow** — configurable batch size, epoch limit, FPS-capped
  training speed, early stopping on validation-loss patience, train/validation
  split, step-by-step single-epoch mode
- **Activations** — ReLU, Sigmoid, Tanh, ELU, with per-layer selection
- **Multi-class classification** up to 10 classes via softmax output

### Datasets
- **Built-in patterns** — Circle, XOR, Spiral, Gaussian clusters,
  N-cluster blobs
- **Real-world samples** — Iris and Wine (PCA-reduced to 2D, bundled)
- **Custom input** — draw your own points by clicking, or upload CSV
- **Controls** — noise level, sample count, class-imbalance ratio,
  feature normalisation + standardisation toggles, train/test split
  visualisation

### Visualisation
- **Real-time decision boundary** with colour-scheme presets (default,
  viridis, plasma, cool, warm), heatmap opacity and contour-count sliders,
  misclassified-point highlighting, confidence circles
- **Interactive chart** — zoom, pan, hover tooltips, click-for-prediction
  details
- **3D view** (Three.js) — height encodes prediction confidence
- **Network diagram** — interactive D3 node graph with weight-magnitude
  colour coding
- **Activation heatmaps** — per-layer neuron activations in real time
- **Voronoi overlay** — alternative boundary view
- **Gradient flow animation** — backprop visualisation
- **Boundary evolution recording** — record and replay training

### Metrics & analysis
- **Loss chart** — training loss + dashed validation loss overlay
- **Accuracy, precision, recall, F1** (macro-averaged)
- **Confusion matrix** heatmap
- **ROC curve with AUC** (binary classification)
- **Training history** with JSON + CSV export
- **Weight histograms** and model-complexity metrics
- **Overfitting / underfitting detection** with suggested fixes

### Export & persistence
- **Model download / upload** — TensorFlow.js JSON + weights format
- **ONNX export** for cross-platform use
- **Python codegen** — produces a matching Keras/TensorFlow script
- **Image export** — PNG, SVG, and screenshot-with-metadata overlay
- **Session save/load** — auto-save to localStorage
- **Shareable config code** — copy/paste Base64 string

### UX & modes
- **Learn / Experiment / Advanced mode selector** (persisted) — progressively
  reveals controls as the user graduates between surfaces
- **Preset configurations** — five quick-start templates + bookmarkable
  named presets
- **Guided tutorials** and **challenge mode** for self-directed learning
- **ELI5 tooltips** on hyperparameters
- **Keyboard shortcuts** — Space, S, R, F, Escape
- **Dark / light theme**, fullscreen mode, responsive mobile layout
- **Browser notifications** on training completion

### Advanced & research
- **Model comparison (A/B)** panel — side-by-side training runs
- **Model ensemble** voting visualisation
- **Feature importance** (permutation), **LIME-style explanations**,
  **saliency maps**
- **Adversarial examples** (FGSM), **Bayesian NNs** (MC Dropout),
  **neural architecture search**
- **Web-Worker-backed training** for a non-blocking UI
- **WebGL-accelerated rendering** and progressive grid chunking
- **REST API** via `window.neurovizAPI`, **WebSocket** live collaboration,
  **plugin system** for custom extensions

A full per-feature reference lives in [`docs/FEATURES.md`](docs/FEATURES.md).
Delivery status by phase is tracked in [`docs/ROADMAP.md`](docs/ROADMAP.md).

---

## Architecture

NeuroViz follows **Hexagonal Architecture** (Ports & Adapters). Core
business logic has zero dependency on TensorFlow.js, D3, Three.js, or
the DOM — adapters live at the edges and are wired up in a composition
root.

```text
┌─────────────────────────────────────────────────────────────────┐
│                        Presentation                             │
│        (controllers, modals, toast, workflow UI)                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Composition Root                           │
│                (main.ts + ApplicationBuilder)                    │
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
│   TrainingSession facade → SessionStateStore,                    │
│   DatasetPreparationService, ExperimentService, LRFinderService  │
└─────────────────────────────────────────────────────────────────┘
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full layer
breakdown, port contracts, and extension points.

### Project structure

```text
src/
├── core/                    # Framework-agnostic business logic
│   ├── domain/              # Point, Prediction, Hyperparameters, ...
│   ├── ports/               # INeuralNetworkService, IVisualizerService, ...
│   └── application/         # TrainingSession facade + extracted services
│       └── training/        # SessionStateStore, DatasetPrep, Experiment, LRFinder
│
├── infrastructure/          # Framework-specific adapters
│   ├── tensorflow/          # TFNeuralNet (TensorFlow.js)
│   ├── d3/                  # D3Chart, Voronoi, gradient flow
│   ├── three/               # 3D boundary view (Three.js)
│   ├── api/                 # Dataset repositories
│   └── education/           # Tutorials, challenges, explain-this-moment
│
├── presentation/            # Controllers, modals, toasts, workflow UI
└── main.ts                  # Composition root
```

### Key design decisions

| Decision | Rationale |
|----------|-----------|
| **Ports & Adapters** | Core logic never imports TensorFlow.js, D3, or Three.js. |
| **Constructor injection** | All dependencies arrive via `TrainingSession` facade. |
| **Service extraction** | `TrainingSession` delegates to four SRP services. |
| **Async training loop** | Guard-rail pattern prevents overlapping GPU calls. |
| **Immutable domain** | `Point`, `Prediction`, `Hyperparameters` are readonly. |
| **Observer state fan-out** | Controllers subscribe via `onStateChange`, never poll. |

---

## Getting started

### Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** 10+

### Installation

```bash
git clone https://github.com/DevilsDev/NeuroViz.git
cd NeuroViz
npm install
npm run dev
```

The app will open at `http://localhost:3000`.

### Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run typecheck` | Run TypeScript type checking |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:e2e` | Run E2E tests (Playwright) |
| `npm run test:e2e:ui` | Run E2E tests with interactive UI |

---

## How to use

1. **Pick a dataset** — Circle, XOR, Spiral, Gaussian, Clusters, Iris,
   Wine, or draw your own.
2. **Pick a preset** (optional) — five quick-start configurations cover
   common learning scenarios.
3. **Configure the network** — set optimizer, learning rate, hidden
   layers (e.g. `8, 4`), activation, regularisation, batch size.
4. **Initialise** — creates the model with the chosen hyperparameters.
5. **Train** — click **Start** to run the training loop, or **Step** to
   advance one epoch at a time.
6. **Observe** — watch the boundary, loss chart, confusion matrix,
   activation heatmaps, and gradient flow update in real time.
7. **Analyse** — flip to the **Analyze** tab for confusion matrix,
   precision / recall / F1, and model-complexity metrics.
8. **Export** — save the model, the session, an image, or generate
   Python code.

New users should stay in **Learn Mode** (the default) to see a calm
subset of controls. **Experiment** and **Advanced** modes progressively
reveal regularisation, LR-schedule, gradient flow, and research tools.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **ML framework** | [TensorFlow.js](https://www.tensorflow.org/js) |
| **2D visualisation** | [D3.js](https://d3js.org/) |
| **3D visualisation** | [Three.js](https://threejs.org/) |
| **Styling** | CSS variables + [Tailwind CSS](https://tailwindcss.com/) |
| **Build tool** | [Vite](https://vitejs.dev/) |
| **Unit testing** | [Vitest](https://vitest.dev/) |
| **E2E testing** | [Playwright](https://playwright.dev/) |
| **Language** | TypeScript 5.6 |

---

## Testing strategy

### Unit tests (Vitest)

```bash
npm test
```

Coverage focuses on:
- `TrainingSession` orchestration and lifecycle transitions
- Port contract compliance
- Domain entity validation
- Application-layer services (early stopping, LR scheduling, data split)
- Presentation controllers (with mocked ports)

### E2E tests (Playwright)

Full browser tests across Chromium, Firefox, and WebKit:

```bash
npm run test:e2e
```

Test categories:
- **Happy path** — full training cycle, pause/resume, reset
- **Deterministic datasets** — seeded mock repository
- **Mode switching** — Learn / Experiment / Advanced
- **Export flows** — model, image, session
- **Accessibility** — keyboard navigation, ARIA labels

---

## CI/CD pipeline

The GitHub Actions workflow runs on every push and PR:

1. **Lint & type check** — ESLint + `tsc --noEmit`
2. **Unit tests** — Vitest with coverage
3. **Build** — Vite production build
4. **E2E tests** — Playwright across Chromium, Firefox, WebKit
5. **Deploy** — GitHub Pages (main branch only)

---

## Roadmap

All 9 feature phases (99 features) and the 5-phase improvement roadmap
are complete:

- **Phases 1–9** — Training, metrics, visualisation, data management,
  model capabilities, UX, education, performance, research features
- **Improvement Phase 2** — Repo hygiene, README reconciliation
- **Improvement Phase 3** — State cues (stale badge, validation badge,
  dataset source label, WebGL banner), Learn Mode `data-min-mode` expansion
- **Improvement Phase 4** — First-run onboarding modal, workflow spine
  (`Prepare → Configure → Train → Analyze`), Learn Mode presets + captions
- **Improvement Phase 5** — `TrainingSession` extraction into
  `SessionStateStore`, `DatasetPreparationService`, `ExperimentService`
- **Improvement Phase 6** — `LRFinderService` extraction, docs polish

Full per-feature status lives in [`docs/ROADMAP.md`](docs/ROADMAP.md).
Historical audit reports are archived under [`docs/archive/`](docs/archive/).

---

## Extending the application

### Adding a new ML backend

1. Create an adapter implementing `INeuralNetworkService`:

```typescript
// src/infrastructure/onnx/ONNXNeuralNet.ts
export class ONNXNeuralNet implements INeuralNetworkService {
  async initialize(config: Hyperparameters): Promise<void> { /* ... */ }
  async train(data: Point[]): Promise<number> { /* ... */ }
  async predict(grid: Point[]): Promise<Prediction[]> { /* ... */ }
}
```

2. Swap the adapter in `ApplicationBuilder`:

```typescript
// const neuralNetService = new TFNeuralNet();
const neuralNetService = new ONNXNeuralNet();
```

No changes required in `TrainingSession` or any core logic.

### Adding a new visualisation

1. Implement `IVisualizerService`:

```typescript
// src/infrastructure/canvas/CanvasChart.ts
export class CanvasChart implements IVisualizerService {
  renderData(points: Point[]): void { /* ... */ }
  renderBoundary(predictions: Prediction[], gridSize: number): void { /* ... */ }
}
```

2. Inject in `ApplicationBuilder`:

```typescript
const visualizerService = new CanvasChart('viz-container', 500, 500);
```

---

## License

Apache 2.0 · [DevilsDev](https://github.com/DevilsDev)

See [LICENSE](LICENSE) for details.
