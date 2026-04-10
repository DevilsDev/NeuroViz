# NeuroViz Feature Roadmap

This document outlines planned features for NeuroViz, organized by priority and complexity.

## Priority Legend

- 🔴 **P0** — Critical / Foundation (enables other features)
- 🟠 **P1** — High value / Quick wins
- 🟡 **P2** — Medium priority / Nice to have
- 🟢 **P3** — Future / Research

## Complexity Legend

- **S** — Small (< 1 day)
- **M** — Medium (1-3 days)
- **L** — Large (3-7 days)
- **XL** — Epic (> 1 week, needs breakdown)

---

## Phase 1: Core Training Enhancements

### 🔴 P0 — Foundation

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Multi-class classification (3+ classes) | M | ✅ | Softmax output, up to 10 classes |
| Batch size configuration | S | ✅ | Configurable in UI |
| Epoch limit (auto-stop) | S | ✅ | Auto-stops at limit |
| Training speed control (FPS) | S | ✅ | Slider 1-60 FPS |

### 🟠 P1 — Optimizers & Regularization

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Adam optimizer | S | ✅ | Default optimizer |
| RMSprop, Adagrad optimizers | S | ✅ | Dropdown selector |
| Learning rate scheduling | M | ✅ | Exponential, step, cosine |
| L2 regularization (weight decay) | S | ✅ | Slider control |
| Dropout layers | M | ✅ | Per-layer toggle |
| Early stopping | M | ✅ | Validation loss patience |

### 🟡 P2 — Advanced Training

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Momentum control | S | ✅ | SGD momentum slider (0-0.99) |
| L1 regularization | S | ✅ | Sparsity inducing |
| Gradient clipping | S | ✅ | Prevent exploding gradients |
| Batch normalization | M | ✅ | Between layers |
| Learning rate warmup | S | ✅ | Gradual increase (0-50 epochs) |
| Cyclic learning rate | M | ✅ | Triangle/cosine cycles |

---

## Phase 2: Metrics & History

### 🔴 P0 — Essential Metrics

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Real-time loss chart | M | ✅ | Line graph with D3 |
| Training history array | S | ✅ | Store epoch/loss pairs |
| Accuracy metric | S | ✅ | Classification accuracy |

### 🟠 P1 — Extended Metrics

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Train/validation split | M | ✅ | Configurable 0-30% |
| Validation loss tracking | S | ✅ | Dashed red line on chart |
| Export history to JSON | S | ✅ | Download button |
| Export history to CSV | S | ✅ | Spreadsheet format |

### 🟡 P2 — Advanced Analytics

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Confusion matrix | M | ✅ | Heatmap visualization |
| Precision/Recall/F1 | S | ✅ | Macro-averaged metrics |
| Learning rate display | S | ✅ | Show current LR during training |
| ROC curve | M | ✅ | Binary classification with AUC |
| Learning rate finder | L | ✅ | Cyclic LR test with chart |

---

## Phase 3: Visualization Improvements

### 🟠 P1 — Decision Boundary

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Heatmap intensity slider | S | ✅ | Opacity control (10-100%) |
| Contour line count | S | ✅ | Slider 3-20 contours |
| Custom color schemes | S | ✅ | 5 presets (default, viridis, plasma, cool, warm) |
| Point size control | S | ✅ | Small/Medium/Large |
| Misclassified points highlighting | S | ✅ | Red outline toggle |

### 🟡 P2 — Interactive Features

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Zoom and pan | M | ✅ | D3 zoom with double-click reset |
| Hover tooltips | S | ✅ | Point coordinates and class |
| Click point for prediction details | S | ✅ | Toast with confidence |
| Confidence circles | M | ✅ | Radius = uncertainty |
| Boundary evolution animation | L | ✅ | Record & replay training |

### 🟢 P3 — Advanced Visualization

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| 3D visualization (Three.js) | XL | ✅ | Height = confidence |
| Network architecture diagram | L | ✅ | Interactive D3 node graph |
| Weight histogram | S | ✅ | Layer weight distribution |
| Weight magnitude visualization | M | ✅ | Color-coded connections |
| Real-time neuron activations | L | ✅ | Per-layer heatmaps |
| Voronoi diagram overlay | M | ✅ | Alternative boundary view |

