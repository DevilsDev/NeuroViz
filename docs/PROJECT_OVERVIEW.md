# NeuroViz — Project Overview

> An interactive neural network visualisation and training tool for understanding how neural networks learn to classify data.

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Feature Set](#feature-set)
5. [UI/UX Design](#uiux-design)
6. [State Management](#state-management)
7. [Accessibility](#accessibility)
8. [File Structure](#file-structure)
9. [Design Decisions](#design-decisions)

---

## Overview

**NeuroViz** is a single-page web application that enables users to:

- Train neural networks on 2D classification datasets
- Watch the decision boundary evolve in real-time
- Explore model internals (weights, gradients, activations)
- Understand classification metrics (confusion matrix, ROC curve)

The primary goal is **education** — helping users build intuition about how neural networks learn by providing immediate visual feedback for every parameter change.

### Target Audience

- Students learning machine learning fundamentals
- Educators demonstrating neural network concepts
- Developers prototyping network architectures
- Anyone curious about how neural networks work

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Language** | TypeScript | Type-safe application logic |
| **Markup** | HTML5 | Semantic structure |
| **Styling** | Tailwind CSS + Custom CSS | Utility-first styling with custom components |
| **2D Visualisation** | D3.js | Decision boundary, charts, diagrams |
| **3D Visualisation** | Three.js | 3D decision surface view |
| **ML Engine** | TensorFlow.js | Neural network training in-browser |
| **Build Tool** | Vite | Fast development and production builds |
| **State** | Custom session manager | Centralised state with localStorage persistence |

### Why These Choices?

- **TensorFlow.js** — Industry-standard ML library, runs entirely in-browser (no server required)
- **D3.js** — Maximum control over visualisation, essential for custom decision boundary rendering
- **Tailwind CSS** — Rapid UI development with consistent design tokens
- **Vite** — Near-instant hot module replacement during development
- **Vanilla TypeScript** — No framework overhead, full control over rendering performance

---

## Architecture

### Directory Structure

```text
NeuroViz/
├── index.html                 # Main HTML document
├── src/
│   ├── main.ts                # Application entry point, event handlers, UI logic
│   ├── domain/                # Core business logic (framework-agnostic)
│   │   ├── network.ts         # Neural network creation, training, prediction
│   │   ├── datasets.ts        # Dataset generation (circle, XOR, spiral, etc.)
│   │   ├── types.ts           # TypeScript interfaces and types
│   │   └── metrics.ts         # Classification metrics calculations
│   ├── presentation/          # UI and visualisation layer
│   │   ├── charts.ts          # D3.js chart components
│   │   ├── threeViz.ts        # Three.js 3D visualisation
│   │   ├── networkDiagram.ts  # Neural network architecture diagram
│   │   └── styles.css         # All CSS (Tailwind + custom)
│   └── infrastructure/        # Cross-cutting concerns
│       ├── logger.ts          # Structured logging with levels
│       ├── errorBoundary.ts   # Global error handling
│       ├── workerManager.ts   # Web Worker for background processing
│       └── toast.ts           # Notification system
├── docs/                      # Documentation
│   ├── PROJECT_OVERVIEW.md    # This file
│   ├── ARCHITECTURE.md        # Hexagonal architecture reference
│   ├── ROADMAP.md             # Phased delivery roadmap
│   └── archive/               # Historical audit snapshots and one-off reports
└── public/                    # Static assets
```

### Layer Responsibilities

| Layer | Responsibility |
|-------|----------------|
| **Domain** | Pure business logic — network creation, training loops, dataset generation. No UI dependencies. |
| **Presentation** | Rendering and user interaction — charts, diagrams, event handlers. Depends on Domain. |
| **Infrastructure** | Cross-cutting utilities — logging, error handling, persistence. Used by all layers. |

### Data Flow

```text
User Action → Event Handler → State Update → updateUI() → DOM/Canvas Update
                                   ↓
                            localStorage (auto-save)
```

---

## Feature Set

### Core Training Features

| Feature | Description |
|---------|-------------|
| **Real-time Decision Boundary** | Watch the classification surface evolve during training |
| **Multiple Datasets** | Circle, XOR, Spiral, Gaussian, Moons, Multi-class, Custom drawing |
| **Configurable Architecture** | 1-5 hidden layers, 1-32 neurons per layer |
| **Activation Functions** | ReLU, Sigmoid, Tanh, LeakyReLU, ELU, SELU, Softplus, Swish |
| **Regularisation** | L2 weight decay, Dropout (0-50%) |
| **Optimisers** | SGD, Adam, RMSprop, Adagrad |
| **Learning Rate Scheduling** | Constant, Step decay, Exponential decay, Cosine annealing |
| **Early Stopping** | Configurable patience based on validation loss |

### Visualisation Features

| Feature | Description |
|---------|-------------|
| **2D Decision Boundary** | Colour-coded classification regions with data points |
| **3D Decision Surface** | Interactive 3D view of the decision boundary |
| **Loss/Accuracy Charts** | Training and validation curves over epochs |
| **Confusion Matrix** | TP/TN/FP/FN with colour intensity |
| **ROC Curve** | Receiver Operating Characteristic with AUC |
| **Network Diagram** | Visual representation of layers and connections |
| **Weight Histograms** | Distribution of weights per layer |
| **Gradient Flow** | Monitor vanishing/exploding gradients |
| **Activation Heatmaps** | Layer-by-layer activation patterns |

### UX Features

| Feature | Description |
|---------|-------------|
| **Onboarding Wizard** | 4-step guided setup for first-time users |
| **Quick Presets** | One-click configurations (Quick Demo, XOR Challenge, Deep Spiral) |
| **Session Persistence** | Auto-save/restore training state across browser sessions |
| **Keyboard Shortcuts** | Space (start/pause), R (reset), S (step), F (fullscreen), ? (help) |
| **Export Options** | PNG, SVG, JSON, CSV, Python code generation |
| **A/B Comparison** | Compare two model configurations side-by-side |
| **What-If Analysis** | Test predictions on custom input points |

---

## UI/UX Design

### Layout Structure

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER                                                                 │
│  ┌─────────────┐  ┌─────────────────────────────────┐  ┌─────────────┐  │
│  │ Logo        │  │ Workflow Stepper                │  │ Actions     │  │
│  │ NeuroViz    │  │ [Data] → [Network] → [Train]    │  │ 🌙 ❓ ⛶     │  │
│  └─────────────┘  └─────────────────────────────────┘  └─────────────┘  │
├─────────────────────────────────────────────────────────────────────────┤
│  MAIN CONTENT                                                           │
│  ┌───────────────────────────────────┐  ┌─────────────────────────────┐ │
│  │                                   │  │ SIDEBAR                     │ │
│  │                                   │  │ ┌─────────────────────────┐ │ │
│  │                                   │  │ │ Tabs: Setup│Train│Analyse│ │ │
│  │     VISUALISATION PANEL           │  │ └─────────────────────────┘ │ │
│  │                                   │  │ ┌─────────────────────────┐ │ │
│  │     Decision Boundary             │  │ │ Quick Presets           │ │ │
│  │     (D3.js / Three.js)            │  │ ├─────────────────────────┤ │ │
│  │                                   │  │ │ Dataset Configuration   │ │ │
│  │                                   │  │ ├─────────────────────────┤ │ │
│  │                                   │  │ │ Network Architecture    │ │ │
│  │                                   │  │ ├─────────────────────────┤ │ │
│  │                                   │  │ │ Training Controls       │ │ │
│  │                                   │  │ ├─────────────────────────┤ │ │
│  │                                   │  │ │ Visualisation Options   │ │ │
│  └───────────────────────────────────┘  │ └─────────────────────────┘ │ │
│                                         └─────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│  METRICS BAR                                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Epoch    │ │ Loss     │ │ Val Loss │ │ Accuracy │ │ Val Acc  │       │
│  │ 150      │ │ 0.0234   │ │ 0.0312   │ │ 98.5%    │ │ 97.2%    │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
├─────────────────────────────────────────────────────────────────────────┤
│  CHARTS PANEL                                                           │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐            │
│  │ Training History│ │ Classification  │ │ Model Internals │            │
│  │ (Loss curves)   │ │ (Confusion, ROC)│ │ (Weights, Grads)│            │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘            │
└─────────────────────────────────────────────────────────────────────────┘
```

### Responsive Design

| Breakpoint | Layout Adaptation |
|------------|-------------------|
| **Desktop (≥1024px)** | Side-by-side visualisation and sidebar |
| **Tablet (768-1023px)** | Stacked layout, collapsible sidebar |
| **Mobile (<768px)** | Full-width visualisation, bottom sheet controls |

### Mobile-Specific Features

- **Bottom Sheet** — Slide-up panel with quick controls (dataset, layers, start button)
- **Collapsible Header** — Header minimises during active training to maximise viz space
- **Touch Gestures** — Pinch to zoom, pan when zoomed, double-tap to reset

### Colour System

```css
/* Primary Palette (Dark Theme) */
--navy-900: #0a0f1a;    /* Background */
--navy-800: #111827;    /* Cards, panels */
--navy-700: #1e293b;    /* Borders, dividers */
--slate-400: #94a3b8;   /* Secondary text */
--white: #ffffff;       /* Primary text */

/* Accent Colours */
--accent-500: #14b8a6;  /* Teal — primary actions, active states */
--accent-400: #2dd4bf;  /* Teal light — hover states */

/* Semantic Colours */
--success: #22c55e;     /* Green — positive metrics */
--warning: #f59e0b;     /* Amber — caution states */
--error: #ef4444;       /* Red — errors, negative metrics */

/* Data Visualisation */
--class-a: #f97316;     /* Orange — Class 0 */
--class-b: #3b82f6;     /* Blue — Class 1 */
--class-c: #22c55e;     /* Green — Class 2 */
--class-d: #a855f7;     /* Purple — Class 3 */
```

### Typography

| Element | Size | Weight | Colour |
|---------|------|--------|--------|
| **Headings** | 1.25rem (20px) | 600 | White |
| **Body** | 0.875rem (14px) | 400 | Slate-300 |
| **Labels** | 0.6875rem (11px) | 500 | Slate-400 |
| **Metrics** | 1.5rem (24px) | 700 | White |
| **Code/Mono** | 0.75rem (12px) | 400 | Slate-300 |

### Component Design

#### Buttons

```text
Primary:   Teal gradient, white text, shadow
Secondary: Navy-700 background, slate-300 text
Ghost:     Transparent, slate-400 text, hover: navy-700
Disabled:  40% opacity, cursor-not-allowed
```

#### Form Controls

```text
Inputs:    Navy-800 background, navy-600 border, slate-200 text
Selects:   Custom dropdown arrow, navy-700 options
Sliders:   Teal track, navy-600 rail, value tooltip
Checkboxes: Teal when checked, navy-600 border
```

#### Cards/Panels

```text
Background: Navy-800 with subtle gradient
Border:     Navy-600/50 (semi-transparent)
Shadow:     Subtle glow effect (panel-glow class)
Radius:     0.75rem (12px)
```

### Interaction Patterns

| Pattern | Implementation |
|---------|----------------|
| **Progressive Disclosure** | Collapsible fieldsets, tabbed interface |
| **Immediate Feedback** | Real-time chart updates, live metrics |
| **Undo/Redo** | Reset button, session restore |
| **Confirmation** | Toast notifications for actions |
| **Loading States** | Spinner overlay during data loading |
| **Empty States** | Animated preview with call-to-action |

---

## State Management

### Central State Object

```typescript
interface TrainingState {
  // Training status
  isRunning: boolean;
  isPaused: boolean;
  currentEpoch: number;
  maxEpochs: number;
  
  // Metrics
  currentLoss: number | null;
  currentValLoss: number | null;
  currentAccuracy: number | null;
  currentValAccuracy: number | null;
  
  // History
  lossHistory: number[];
  valLossHistory: number[];
  accuracyHistory: number[];
  
  // Configuration
  dataset: DatasetType;
  layers: number[];
  activation: ActivationType;
  learningRate: number;
  batchSize: number;
  
  // Model reference
  model: tf.LayersModel | null;
  data: DataPoint[] | null;
}
```

### State Flow

1. **User Action** — Click, input change, keyboard shortcut
2. **Event Handler** — Validates input, updates state
3. **State Update** — Modifies `TrainingState` object
4. **UI Sync** — `updateUI(state)` propagates changes to DOM
5. **Persistence** — Auto-save to localStorage on significant changes

### Persistence Strategy

```typescript
// Saved to localStorage
{
  "neuroviz-session": {
    dataset: "circle",
    layers: [8, 4],
    activation: "relu",
    learningRate: 0.03,
    // ... full configuration
  },
  "neuroviz-has-visited": "true",      // First-visit flag
  "neuroviz-skip-wizard": "true",      // Wizard preference
  "neuroviz-collapsed-sections": [...] // UI state
}
```

---

## Accessibility

### WCAG 2.1 AA Compliance

| Criterion | Implementation |
|-----------|----------------|
| **1.3.1 Info and Relationships** | Semantic HTML, ARIA landmarks, proper heading hierarchy |
| **1.4.3 Contrast (Minimum)** | All text ≥4.5:1 contrast ratio |
| **2.1.1 Keyboard** | All interactive elements keyboard accessible |
| **2.4.1 Bypass Blocks** | Skip links to main content areas |
| **2.4.6 Headings and Labels** | Descriptive labels on all form controls |
| **4.1.2 Name, Role, Value** | ARIA labels on custom controls |

### Accessibility Features

- **Skip Links** — "Skip to visualisation", "Skip to controls"
- **Landmark Roles** — `banner`, `main`, `complementary`, `application`
- **Tab Navigation** — Arrow keys for tab switching, proper focus management
- **Screen Reader Announcements** — Live region for training status updates
- **Reduced Motion** — Respects `prefers-reduced-motion` media query

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Start/Pause training |
| `S` | Step (single epoch) |
| `R` | Reset network |
| `F` | Toggle fullscreen |
| `?` | Show help modal |
| `Escape` | Close modals, pause training |
| `Tab` | Navigate controls |
| `Arrow Keys` | Navigate tabs |

---

## File Structure

### Size Breakdown

| File | Lines | Purpose |
|------|-------|---------|
| `main.ts` | ~4,900 | Event handlers, UI logic, state management |
| `styles.css` | ~2,000 | All styling (Tailwind utilities + custom CSS) |
| `index.html` | ~1,600 | Complete HTML structure, modals, controls |
| `charts.ts` | ~1,200 | D3.js visualisation components |
| `network.ts` | ~800 | TensorFlow.js model creation and training |
| `threeViz.ts` | ~600 | Three.js 3D visualisation |
| `datasets.ts` | ~400 | Dataset generation algorithms |

### Key Files Explained

#### `main.ts`

The application entry point and orchestrator. Contains:

- DOM element references
- Event handler bindings
- State management functions
- UI update logic
- Training loop coordination

#### `styles.css`

All styling in a single file for maintainability:

- Tailwind base/components/utilities
- Custom component styles
- Responsive breakpoints
- Dark/light theme support
- Animation keyframes

#### `index.html`

Complete HTML structure including:

- Header with navigation
- Main visualisation panel
- Sidebar with tabbed controls
- Metrics bar
- Charts panel
- All modals (help, wizard, A/B comparison)

---

## Design Decisions

### Why Single-Page Application?

- **No server required** — Runs entirely in-browser
- **Instant feedback** — No network latency for training updates
- **Offline capable** — Works without internet after initial load
- **Easy deployment** — Static files, any web host

### Why No Framework (React, Vue, etc.)?

- **Performance** — Direct DOM manipulation for high-frequency updates (60fps training viz)
- **Bundle size** — Smaller initial load, faster time-to-interactive
- **Simplicity** — Fewer abstractions, easier to understand and maintain
- **Learning tool** — Demonstrates that complex UIs don't require frameworks

### Why Tailwind CSS?

- **Rapid prototyping** — Utility classes speed up development
- **Consistency** — Design tokens ensure visual coherence
- **Purging** — Unused styles removed in production build
- **Customisation** — Extended with custom colours and components

### Why D3.js for Visualisation?

- **Full control** — Custom rendering for decision boundary
- **Performance** — Efficient updates with data binding
- **Flexibility** — Any chart type, any interaction
- **Industry standard** — Well-documented, large community

### Trade-offs Accepted

| Decision | Trade-off |
|----------|-----------|
| Single file for main.ts | Large file, but all logic in one place |
| No component library | More custom CSS, but exact control |
| localStorage only | No cloud sync, but no account required |
| TensorFlow.js | Larger bundle, but full ML capabilities |

---

## Future Considerations

### Potential Enhancements

- **Model zoo** — Pre-trained models for common patterns
- **Collaborative mode** — Share training sessions via URL
- **GPU acceleration** — WebGL backend for larger networks
- **Custom datasets** — CSV/JSON import
- **Hyperparameter search** — Automated architecture tuning

### Performance Optimisations

- **Web Worker training** — Move training loop off main thread
- **Canvas rendering** — Replace SVG for decision boundary at high resolution
- **Incremental updates** — Only redraw changed chart regions

---

## Contributing

Start from the evergreen docs:

- `docs/ARCHITECTURE.md` — Hexagonal architecture reference
- `docs/DEVELOPMENT.md` — Local setup and workflow
- `docs/ROADMAP.md` — Phased delivery plan and current status

Historical audit reports and one-off reviews live under `docs/archive/`.

---

Last updated: December 2025
