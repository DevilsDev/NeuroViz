# NeuroViz - Interactive Neural Network Decision Boundary Visualizer

[![CI/CD](https://github.com/DevilsDev/NeuroViz/actions/workflows/ci.yml/badge.svg)](https://github.com/DevilsDev/NeuroViz/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Version](https://img.shields.io/badge/version-2.22.0-blue.svg)](https://github.com/DevilsDev/NeuroViz/releases)

> A browser-based educational tool for visualizing how neural networks learn to classify 2D data points in real-time. Built with Hexagonal Architecture principles to demonstrate clean separation of concerns and maintainable code design.

**[Live Demo](https://devilsdev.github.io/NeuroViz/)** | **[Documentation](./docs/)** | **[Contributing](#contributing)**

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Usage Guide](#usage-guide)
- [Documentation](#documentation)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

NeuroViz is an interactive educational platform that helps users understand neural network fundamentals through real-time visualization. Watch decision boundaries evolve during training, experiment with different hyperparameters, and explore advanced ML concepts like adversarial examples, model complexity, and learning rate schedules.

### What Makes NeuroViz Special?

- **Real-time Training Visualization**: See decision boundaries evolve epoch by epoch
- **Hexagonal Architecture**: Clean separation between business logic and infrastructure
- **Educational Focus**: Interactive tutorials, tooltips, and challenges
- **Advanced ML Features**: Adversarial examples, model complexity analysis, ensemble learning
- **Production-Ready Code**: Comprehensive testing, CI/CD, security audits
- **Fully Client-Side**: No backend required - runs entirely in your browser

### Target Audience

- **Students**: Learning neural network fundamentals
- **Educators**: Teaching ML concepts with interactive demonstrations
- **Developers**: Studying clean architecture patterns in TypeScript
- **Researchers**: Rapid prototyping and visualization of 2D classification problems

---

## Key Features

### Core Functionality

#### Neural Network Training
- **Configurable Architecture**: Define custom layer sizes (e.g., [8, 4])
- **Multiple Optimizers**: SGD with momentum, Adam, RMSprop, Adagrad
- **Activation Functions**: ReLU, Sigmoid, Tanh, ELU, Leaky ReLU, SELU
- **Loss Functions**: Cross-entropy, MSE, Hinge loss
- **Regularization**: L1/L2 regularization, dropout, batch normalization
- **Multi-class Support**: Binary and multi-class classification (up to 10 classes)

#### Real-time Visualization
- **Decision Boundaries**: Contour-based gradients (binary) or pixel regions (multi-class)
- **Training Progress**: Loss, accuracy, validation metrics, learning rate tracking
- **Network Diagrams**: Interactive layer-by-layer visualization with weight flows
- **Activation Heatmaps**: See neuron activations across layers
- **Gradient Flow**: Visualize gradient magnitudes during backpropagation

#### Dataset Management
- **Predefined Datasets**: Circle, XOR, Spiral, Gaussian, Iris, Wine
- **Custom Datasets**: Upload CSV files or draw points directly on the canvas
- **Data Preprocessing**: Normalization, standardization
- **Train/Validation Split**: Configurable split ratios with stratified sampling

### Advanced Features

#### Education System
- **Interactive Tutorials**: Step-by-step guided tours of key concepts
- **Contextual Tooltips**: Hover over any UI element for explanations
- **Challenges**: Gamified learning objectives with scoring and leaderboards
- **Difficulty Levels**: Beginner, intermediate, and advanced content

#### Machine Learning Tools
- **Learning Rate Finder**: Automatically discover optimal learning rates
- **Learning Rate Schedules**: Exponential decay, step decay, cosine annealing, cyclic schedules
- **Early Stopping**: Prevent overfitting with validation-based stopping
- **Adversarial Examples**: Generate and visualize adversarial attacks (FGSM)
- **Model Complexity Analysis**: Parameter count, memory usage, FLOPs estimation
- **Confusion Matrix**: Multi-class classification performance analysis
- **ROC Curves**: Binary classification evaluation

#### Model Management
- **Session Persistence**: Save and restore training sessions via LocalStorage
- **Model Export**: Download trained models (TensorFlow.js format)
- **Training History**: Export metrics as JSON, CSV, or formatted text
- **PNG/SVG Export**: Save visualizations with metadata overlays
- **HTML Reports**: Generate comprehensive training reports

#### Performance Optimization
- **Adjustable Training Speed**: 15 FPS (balanced) to Max (unlimited)
- **Batch Training**: Configurable mini-batch sizes
- **Progressive Rendering**: Efficient rendering for large datasets
- **Frame Rate Limiting**: Prevent UI blocking during intensive training
- **WebGL Acceleration**: Hardware-accelerated rendering (experimental)

### UI/UX Features
- **Responsive Design**: Desktop and mobile-friendly interface
- **Dark Theme**: Modern, low-glare color scheme
- **Keyboard Shortcuts**: Power-user productivity
- **Touch Gestures**: Mobile-optimized controls
- **Floating Metrics Bar**: Always-visible training progress
- **Bottom Sheet**: Mobile-friendly expandable controls
- **What-If Analysis**: Simulate parameter changes without retraining

---

## Technology Stack

### Core Technologies
| Layer | Technology | Purpose |
|-------|------------|---------|
| **ML Framework** | [TensorFlow.js](https://www.tensorflow.org/js) 4.21 | Neural network training and inference |
| **Visualization** | [D3.js](https://d3js.org/) 7.9 | Decision boundaries, charts, diagrams |
| **3D Rendering** | [Three.js](https://threejs.org/) 0.181 | 3D network visualizations (experimental) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) 3.4 | Utility-first CSS framework |
| **Language** | TypeScript 5.6 | Type-safe JavaScript |
| **Build Tool** | [Vite](https://vitejs.dev/) 6.0 | Fast development and optimized builds |

### Development & Testing
| Tool | Purpose |
|------|---------|
| **Unit Testing** | [Vitest](https://vitest.dev/) 4.0 - Fast, Vite-native test runner |
| **E2E Testing** | [Playwright](https://playwright.dev/) 1.49 - Cross-browser automation |
| **Linting** | ESLint 9.39 - Code quality enforcement |
| **Type Checking** | TypeScript compiler - Static type validation |
| **CI/CD** | GitHub Actions - Automated testing and deployment |
| **Release Management** | Semantic Release 25.0 - Automated versioning |

### Code Quality & Security
- **Test Coverage**: 70%+ unit test coverage (Vitest with V8 coverage)
- **E2E Coverage**: Comprehensive Playwright tests across Chromium, Firefox, WebKit
- **Security Scanning**: TruffleHog for secret detection
- **Performance Auditing**: Lighthouse CI (95+ scores)
- **XSS Protection**: Comprehensive security audit (see [XSS_AUDIT_REPORT.md](../docs/XSS_AUDIT_REPORT.md))

---

## Architecture

NeuroViz follows **Hexagonal Architecture** (Ports & Adapters), ensuring business logic is completely decoupled from infrastructure concerns.

### Architectural Principles

1. **Dependency Inversion**: Core depends on abstractions, not implementations
2. **Single Responsibility**: Each module has one reason to change
3. **Interface Segregation**: Clients depend only on what they use
4. **Separation of Concerns**: UI, business logic, and infrastructure are isolated

### Layer Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                       │
│              (UI Controllers, Views, User Interaction)          │
│                                                                 │
│  TrainingController │ DatasetController │ EducationController  │
│  VisualizationController │ ExportController │ SessionController│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                          │
│                    (Use Cases, Orchestration)                   │
│                                                                 │
│              TrainingSession (Main Orchestrator)                │
│     Commands: Initialize │ Start │ Step │ UpdateConfig         │
│        Services: LRScheduler │ EarlyStopping │ DataSplitter    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Core/Domain Layer                       │
│                  (Business Logic, Entities, Rules)              │
│                                                                 │
│  Entities: Point │ Prediction │ Hyperparameters │ History      │
│  Ports (Interfaces): INeuralNetworkService │ IVisualizerService│
│                      IDatasetRepository │ IStorageService      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                         │
│              (Framework Implementations, Adapters)              │
│                                                                 │
│  TFNeuralNet (TensorFlow.js) │ D3Chart (D3.js)                 │
│  MockDataRepository │ LocalStorageService │ Logger             │
│  AdvancedFeaturesService │ TutorialService │ ChallengeService  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **Hexagonal Architecture** | Zero coupling between core logic and TensorFlow.js/D3.js |
| **Command Pattern** | Encapsulates validation and execution logic for UI actions |
| **Strategy Pattern** | Learning rate schedulers, early stopping strategies |
| **Observer Pattern** | State change notifications to UI via callbacks |
| **Factory Pattern** | UI element creation with type safety |
| **Repository Pattern** | Abstract data access (mock API, CSV, LocalStorage) |

For detailed architecture documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Getting Started

### Prerequisites

- **Node.js**: Version 20+ (LTS recommended)
- **npm**: Version 10+
- **Browser**: Modern browser with ES2022 support (Chrome 90+, Firefox 88+, Safari 14+)

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

The application will open at `http://localhost:3000`.

### Build for Production

```bash
# Type-check and build
npm run build

# Preview production build locally
npm run preview
```

Build artifacts will be in the `dist/` directory.

---

## Usage Guide

### Basic Workflow

1. **Select a Dataset**
   - Choose from predefined datasets (Circle, XOR, Spiral, Gaussian)
   - Or upload a CSV file / draw custom points

2. **Configure Network**
   - Set learning rate (e.g., 0.03)
   - Define hidden layers (e.g., "8, 4" for two hidden layers)
   - Choose optimizer (Adam recommended)
   - Select activation function (ReLU recommended)

3. **Initialize Network**
   - Click "Initialize Network" button
   - Model architecture is created and compiled

4. **Train**
   - Click "Start" for continuous training
   - Or "Step" to train one epoch at a time
   - Watch decision boundary evolve in real-time

5. **Analyze**
   - View loss/accuracy charts
   - Inspect confusion matrix
   - Explore network diagram with weight flows
   - Generate adversarial examples

### Advanced Usage

#### Learning Rate Finder
```
1. Initialize network
2. Load dataset
3. Click "Tools" → "LR Finder"
4. Review suggested optimal learning rate
5. Update configuration and re-initialize
```

#### Model Export
```
1. Train your model
2. Click "Export" → "Save Model"
3. Download model.json and weights.bin
4. Load later via "Import Model"
```

#### Session Persistence
```
1. Train your model
2. Click "Session" → "Save Session"
3. Session saved to browser LocalStorage
4. Restore via "Load Session" (survives page refresh)
```

For detailed feature documentation, see [FEATURES.md](./FEATURES.md).

---

## Documentation

### Available Documentation

- **[README.md](./README.md)** - This file (project overview)
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Hexagonal architecture deep dive
- **[API.md](./API.md)** - API reference for key classes and interfaces
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development guide and best practices
- **[FEATURES.md](./FEATURES.md)** - Comprehensive feature documentation
- **[CHANGELOG.md](../CHANGELOG.md)** - Version history and release notes
- **[ROADMAP.md](./ROADMAP.md)** - Future features and planned improvements

### Technical Reports

- **[XSS_AUDIT_REPORT.md](./XSS_AUDIT_REPORT.md)** - Security audit findings
- **[IMPROVEMENTS_SUMMARY.md](./IMPROVEMENTS_SUMMARY.md)** - Recent enhancements
- **[CONSOLE_OUTPUT_FIXES.md](./CONSOLE_OUTPUT_FIXES.md)** - Debugging improvements
- **[MEMORY_LEAK_FIXES.md](../MEMORY_LEAK_FIXES.md)** - Memory management fixes

---

## Testing

### Test Pyramid

NeuroViz follows the testing pyramid with:
- **70% Unit Tests**: Core logic, domain entities, services
- **20% Integration Tests**: Controller-service interactions
- **10% E2E Tests**: Full user workflows across browsers

### Running Tests

```bash
# Unit tests (Vitest)
npm test                    # Run once
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report

# E2E tests (Playwright)
npm run test:e2e            # Headless (CI mode)
npm run test:e2e:ui         # Interactive UI mode
npm run test:e2e:headed     # Headed browser mode
npm run test:e2e:debug      # Debug mode with breakpoints

# Linting and type checking
npm run lint                # ESLint
npm run typecheck           # TypeScript compiler
```

### Coverage Goals

- **Unit Test Coverage**: 70%+
- **Critical Path Coverage**: 90%+ (TrainingSession, TFNeuralNet, D3Chart)
- **E2E Coverage**: All user-facing workflows
- **Browser Coverage**: Chromium, Firefox, WebKit

### Test Organization

```
tests/
├── unit/                      # Vitest unit tests
│   ├── core/                  # Domain and application tests
│   ├── infrastructure/        # Service adapter tests
│   └── presentation/          # Controller tests
├── e2e/                       # Playwright E2E tests
│   ├── training.spec.ts       # Training workflows
│   ├── dataset.spec.ts        # Dataset management
│   └── export.spec.ts         # Export functionality
└── pages/                     # Page object models
    └── index.ts               # Reusable test helpers
```

For detailed testing guidelines, see [DEVELOPMENT.md](./DEVELOPMENT.md#testing).

---

## Contributing

We welcome contributions! Please see our contributing guidelines:

### How to Contribute

1. **Fork the Repository**
   ```bash
   git fork https://github.com/DevilsDev/NeuroViz.git
   ```

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**
   - Follow TypeScript and ESLint conventions
   - Add tests for new features
   - Update documentation as needed

4. **Run Tests**
   ```bash
   npm run lint
   npm run typecheck
   npm test
   npm run test:e2e
   ```

5. **Commit with Conventional Commits**
   ```bash
   git commit -m "feat: add new learning rate schedule"
   git commit -m "fix: resolve memory leak in D3Chart"
   git commit -m "docs: update API reference"
   ```

6. **Push and Create Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

### Conventional Commit Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style/formatting
- `refactor`: Code restructuring
- `test`: Test additions/changes
- `chore`: Build process, dependencies

### Code Standards

- **TypeScript Strict Mode**: All code must pass strict type checking
- **ESLint Compliance**: Zero warnings/errors
- **Test Coverage**: New features must include tests
- **Documentation**: Update docs for user-facing changes
- **Architectural Consistency**: Respect layer boundaries

For detailed development guidelines, see [DEVELOPMENT.md](./DEVELOPMENT.md).

---

## License

**Apache License 2.0**

Copyright 2025 [DevilsDev](https://github.com/DevilsDev)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

See [LICENSE](../LICENSE) for full details.

---

## Acknowledgments

- **TensorFlow.js Team**: For the excellent ML framework
- **D3.js Community**: For powerful visualization tools
- **Open Source Contributors**: For dependencies and inspiration

---

## Support & Contact

- **Issues**: [GitHub Issues](https://github.com/DevilsDev/NeuroViz/issues)
- **Discussions**: [GitHub Discussions](https://github.com/DevilsDev/NeuroViz/discussions)
- **Documentation**: [GitHub Wiki](https://github.com/DevilsDev/NeuroViz/wiki)

---

**Built with TypeScript, TensorFlow.js, and D3.js**

**Crafted with clean architecture principles for educational excellence**
