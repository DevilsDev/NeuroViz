# NeuroViz CI/CD Audit

Branch: `wt/sad-elbakyan` (worktree off `main`)
Scope: the `CI/CD` workflow (`.github/workflows/ci.yml`) is the sole source of
deployment failures. `Lighthouse CI` and `Security Scan` are healthy and are
only mentioned where they share a fault with `ci.yml`. This is a research +
plan document — no files outside this one were touched.

---

## 1. Executive summary

- **Every E2E run on `main` is guaranteed to time out on the very first
  `beforeEach`**, because `tests/pages/NeuroPage.ts` waits for two globals
  (`window.tf`, `window.app`) that `src/main.ts:45` and
  `src/core/application/ApplicationBuilder.ts:119` only expose when
  `import.meta.env.DEV || import.meta.env.MODE === 'test'`. CI runs
  `vite preview` against a production build, so neither global ever appears.
- A **second, independent bug** compounds the first: `playwright.config.ts:32`
  sets `baseURL` to `http://localhost:5173/NeuroViz` (no trailing slash), but
  every `NeuroPage.goto()` call (`tests/pages/NeuroPage.ts:103`) invokes
  `page.goto('/')`. URL resolution sends Playwright to `http://localhost:5173/`
  — the preview server only serves the app at `/NeuroViz/`, so tests land on a
  404 page and then wait 30 s for a `tf` global that will never exist. Even if
  bug #1 were fixed, the tests would still fail on this.
- The `e2e` job has **no `timeout-minutes`**, so a broken suite can (and has)
  burned up to the GitHub default 6 h per run before cancelling. Combined with
  ~110 `beforeEach` blocks × 30 s × 3 retries, the worst case is bounded only
  by the global cap.
- Because `deploy` depends on `[test, build, e2e]`, the site has not
  auto-deployed for days and is being hand-deployed from `dist/` by the user.
  There is **no `workflow_dispatch` escape hatch** for emergency deploys.
- The single highest-value fix (Phase 1 below) is a **one-line change to
  `NeuroPage.goto()`** to navigate to `/NeuroViz/` and drop the two doomed
  readiness probes, followed by a 15-minute job timeout. That alone restores
  green CI and auto-deploys without editing workflows or source.

---

## 2. Root cause of the E2E failures

### Primary cause — the readiness probes target dev-only globals

`tests/pages/NeuroPage.ts:100`:

```ts
async goto(): Promise<void> {
  await this.disableOnboarding();
  await this.page.goto('/');
  await expect(this.vizContainer).toBeVisible();
  await this.waitForTensorFlowReady();   // ← waits for window.tf
  await this.waitForAppReady();          // ← waits for window.app
}
```

`tests/pages/NeuroPage.ts:115` checks for `window.tf`:

```ts
async waitForTensorFlowReady(): Promise<void> {
  await this.page.waitForFunction(
    () => typeof (window as unknown as { tf?: unknown }).tf !== 'undefined',
    { timeout: 30000 }
  );
}
```

`tests/pages/NeuroPage.ts:129` checks for `window.app`:

```ts
async waitForAppReady(): Promise<void> {
  await this.page.waitForFunction(
    () => {
      const app = (window as any).app;
      return app && app.services && app.services.session && app.controllers;
    },
    { timeout: 10000 }
  );
}
```

Both globals are gated on DEV/test mode in the source:

- `src/main.ts:45`
  ```ts
  if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
    window.app = app;
  }
  ```
- `src/core/application/ApplicationBuilder.ts:118`
  ```ts
  if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
    (window as typeof window & { tf: typeof tf }).tf = tf;
  }
  ```

`.github/workflows/ci.yml:261` runs `npm run preview -- --port 5173` against
the artifact produced by `npm run build` (`.github/workflows/ci.yml:175`),
which is a full production build. In a production build Vite sets
`import.meta.env.DEV === false` and `import.meta.env.MODE === 'production'`,
so **both branches are dead-stripped at build time**. `window.tf` and
`window.app` are not attached, and no amount of waiting will make them appear.

