# NeuroViz Development Guide

Comprehensive guide for developers contributing to or extending NeuroViz.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Code Standards](#code-standards)
- [Testing Guidelines](#testing-guidelines)
- [Adding New Features](#adding-new-features)
- [Performance Optimization](#performance-optimization)
- [Security Considerations](#security-considerations)
- [Debugging](#debugging)
- [CI/CD Pipeline](#cicd-pipeline)
- [Release Process](#release-process)

---

## Development Setup

### Prerequisites

```bash
# Required versions
Node.js: 20+
npm: 10+
Git: 2.30+
```

### Initial Setup

```bash
# Clone repository
git clone https://github.com/DevilsDev/NeuroViz.git
cd NeuroViz

# Install dependencies
npm install

# Start development server with hot reload
npm run dev
```

### Development Commands

```bash
# Development
npm run dev          # Start Vite dev server (http://localhost:3000)

# Building
npm run build        # Type-check + production build
npm run preview      # Preview production build locally

# Code Quality
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript compiler (no emit)

# Testing
npm test             # Run unit tests once
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report

# E2E Testing
npm run test:e2e            # Headless (CI mode)
npm run test:e2e:ui         # Interactive UI mode
npm run test:e2e:headed     # Headed browser mode
npm run test:e2e:debug      # Debug mode with breakpoints
npm run test:e2e:report     # View test report
```

### IDE Setup

#### VS Code (Recommended)

Install extensions:
- **ESLint** - Code linting
- **TypeScript Vue Plugin (Volar)** - TypeScript support
- **Tailwind CSS IntelliSense** - Tailwind autocomplete
- **Prettier** - Code formatting

**`.vscode/settings.json`**:
```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "editor.formatOnSave": true,
  "typescript.tsdk": "node_modules/typescript/lib",
  "eslint.validate": [
    "typescript",
    "javascript"
  ]
}
```

---

## Project Structure

### Directory Layout

```
NeuroViz/
├── src/
│   ├── core/                    # Core domain (zero dependencies)
│   │   ├── domain/              # Entities, value objects
│   │   ├── ports/               # Interface definitions
│   │   ├── application/         # Use cases, orchestration
│   │   └── research/            # Advanced ML algorithms
│   │
│   ├── infrastructure/          # Framework implementations
│   │   ├── tensorflow/          # TensorFlow.js adapter
│   │   ├── d3/                  # D3.js visualization
│   │   ├── api/                 # Dataset repositories
│   │   ├── storage/             # Persistence
│   │   ├── logging/             # Logging
│   │   ├── education/           # Educational services
│   │   ├── ml/                  # Advanced ML features
│   │   ├── export/              # Export services
│   │   ├── performance/         # Optimization
│   │   └── security/            # Security utilities
│   │
│   ├── presentation/            # UI controllers
│   │   └── controllers/         # Domain-specific controllers
│   │
│   ├── utils/                   # Shared utilities
│   ├── config/                  # Configuration
│   ├── workers/                 # Web Workers
│   └── main.ts                  # Composition root
│
├── tests/
│   ├── unit/                    # Vitest unit tests
│   ├── e2e/                     # Playwright E2E tests
│   └── pages/                   # Page object models
│
├── public/                      # Static assets
├── docs/                        # Documentation
│
├── .github/
│   └── workflows/               # CI/CD pipelines
│
├── index.html                   # Main HTML file
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── playwright.config.ts        # Playwright configuration
└── package.json                # Dependencies and scripts
```

### File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| **Domain Entities** | PascalCase | `Point.ts`, `Hyperparameters.ts` |
| **Interfaces (Ports)** | `I` prefix + PascalCase | `INeuralNetworkService.ts` |
| **Adapters** | PascalCase, framework suffix | `TFNeuralNet.ts`, `D3Chart.ts` |
| **Controllers** | PascalCase + `Controller` suffix | `TrainingController.ts` |
| **Commands** | PascalCase + `Command` suffix | `InitializeNetworkCommand.ts` |
| **Utilities** | camelCase | `validation.ts`, `dom.ts` |
| **Constants** | SCREAMING_SNAKE_CASE | `DEFAULT_HYPERPARAMETERS` |
| **Test Files** | Same as source + `.test.ts` | `TrainingSession.test.ts` |
| **E2E Tests** | Feature + `.spec.ts` | `training.spec.ts` |

---

## Code Standards

### TypeScript Standards

#### 1. Strict Mode

All code must pass TypeScript strict mode:

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

#### 2. Type Safety

```typescript
// ❌ Bad: Implicit any
function process(data) {
  return data.map(x => x.value);
}

// ✅ Good: Explicit types
function process(data: Point[]): number[] {
  return data.map(x => x.label);
}

// ❌ Bad: Non-null assertion without guard
const value = array[0]!.property;

// ✅ Good: Null check
const item = array[0];
if (item) {
  const value = item.property;
}
```

#### 3. Immutability

```typescript
// ❌ Bad: Mutable domain entity
interface Point {
  x: number;
  y: number;
  label: number;
}

// ✅ Good: Immutable domain entity
interface Point {
  readonly x: number;
  readonly y: number;
  readonly label: number;
}

// ❌ Bad: Mutation
point.label = 1;

// ✅ Good: Create new instance
const updated = { ...point, label: 1 };
```

#### 4. Interface Segregation

```typescript
// ❌ Bad: Fat interface
interface IService {
  initialize(): void;
  train(): void;
  predict(): void;
  export(): void;
  import(): void;
  dispose(): void;
}

// ✅ Good: Segregated interfaces
interface ITrainable {
  train(): void;
}

interface ISerializable {
  export(): Blob;
  import(data: Blob): void;
}
```

### ESLint Compliance

Zero warnings/errors required for commit:

```bash
npm run lint
```

**Common rules**:
- No unused variables
- No console.log in production code (use logger)
- Prefer const over let
- No var declarations
- Async functions must be awaited or returned
- Exhaustive switch statements

### Code Style

```typescript
// ✅ Good: Clear naming
class TrainingSession {
  private readonly neuralNet: INeuralNetworkService;

  async setHyperparameters(config: Hyperparameters): Promise<void> {
    await this.neuralNet.initialize(config);
  }
}

// ❌ Bad: Unclear naming
class TS {
  private nn: any;

  async setHP(cfg: any): Promise<void> {
    await this.nn.init(cfg);
  }
}
```

**Naming Conventions**:
- Classes: `PascalCase`
- Methods/functions: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Private fields: `camelCase` (no underscore prefix)
- Interfaces: `PascalCase` with `I` prefix for ports

---

## Testing Guidelines

### Test Pyramid

```
        ┌──────────────┐
        │  E2E Tests   │  10% - User workflows
        │   (Playwright)│
        ├──────────────┤
        │ Integration  │  20% - Component interactions
        │    Tests     │
        ├──────────────┤
        │  Unit Tests  │  70% - Business logic
        │   (Vitest)   │
        └──────────────┘
```

### Unit Testing (Vitest)

#### Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('TrainingSession', () => {
  let session: TrainingSession;
  let mockNeuralNet: INeuralNetworkService;
  let mockVisualizer: IVisualizerService;

  beforeEach(() => {
    // Setup mocks
    mockNeuralNet = {
      initialize: vi.fn(),
      train: vi.fn().mockResolvedValue({ loss: 0.5, accuracy: 0.8 }),
      predict: vi.fn(),
      // ...
    };

    mockVisualizer = {
      renderData: vi.fn(),
      renderBoundary: vi.fn(),
      // ...
    };

    session = new TrainingSession(mockNeuralNet, mockVisualizer, mockDataRepo);
  });

  afterEach(() => {
    session.dispose();
  });

  it('should initialize network with hyperparameters', async () => {
    const config: Hyperparameters = {
      learningRate: 0.03,
      layers: [8, 4],
      optimizer: 'adam',
      activation: 'relu'
    };

    await session.setHyperparameters(config);

    expect(mockNeuralNet.initialize).toHaveBeenCalledWith(config);
  });

  it('should throw error if training before initialization', async () => {
    await expect(session.step()).rejects.toThrow('Hyperparameters not set');
  });
});
```

#### Coverage Requirements

- **Critical Paths**: 90%+ (TrainingSession, TFNeuralNet, D3Chart)
- **Overall**: 70%+
- **Branches**: 70%+

Run coverage:
```bash
npm run test:coverage
open coverage/index.html
```

### E2E Testing (Playwright)

#### Page Object Pattern

```typescript
// tests/pages/index.ts
export class TrainingPage {
  constructor(private page: Page) {}

  async initialize(layers: string, learningRate: string) {
    await this.page.fill('#input-layers', layers);
    await this.page.fill('#input-lr', learningRate);
    await this.page.click('#btn-init');
  }

  async startTraining() {
    await this.page.click('#btn-start');
  }

  async waitForEpochs(count: number) {
    await this.page.waitForFunction(
      (targetEpoch) => {
        const epoch = document.getElementById('epoch-value')?.textContent;
        return epoch && parseInt(epoch) >= targetEpoch;
      },
      count,
      { timeout: 30000 }
    );
  }
}
```

#### E2E Test Example

```typescript
// tests/e2e/training.spec.ts
import { test, expect } from '@playwright/test';
import { TrainingPage } from '../pages/index';

test.describe('Neural Network Training', () => {
  test('should train network and update metrics', async ({ page }) => {
    await page.goto('http://localhost:3000');

    const trainingPage = new TrainingPage(page);

    // Load dataset
    await page.selectOption('#dataset-select', 'circle');
    await page.click('#btn-fetch');

    // Initialize network
    await trainingPage.initialize('8,4', '0.03');

    // Start training
    await trainingPage.startTraining();

    // Wait for 10 epochs
    await trainingPage.waitForEpochs(10);

    // Verify metrics updated
    const loss = await page.textContent('#loss-value');
    expect(parseFloat(loss!)).toBeLessThan(1.0);

    const accuracy = await page.textContent('#accuracy-value');
    expect(parseFloat(accuracy!)).toBeGreaterThan(0);
  });
});
```

### Mocking Best Practices

```typescript
// ✅ Good: Mock at port boundary
const mockNeuralNet: INeuralNetworkService = {
  initialize: vi.fn(),
  train: vi.fn().mockResolvedValue({ loss: 0.5, accuracy: 0.8 }),
  // ...
};

// ❌ Bad: Mock TensorFlow.js directly
vi.mock('@tensorflow/tfjs', () => ({
  sequential: vi.fn(),
  // ...
}));
```

---

## Adding New Features

### Step-by-Step Guide

#### Example: Adding Dropout Support

**Step 1: Update Domain Model**

```typescript
// src/core/domain/Hyperparameters.ts
export interface Hyperparameters {
  // ... existing fields
  readonly dropoutRate?: number;  // 0.0 - 0.5
}

export const DEFAULT_HYPERPARAMETERS: Hyperparameters = {
  // ... existing defaults
  dropoutRate: 0,
};
```

**Step 2: Update Port (if needed)**

```typescript
// src/core/ports/INeuralNetworkService.ts
// No changes needed - initialize() already accepts Hyperparameters
```

**Step 3: Update Infrastructure Adapter**

```typescript
// src/infrastructure/tensorflow/TFNeuralNet.ts
private buildModel(config: Hyperparameters): tf.Sequential {
  const model = tf.sequential();

  // Add first layer
  model.add(tf.layers.dense({ units: config.layers[0] }));

  // Add dropout if configured
  if (config.dropoutRate && config.dropoutRate > 0) {
    model.add(tf.layers.dropout({ rate: config.dropoutRate }));
  }

  // ... rest of model
}
```

**Step 4: Update UI**

```html
<!-- index.html -->
<div class="form-group">
  <label for="input-dropout">Dropout Rate</label>
  <select id="input-dropout">
    <option value="0">None</option>
    <option value="0.1">0.1</option>
    <option value="0.2">0.2</option>
    <option value="0.3">0.3</option>
    <option value="0.5">0.5</option>
  </select>
</div>
```

```typescript
// src/presentation/controllers/TrainingController.ts
private buildInitializeNetworkConfig(): InitializeNetworkConfig {
  return {
    // ... existing fields
    dropoutRate: parseFloat(this.elements.inputDropout.value) || 0,
  };
}
```

**Step 5: Add Tests**

```typescript
// tests/unit/infrastructure/TFNeuralNet.test.ts
it('should add dropout layers when dropout rate is set', async () => {
  await neuralNet.initialize({
    learningRate: 0.03,
    layers: [8, 4],
    optimizer: 'adam',
    activation: 'relu',
    dropoutRate: 0.2
  });

  const structure = neuralNet.getStructure();
  // Verify dropout layers exist in model
});
```

**Step 6: Update Documentation**

```markdown
<!-- docs/API.md -->
### Hyperparameters

- `dropoutRate?: number` - Dropout rate (0.0-0.5). Helps prevent overfitting.
```

**Step 7: Create Commit**

```bash
git add .
git commit -m "feat: add dropout regularization support

- Add dropoutRate to Hyperparameters interface
- Implement dropout layers in TFNeuralNet
- Add UI dropdown for dropout rate selection
- Add tests for dropout functionality
- Update API documentation"
```

---

## Performance Optimization

### Memory Management

#### TensorFlow.js Tensors

```typescript
// ❌ Bad: Memory leak
async function process(data: Point[]): Promise<number> {
  const xs = tf.tensor2d(data.map(p => [p.x, p.y]));
  const result = model.predict(xs);
  // Tensors not disposed!
  return result.dataSync()[0];
}

// ✅ Good: Explicit disposal
async function process(data: Point[]): Promise<number> {
  const xs = tf.tensor2d(data.map(p => [p.x, p.y]));
  try {
    const result = model.predict(xs) as tf.Tensor;
    try {
      const value = await result.data();
      return value[0] ?? 0;
    } finally {
      result.dispose();
    }
  } finally {
    xs.dispose();
  }
}
```

#### Check for Memory Leaks

```typescript
// Monitor GPU memory
const before = TFNeuralNet.getMemoryInfo();
// Perform operations
const after = TFNeuralNet.getMemoryInfo();

if (after.numTensors > before.numTensors) {
  console.warn('Potential memory leak detected');
}
```

### Rendering Optimization

```typescript
// ❌ Bad: Re-render on every frame
requestAnimationFrame(() => {
  visualizer.renderBoundary(predictions, 50);
});

// ✅ Good: Render at intervals
if (epoch % renderInterval === 0) {
  await visualizer.renderBoundary(predictions, 50);
}
```

### Frame Rate Limiting

```typescript
private lastFrameTime = 0;
private frameInterval = 1000 / 60; // 60 FPS

private async loop(): Promise<void> {
  const now = performance.now();
  if (now - this.lastFrameTime < this.frameInterval) {
    requestAnimationFrame(() => void this.loop());
    return;
  }
  this.lastFrameTime = now;

  // Perform training step
}
```

---

## Security Considerations

### XSS Prevention

```typescript
// ❌ Bad: Direct innerHTML with user input
element.innerHTML = userInput;

// ✅ Good: Use textContent
element.textContent = userInput;

// ✅ Good: Escape HTML if innerHTML needed
import { escapeHTML } from '../infrastructure/security/htmlSanitizer';
element.innerHTML = `<div>${escapeHTML(userInput)}</div>`;
```

### Input Validation

```typescript
// ✅ Good: Validate all user inputs
function parseLayersInput(input: string): number[] {
  const layers = input.split(',')
    .map(s => parseInt(s.trim(), 10))
    .filter(n => !isNaN(n) && n > 0 && n <= 1000);

  if (layers.length === 0) {
    throw new Error('Invalid layers: must contain at least one positive number');
  }

  return layers;
}
```

### Secure File Handling

```typescript
// ✅ Good: Validate file types
async function handleFileUpload(file: File): Promise<void> {
  const allowedTypes = ['text/csv', 'application/json'];

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }

  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    throw new Error('File too large');
  }

  // Process file
}
```

---

## Debugging

### Browser DevTools

#### TensorFlow.js Memory

```javascript
// Console commands
tf.memory()  // Check tensor count and memory usage
tf.profile(() => model.train(data))  // Profile performance
```

#### D3.js Inspections

```javascript
// Inspect SVG elements
d3.select('#viz-container').selectAll('circle').nodes()

// Check scales
d3.select('#viz-container').datum()
```

### Logging

```typescript
import { logger } from '../infrastructure/logging/Logger';

// Development logging
logger.debug('Training started', { epoch: 0 });
logger.info('Network initialized', { layers: [8, 4] });
logger.warn('High loss detected', { loss: 5.2 });
logger.error('Training failed', error, { epoch: 42 });
```

### Debugging Training Issues

**Loss is NaN**:
- Learning rate too high → Reduce to 0.001-0.01
- Gradient explosion → Add gradient clipping (`clipNorm: 1.0`)
- Bad initialization → Check data normalization

**Slow Convergence**:
- Learning rate too low → Try LR finder
- Poor architecture → Add more hidden units
- No normalization → Standardize features

**Memory Issues**:
- Check for tensor disposal in all async functions
- Monitor `tf.memory()` during training
- Reduce batch size or grid resolution

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'

      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
      - run: npm run test:e2e

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Pre-commit Checks

Create `.husky/pre-commit`:

```bash
#!/bin/sh
npm run lint
npm run typecheck
npm test
```

---

## Release Process

### Semantic Versioning

NeuroViz uses [Semantic Release](https://semantic-release.gitbook.io/):

- **Major**: Breaking changes (`BREAKING CHANGE:` in commit)
- **Minor**: New features (`feat:`)
- **Patch**: Bug fixes (`fix:`)

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting)
- `refactor`: Code restructuring
- `test`: Test additions/changes
- `chore`: Build/dependency updates

**Example**:
```bash
git commit -m "feat(training): add early stopping support

Implement EarlyStoppingStrategy with configurable patience.
Automatically stops training when validation loss plateaus.

Closes #123"
```

### Release Workflow

1. **Commit changes** with conventional commits
2. **Push to main** branch
3. **Semantic Release runs automatically**:
   - Analyzes commit messages
   - Determines version bump
   - Generates CHANGELOG.md
   - Creates GitHub release
   - Publishes to npm (if configured)

---

## Best Practices Summary

### Architecture
- ✅ Core has zero infrastructure dependencies
- ✅ Use dependency injection via constructor
- ✅ Implement ports in infrastructure layer
- ✅ Commands handle validation and business logic

### Code Quality
- ✅ TypeScript strict mode
- ✅ ESLint zero warnings
- ✅ 70%+ test coverage
- ✅ Immutable domain entities

### Performance
- ✅ Dispose TensorFlow tensors explicitly
- ✅ Limit rendering to intervals
- ✅ Frame rate throttling
- ✅ Monitor memory usage

### Security
- ✅ Escape user input before innerHTML
- ✅ Validate all inputs
- ✅ Sanitize file uploads
- ✅ No secrets in code

### Testing
- ✅ 70% unit, 20% integration, 10% E2E
- ✅ Mock at port boundaries
- ✅ Page object pattern for E2E
- ✅ Test error paths

---

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [TensorFlow.js Guide](https://www.tensorflow.org/js/guide)
- [D3.js Documentation](https://d3js.org/)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)

---

For questions or issues, see [GitHub Issues](https://github.com/DevilsDev/NeuroViz/issues).