---

## Phase 4: Data Management

### 🟠 P1 — Custom Data

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Draw your own data (click to add) | M | ✅ | Click chart, toggle class |
| Noise level slider | S | ✅ | 0-50% noise |
| Sample count slider | S | ✅ | 50-500 points |
| Class imbalance ratio | S | ✅ | Slider control (10-90%) |

### 🟡 P2 — Data Import/Export

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Upload CSV files | M | ✅ | File input + parsing |
| Download current dataset | S | ✅ | CSV export |
| Real-world datasets (Iris, Wine) | M | ✅ | PCA-reduced, bundled |

### 🟡 P2 — Preprocessing

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Feature normalization toggle | S | ✅ | Min-max scaling |
| Standardization toggle | S | ✅ | Z-score scaling |
| Train/test split visualization | M | ✅ | Different markers (yellow dashed) |

---

## Phase 5: Model Capabilities

### 🟠 P1 — Activation Functions

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| ReLU activation | S | ✅ | Default option |
| Sigmoid activation | S | ✅ | Classic activation |
| Tanh activation | S | ✅ | Alternative to sigmoid |
| ELU activation | S | ✅ | Smooth alternative |
| Per-layer activation selection | M | ✅ | Comma-separated input |

### 🟡 P2 — Model Management

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Download trained model | M | ✅ | TensorFlow.js format |
| Load saved model | M | ✅ | File upload (JSON + weights) |
| Share config code | M | ✅ | Copy/paste Base64 config |

### 🟢 P3 — Advanced Models

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Model comparison (A/B) | L | ✅ | Side-by-side training |
| Model ensemble | L | ✅ | Voting visualization |
| Export to ONNX | L | ✅ | Cross-platform |
| Generate Python code | M | ✅ | Keras/TensorFlow export |

---

## Phase 6: UX & Polish

### 🟠 P1 — Essential UX

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Keyboard shortcuts | S | ✅ | Space, S, R, Escape |
| Dark/light theme toggle | M | ✅ | CSS variables + Tailwind dark mode |
| Responsive mobile layout | M | ✅ | Mobile-first breakpoints |
| Fullscreen mode | S | ✅ | Fullscreen API + F key |

### 🟡 P2 — Session Management

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Save session to localStorage | M | ✅ | Auto-save on close |
| Load previous session | M | ✅ | Restore on load |
| Preset configurations | S | ✅ | 5 quick start templates |
| Bookmark configurations | S | ✅ | Named presets with save/delete |

### 🟡 P2 — Export & Sharing

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Download boundary as PNG | S | ✅ | Canvas to image |
| Download as SVG | S | ✅ | D3 SVG export |
| Screenshot with metadata | M | ✅ | Overlay config info |

### 🟢 P3 — Advanced UX

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Record training as GIF | L | ✅ | Frame capture from evolution |
| Split-screen comparison | M | ✅ | Model comparison panel |
| Browser notifications | S | ✅ | Training complete alert |

---

## Phase 7: Educational Features

### 🟡 P2 — Tooltips & Guidance

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| "Explain like I'm 5" tooltips | M | ✅ | Hover explanations |
| Overfitting/underfitting warnings | M | ✅ | Automatic detection |
| Suggested fixes | M | ✅ | Actionable recommendations |

### 🟢 P3 — Interactive Learning

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Guided tutorials | L | ✅ | Step-by-step walkthrough |
| What-if analysis | L | ✅ | Parameter sensitivity |
| Gradient visualization | L | ✅ | Backprop animation |

---

## Phase 8: Performance & Infrastructure

### 🟠 P1 — Performance

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Web Worker for training | L | ✅ | Non-blocking UI |
| Frame rate limiter | S | ✅ | Battery saving mode |
| Progressive grid rendering | M | ✅ | Large grid optimization |