Every `beforeEach` in every test file calls `neuroPage.goto()` — 110 test
entry points across `all-datasets.spec.ts`, `all-ui-controls.spec.ts`,
`comprehensive-ui.spec.ts`, `neuroviz.spec.ts`, and `tab-content.spec.ts` —
so the first Playwright probe hits the 30-s timeout, retries twice per the
`retries: 2` setting in `playwright.config.ts:18`, and grinds for ~90 s per
test × up to 110 tests.

This is consistent with the symptom log from run `24174727211`:

- `wait-on http://localhost:5173/NeuroViz/` passes (server is serving).
- Every test fails with identical `TimeoutError: page.waitForFunction: Timeout
  30000ms exceeded.`
- Cleanup kills an orphan `npm run preview` (server stayed alive; preview
  wasn't the problem).

### Aggravating cause — baseURL and path mismatch

`playwright.config.ts:32` sets

```ts
baseURL: process.env.CI ? 'http://localhost:5173/NeuroViz' : 'http://localhost:3000',
```

and `tests/pages/NeuroPage.ts:103` uses `await this.page.goto('/')`. Playwright
passes the path through `new URL('/', baseURL)`, which resolves to
`http://localhost:5173/` — **not** `http://localhost:5173/NeuroViz/`. The
preview server (with `base: '/NeuroViz/'` per `vite.config.ts:12`) serves
nothing at `/`. The tests therefore land on a 404/empty page even in worlds
where `window.tf` existed.

Two fixes are available and either is sufficient:
- Change baseURL to `'http://localhost:5173/NeuroViz/'` (trailing slash), or
- Change `page.goto('/')` to `page.goto('/NeuroViz/')` or `page.goto('./')`.

The trailing-slash fix on baseURL is simpler and matches the `wait-on` URL in
`.github/workflows/ci.yml:264`.

### When did this break?

These are not regressions from yesterday's refactor. `NeuroPage.goto()` has
been waiting on `window.tf`/`window.app` for a while, and `main.ts` has been
gating them on `DEV/test` for a while too. The question is: how did it ever
pass? Two plausible histories:

1. Historically the E2E job ran against `vite dev` (not `vite preview`), in
   which case `import.meta.env.DEV === true` and both globals were present.
   At some point the job switched to `preview`, and the readiness contract
   silently broke. The comment on `ci.yml:258` ("Run E2E Tests against preview
   server") and the separate `webServer: undefined` branch in
   `playwright.config.ts:82` for CI support that reading.
2. The E2E suite has been red for longer than anyone noticed, and
   `f1e5c2f refactor: phase 1-5 codebase cleanup` just made it more visible.

This is worth confirming from git log but does not change the fix.

---

## 3. Secondary issues

Severity legend: **critical** = breaks the pipeline or production,
**warning** = degrades safety / cost / feedback loop, **cleanup** = nice to
have.

### 3.1 `e2e` job has no `timeout-minutes` — **critical**
`.github/workflows/ci.yml:212`. GitHub's default per-job cap is 6 h. A hung
probe combined with `retries: 2` and 110+ beforeEach blocks has produced 2 h+
runs. Set `timeout-minutes: 15` (or 20) on the `e2e` job and a
`test.setTimeout` budget on the Playwright side.

### 3.2 Deploy is strictly gated on `e2e` — **critical**
`.github/workflows/ci.yml:296`: `needs: [test, build, e2e]`. While E2E is
broken, no push ever deploys. There is no `workflow_dispatch` path, no
"force-deploy" option, and no way to promote a known-good build without
editing the workflow. The user has been manually pushing `dist/*` to
`gh-pages`, which works but bypasses attestation, provenance, and the
semantic-release version number.

### 3.3 Release and CI run in parallel on every push to `main` — **warning**
`.github/workflows/release.yml:24` and `.github/workflows/ci.yml:19` both
trigger on `push` to `main`. `release.yml` writes a `chore(release): X.Y.Z
[skip ci]` commit, and CI correctly skips that follow-up commit. The
interleaving is cosmetic (see `git log origin/main --oneline`: every product
commit is followed by a `chore(release)` commit) but has real effects:
- `release.yml` bumps `package.json` version before CI finishes, so the
  deployed artifact's version metadata can lag the tag that marks it.
- Release runs `npm ci` + `semantic-release` on a full clone with
  `fetch-depth: 0` (`release.yml:45`) — fine, but it also means release can
  succeed and tag a version whose E2E never passed. The tag → deployed-build
  linkage on `gh-pages` is purely by convention.
- Nothing connects the semantic-release version bump to the CI/CD deploy
  commit message (`'deploy: ${{ github.sha }}'`, `ci.yml:331`).

### 3.4 E2E runs against `vite preview`, not a static server — **warning**
`.github/workflows/ci.yml:261`. `vite preview` is close to, but not exactly,
what GitHub Pages serves. It handles SPA fallback, trailing slashes, and MIME
types slightly differently from the static host. A realistic staging served
by `npx serve dist -l 5173 -c serve.json` (or `http-server`) would catch
real-world 404s and asset-path bugs that preview hides. Low priority, but
worth flipping once the E2E is healthy.

### 3.5 `retries: 2` masks real flakiness and triples failure wall-clock — **warning**
`playwright.config.ts:18`. With a broken probe, each failing test takes 30 s
× 3 = 90 s before moving on. Keep `retries: 1` on CI as a pragmatic balance,
or drop to `0` once flakiness is diagnosed.

### 3.6 `fullyParallel: true` but `workers: 1` on CI — **warning**
`playwright.config.ts:11` and `playwright.config.ts:21`. The two settings
contradict: tests are marked parallelisable but run single-threaded. With
~110 entry points the suite should be split across 2–4 workers and/or
sharded. Sequential execution is a holdover from TF.js memory-pressure
concerns that may no longer apply; benchmark before committing to a number.

### 3.7 No sharding across runners — **warning**
The suite can be split with `--shard=1/4` × 4 matrix jobs for a 4× wall-clock
win. Only worth doing once the suite is green and the total time is a real
constraint. For now parallel workers inside one job are the cheaper step.

### 3.8 Concurrency group cancels in-progress runs — **informational**
`.github/workflows/ci.yml:25`. Intended behaviour. Explains the `cancelled`
status on runs that were superseded by a newer push. Keep.

### 3.9 Node 20 on CI, Node 22 on release, Node 20 in Security — **cleanup**
`.github/workflows/ci.yml:34` pins `NODE_VERSION: '20'` (LTS).
`.github/workflows/release.yml:51` pins `'22'` with a comment claiming
semantic-release needs ≥22. `.github/workflows/security.yml:48`, `:153` pin
`'20'`. `.github/workflows/lighthouse.yml:28` pins `'20'`. Node 20 goes
maintenance in 2026-10 and EOL 2026-04; both are within the project's
lifetime. Move everything to Node 22 LTS (or 24 once 24 is LTS in 2026-10)
in a single pass once CI is green.

### 3.10 `actions/*` versions are fine; no pinning-by-SHA — **cleanup**
`actions/checkout@v4`, `actions/setup-node@v4`, `actions/cache@v4`,
`actions/upload-artifact@v4`, `actions/download-artifact@v4`,
`peaceiris/actions-gh-pages@v4` — all on current majors. Acceptable. For
supply-chain hardening a future pass can pin to full commit SHAs, but it is
not the cause of any current pain. `trufflesecurity/trufflehog@main` in
`.github/workflows/security.yml:113` is the one unpinned reference —
**cleanup**, pin to a tag.

### 3.11 Failure artifacts are large and retained for 7 days — **cleanup**
`.github/workflows/ci.yml:278` and `:286` upload `tests/reports/` (~68 MB)
and `tests/results/` (~78 MB) on every failure. With the suite failing
every run, that is ~1 GB of storage per week per developer. Reduce
retention to 3 days, and/or upload only on the final retry, and/or gzip
the HTML report.

### 3.12 Cached `node_modules` layer is fragile — **cleanup**
`ci.yml:61` caches `node_modules` directly with a `node-modules-…` key and
then *also* uploads it as an artifact for downstream jobs (`ci.yml:75`).
That's doing the same work twice. The cleaner pattern is:
- Let `actions/setup-node@v4` cache the `npm` store (already enabled at
  `ci.yml:54`), and
- Run `npm ci --prefer-offline` fresh in each job (fast, deterministic).

The `node_modules`-as-artifact dance costs upload/download time per job and
can break subtly when a native module differs between uploader and consumer
runners (e.g. `canvas`, which is present in `devDependencies`).

### 3.13 `test:coverage` runs twice — **cleanup**
`.github/workflows/ci.yml:128` runs `npm test` (plain vitest) then
`.github/workflows/ci.yml:131` runs `npm run test:coverage` (vitest +
coverage). The coverage run already executes the full test suite; the first
invocation is pure waste. Delete the plain `npm test` step.

### 3.14 Bundle-size guard is off-by-convention — **cleanup**
`ci.yml:193` fails if `dist/` exceeds 25 MB (`du -sm`). `du -sm` rounds up,
and the repo's current bundle is near the line. A few innocuous asset
additions could trip this. Move the guard to a scripted check that reads
actual file sizes from the Vite build output and reports per-chunk budgets
(this pairs well with Lighthouse's existing perf budgets).

### 3.15 `peaceiris/actions-gh-pages@v4` vs `actions/deploy-pages` — **cleanup**
Covered in Section 4 trade-offs.

### 3.16 Security and Lighthouse workflows are healthy — **informational**
`security.yml` has graceful `continue-on-error` on scans, `|| exit 0`
fallbacks, and a weekly cron. Nothing actionable beyond pinning
`trufflehog@main` (see 3.10).

`lighthouse.yml` uses `treosh/lighthouse-ci-action@v11`, which starts its
own server internally. No interaction with the broken CI/CD flow.

---

## 4. Proposed architecture for a healthy pipeline

### 4.1 E2E: blocking vs non-blocking

Target state:
- **`e2e` is required to pass on PRs**, because blocking merges on broken UI
  is exactly what E2E is for.
- **`e2e` is advisory on `main`** (runs, reports, but does not block
  `deploy`). Rationale: by the time a change reaches `main` it has passed PR
  gating. Blocking post-merge deploys on a flaky suite is how teams end up
  hand-deploying from `dist/`, which is where we are today.
- A `workflow_dispatch` input `skip_e2e: bool` (default `false`) exists as a
  documented break-glass for emergency deploys during a suite outage.

Concrete shape in YAML terms (not code — this is the target):

```yaml
on:
  push:         { branches: [main] }
  pull_request: { branches: [main] }
  workflow_dispatch:
    inputs:
      skip_e2e:
        description: 'Skip E2E (emergency deploy only)'
        type: boolean
        default: false

jobs:
  e2e:
    if: ${{ !(github.event_name == 'workflow_dispatch' && inputs.skip_e2e) }}
    timeout-minutes: 15
    continue-on-error: ${{ github.event_name == 'push' && github.ref == 'refs/heads/main' }}
    ...

  deploy:
    needs: [test, build]                       # ← note: NOT e2e
    if: |
      (github.event_name == 'push' && github.ref == 'refs/heads/main') ||
      (github.event_name == 'workflow_dispatch')
    ...
```

The `deploy` job drops `e2e` from `needs` but is still gated on `test` (lint
+ unit + typecheck) and `build`, which are the fast, reliable signals.
Pull-request runs still block merge on `e2e` via branch protection on the
`E2E Tests` check — that protection is configured in the repo, not in the
workflow, and is unaffected by this change.

Other E2E settings:
- `timeout-minutes: 15` at the job level.
- `timeout: 60000` (global per-test) in `playwright.config.ts` on CI, down
  from `90000`. If a test genuinely needs more, opt in with
  `test.setTimeout(120_000)` at the call site.
- `retries: 1` on CI, down from `2`. Real flakes retry once; real bugs fail
  fast.
- `workers: 2` on CI (benchmark first). The current `workers: 1` is a
  memory-safety holdover; Playwright + chromium + TF.js fit in a 7 GB runner
  easily for this suite size.
- Keep `projects: chromium` only on CI. Firefox/WebKit live in a nightly
  matrix, not per-PR.

### 4.2 Deploy: keep `peaceiris` or move to official Pages action?

Trade-offs:

| Axis | `peaceiris/actions-gh-pages@v4` (current) | `actions/configure-pages@v5` + `actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4` |
|---|---|---|
| History on `gh-pages` | Real git commits, inspectable | No `gh-pages` branch; artifacts stored in Pages backend |
| Rollback | `git revert` on `gh-pages`, trivial | Via Pages UI; no git affordance |
| Manual hand-deploy (current escape hatch) | Still works (user did it this week) | Incompatible; hand-deploy has to push an artifact via API |
| Attestation / provenance | Self-rolled | Built in (SLSA, Sigstore via Pages) |
| Migration cost | Zero | Medium; also needs repo Pages settings flipped from "branch" to "actions" |
| Third-party dependency | Yes (peaceiris) | No (first-party) |

Recommendation: **stay on `peaceiris` for now**. The user is actively relying
on the ability to hand-push to `gh-pages` when CI is broken. Losing that
affordance before CI is reliable would be a net regression. Revisit after
Phase 3 (stable E2E) — at that point the migration to `actions/deploy-pages`
becomes a pure upside move and takes about an hour.

### 4.3 Release ↔ CI coordination

The current interleaving is harmless but ugly. Three options, in order of
effort:

1. **Cheap**: leave as-is, rely on `[skip ci]` to prevent double-runs. This
   already works. The cosmetic price is alternating `fix:` / `chore(release):`
   commits in `git log`.
2. **Medium**: make `release.yml` a `workflow_run` trigger that fires after
   `CI/CD` completes successfully on `main`. Release then runs only on green
   main. Downside: release no longer runs on builds that were green but had
   E2E marked advisory (section 4.1), so this requires defining "green" more
   carefully. Probably overkill.
3. **Proper**: collapse release into the deploy job of `ci.yml`. A single
   workflow, one trigger, deterministic order: test → build → e2e (advisory)
   → release → deploy. This is what most mature projects do. Non-trivial
   migration because `release.yml` sets different permissions and checks out
   with `fetch-depth: 0`; merging requires reusing the same checkout and
   splitting permissions with a reusable workflow. Maybe 3 hours of work.
   Best done after Phase 3.

Recommendation: **Phase 5 or later**. Don't touch this while other things
are burning.

### 4.4 Emergency-deploy escape hatch

Two orthogonal mechanisms, both cheap:

- **`workflow_dispatch` with `skip_e2e` input** on `ci.yml` — see 4.1.
  Lets the user deploy a green `build` without waiting on E2E at all, via
  the Actions UI. No local `git push` needed.
- **Documented manual deploy** in `README.md`: the exact four commands the
  user has been running this week. Not a substitute for the above, but a
  last-resort option if Actions itself is down.

Recommendation: do the `workflow_dispatch` path in Phase 2. Document the
manual fallback at the same time.

### 4.5 Node version policy

Move to Node 22 LTS everywhere in one small PR, after Phase 1 is green:
- `.github/workflows/ci.yml:34`: `NODE_VERSION: '22'`
- `.github/workflows/release.yml:51`: already `'22'`, leave
- `.github/workflows/security.yml:48`, `:153`: `'22'`
- `.github/workflows/lighthouse.yml:28`: `'22'`

Defer Node 24 until it goes LTS (scheduled 2026-10). `semantic-release`
claims to need ≥22 already, so 22 is the common floor.

### 4.6 Caching policy

Delete the `node_modules`-as-artifact plumbing. Rely on
`actions/setup-node@v4`'s built-in `cache: 'npm'` and run `npm ci
--prefer-offline` fresh in every job. Simpler, faster in practice, and
eliminates the `canvas`-native-module cross-runner risk.

### 4.7 Sharding

Don't shard yet. Get the suite green, then measure. If wall-clock exceeds
~8 minutes after workers:2, introduce a 2-way shard via
`strategy.matrix.shard: [1, 2]` and `--shard=${{ matrix.shard }}/2`.

---

## 5. Phased fix plan

Every phase is independently shippable. Phase 1 is the only one that must
happen immediately; everything else can be scheduled.

### Phase 1 — Restore green CI and auto-deploy (smallest possible)

**Goal**: next push to `main` goes green and deploys. Nothing else changes.

**Touched files**:
- `tests/pages/NeuroPage.ts` — in `goto()`:
  - change `page.goto('/')` to `page.goto('/NeuroViz/')` (absolute path
    that resolves correctly regardless of trailing-slash baseURL state), and
  - delete the `waitForTensorFlowReady()` and `waitForAppReady()` calls.
    Replace with a DOM-level readiness probe that exists in production
    builds, e.g. `await expect(this.vizContainer).toBeVisible();` is already
    there — supplement with
    `await this.page.locator('.dataset-preview-card').first().waitFor();`
    or similar, tied to a real piece of app UI that renders only after
    `ApplicationBuilder.build()` completes. This is the one judgement call:
    pick a selector that reliably appears post-init in production.
- `playwright.config.ts` — set `baseURL: 'http://localhost:5173/NeuroViz/'`
  (trailing slash) for defence in depth.
- `.github/workflows/ci.yml` — on the `e2e` job: add
  `timeout-minutes: 15`.

**What stays broken**: anything downstream that actually reads `window.app`
or `window.tf` internally (the white-box tests described in NeuroPage
comments). Those need a different answer — see Phase 2 — but they are a
minority of the suite. In Phase 1 they should either be skipped with a
`test.fixme()` tag or pass-through as the DOM-level probe is enough for
most assertions.

**Verification**: locally,
```
npm run build
GITHUB_ACTIONS=true npm run preview -- --port 5173 &
npx wait-on http://localhost:5173/NeuroViz/
CI=true npm run test:e2e
```
Expect a handful of failures in white-box tests, not a wall of 30-s timeouts.
Then push the branch and watch the `CI/CD` run.

### Phase 2 — Ship the escape hatch and cut junk work

**Goal**: unbreakable path to deploy even when E2E regresses; stop
double-running tests; stop uploading 150 MB of garbage per failure.

**Touched files**:
- `.github/workflows/ci.yml`:
  - add `workflow_dispatch` with a `skip_e2e` boolean input
  - `e2e` job: `if: ${{ !inputs.skip_e2e }}`
  - `deploy` job: drop `e2e` from `needs`, keep `test` and `build`; update
    the `if:` to allow `workflow_dispatch`
  - remove the standalone `npm test` step (line 128-129); keep only
    `npm run test:coverage`
  - reduce failure-artifact retention from `7` to `3` days
  - delete the `node_modules`-as-artifact steps (lines 75-80, 108-114,
    166-172, 232-238); add `cache: 'npm'` where missing and run `npm ci
    --prefer-offline` at job start
- `README.md` — add a short "Deploying manually" section with the exact
  commands.

**Verification**:
- Trigger `CI/CD` via Actions UI with `skip_e2e: true` and confirm deploy
  runs without E2E.
- Trigger a PR, confirm `e2e` still runs and still blocks merge via branch
  protection.
- Inspect a failed run: artifact retention is 3 days, no `node-modules`
  artifact is uploaded.

### Phase 3 — Make E2E stable and fast again

**Goal**: fix the white-box tests and get the suite to <8 min wall-clock.

**Touched files**:
- `tests/pages/NeuroPage.ts` — reinstate `window.app`/`window.tf` waits,
  but gated on either (a) a build-time env var (`VITE_EXPOSE_INTERNALS=true`)
  that `main.ts` and `ApplicationBuilder.ts` honour in addition to the
  current DEV check, or (b) a separate "e2e-build" script
  `npm run build:e2e` that sets `VITE_MODE=test`. Option (b) is cleaner: it
  keeps the production bundle clean and only the CI e2e job runs the
  instrumented build.
- `src/main.ts:45` — relax the gate to include the new env var.
- `src/core/application/ApplicationBuilder.ts:119` — same.
- `playwright.config.ts`:
  - `retries: 1` (down from 2)
  - `workers: 2` (up from 1; benchmark and revise)
  - `timeout: 60000` (down from 90000)
- `.github/workflows/ci.yml`:
  - build step runs `npm run build:e2e` when it's the input to `e2e`
    (either a separate job or conditional env)
  - deploy still uses the clean production build
- `e2e` job: flip `continue-on-error: true` on push-to-main (advisory),
  leave blocking on PRs.

**Verification**: CI run on a fresh PR is green in <10 min total; no tests
flake more than once in 10 consecutive runs; deploy still fires on main even
if `e2e` reports failure.

### Phase 4 — Modernisation pass

**Goal**: Node 22 everywhere, pin unpinned actions, swap to static server.

**Touched files**:
- `.github/workflows/ci.yml:34` — `NODE_VERSION: '22'`
- `.github/workflows/lighthouse.yml:28` — `NODE_VERSION: '22'`
- `.github/workflows/security.yml:48`, `:153` — `node-version: '22'`
- `.github/workflows/security.yml:113` — pin
  `trufflesecurity/trufflehog@<tag>`
- `.github/workflows/ci.yml:261` — swap `npm run preview` for
  `npx http-server dist -p 5173 --cors -c-1` (or equivalent), and add a
  `public/404.html` symlink-to-index for SPA fallback if any routes need it.
  This makes the preview environment bit-for-bit identical to GitHub Pages.

**Verification**: CI runs green on a fresh PR with the new Node version;
Lighthouse, Security, and CI/CD all green; local `npm run build &&
npx http-server dist -p 5173` reproduces the CI environment exactly.

### Phase 5 — Release/CI unification (optional, low priority)

**Goal**: collapse `release.yml` into `ci.yml` as a final stage after deploy.

**Touched files**: `.github/workflows/ci.yml`, delete
`.github/workflows/release.yml`, update `.releaserc` if present.

**Verification**: a tagged release cycle (feat → release) produces one
linear workflow run, one tag, one deploy.

---

## 6. Open questions / decisions for the user

1. **Phase 1 DOM readiness selector**: which element in the production build
   is the most reliable "the app is ready" signal? Candidates from the page
   object are `#viz-container` (always present — too early),
   `.dataset-preview-card` (rendered by `DatasetGallery`, which runs in
   `initializeUIComponents`), `#btn-load-data` (same). I lean toward
   `.dataset-preview-card` because it requires the full ApplicationBuilder
   pipeline to finish. Confirm before we code Phase 1, or tell me to just
   use that one.
2. **White-box tests**: are the tests that reach into `window.app.services`
   still load-bearing for coverage, or are the black-box tests enough now?
   If the latter, delete `waitForAppReady` entirely and simplify. If the
   former, Phase 3 must reinstate the instrumented-build path.
3. **Deploy path**: stay on `peaceiris` (my recommendation) or migrate to
   `actions/deploy-pages`? Relevant because the user's ability to hand-push
   to `gh-pages` is a real safety net right now.
4. **E2E-on-main policy**: advisory (`continue-on-error: true`) as I
   recommend in 4.1, or keep blocking and accept the risk of another outage
   requiring manual deploys? The conservative call is "advisory on main,
   blocking on PR"; the safety-first call is "blocking everywhere, and we
   fix flakes immediately". Product call.
5. **Node version**: jump to 22 now, or wait for 24 LTS in 2026-10? 22 is
   safer today; 24 avoids a second bump in six months.
6. **Sharding**: acceptable to add matrix sharding in Phase 3 if wall-clock
   warrants, or do you want the suite to stay as a single job for
   log-readability reasons?
7. **Release-CI unification (Phase 5)**: worth doing at all, or is the
   current interleave fine? This is pure ergonomics; no operational benefit.
