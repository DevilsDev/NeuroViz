# Archive

Code that is implemented but **not wired into the running app**. It lives
outside `src/` and `tests/unit/` so it is not type-checked, linted, tested
or bundled, but stays easy to find and revive.

The layout mirrors the repository root (`archive/src/...`,
`archive/tests/...`), so relative imports *between archived files* still
resolve. Imports of code that remains in `src/` (e.g. `src/core/domain`) do
not — fix those paths when reviving a module.

| Path | What it is |
|------|------------|
| `src/experimental/research/` | LIME-style explanations, saliency maps, Bayesian NNs (MC Dropout), neural architecture search |
| `src/experimental/webgl/` | GPU-accelerated 2D renderer |
| `src/experimental/RestAPI.ts` | `window.neurovizAPI` scripting API |
| `src/experimental/realtime/` | WebSocket collaboration manager |
| `src/experimental/plugins/` | Plugin manager |
| `src/core/application/ModelComparison.ts`, `ModelEnsemble.ts` | A/B model comparison and ensemble voting |
| `src/core/research/FeatureImportance.ts` | Permutation feature importance |
| `src/infrastructure/performance/` | Frame-rate limiter and progressive grid renderer |
| `src/workers/` | Web Worker training (`WorkerManager` + worker). Its request handlers are keyed by response type, not request id, so concurrent requests can clobber each other; fix before reuse. |
| `src/presentation/ELI5Tooltips.ts` | Plain-language tooltips for elements marked `data-eli5`. No markup uses that attribute, so it never showed anything; hyperparameter tooltips come from `infrastructure/education/TooltipService`. |
| `tests/unit/experimental/`, `tests/unit/presentation/ELI5Tooltips.test.ts` | Unit tests for the archived LIME, NAS and ELI5 tooltip modules |

## Reviving a module

1. `git mv archive/src/<path> src/<path>` (and its tests from `archive/tests/`).
2. Fix imports, then run `npm run typecheck && npm run lint && npm test`.
3. Wire it into `ApplicationBuilder` / a controller and expose it in the UI.
4. Move its entry in the README from "not yet in the app" to the feature list.
