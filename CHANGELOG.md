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
