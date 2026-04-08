# NeuroViz Redesign Plan — Google-Grade UI

## Current Problems

### Critical
1. **26+ duplicate controls** — same buttons appear in left panel AND right sidebar with same IDs (HTML validity errors)
2. **3 competing metric displays** — status tiles, floating metrics bar, sticky metrics all show the same data
3. **No clear primary action** — 4 different cyan gradient buttons compete for attention
4. **3 separate color systems** — CSS variables, Tailwind theme, and presentation/styles.css conflict
5. **47 visible controls on first load** — massive cognitive overload

### High
6. Left panel (`panel-left`) is entirely duplicated in the sidebar tabs — it should be removed
7. Grid layout defined in 2 places with conflicting rules
8. `.btn-primary` defined 5+ times across stylesheets with cascade conflicts
9. Empty placeholder modals (`#onboarding-modal`, `#ab-modal`) bloat the DOM
10. Mobile sticky footer duplicates desktop training controls

## Target Architecture

### Layout: Material Design App Shell
```
+-----------------------------------------------+
| Top Bar: Logo | Dataset Chips | Controls | Menu|
+-----------------------------------------------+
|         |                                      |
| Sidebar |  Main Content Area                   |
| (tabs)  |  - Hero Visualization                |
|         |  - Chart Strip                        |
| Data    |                                      |
| Model   |                                      |
| Train   |                                      |
| Analyze |                                      |
|         |                                      |
+-----------------------------------------------+
```

### Mode System
- **Learn**: Minimal controls, guided hints, large viz
- **Experiment**: Common controls visible, presets accessible  
- **Advanced**: Full control panels, diagnostics, all metrics

### Single Source of Truth
- ONE location per control (eliminate all duplicates)
- ONE metric display system (metric tiles in top bar only)
- ONE color system (CSS custom properties, referenced by Tailwind)
- ONE button hierarchy (primary = Start Training only)

## Implementation Phases

### Phase 1: Nuclear cleanup of index.html
- Remove entire left panel (panel-left) — all content already in sidebar tabs
- Remove floating-metrics-bar (duplicate of status tiles)
- Remove sticky footer controls (duplicate of center panel controls)
- Remove empty modals (onboarding-modal, ab-modal)
- Remove all duplicate IDs
- Remove legacy hidden elements that are unused

### Phase 2: Restructure into Material app shell
- Top bar: logo, dataset chips, playback controls, metrics, mode selector, menu
- Sidebar: 4 tabs (Data/Model/Train/Analyze) — single canonical location
- Main area: viz panel + chart strip

### Phase 3: Unify CSS
- Single color system via CSS custom properties
- Remove conflicting Tailwind overrides
- One button class hierarchy (contained/outlined/text)
- One card class (viz-card)
- One metric class (metric-tile)
- Consistent 8px spacing grid

### Phase 4: Mode system
- Learn/Experiment/Advanced toggle in top bar
- CSS classes control visibility of sections per mode
- Persist in localStorage

### Phase 5: Progressive disclosure
- All advanced controls start collapsed
- Accordions for regularization, adversarial, speed comparison
- Model tab shows only essential hyperparameters by default

### Phase 6: Polish
- Microcopy improvements (Google tone)
- Transition animations for tab switching
- Loading states for training
- Keyboard accessibility audit

## Files to Modify
1. `index.html` — complete rewrite of body structure
2. `src/style.css` — unified design system
3. `src/presentation/styles.css` — remove conflicts, keep only unique rules
4. `src/utils/DatasetGallery.ts` — update selectors for new chip structure
5. `src/core/application/ApplicationBuilder.ts` — update tab init

## Success Criteria
- Under 20 visible controls on first load (Learn mode)
- Zero duplicate controls
- Zero duplicate IDs  
- One clear primary CTA per screen state
- A new user understands the app in under 5 seconds
- Passes: "Would this feel out of place inside a Google product?" — No
