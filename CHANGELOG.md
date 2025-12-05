## [2.7.0](https://github.com/DevilsDev/NeuroViz/compare/v2.6.0...v2.7.0) (2025-12-05)

### Features

* Implement D3-based neural network and confusion matrix visualizations, training control, and core application structure. ([365d5f0](https://github.com/DevilsDev/NeuroViz/commit/365d5f0c666f71671bcce90f7d3d439aec8079e0))

## [2.6.0](https://github.com/DevilsDev/NeuroViz/compare/v2.5.0...v2.6.0) (2025-12-05)

### Features

* Generate Playwright test reports and results, and add a local storage service and Vite environment type definition. ([fbc13b2](https://github.com/DevilsDev/NeuroViz/commit/fbc13b2c14175eba57930d88c9b1523d5760481a))

## [2.5.0](https://github.com/DevilsDev/NeuroViz/compare/v2.4.0...v2.5.0) (2025-12-05)

### Features

* introduce `TrainingController` to manage UI interactions and orchestrate training sessions. ([4449ad5](https://github.com/DevilsDev/NeuroViz/commit/4449ad5d7f29eacd3831eafe55b92c4a1dac62fd))

## [2.4.0](https://github.com/DevilsDev/NeuroViz/compare/v2.3.0...v2.4.0) (2025-12-05)

### Features

* add initial application structure, services, and dataset management controller ([16df581](https://github.com/DevilsDev/NeuroViz/commit/16df5813c79efec056c7fa8054fe43c23586d9c1))

## [2.3.0](https://github.com/DevilsDev/NeuroViz/compare/v2.2.0...v2.3.0) (2025-12-05)

### Features

* Introduce `TrainingController` for managing UI interactions and add new testing infrastructure. ([97f9c1e](https://github.com/DevilsDev/NeuroViz/commit/97f9c1e2b6e4a76c80064695639536c8b803af58))

## [2.2.0](https://github.com/DevilsDev/NeuroViz/compare/v2.1.0...v2.2.0) (2025-12-05)

### Features

* Add core neural network hyperparameters and training configuration domain models, and introduce comprehensive E2E and unit tests. ([fa9791f](https://github.com/DevilsDev/NeuroViz/commit/fa9791f84bfe43f2df7cf52a334aad833683c3b4))

## [2.1.0](https://github.com/DevilsDev/NeuroViz/compare/v2.0.1...v2.1.0) (2025-12-05)

### Features

* Introduce training session orchestration with abstract neural network service and TensorFlow.js implementation. ([297129a](https://github.com/DevilsDev/NeuroViz/commit/297129a70a75bd5c5820bc6e36cbdc2cf8f5350a))

## [2.0.1](https://github.com/DevilsDev/NeuroViz/compare/v2.0.0...v2.0.1) (2025-12-05)

### Bug Fixes

* **e2e:** enable pause button when training starts ([c163d45](https://github.com/DevilsDev/NeuroViz/commit/c163d45b8607237b3c884fccab9899369125103e))

## [2.0.0](https://github.com/DevilsDev/NeuroViz/compare/v1.1.1...v2.0.0) (2025-12-05)

### ⚠ BREAKING CHANGES

* **training:** Learning rate schedules now work correctly

Previously, updating the learning rate would call initialize() which
destroyed the model and all trained weights, causing training to reset.
This made all LR schedules (exponential, step, cosine, cyclic) completely
non-functional.

Changes:
- Add updateLearningRate() method to INeuralNetworkService interface
- Implement updateLearningRate() in TFNeuralNet to preserve weights:
  * Save current weights before recompiling
  * Create new optimizer with updated learning rate
  * Recompile model (preserves architecture)
  * Restore saved weights
  * Dispose old weight tensors to prevent memory leaks
- Update TrainingSession.updateLearningRateIfNeeded() to use new method
- Remove misleading comment that claimed weights were preserved

Impact:
- Learning rate schedules now function correctly
- Training no longer resets when LR changes >1%
- 5 out of 6 LR schedule types now work as intended:
  * exponential decay ✓
  * step-wise decay ✓
  * cosine annealing ✓
  * cyclic_triangular ✓
  * cyclic_cosine ✓

Fixes critical production bug where advanced training features appeared
to exist but were completely broken.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

### Bug Fixes

* **training:** preserve weights during learning rate updates ([d1ac149](https://github.com/DevilsDev/NeuroViz/commit/d1ac149e3bd980a5dece442aac29f1f953becbef))

## [1.1.1](https://github.com/DevilsDev/NeuroViz/compare/v1.1.0...v1.1.1) (2025-12-04)

### Bug Fixes

* **e2e:** update training status display and button aria-labels ([0da3cb0](https://github.com/DevilsDev/NeuroViz/commit/0da3cb0baf150892942165b42d24bcae89533269))

## [1.1.0](https://github.com/DevilsDev/NeuroViz/compare/v1.0.6...v1.1.0) (2025-12-04)

### Features

* Add local Claude settings to configure allowed shell commands and IDE diagnostics. ([dcb4e39](https://github.com/DevilsDev/NeuroViz/commit/dcb4e3954f4555c7a2ae8170efb3e02024e95544))

## [1.0.6](https://github.com/DevilsDev/NeuroViz/compare/v1.0.5...v1.0.6) (2025-12-04)

### Bug Fixes

* **html:** remove duplicate sticky-controls div causing ID conflicts ([5ab3ecc](https://github.com/DevilsDev/NeuroViz/commit/5ab3ecc7013413527c3b2be1383d8625ff846eb8)), closes [#sidebar-sticky-footer](https://github.com/DevilsDev/NeuroViz/issues/sidebar-sticky-footer) [#sticky-controls](https://github.com/DevilsDev/NeuroViz/issues/sticky-controls) [#sticky-controls](https://github.com/DevilsDev/NeuroViz/issues/sticky-controls) [#sidebar-sticky-footer](https://github.com/DevilsDev/NeuroViz/issues/sidebar-sticky-footer)

## [1.0.5](https://github.com/DevilsDev/NeuroViz/compare/v1.0.4...v1.0.5) (2025-12-04)

### Bug Fixes

* **e2e:** use visible sticky footer buttons instead of hidden controls ([ec258bc](https://github.com/DevilsDev/NeuroViz/commit/ec258bc01230e1de6bcb800834007cee9113ebd9)), closes [#btn-start](https://github.com/DevilsDev/NeuroViz/issues/btn-start) [#btn-pause](https://github.com/DevilsDev/NeuroViz/issues/btn-pause) [#training-fieldset](https://github.com/DevilsDev/NeuroViz/issues/training-fieldset) [#btn-start-sticky](https://github.com/DevilsDev/NeuroViz/issues/btn-start-sticky) [#btn-pause-sticky](https://github.com/DevilsDev/NeuroViz/issues/btn-pause-sticky) [#btn-step-sticky](https://github.com/DevilsDev/NeuroViz/issues/btn-step-sticky) [#btn-reset-sticky](https://github.com/DevilsDev/NeuroViz/issues/btn-reset-sticky)

## [1.0.4](https://github.com/DevilsDev/NeuroViz/compare/v1.0.3...v1.0.4) (2025-12-04)

### Bug Fixes

* **e2e:** enable/disable Start button based on initialization state ([16ce519](https://github.com/DevilsDev/NeuroViz/commit/16ce51926ce312896f39e18c239d3c37893fc5f2))

## [1.0.3](https://github.com/DevilsDev/NeuroViz/compare/v1.0.2...v1.0.3) (2025-12-04)

### Bug Fixes

* **tests:** add async delays to NAS test mocks to ensure totalTime > 0 ([52f360d](https://github.com/DevilsDev/NeuroViz/commit/52f360d169d56ba270f8b77f13db78d5c94ded76))

## [1.0.2](https://github.com/DevilsDev/NeuroViz/compare/v1.0.1...v1.0.2) (2025-12-04)

### Bug Fixes

* **e2e:** resolve loading overlay CSS specificity issue ([fdcb2bf](https://github.com/DevilsDev/NeuroViz/commit/fdcb2bf1da0769c832d84a21dd10bad65b3515f8))

## [1.0.1](https://github.com/DevilsDev/NeuroViz/compare/v1.0.0...v1.0.1) (2025-12-04)

### Bug Fixes

* **e2e:** expose TensorFlow.js globally and run chromium only in CI ([29c9873](https://github.com/DevilsDev/NeuroViz/commit/29c9873c246a8978b5057ad91789825cdf5e69f0))

## 1.0.0 (2025-12-04)

### Features

* Add main application entry point, initializing all core services, controllers, and UI components. ([853ae8f](https://github.com/DevilsDev/NeuroViz/commit/853ae8fcf0f6b7ad0f17c7248cbe52e6f7fd28ad))
* Implement comprehensive testing infrastructure, CI/CD workflows, and new research components like LIME Explainer. ([416a928](https://github.com/DevilsDev/NeuroViz/commit/416a9289112c8e8306508e1fbd1e7b543e7d57e4))
* implement hexagonal architecture for neural network visualiser ([19943a3](https://github.com/DevilsDev/NeuroViz/commit/19943a351af4f4fa7704dd18aed89c3a751244f1))
* Implement initial application structure with model comparison, A/B testing, and ensemble training features. ([86e87f3](https://github.com/DevilsDev/NeuroViz/commit/86e87f360a41f73e718454da7a6787b47c9b4758))
* Implement initial training control UI, sidebar navigation, and D3 visualization infrastructure. ([377f62b](https://github.com/DevilsDev/NeuroViz/commit/377f62b6375dea7ac915eca6da7da907d5c75328))
* Initialize core application architecture with session management, D3 visualization, DOM utilities, and comprehensive E2E testing. ([25e433a](https://github.com/DevilsDev/NeuroViz/commit/25e433a9ff8a5daddc2826bf6ee082cfd21b64b0))

### Bug Fixes

* **ci:** resolve workflow failures - update Node to 22 for semantic-release, fix TruffleHog duplicate flag, simplify Lighthouse assertions ([db0cd3c](https://github.com/DevilsDev/NeuroViz/commit/db0cd3c46132e357f88bb03a15ccf74e350683d2))
* replace Gitleaks with TruffleHog and adjust CI thresholds ([6e67c46](https://github.com/DevilsDev/NeuroViz/commit/6e67c46b610fdebbc903fed56354e34935c337ba))
* resolve all ESLint errors and warnings for production readiness ([6c874d8](https://github.com/DevilsDev/NeuroViz/commit/6c874d8ac20aae8092a7c976efdcfb7dbf660280))