### 🟢 P3 — Advanced Infrastructure

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| WebGL-accelerated rendering | L | ✅ | Canvas/Three.js |
| REST API | XL | ✅ | Programmatic control |
| WebSocket real-time updates | L | ✅ | Live collaboration |
| Plugin system | XL | ✅ | Extensibility |

---

## Phase 9: Research Features

### 🟢 P3 — Explainability

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Feature importance | L | ✅ | Permutation importance |
| LIME-style explanations | XL | ✅ | Local interpretability |
| Saliency maps | L | ✅ | Gradient-based |

### 🟢 P3 — Advanced ML

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Adversarial examples | L | ✅ | FGSM attack |
| Bayesian neural networks | XL | ✅ | Uncertainty quantification |
| Neural architecture search | XL | ✅ | Auto-optimization |

---

## Implementation Order (Suggested)

### ✅ Sprint 1: Training Controls (Complete)

1. ✅ Batch size configuration
2. ✅ Epoch limit (auto-stop)
3. ✅ Training speed control
4. ✅ Adam optimizer
5. ✅ L2 regularization

### ✅ Sprint 2: Metrics Dashboard (Complete)

1. ✅ Training history array
2. ✅ Real-time loss chart
3. ✅ Accuracy metric
4. ✅ Export to JSON/CSV
5. ✅ Train/validation split
6. ✅ Validation loss tracking

### ✅ Sprint 3: Visualization Polish (Complete)

1. ✅ Zoom and pan
2. ✅ Hover tooltips
3. ✅ Heatmap opacity control
4. ✅ Colour scheme selector
5. ✅ Point size control

### ✅ Sprint 4: Data Flexibility (Complete)

1. ✅ Draw your own data (click to add)
2. ✅ Noise/sample sliders
3. ✅ Multi-class support (2-5 classes)

### ✅ Sprint 5: UX & Persistence (Complete)

1. ✅ Keyboard shortcuts (Space, S, R, F)
2. ✅ Dark/light theme toggle
3. ✅ Fullscreen mode (F key)
4. ✅ Session save/load (auto-save on close)
5. ✅ Preset configurations (5 quick start templates)
6. ✅ Responsive mobile layout

### ✅ Sprint 6: Advanced Training (Complete)

1. ✅ Learning rate scheduling (exponential, step, cosine)
2. ✅ Dropout layers (per-layer toggle)
3. ✅ Early stopping (validation loss patience)
4. ✅ Confusion matrix visualization
5. ✅ Precision/Recall/F1 metrics

### ✅ Sprint 7: Export & Sharing (Complete)

1. ✅ Download boundary as PNG
2. ✅ Download as SVG
3. ✅ Upload CSV files
4. ✅ Download current dataset

### ✅ Sprint 8: Advanced Visualization (Complete)

1. ✅ Misclassified points highlighting
2. ✅ Click point for prediction details
3. ✅ Contour line count control
4. ✅ Confidence circles

### ✅ Sprint 9: Quick Wins (Complete)

1. ✅ Momentum control (SGD)
2. ✅ L1 regularization
3. ✅ Learning rate warmup
4. ✅ Feature normalization/standardization
5. ✅ Gradient clipping
6. ✅ Weight histogram
7. ✅ Learning rate display

### ✅ Sprint 10: High-Value Features (Complete)

1. ✅ Batch normalization
2. ✅ Train/test split visualization
3. ✅ Load saved model
4. ✅ Screenshot with metadata

### ✅ Sprint 11: Advanced Features (Complete)

1. ✅ Cyclic learning rate (triangle + cosine)
2. ✅ ROC curve with AUC
3. ✅ Share config code (copy/paste)

### ✅ Sprint 12: High-Value Quick Wins (Complete)

1. ✅ Browser notifications
2. ✅ Learning rate finder
3. ✅ Boundary evolution animation

### ✅ Sprint 13: Advanced Features (Complete)

1. ✅ Record training as GIF
2. ✅ Model comparison panel
3. ✅ Network architecture diagram
4. ✅ Generate Python code
5. ✅ Overfitting/underfitting warnings

### ✅ Sprint 14: Infrastructure & Education (Complete)

