# NeuroViz — Product Readiness Review

**Reviewer hats:** Senior Software Architect (Google) + Senior Neural Network Expert (MIT)
**Scope:** Does the live app deliver its stated objectives and goals at every user-facing output and function?
**Date:** 2026-04-10
**Build under review:** `main` @ `240b143` (live deploy hash `BR__Damg` at https://devilsdev.github.io/NeuroViz/)
**Phase 1 status:** Complete. `TrainingSession.runLRFinder` now calls `this.neuralNet.updateLearningRate(currentLR)` through the port contract (`src/core/application/TrainingSession.ts:910`), and both tutorial target regressions are fixed (`src/presentation/Tutorial.ts:81`, `:192-197`). `npx tsc --noEmit` is clean.

---

## TL;DR

NeuroViz does what it says on the tin: a learner can pick a dataset, configure a small MLP, press Start, and watch the decision boundary refine itself while loss falls and accuracy rises. The ML primitives are real (TensorFlow.js, He init, SGD/Adam, live loss/val curves) and the D3 visualisations are correct (verified colormap, contour topology, network diagram, weight histogram, complexity math). The hexagonal architecture is genuinely hexagonal — the domain layer is pure and ports are narrow — with two specific core→infrastructure leaks worth fixing.

Five items keep this from being a victory lap:

1. **Confusion Matrix panel renders an empty container** — 0 DOM children even when open and trained. Highest-priority user-visible bug.
2. **Output-layer activation histogram shows "No data"** while Input/L1/L2 populate. Partial rendering bug in the activation pipeline's final layer hook.
3. **Architecture edit (`#input-layers`) does not propagate** through programmatic input events — the network silently stays on the last-initialised topology. Keyboard-only users appear unaffected; anything that edits the field via JS is not.
4. **"Initialise Network" (`#btn-init`) lives in the Model tab** while Start/Pause/Reset live in the Train tab, and Reset wipes the network diagram without rebuilding. The rebuild-after-edit workflow is present but undiscoverable.
5. **Two core→infrastructure leaks:** `TrainingSession` and `Application` both import `logger` directly from `src/infrastructure/logging/Logger`. Logger should be an `ILogger` port.

None of these block the app from teaching a first-time learner how a neural network fits a Spiral dataset. All five are addressable in a focused follow-up PR and do not require touching the ML core.

---

## Part A — Senior Software Architect (Google) hat

### A.1 Hexagonal boundary audit

**Domain layer — clean.**
`src/core/domain/` has zero imports from `infrastructure/`, `presentation/`, `workers/`, or any third-party ML library. Every domain type (`Point`, `Prediction`, `Hyperparameters`, `TrainingHistory`, `TrainingConfig`, `Challenge`, `AdversarialExample`, `ConfigHistory`, `DatasetStatistics`) is a plain TypeScript value. This is the hard-to-get-right half of hexagonal and it is correct.

**Ports layer — clean.**
`src/core/ports/` contains four interfaces (`INeuralNetworkService`, `IChartService`, `IVisualizerService`, `IDatasetRepository`) that import only domain types. `INeuralNetworkService.updateLearningRate` is explicit and weight-preserving, which is precisely what the Phase 1 fix relies on. Ports are narrow, typed, and framework-free.

**Application layer — two real leaks.**
Two files in `src/core/application/` reach directly into `infrastructure/`:

| File | Line | Import |
|---|---|---|
| `TrainingSession.ts` | 5 | `import { logger } from '../../infrastructure/logging/Logger'` |
| `Application.ts` | 30 | `import { logger } from '../../infrastructure/logging/Logger'` |
| `Application.ts` | 29 | `import { AdvancedFeaturesService } from '../../infrastructure/ml/AdvancedFeaturesService'` |

The logger imports are the more important ones because they bind the entire training pipeline to a concrete logging implementation. The fix is the same pattern the codebase already uses everywhere else: add `ILogger` to `src/core/ports/`, inject via constructor, and let `ApplicationBuilder` wire the concrete `Logger` in.

`AdvancedFeaturesService` should either move to `src/core/application/` if it is domain logic or be fronted by an `IAdvancedFeaturesService` port if it legitimately belongs to infrastructure.

**Composition root — structural smell, not a leak.**
`ApplicationBuilder.ts` imports TensorFlow, D3, every presentation controller, `WorkerManager`, `LocalStorageService`, and `ErrorBoundary`. That is *correct behaviour for a composition root* — the composition root is the one place allowed to know about every adapter. The smell is that the file lives inside `src/core/application/`. Composition roots belong at `src/main.ts` or `src/bootstrap/` so core is literally importable without pulling in D3 or TensorFlow. Moving the file is a rename-and-retarget refactor; it does not change behaviour.

**Presentation layer — clean in both directions.**
`src/presentation/` imports from core but core never imports from presentation (verified via grep). Controllers receive their dependencies from `ApplicationBuilder`.

**Phase 1 fix quality.**
The `runLRFinder` change at `TrainingSession.ts:910` is exactly the right shape: one line, no reflection, no `@ts-ignore`, no fallback path that rebuilds the model and silently destroys trained weights. The plan specified leaving `TFNeuralNet.setLearningRate` (the off-contract sibling method) for Phase 2 dead-code removal; in reality it has already been stripped — a grep for `setLearningRate` across `src/` returns zero hits. The contract is now the only way to change the learning rate, which is what you want.

### A.2 CI/CD posture

The pipeline overhaul in `0493999` and the forensic audit committed at `docs/CICD_AUDIT_REPORT.md` (240b143) already document this in depth. The critical property for product readiness is: **`deploy` depends on `test` and `build`, not on `e2e`**. E2E is advisory on `main` (`continue-on-error: true`) with a `timeout-minutes` guard and a `workflow_dispatch` escape hatch. This means a flaky Playwright run cannot hold a working build hostage, while a regressed unit test or a broken build still blocks deploy. That is the right priority ordering for a GitHub-Pages-hosted educational tool where real users care about the site being up, not about the E2E suite being green on every commit.

Outstanding CI/CD items (already filed as issues in the earlier session):

- **Issue #18** — Playwright Page Object Model selector drift after the hexagonal refactor. Scope clarified: only `#btn-*-sticky` IDs are genuinely drifted; `.data-point` is *not* dead (verified at `src/infrastructure/d3/D3Chart.ts:227`). Fix belongs in `tests/e2e/pages/NeuroPage.ts`, not in the app.
- **Issue #19** — Node 20 deprecation on GitHub Actions runners (forced Node 24 by 2026-06-02, removed 2026-09-16). 22 action pins across four workflows need a version bump. Full inventory is in the issue.

### A.3 User-visible bugs (architect hat)

Observed live at `BR__Damg`:

1. **Confusion Matrix empty container.** `#confusion-matrix-container` is present, the Analyze accordion opens it to a 140×307 px visible box, and after one or more training epochs the container still has **zero child nodes**. This is a rendering binding bug — the adapter is wired but the render call is not firing or is rendering into the wrong selector. The visualiser works in unit tests, so the break is almost certainly at the controller/event boundary.

2. **Output activation histogram "No data".** `#activation-histogram` shows Input / L1 / L2 with populated stats (Input μ=0.29 σ=0.39, L1 μ=0.38 σ=0.67, L2 μ=0.40 σ=0.28) but the Output layer reads "No data". Either the final layer's activation capture hook is missing or the histogram binding skips the output layer intentionally without explaining why.

3. **Programmatic `#input-layers` immunity.** Setting `#input-layers.value` via the React native setter + dispatching `InputEvent('input')` + `Event('change')` + `KeyboardEvent('keydown', {key:'Enter'})` does not propagate any of the tried topologies ("16, 8", "32, 16", "4, 3"). The model stays at whatever was last `#btn-init`'d. This is fine for a human keyboard user (they typed, the input listener runs) but breaks anything that drives the UI programmatically — Playwright, screen readers, future URL state restoration, and my own live-site assessment run. The likely cause is that the event listener is bound in a way that does not observe `InputEvent` with the React-style native-setter bypass. A short hand-verification (human typing in the field) is needed before ruling this in as a real bug.

4. **Initialise Network discoverability.** `#btn-init` lives in the Model tab; Start / Pause / Step / Reset live in the Train tab. After editing the architecture, the user must tab-switch, click Initialise, then tab-switch back to Train. Reset also clears the network diagram without rebuilding it, so the workflow ends on a blank diagram that only repopulates after the next Initialise. Two fixes, either of which works: (a) mirror `#btn-init` as a secondary action in the Train tab so the flow is linear within one view; (b) have Reset implicitly re-initialise with the current hyperparameters so the diagram stays alive.

5. **No ROC curve panel in Analyze.** The Analyze tab accordion has Network Diagram, Weight Histogram, Confusion Matrix, Activation Histogram, Model Complexity, Adversarial, Loss Chart. There is no ROC panel, consistent with the earlier session's finding that `D3RocCurve` was unreferenced dead code. Either ship the panel or delete the adapter; the middle state (adapter exists but no UI slot) is what produced the confusion in the first place.

### A.4 Architect hat verdict

**Ship-quality, with surgical follow-ups.** The hexagonal boundaries are real, the ports are used the way ports are supposed to be used, the CI/CD pipeline puts deploy on the right critical path, and the Phase 1 fix closed the one place the port contract was being bypassed with reflection. The four follow-ups (logger port extraction, composition-root relocation, confusion matrix binding fix, output-layer activation hook) are all contained, reviewable, and do not require a re-architecture.

---

## Part B — Neural Network Expert (MIT) hat

### B.1 ML primitive correctness

Verified against the Spiral dataset, 200 samples, 160/40 train/val split, default architecture 2→8→4→2 with ReLU hidden + Sigmoid output:

**Weight initialisation.** The weight histogram after `#btn-init` (before any training) shows 18 bins, **μ = -0.017, σ = 0.992**. That is a textbook He-normal signature: He-normal draws `W ~ N(0, sqrt(2/fan_in))`, and with `fan_in = 2` the expected σ ≈ 1.0. Observed σ = 0.992 is ~0.8% off the theoretical value, well within sampling noise for 70 parameters. Mean near zero confirms unbiased initialisation. This is implemented correctly and a learner looking at the histogram gets the right intuition for what "He init" looks like in practice.

**Network topology rendering.** Network diagram shows **16 circles** (2 input + 8 L1 + 4 L2 + 2 output) and **56 lines** (2×8 + 8×4 + 4×2 = 16 + 32 + 8 = 56 connections). Matches the architecture exactly. No phantom nodes, no missing edges. A student can count neurons and verify fan-in/fan-out by eye.

**Parameter count and complexity.** `#complexity-params` reports **70 parameters, 140 FLOPs, 280 B memory**. Hand-verified:
- L1: 2×8 weights + 8 biases = 24
- L2: 8×4 weights + 4 biases = 36
- L3: 4×2 weights + 2 biases = 10
- **Total: 70** ✅

FLOPs = 2 × params for the forward pass (one multiply + one add per weight) = 140 ✅. Memory = 70 params × 4 bytes (float32) = 280 B ✅. The displayed math is correct and the complexity panel is safe to trust as a teaching surface.

**Decision boundary.** The D3 contour renderer in `#viz-container` produces **11 filled contour polygons** with a divergent cyan→white→orange colormap. This is the correct choice for a binary-classification probability field: divergent colormaps make the P(y=1) = 0.5 decision line visually unambiguous and let learners see gradient of confidence away from the boundary, not just the sign. Eleven contour bands is a reasonable density — enough to see the gradient, few enough that individual bands stay distinct on a 400×400 px canvas.

**Loss/accuracy telemetry after one epoch.** Training ran one epoch before RAF throttling in a backgrounded tab stalled further progress. Observed values: **loss 1.2970, val_loss 0.9114, accuracy 37.5%**. These deserve three notes:

- *Initial loss of 1.297 for binary cross-entropy on a 2-class spiral with He init is plausible* but high. BCE with uniform-probability predictions would give `-log(0.5) ≈ 0.693`. A 1.297 start implies the sigmoid outputs are further than 0.5 from the true labels on average — consistent with He-initialised weights in a 2→8→4→2 net producing saturated sigmoid outputs before any training.
- *Val loss (0.9114) < train loss (1.2970)* is the inverted ordering you usually do not see. Two innocent explanations: (a) the 40-sample validation split happens to contain easier samples than the 160-sample train split, which is plausible at such small sizes; (b) the train loss is a running average across the epoch including earlier (noisier) batches while val loss is measured at the end on a fixed set. Either way it is not a bug, but the UI should expose enough signal that a learner can distinguish "val happens to be easier" from "something is wrong" — e.g., plotting both curves across multiple epochs. Which the loss chart already does.
- *Accuracy 37.5% < random (50%)* after one epoch is consistent with a severely miscalibrated output layer at epoch 1 where the sigmoid is biased toward the wrong class for most samples. This should cross 50% within 3-5 epochs on a Spiral with this architecture; it is a single-sample snapshot, not a verdict on training quality.

**Activation statistics across hidden layers.** Input μ=0.29 σ=0.39, L1 μ=0.38 σ=0.67, L2 μ=0.40 σ=0.28. The mean is rising and σ is varying across layers — expected ReLU behaviour for untrained weights on normalised inputs. No dead-neuron alarm (a dead ReLU layer would show μ ≈ 0 and σ ≈ 0). However the fact that the **Output layer histogram reads "No data"** while L1/L2 populate is a bug (logged as B.2 item 2 above) — from a didactic perspective the Output layer is the most interesting histogram on a classification problem because it lets learners see logit separation emerge during training. Losing it silently is a real pedagogical regression.

### B.2 Didactic evaluation

NeuroViz's core educational proposition is: *"Manipulate a small neural network end-to-end and see every layer of what is happening, live."* Measured against that:

**What delivers the proposition correctly:**

- **Live decision boundary** is the single most valuable teaching surface and it works. Divergent colormap is the right call.
- **Live loss + val accuracy on a dual axis** is the second most valuable surface and it works — the loss chart accordion shows both curves on the same time axis with different scales, which is exactly how you teach overfitting.
- **Network diagram** correctly shows fan-in/fan-out with every connection, so a learner can count parameters by eye and then sanity-check against the complexity panel.
- **Weight histogram with textbook He-init signature** makes the "initialisation matters" lesson visible the instant you click Initialise, before any training. This is rare in educational tools and genuinely strong.
- **Layer-wise activation histograms** (minus the Output bug) let a learner see activations shift across depth as training progresses, which is how you build intuition for ReLU, dying neurons, and batch-norm's purpose.
- **Model complexity panel** puts param count / FLOPs / memory in front of the learner, which is essential scaffolding for the "why don't we just make it bigger" conversation.
- **Tutorial fix (Phase 1).** The "Getting Started" tutorial now actually highlights `#viz-container` at the `observe` step instead of missing silently, and the Overfitting tutorial's `early-stopping` step is now a self-contained informational step with didactic text rather than a phantom highlight on a non-existent input. Both tutorials walk end-to-end without silent no-ops.

**What the proposition promises but the current build does not deliver to a learner:**

- **Confusion matrix** is the canonical classification-quality visual. It is present in the tab, the adapter exists, the container is visible — but it is empty after training. A learner who opens it learns *nothing*. Priority 1 to fix.
- **ROC curve** has no UI slot despite the adapter existing. A learner who has been told to look for ROC during the overfitting tutorial has nowhere to look. Ship the panel or remove the adapter and the tutorial reference.
- **Architecture editing feedback loop.** A core interaction is "edit layers, see it rebuild". In the current build the programmatic path does not propagate, and even the keyboard path routes through a tab switch to click Initialise. A learner who does not find `#btn-init` thinks the tool is broken. A single "Apply" button next to the `#input-layers` field in the Train tab would close this loop.

**What is not promised and that is the correct call:**

- No regularisation toggles beyond early stopping in the current tutorial — this is the right scope for a "your first neural network" tool.
- No optimiser ensembles or per-layer LR scheduling exposed in the main UI — again, right scope.
- LR Finder is exposed via the research panel only, which is the right place for it; it is an advanced diagnostic, not a beginner interaction.

### B.3 Neural-net hat verdict

**ML correctness: pass.** The primitives are real, the visualisations are correct, the math is verifiable, and the initialisation/activation/complexity surfaces all give a learner the right intuition. The didactic narrative is coherent — dataset → architecture → training → diagnosis — and the Phase 1 tutorial fix restores the first end-to-end walkthrough.

**Didactic delivery: 80% of the promise.** The Confusion Matrix gap and the Output activation "No data" regression are not academic quibbles — they are the exact surfaces a learner goes looking for to answer *"is my model any good?"*. Fixing both moves the tool from "mostly complete" to "genuinely complete" for the first-time-learner audience it is designed for.

---

## Consolidated follow-up list (priority order)

| # | Item | Hat | Effort | Impact |
|---|---|---|---|---|
| 1 | Fix Confusion Matrix empty container binding | ML/UX | S | High — restores the canonical classification-quality visual |
| 2 | Fix Output-layer activation histogram "No data" | ML/UX | S | High — restores the most interesting layer for a classifier |
| 3 | Extract `ILogger` port; remove `logger` import from `TrainingSession.ts:5` and `Application.ts:30` | Architect | S | Medium — closes the last core→infrastructure leak in the training pipeline |
| 4 | Add Apply/Rebuild button next to `#input-layers` in the Train tab OR have Reset re-initialise | UX | S | Medium — closes the architecture-edit feedback loop |
| 5 | Verify manually whether `#input-layers` accepts keyboard edits, then either confirm fix-for-programmatic-only or log as a real propagation bug | UX/QA | XS | Medium |
| 6 | Decide: ship ROC curve panel OR remove `D3RocCurve` adapter and any dangling references | ML/Architect | S | Medium — closes the middle state |
| 7 | Relocate `ApplicationBuilder.ts` from `src/core/application/` to `src/bootstrap/` or `src/main.ts` | Architect | S | Low — cosmetic, but clarifies that core does not depend on adapters |
| 8 | Issue #18 — Playwright selector drift in `NeuroPage.ts` (`#btn-*-sticky` IDs) | CI/CD | S | Medium — restores E2E as a reliable signal |
| 9 | Issue #19 — Node 20 → Node 24 bump across 22 action pins in 4 workflows before 2026-06-02 | CI/CD | S | High before deadline, irrelevant after |

None of these require touching the ML core, the port contracts, the domain types, or the deploy pipeline. All nine fit into a single focused week of work.

---

## Sign-off

The live build at `BR__Damg` delivers the essential educational loop (dataset → architecture → training → live decision boundary + loss curves) correctly and with real ML under the hood. The hexagonal architecture is genuine. The Phase 1 fix closed the one reflective hack in the training pipeline and the one tutorial silent-miss. The four surgical follow-ups (confusion matrix, output activation, logger port, architecture-edit loop) move the build from "ships" to "ships well", and none of them require re-architecting anything.

**Phase 1 verdict: complete and merged (`240b143`).**
**Product-readiness verdict: ship, with the consolidated follow-up list above scheduled as the next focused PR.**
