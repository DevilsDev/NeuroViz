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
| Multi-class classification (3+ classes) | M | 🔲 | Unlocks real-world datasets |
| Batch size configuration | S | ✅ | Configurable in UI |
| Epoch limit (auto-stop) | S | ✅ | Auto-stops at limit |
| Training speed control (FPS) | S | ✅ | Slider 1-60 FPS |

### 🟠 P1 — Optimizers & Regularization

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Adam optimizer | S | ✅ | Default optimizer |
| RMSprop, Adagrad optimizers | S | ✅ | Dropdown selector |
| Learning rate scheduling | M | 🔲 | Decay, step, cosine |
| L2 regularization (weight decay) | S | ✅ | Slider control |
| Dropout layers | M | 🔲 | Per-layer toggle |
| Early stopping | M | 🔲 | Validation loss patience |

### 🟡 P2 — Advanced Training

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Momentum control | S | 🔲 | SGD momentum parameter |
| L1 regularization | S | 🔲 | Sparsity inducing |
| Batch normalization | M | 🔲 | Between layers |
| Learning rate warmup | S | 🔲 | Gradual increase |
| Cyclic learning rate | M | 🔲 | Triangle/cosine cycles |

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
| Confusion matrix | M | 🔲 | Heatmap visualization |
| Precision/Recall/F1 | S | 🔲 | Per-class metrics |
| ROC curve | M | 🔲 | Binary classification |
| Learning rate finder | L | 🔲 | Cyclic LR test |

---

## Phase 3: Visualization Improvements

### 🟠 P1 — Decision Boundary

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Heatmap intensity slider | S | ✅ | Opacity control (10-100%) |
| Contour line count | S | 🔲 | Threshold adjustment |
| Custom color schemes | S | ✅ | 5 presets (default, viridis, plasma, cool, warm) |
| Point size control | S | ✅ | Small/Medium/Large |
| Misclassified points highlighting | S | 🔲 | Red outline/marker |

### 🟡 P2 — Interactive Features

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Zoom and pan | M | ✅ | D3 zoom with double-click reset |
| Hover tooltips | S | ✅ | Point coordinates and class |
| Click point for prediction details | S | 🔲 | Tooltip with confidence |
| Confidence circles | M | 🔲 | Radius = uncertainty |
| Boundary evolution animation | L | 🔲 | Replay training |

### 🟢 P3 — Advanced Visualization

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| 3D visualization (Three.js) | XL | 🔲 | Height = confidence |
| Network architecture diagram | L | 🔲 | Interactive node graph |
| Weight magnitude visualization | M | 🔲 | Color-coded connections |
| Real-time neuron activations | L | 🔲 | Per-layer heatmaps |
| Voronoi diagram overlay | M | 🔲 | Alternative boundary view |

---

## Phase 4: Data Management

### 🟠 P1 — Custom Data

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Draw your own data (click to add) | M | ✅ | Click chart, toggle class |
| Noise level slider | S | ✅ | 0-50% noise |
| Sample count slider | S | ✅ | 50-500 points |
| Class imbalance ratio | S | 🔲 | Slider control |

### 🟡 P2 — Data Import/Export

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Upload CSV files | M | 🔲 | File input + parsing |
| Download current dataset | S | 🔲 | CSV export |
| Real-world datasets (Iris, Wine) | M | 🔲 | Bundled or fetched |

### 🟡 P2 — Preprocessing

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Feature normalization toggle | S | 🔲 | Min-max scaling |
| Standardization toggle | S | 🔲 | Z-score scaling |
| Train/test split visualization | M | 🔲 | Different markers |

---

## Phase 5: Model Capabilities

### 🟠 P1 — Activation Functions

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| ReLU activation | S | 🔲 | Default option |
| Leaky ReLU | S | 🔲 | Configurable alpha |
| Tanh activation | S | 🔲 | Alternative to sigmoid |
| Per-layer activation selection | M | 🔲 | Dropdown per layer |

