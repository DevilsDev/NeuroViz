# NeuroViz

[![CI/CD](https://github.com/DevilsDev/NeuroViz/actions/workflows/ci.yml/badge.svg)](https://github.com/DevilsDev/NeuroViz/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Interactive Neural Network Decision Boundary Visualiser — a browser-based application that visualises how neural networks learn to classify 2D data points in real-time. Built with **Hexagonal Architecture** (Ports & Adapters) to demonstrate clean separation of concerns.

🔗 **[Live Demo](https://devilsdev.github.io/NeuroViz/)**

## Features

- **Real-time Training Visualisation** — Watch the decision boundary evolve as the network learns
- **Multiple Datasets** — Circle, XOR, Spiral, and Gaussian cluster patterns
- **Configurable Hyperparameters** — Adjust learning rate and hidden layer architecture
- **Step-by-Step Mode** — Debug training one epoch at a time
- **Responsive UI** — Modern dark theme with Tailwind CSS

## Architecture

NeuroViz follows **Hexagonal Architecture** (also known as Ports & Adapters), ensuring the core business logic is completely decoupled from infrastructure concerns.

```text
┌─────────────────────────────────────────────────────────────────┐
│                        Presentation                             │
│                     (index.html, styles)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Composition Root                           │
│                        (main.ts)                                │
│         Wires adapters to ports via dependency injection        │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   TFNeuralNet   │ │    D3Chart      │ │ MockDataRepo    │
│  (TensorFlow)   │ │    (D3.js)      │ │   (Mock API)    │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         │ implements        │ implements        │ implements
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ INeuralNetwork  │ │  IVisualizer    │ │ IDatasetRepo    │
│    Service      │ │    Service      │ │                 │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Core                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Domain    │  │    Ports    │  │      Application        │  │
│  │  (Entities) │  │ (Interfaces)│  │   (TrainingSession)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Project Structure

```text
src/
├── core/                    # Framework-agnostic business logic
│   ├── domain/              # Entities: Point, Prediction, Hyperparameters
│   ├── ports/               # Interfaces: INeuralNetworkService, IVisualizerService
│   └── application/         # Use cases: TrainingSession orchestrator
│
├── infrastructure/          # Framework-specific implementations
│   ├── tensorflow/          # TFNeuralNet adapter (TensorFlow.js)
│   ├── d3/                  # D3Chart adapter (D3.js)
│   └── api/                 # MockDataRepository (simulated microservice)
│
├── presentation/            # UI styles (Tailwind CSS)
└── main.ts                  # Composition root (dependency injection)
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Ports & Adapters** | Core logic has zero dependencies on TensorFlow.js or D3.js |
| **Constructor Injection** | All dependencies injected via `TrainingSession` constructor |
| **Async Training Loop** | Guard-rail pattern prevents overlapping GPU calls |
| **Immutable Domain** | `Point`, `Prediction`, `Hyperparameters` are readonly |

## Getting Started

### Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** 10+

### Installation

```bash
# Clone the repository
git clone https://github.com/DevilsDev/NeuroViz.git
cd NeuroViz

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:3000`.

### Available Scripts

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

## How to Use

1. **Select a Dataset** — Choose from Circle, XOR, Spiral, or Gaussian
2. **Fetch Data** — Click "Fetch Data" to load the dataset (simulates API call)
3. **Configure Network** — Set learning rate and hidden layer sizes (e.g., `8, 4`)
4. **Initialise** — Click "Initialise Network" to create the model
5. **Train** — Click "Start" to begin training, or "Step" for single epochs
6. **Observe** — Watch the decision boundary evolve in real-time

## Tech Stack

| Layer | Technology |
|-------|------------|
| **ML Framework** | [TensorFlow.js](https://www.tensorflow.org/js) |
| **Visualisation** | [D3.js](https://d3js.org/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) |
| **Build Tool** | [Vite](https://vitejs.dev/) |
| **Unit Testing** | [Vitest](https://vitest.dev/) |
| **E2E Testing** | [Playwright](https://playwright.dev/) |
| **Language** | TypeScript 5.6 |

## Testing Strategy

### Unit Tests (Vitest)

Core domain and application logic tested with mocked infrastructure:

```bash
npm test
```

Coverage focuses on:
- `TrainingSession` orchestration logic
- Domain entity validation
- Port contract compliance

### E2E Tests (Playwright)

Full browser tests across Chromium, Firefox, and WebKit:

```bash
npm run test:e2e
```

Test categories:
- **Happy Path** — Full training cycle, pause/resume, reset
- **Mocked Microservice** — Deterministic data for reproducible tests
- **Error Handling** — Input validation, disabled states
- **Accessibility** — Button labels, keyboard navigation

## CI/CD Pipeline

The GitHub Actions workflow runs on every push and PR:

1. **Lint & Type Check** — TypeScript compilation
2. **Unit Tests** — Vitest with coverage
3. **Build** — Vite production build
4. **E2E Tests** — Playwright across 3 browsers
5. **Deploy** — GitHub Pages (main branch only)

---

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) for planned features including:

- Advanced optimizers (Adam, RMSprop) and regularization
- Real-time training metrics and loss charts
- Custom dataset upload and drawing
- Multi-class classification support
- Model export and session persistence
- Educational tooltips and tutorials

---

## Extending the Application

### Adding a New ML Backend

1. Create a new adapter implementing `INeuralNetworkService`:

```typescript
// src/infrastructure/onnx/ONNXNeuralNet.ts
export class ONNXNeuralNet implements INeuralNetworkService {
  async initialize(config: Hyperparameters): Promise<void> { /* ... */ }
  async train(data: Point[]): Promise<number> { /* ... */ }
  async predict(grid: Point[]): Promise<Prediction[]> { /* ... */ }
}
```

2. Swap the adapter in `main.ts`:

```typescript
// const neuralNetService = new TFNeuralNet();
const neuralNetService = new ONNXNeuralNet();
```

No changes required to `TrainingSession` or any core logic.

### Adding a New Visualisation

1. Implement `IVisualizerService`:

```typescript
// src/infrastructure/canvas/CanvasChart.ts
export class CanvasChart implements IVisualizerService {
  renderData(points: Point[]): void { /* ... */ }
  renderBoundary(predictions: Prediction[], gridSize: number): void { /* ... */ }
}
```

2. Inject in `main.ts`:

```typescript
const visualizerService = new CanvasChart('viz-container', 500, 500);
```

---

## License

Apache 2.0  [DevilsDev](https://github.com/DevilsDev)

See [LICENSE](LICENSE) for details.