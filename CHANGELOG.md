## [2.31.1](https://github.com/DevilsDev/NeuroViz/compare/v2.31.0...v2.31.1) (2026-04-10)

### Bug Fixes

* **training:** auto re-init when model config is stale before training ([7190510](https://github.com/DevilsDev/NeuroViz/commit/71905105d2fa2da1a359b02796bf42810bb8831c))

## [2.31.0](https://github.com/DevilsDev/NeuroViz/compare/v2.30.2...v2.31.0) (2026-04-10)

### Features

* **chart:** split into 3 equal panels — LR, Loss, Accuracy ([789ac76](https://github.com/DevilsDev/NeuroViz/commit/789ac769258e85b086bf9be36b64cc85dc82de90))

## [2.30.2](https://github.com/DevilsDev/NeuroViz/compare/v2.30.1...v2.30.2) (2026-04-10)

### Bug Fixes

* **chart:** support negative loss values in loss chart Y-axis domain ([96bcc77](https://github.com/DevilsDev/NeuroViz/commit/96bcc7798be6e4b8b9c7ec0b2b4c2c8bd15c1ace))

## [2.30.1](https://github.com/DevilsDev/NeuroViz/compare/v2.30.0...v2.30.1) (2026-04-10)

### Bug Fixes

* **ui:** match dataset shortcut order to UI bar (3=Spiral, 4=Gaussian) ([4f1a12b](https://github.com/DevilsDev/NeuroViz/commit/4f1a12b62902bceaacd33aa797d18762cb334396))

## [2.30.0](https://github.com/DevilsDev/NeuroViz/compare/v2.29.2...v2.30.0) (2026-04-10)

### Features

* **ui:** wire dataset keyboard shortcuts 1–5 ([b797f65](https://github.com/DevilsDev/NeuroViz/commit/b797f656307482c087d1683ec47f09a834065a40))

## [2.29.2](https://github.com/DevilsDev/NeuroViz/compare/v2.29.1...v2.29.2) (2026-04-10)

### Bug Fixes

* **core:** prevent disposed model race condition during re-initialisation ([005a69d](https://github.com/DevilsDev/NeuroViz/commit/005a69d8bd9ad97d6469cfecf705687120efed5e))

## [2.29.1](https://github.com/DevilsDev/NeuroViz/compare/v2.29.0...v2.29.1) (2026-04-10)

### Code Refactoring

* **core:** Phase 5 — extract TrainingSession into single-responsibility services ([8c3bf66](https://github.com/DevilsDev/NeuroViz/commit/8c3bf66620aadae7ea5d9439409af352eb878dd5))

## [2.29.0](https://github.com/DevilsDev/NeuroViz/compare/v2.28.0...v2.29.0) (2026-04-10)

### Features

* **ui:** Phase 4 — onboarding modal + workflow spine ([d827308](https://github.com/DevilsDev/NeuroViz/commit/d82730884b2fe672596a419641345b83602aaec5))

## [2.28.0](https://github.com/DevilsDev/NeuroViz/compare/v2.27.16...v2.28.0) (2026-04-10)

### Features

* **ui:** Phase 3 — state cues + Learn Mode data-min-mode expansion ([cc3658a](https://github.com/DevilsDev/NeuroViz/commit/cc3658a6ffccdc524bb9f7bd12303bb86df82e7b))

## [2.27.16](https://github.com/DevilsDev/NeuroViz/compare/v2.27.15...v2.27.16) (2026-04-10)

### Bug Fixes

* **ml-viz:** confusion matrix, activation histogram, webgl recovery ([#20](https://github.com/DevilsDev/NeuroViz/issues/20)) ([3e1c480](https://github.com/DevilsDev/NeuroViz/commit/3e1c480c830e7cec6eb7124f6057ba86e85beef5))

### Documentation

* **cicd:** archive forensic audit behind the pipeline overhaul [skip ci] ([240b143](https://github.com/DevilsDev/NeuroViz/commit/240b143be443b92f1dbd7c98c547f962114498c8))
* **review:** dual-hat product readiness assessment after Phase 1 [skip ci] ([03adb58](https://github.com/DevilsDev/NeuroViz/commit/03adb58052780d8e91451e4e87ad6ae4dd9f2d81)), closes [#btn-init](https://github.com/DevilsDev/NeuroViz/issues/btn-init)
* **review:** integrate static architecture audit findings [skip ci] ([e4ebba2](https://github.com/DevilsDev/NeuroViz/commit/e4ebba25a61a50751656daadcf743f83603693c4)), closes [#1](https://github.com/DevilsDev/NeuroViz/issues/1)

## [2.27.15](https://github.com/DevilsDev/NeuroViz/compare/v2.27.14...v2.27.15) (2026-04-09)

### Bug Fixes

* **dataset:** draw chip fires exactly one toast, not three ([591957d](https://github.com/DevilsDev/NeuroViz/commit/591957da0259eb1971f7eb5eccfe718762ddc79e)), closes [#1](https://github.com/DevilsDev/NeuroViz/issues/1)
* **ui:** header dataset chips no longer disappear on hover ([a4ba849](https://github.com/DevilsDev/NeuroViz/commit/a4ba849093b3be69ea7e994480820518faddfe32)), closes [#313244](https://github.com/DevilsDev/NeuroViz/issues/313244)
* **ui:** mirror compress icon top-right corner outward ([36fd62e](https://github.com/DevilsDev/NeuroViz/commit/36fd62e2cf4ffb2aad3aa373f8c48f865ef640b1))
* **ui:** unify background to Catppuccin and fill full viewport ([25de1db](https://github.com/DevilsDev/NeuroViz/commit/25de1db9136a7691174291c285724855fb0c2082)), closes [#0A0E1A](https://github.com/DevilsDev/NeuroViz/issues/0A0E1A) [#0A0E1A](https://github.com/DevilsDev/NeuroViz/issues/0A0E1A)
* **ui:** wire help button + stop header clipping button ascenders ([5c7e4db](https://github.com/DevilsDev/NeuroViz/commit/5c7e4db805a286af22275627f87cb8cd7a7552ee)), closes [#btn-help](https://github.com/DevilsDev/NeuroViz/issues/btn-help) [#help-modal](https://github.com/DevilsDev/NeuroViz/issues/help-modal) [#btn-open-help](https://github.com/DevilsDev/NeuroViz/issues/btn-open-help) [#btn-fullscreen](https://github.com/DevilsDev/NeuroViz/issues/btn-fullscreen)

### Code Refactoring

* phase 1-5 codebase cleanup — remove dead code, prune controllers, tighten barrels ([e1e278a](https://github.com/DevilsDev/NeuroViz/commit/e1e278afff56a73c364f91d51833ea870d40bf9a)), closes [#chart](https://github.com/DevilsDev/NeuroViz/issues/chart) [#viz-container](https://github.com/DevilsDev/NeuroViz/issues/viz-container)

## [2.27.14](https://github.com/DevilsDev/NeuroViz/compare/v2.27.13...v2.27.14) (2026-04-09)

### Bug Fixes

* toast z-index 200 — renders above header (z-100) and dropdowns ([2f672fb](https://github.com/DevilsDev/NeuroViz/commit/2f672fb4d027d59e173167f4edb2deebcae1a1a0))

## [2.27.13](https://github.com/DevilsDev/NeuroViz/compare/v2.27.12...v2.27.13) (2026-04-09)

### Bug Fixes

* challenge banner top 148px — clears toolbar bottom (141px) ([194ab79](https://github.com/DevilsDev/NeuroViz/commit/194ab792dfb8617242145f0fb057242320e1b685))

## [2.27.12](https://github.com/DevilsDev/NeuroViz/compare/v2.27.11...v2.27.12) (2026-04-09)

### Bug Fixes

* challenge banner positioning — center on content, clear toolbar ([35789e0](https://github.com/DevilsDev/NeuroViz/commit/35789e095abea3bff96eb2eac7b526701380dd63))

## [2.27.11](https://github.com/DevilsDev/NeuroViz/compare/v2.27.10...v2.27.11) (2026-04-09)

### Bug Fixes

* move Learn dropdown to document.body — escapes all stacking contexts ([9cd85cc](https://github.com/DevilsDev/NeuroViz/commit/9cd85ccec42cc29983c57c761e3c6d622225a416))

## [2.27.10](https://github.com/DevilsDev/NeuroViz/compare/v2.27.9...v2.27.10) (2026-04-09)

### Bug Fixes

* Learn dropdown uses position:fixed + JS positioning to escape grid ([d95e723](https://github.com/DevilsDev/NeuroViz/commit/d95e723542321283c50e837553e774a111d3bc11))

## [2.27.9](https://github.com/DevilsDev/NeuroViz/compare/v2.27.8...v2.27.9) (2026-04-09)

### Bug Fixes

* sidebar overflow-hidden → overflow-y-auto to fix dropdown stacking ([293fcb8](https://github.com/DevilsDev/NeuroViz/commit/293fcb8c4f7c329f0f95e7f31cf1bc93f0c36acc))

## [2.27.8](https://github.com/DevilsDev/NeuroViz/compare/v2.27.7...v2.27.8) (2026-04-09)

### Bug Fixes

* sidebar z-index lower than header so Learn dropdown paints above it ([06d07ad](https://github.com/DevilsDev/NeuroViz/commit/06d07ad6af9590e8ed77bf77927665e7fa5e9923))

## [2.27.7](https://github.com/DevilsDev/NeuroViz/compare/v2.27.6...v2.27.7) (2026-04-09)

### Bug Fixes

* Learn dropdown hidden behind sidebar — raise header z-index to 100 ([07ca3d9](https://github.com/DevilsDev/NeuroViz/commit/07ca3d9ed75c87f42b1a1ea602cfde7a328e43a1))

## [2.27.6](https://github.com/DevilsDev/NeuroViz/compare/v2.27.5...v2.27.6) (2026-04-09)

### Bug Fixes

* **theme:** Learn dropdown invisible in light mode + modal/button fixes ([33b5453](https://github.com/DevilsDev/NeuroViz/commit/33b545326b2a2f14e41cbc30698d85754403a09b))

## [2.27.5](https://github.com/DevilsDev/NeuroViz/compare/v2.27.4...v2.27.5) (2026-04-08)

### Bug Fixes

* **theme:** theme-aware training glow animation, fix light mode bleed ([eb690fc](https://github.com/DevilsDev/NeuroViz/commit/eb690fcd2ea0e3a424d1e5982b57d3330ba2ffec))

## [2.27.4](https://github.com/DevilsDev/NeuroViz/compare/v2.27.3...v2.27.4) (2026-04-08)

### Bug Fixes

* **theme:** complete light theme system — surfaces, charts, controls ([db9ed1b](https://github.com/DevilsDev/NeuroViz/commit/db9ed1bb91f99a710a76f87882c3656187f78ec1)), closes [#EFF1F5](https://github.com/DevilsDev/NeuroViz/issues/EFF1F5) [#E6E9EF](https://github.com/DevilsDev/NeuroViz/issues/E6E9EF) [#DCE0E8](https://github.com/DevilsDev/NeuroViz/issues/DCE0E8)

## [2.27.3](https://github.com/DevilsDev/NeuroViz/compare/v2.27.2...v2.27.3) (2026-04-08)

### Bug Fixes

* **d3:** rewrite chart annotation layout — fix overlaps, improve formatting ([399b2b0](https://github.com/DevilsDev/NeuroViz/commit/399b2b0137d29908905566fca9e05b764278d98a))

## [2.27.2](https://github.com/DevilsDev/NeuroViz/compare/v2.27.1...v2.27.2) (2026-04-08)

### Bug Fixes

* **ui:** transparent slider base — let track pseudo-element handle visuals ([de0dea9](https://github.com/DevilsDev/NeuroViz/commit/de0dea9be03f4a891a3ea22a5e6bcdd83cdee88f))

## [2.27.1](https://github.com/DevilsDev/NeuroViz/compare/v2.27.0...v2.27.1) (2026-04-08)

### Bug Fixes

* **ui:** align range sliders with Colab-style design ([c743bf2](https://github.com/DevilsDev/NeuroViz/commit/c743bf215e63400ce590409f250578b31b057565))

## [2.27.0](https://github.com/DevilsDev/NeuroViz/compare/v2.26.0...v2.27.0) (2026-04-08)

### Features

* **ui:** Phase 6 — final polish: microcopy, transitions, accessibility ([63ac613](https://github.com/DevilsDev/NeuroViz/commit/63ac6138551af7b61f0fd381b6568a00931275dd))

## [2.26.0](https://github.com/DevilsDev/NeuroViz/compare/v2.25.0...v2.26.0) (2026-04-08)

### Features

* **ui:** Phase 5 — progressive disclosure with smooth animations ([cfdc157](https://github.com/DevilsDev/NeuroViz/commit/cfdc157c7b31a5d416d121bd5fd56d2fff9acd96))

## [2.25.0](https://github.com/DevilsDev/NeuroViz/compare/v2.24.5...v2.25.0) (2026-04-08)

### Features

* **ui:** Phase 4 — Learn/Experiment/Advanced mode system ([2520a8c](https://github.com/DevilsDev/NeuroViz/commit/2520a8c9865b1434ace6ec1e6038cbcd78f90436))

## [2.24.5](https://github.com/DevilsDev/NeuroViz/compare/v2.24.4...v2.24.5) (2026-04-08)

### Code Refactoring

* **css:** Phase 3 — unified design system, eliminate color conflicts ([752f415](https://github.com/DevilsDev/NeuroViz/commit/752f41528d976e24cb530907e73429665ec4ec87)), closes [14b8a6/#0d9488](https://github.com/14b8a6/NeuroViz/issues/0d9488)

## [2.24.4](https://github.com/DevilsDev/NeuroViz/compare/v2.24.3...v2.24.4) (2026-04-08)

### Code Refactoring

* **ui:** Phase 2 — Material Design app shell with structured toolbar ([b99bf92](https://github.com/DevilsDev/NeuroViz/commit/b99bf9203d12acfb33d8cab4d7173a467a7fa82e))

## [2.24.3](https://github.com/DevilsDev/NeuroViz/compare/v2.24.2...v2.24.3) (2026-04-08)

### Code Refactoring

* **ui:** Phase 2 — Material Design app shell with structured toolbar ([bb0954f](https://github.com/DevilsDev/NeuroViz/commit/bb0954f1a41d3ae28f63aaf5d2aa1c0afd6248e1))

## [2.24.2](https://github.com/DevilsDev/NeuroViz/compare/v2.24.1...v2.24.2) (2026-04-08)

### Code Refactoring

* **ui:** Phase 1 — nuclear cleanup of duplicate controls and dead code ([dc329b5](https://github.com/DevilsDev/NeuroViz/commit/dc329b557a256e39112acfce557349d241cb5d16))

## [2.24.1](https://github.com/DevilsDev/NeuroViz/compare/v2.24.0...v2.24.1) (2026-04-08)

### Bug Fixes

* **ui:** show dataset chips in header (remove hidden class) ([7b99bcc](https://github.com/DevilsDev/NeuroViz/commit/7b99bcc9e1e2bcde18e393c82562ee2c89e5dc12))

## [2.24.0](https://github.com/DevilsDev/NeuroViz/compare/v2.23.5...v2.24.0) (2026-04-08)

### Features

* **ui:** complete UI makeover — 2-column layout with tabbed sidebar ([d27d6f6](https://github.com/DevilsDev/NeuroViz/commit/d27d6f670898e9b30d24910a5d73c63027060fa5))

## [2.23.5](https://github.com/DevilsDev/NeuroViz/compare/v2.23.4...v2.23.5) (2026-04-08)

### Bug Fixes

* **ux:** enable Start Training button when dataset loaded (auto-init) ([beecf0c](https://github.com/DevilsDev/NeuroViz/commit/beecf0cf1e5c553a1f07b8f264b9538251dc5146))

## [2.23.4](https://github.com/DevilsDev/NeuroViz/compare/v2.23.3...v2.23.4) (2026-04-08)

### Bug Fixes

* **ux:** resolve 12 UI/UX issues from usability review ([3150d35](https://github.com/DevilsDev/NeuroViz/commit/3150d3502f6bc58463536d88dc189281b51035ba))

## [2.23.3](https://github.com/DevilsDev/NeuroViz/compare/v2.23.2...v2.23.3) (2026-04-07)

### Bug Fixes

* **tests:** stabilize remaining flaky integration tests for CI ([51c8a47](https://github.com/DevilsDev/NeuroViz/commit/51c8a47613ef254dc5cf2c7e3f88013ed0314d4a))

## [2.23.2](https://github.com/DevilsDev/NeuroViz/compare/v2.23.1...v2.23.2) (2026-04-07)

### Bug Fixes

* **tests:** stabilize flaky CI tests that blocked deployment ([ca5a2aa](https://github.com/DevilsDev/NeuroViz/commit/ca5a2aabe1499431e599aa9aaef4b888168df591))

## [2.23.1](https://github.com/DevilsDev/NeuroViz/compare/v2.23.0...v2.23.1) (2026-04-07)

### Documentation

* Add NeuroViz codebase review document. ([0187205](https://github.com/DevilsDev/NeuroViz/commit/018720500d99e5be6a4411c7cab21e9fb9d57f8d))

### Code Refactoring

* architectural audit — fix hexagonal boundary violations, improve performance and error handling ([90b282b](https://github.com/DevilsDev/NeuroViz/commit/90b282b78d387685be75d77a5b8dbe4dbd61b0a8))

## [2.23.0](https://github.com/DevilsDev/NeuroViz/compare/v2.22.0...v2.23.0) (2026-01-04)

### Features

* add NeuroViz student guide explaining neural networks and tool usage ([e63df7e](https://github.com/DevilsDev/NeuroViz/commit/e63df7e46852f5d054f606e3ea2728fa0c6a8d3a))

## [2.22.0](https://github.com/DevilsDev/NeuroViz/compare/v2.21.1...v2.22.0) (2025-12-08)

### Features

* Add HMR support to UIFactory to clear element cache on hot reload ([c92081e](https://github.com/DevilsDev/NeuroViz/commit/c92081eb9e047649cfd97f47e7f136e179c535fe))
* Add HMR support to UIFactory to clear element cache on hot reload ([1d7cf06](https://github.com/DevilsDev/NeuroViz/commit/1d7cf0636a13affd2a3e6d16c9787b607c49e543))

## [2.21.1](https://github.com/DevilsDev/NeuroViz/compare/v2.21.0...v2.21.1) (2025-12-08)

### Code Refactoring

* Remove sticky footer controls and make performance mode dropdown required ([06bbe2b](https://github.com/DevilsDev/NeuroViz/commit/06bbe2bed666fa60beab9bf87bc2761b46317e9e))

## [2.21.0](https://github.com/DevilsDev/NeuroViz/compare/v2.20.0...v2.21.0) (2025-12-08)

### Features

* Add neural network disposal, make sticky footer controls optional, and improve D3Chart cleanup ([03ae144](https://github.com/DevilsDev/NeuroViz/commit/03ae144311015b3e4948dee92aac838d32a2fba2))

## [2.20.0](https://github.com/DevilsDev/NeuroViz/compare/v2.19.0...v2.20.0) (2025-12-08)

### Features

* Implement D3 loss chart, new styling, and comprehensive E2E tests for all UI controls. ([d3c1d6d](https://github.com/DevilsDev/NeuroViz/commit/d3c1d6d3bd2730a93e9f77d4029d6f30f7b277f3))

## [2.19.0](https://github.com/DevilsDev/NeuroViz/compare/v2.18.0...v2.19.0) (2025-12-07)

### Features

* introduce Playwright test report files ([aa8d294](https://github.com/DevilsDev/NeuroViz/commit/aa8d294a3ab1e472e0940d86de13c277b269fd94))

## [2.18.0](https://github.com/DevilsDev/NeuroViz/compare/v2.17.0...v2.18.0) (2025-12-06)

### Features

* Implement model comparison, A/B testing, and ensemble management features along with core application structure and UI components. ([894b06c](https://github.com/DevilsDev/NeuroViz/commit/894b06c2478d913e5bd1e221e6c7f31c0cf72914))

## [2.17.0](https://github.com/DevilsDev/NeuroViz/compare/v2.16.0...v2.17.0) (2025-12-06)

### Features

* Introduce a centralized `UIFactory` for type-safe DOM element retrieval and add new styling. ([31a6679](https://github.com/DevilsDev/NeuroViz/commit/31a6679d035cccad73a16c12d4ec0544589a8624))

## [2.16.0](https://github.com/DevilsDev/NeuroViz/compare/v2.15.0...v2.16.0) (2025-12-06)

### Features

* Add TrainingController for neural network UI and refactor base styling with CSS variables and data attributes. ([a72be44](https://github.com/DevilsDev/NeuroViz/commit/a72be44ce5491e5191eb8585e6a56fdddd01b00b))

## [2.15.0](https://github.com/DevilsDev/NeuroViz/compare/v2.14.0...v2.15.0) (2025-12-06)

### Features

* Add core application structure, new ExportController, and centralized UIFactory for DOM element access. ([369e736](https://github.com/DevilsDev/NeuroViz/commit/369e73694cf95fd49176a4cf00201b22044330ee))

## [2.14.0](https://github.com/DevilsDev/NeuroViz/compare/v2.13.0...v2.14.0) (2025-12-06)

### Features

* Add new controllers for visualization, export, session, and training, along with dataset gallery and keyboard shortcut utilities. ([e5d08f6](https://github.com/DevilsDev/NeuroViz/commit/e5d08f6cbc0f6b613a8630f157a5cf3000de7c8e))

## [2.13.0](https://github.com/DevilsDev/NeuroViz/compare/v2.12.0...v2.13.0) (2025-12-06)

### Features

* Implement core training session management, add new presentation controllers, and introduce comprehensive end-to-end testing. ([2088027](https://github.com/DevilsDev/NeuroViz/commit/20880270c8747a5eef53501c7a383298d116cfd0))

## [2.12.0](https://github.com/DevilsDev/NeuroViz/compare/v2.11.0...v2.12.0) (2025-12-06)

### Features

* Add Iris and Wine dataset preview cards to the dataset selection interface ([6f413ee](https://github.com/DevilsDev/NeuroViz/commit/6f413eebd8c4adbd9797949c8f1de8da081f12d3))

## [2.11.0](https://github.com/DevilsDev/NeuroViz/compare/v2.10.0...v2.11.0) (2025-12-06)

### Features

* Add main application entry point and new end-to-end test suite with page objects. ([d879e6c](https://github.com/DevilsDev/NeuroViz/commit/d879e6c1e8ca7aab58117efc6921ff47b5e46a2d))

## [2.10.0](https://github.com/DevilsDev/NeuroViz/compare/v2.9.0...v2.10.0) (2025-12-06)

### Features

* Implement core training session, command pattern, TensorFlow integration, and comprehensive testing ([ca7a6d3](https://github.com/DevilsDev/NeuroViz/commit/ca7a6d3032284ad4bd409dd6a176ff769089528d))

## [2.9.0](https://github.com/DevilsDev/NeuroViz/compare/v2.8.0...v2.9.0) (2025-12-05)

### Features

* Add `TrainingSession` for managing neural network training and `TFNeuralNet` for TensorFlow-based models. ([f95b99b](https://github.com/DevilsDev/NeuroViz/commit/f95b99bd77f6a948f40d667d499d9f0d12d1c053))

## [2.8.0](https://github.com/DevilsDev/NeuroViz/compare/v2.7.0...v2.8.0) (2025-12-05)

### Features

* Implement global keyboard shortcuts utility and add dataset gallery tests. ([8ceff7a](https://github.com/DevilsDev/NeuroViz/commit/8ceff7a7b17a729298e062b9f8739ed0d59d226d))

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