1. ✅ Web Worker for background processing
2. ✅ 3D visualization with Three.js
3. ✅ Guided tutorials system

### ✅ Sprint 15: Phase 3 Completion (Complete)

1. ✅ Weight magnitude visualization (color-coded connections)
2. ✅ Real-time neuron activations (per-layer heatmaps)
3. ✅ Voronoi diagram overlay (alternative boundary view)

### ✅ Sprint 16: Phase 5 Completion (Complete)

1. ✅ Model comparison (A/B) - side-by-side training
2. ✅ Model ensemble - voting visualization
3. ✅ Export to ONNX - cross-platform format

### ✅ Sprint 17: Phase 7 Completion (Complete)

1. ✅ ELI5 tooltips - beginner-friendly hover explanations
2. ✅ Suggested fixes - actionable recommendations with one-click apply
3. ✅ What-if analysis - parameter sensitivity testing
4. ✅ Gradient visualization - backprop flow animation

### ✅ Sprint 18: Phase 8 Completion (Complete)

1. ✅ Frame rate limiter - battery saving performance modes
2. ✅ Progressive grid rendering - chunked rendering for large grids
3. ✅ WebGL-accelerated rendering - GPU-powered 2D visualization
4. ✅ REST API - programmatic control via window.neurovizAPI
5. ✅ WebSocket real-time updates - live collaboration support
6. ✅ Plugin system - extensible architecture for custom features

### ✅ Sprint 19: Phase 9 Completion (Complete)

1. ✅ Feature importance - permutation importance analysis
2. ✅ LIME-style explanations - local interpretable explanations
3. ✅ Saliency maps - gradient-based sensitivity visualization
4. ✅ Adversarial examples - FGSM attack generation
5. ✅ Bayesian neural networks - MC Dropout uncertainty quantification
6. ✅ Neural architecture search - random/evolutionary auto-optimization

---

## Improvement Roadmap (Phases 2–6)

The improvement roadmap addresses architecture quality, UX clarity, and
repo hygiene — orthogonal to the feature phases above.

| Phase | Description | Status | PR |
|-------|-------------|--------|----|
| Phase 2 | Repo hygiene + README reconciliation | ✅ Complete | `13188c1` |
| Phase 3 | State cues + Learn Mode `data-min-mode` expansion | ✅ Complete | #23 |
| Phase 4 | Onboarding modal + workflow spine | ✅ Complete | #24 |
| Phase 5 | `TrainingSession` controlled extraction (3 services) | ✅ Complete | #25 |
| Phase 6 | LR finder extraction + docs polish | ✅ Complete | #26 |

### Services extracted from TrainingSession (Phase 5–6)

| Service | Lines | Responsibility |
|---------|-------|----------------|
| `SessionStateStore` | 205 | Mutable state + observer notifications |
| `DatasetPreparationService` | 162 | Data loading, preprocessing, train/val splitting |
| `ExperimentService` | 80 | Config undo/redo, boundary snapshots, completion |
| `LRFinderService` | 60 | LR range test sweep with model restoration |
| `TrainingSession` (facade) | 605 | Orchestration, training loop, visualisation coordination |

---

## Contributing

To contribute a feature:

1. Check this roadmap for priority and status
2. Create an issue referencing the feature
3. Submit a PR with tests
4. Update this document when complete

---

Last updated: April 2026

---

## Progress Summary

| Phase | Description | Completed | Total | Progress |
|-------|-------------|-----------|-------|----------|
| Phase 1 | Core Training | 16 | 16 | 100% |
| Phase 2 | Metrics & History | 12 | 12 | 100% |
| Phase 3 | Visualization | 16 | 16 | 100% |
| Phase 4 | Data Management | 10 | 10 | 100% |
| Phase 5 | Model Capabilities | 12 | 12 | 100% |
| Phase 6 | UX & Polish | 14 | 14 | 100% |
| Phase 7 | Educational | 6 | 6 | 100% |
| Phase 8 | Performance | 7 | 7 | 100% |
| Phase 9 | Research | 6 | 6 | 100% |
| **Total** | | **99** | **99** | **100%** |
