# NeuroViz Documentation Index

Welcome to the NeuroViz documentation. This directory holds the **evergreen**
reference docs for the project. Historical audit reports and one-off reviews
live under [`archive/`](./archive/) and should not be linked from the main
README or other evergreen docs.

For the project pitch, getting-started steps, and shipped-feature overview,
start at the repository root [`README.md`](../README.md).

---

## Evergreen documentation

| Document | What it covers |
|---|---|
| [`PROJECT_OVERVIEW.md`](./PROJECT_OVERVIEW.md) | High-level tour of the codebase, responsibilities, and directory layout. Good first read for new contributors. |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Hexagonal architecture deep dive — ports, adapters, dependency direction, and the core/application/infrastructure/presentation layering. |
| [`API.md`](./API.md) | Reference for the key ports (`INeuralNetworkService`, `IVisualizerService`, `IDatasetRepository`), application services, and the public `window.neurovizAPI`. |
| [`DEVELOPMENT.md`](./DEVELOPMENT.md) | Local setup, development loop, testing workflow, and contribution conventions. |
| [`FEATURES.md`](./FEATURES.md) | Feature-by-feature user guide with examples and best-practice notes. |
| [`RESPONSIVE_DESIGN_SYSTEM.md`](./RESPONSIVE_DESIGN_SYSTEM.md) | Breakpoints, spacing scale, and responsive-layout primitives used across the UI. |
| [`ROADMAP.md`](./ROADMAP.md) | Phased delivery plan with per-feature status. Source of truth for what ships today and what's next. |
| [`user-guide/`](./user-guide/) | User-facing learning material. Start with [`INTRO-FOR-STUDENTS.md`](./user-guide/INTRO-FOR-STUDENTS.md). |

## Historical material

See [`archive/`](./archive/) for preserved audit snapshots (CI/CD, UX, XSS,
spatial, design), implementation logs, and superseded improvement plans.
These files are kept for provenance only — they drift the moment the code
changes and should not be used as a reference for how the app works today.

---

## Where to start by role

- **New contributor, first day:** `PROJECT_OVERVIEW.md` → `ARCHITECTURE.md` →
  `DEVELOPMENT.md`.
- **User learning the app:** `../README.md` → `FEATURES.md` →
  `user-guide/INTRO-FOR-STUDENTS.md`.
- **Extending a port or adapter:** `ARCHITECTURE.md` → `API.md` →
  `../README.md#extending-the-application`.
- **Planning the next feature:** `ROADMAP.md`.