### 🟡 P2 — Model Management

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Download trained model | M | 🔲 | TensorFlow.js format |
| Load saved model | M | 🔲 | File upload |
| Share via URL parameters | M | 🔲 | Encode config in URL |

### 🟢 P3 — Advanced Models

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Model comparison (A/B) | L | 🔲 | Side-by-side training |
| Model ensemble | L | 🔲 | Voting visualization |
| Export to ONNX | L | 🔲 | Cross-platform |
| Generate Python code | M | 🔲 | Keras equivalent |

---

## Phase 6: UX & Polish

### 🟠 P1 — Essential UX

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Keyboard shortcuts | S | 🔲 | Space, S, R, Escape |
| Dark/light theme toggle | M | 🔲 | CSS variables |
| Responsive mobile layout | M | 🔲 | Tailwind breakpoints |
| Fullscreen mode | S | 🔲 | Fullscreen API |

### 🟡 P2 — Session Management

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Save session to localStorage | M | 🔲 | Data + config + model |
| Load previous session | M | 🔲 | Restore state |
| Preset configurations | S | 🔲 | Quick experiment templates |
| Bookmark configurations | S | 🔲 | Named presets |

### 🟡 P2 — Export & Sharing

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Download boundary as PNG | S | 🔲 | Canvas to image |
| Download as SVG | S | 🔲 | D3 SVG export |
| Screenshot with metadata | M | 🔲 | Overlay config info |

### 🟢 P3 — Advanced UX

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Record training as GIF | L | 🔲 | Frame capture |
| Split-screen comparison | M | 🔲 | Two models side-by-side |
| Browser notifications | S | 🔲 | Training complete alert |

---

## Phase 7: Educational Features

### 🟡 P2 — Tooltips & Guidance

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| "Explain like I'm 5" tooltips | M | 🔲 | Hover explanations |
| Overfitting/underfitting warnings | M | 🔲 | Automatic detection |
| Suggested fixes | M | 🔲 | Actionable recommendations |

### 🟢 P3 — Interactive Learning

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Guided tutorials | L | 🔲 | Step-by-step walkthrough |
| What-if analysis | L | 🔲 | Parameter sensitivity |
| Gradient visualization | L | 🔲 | Backprop animation |

---

## Phase 8: Performance & Infrastructure

### 🟠 P1 — Performance

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Web Worker for training | L | 🔲 | Non-blocking UI |
| Frame rate limiter | S | 🔲 | Battery saving mode |
| Progressive grid rendering | M | 🔲 | Large grid optimization |

### 🟢 P3 — Advanced Infrastructure

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| WebGL-accelerated rendering | L | 🔲 | Canvas/Three.js |
| REST API | XL | 🔲 | Programmatic control |
| WebSocket real-time updates | L | 🔲 | Live collaboration |
| Plugin system | XL | 🔲 | Extensibility |

---

## Phase 9: Research Features

### 🟢 P3 — Explainability

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Feature importance | L | 🔲 | Permutation importance |
| LIME-style explanations | XL | 🔲 | Local interpretability |
| Saliency maps | L | 🔲 | Gradient-based |

### 🟢 P3 — Advanced ML

| Feature | Complexity | Status | Notes |
|---------|------------|--------|-------|
| Adversarial examples | L | 🔲 | FGSM attack |
| Bayesian neural networks | XL | 🔲 | Uncertainty quantification |
| Neural architecture search | XL | 🔲 | Auto-optimization |
| Transfer learning | L | 🔲 | Pre-trained models |

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

### 🔄 Sprint 4: Data Flexibility (In Progress)

1. ✅ Draw your own data (click to add)
2. ✅ Noise/sample sliders
3. 🔲 Multi-class support
4. 🔲 Upload CSV

### Sprint 5: UX & Persistence

1. 🔲 Keyboard shortcuts
2. 🔲 Dark/light theme
3. 🔲 Session save/load
4. 🔲 Preset configurations

---

## Contributing

To contribute a feature:

1. Check this roadmap for priority and status
2. Create an issue referencing the feature
3. Submit a PR with tests
4. Update this document when complete

---

Last updated: December 2024
