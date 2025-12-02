# UX/UI Audit Report: NeuroViz

**Audit Date:** 2 December 2025  
**Auditor:** Senior Staff Designer, Google UX/UI Division  
**Frameworks Applied:** Material Design 3, Nielsen's Heuristics, WCAG 2.1 (Level AA)

---

## 1. Executive Summary

NeuroViz is an ambitious neural network visualisation tool with impressive technical depth, but it suffers from **feature overload** that overwhelms first-time users. The interface attempts to expose every possible configuration simultaneously, creating cognitive paralysis rather than progressive disclosure. The visual foundation is solid—the dark theme with teal accents is contemporary—but the information architecture desperately needs restructuring to guide users through a logical workflow.

### Overall Grade: C+

The technical capability is A-tier; the user experience is C-tier. This is a classic case of building for power users whilst neglecting the onboarding journey.

---

## 2. The "Friction" Audit (UX Focus)

### Issue 1: Cognitive Overload on First Load

- **Severity:** 🔴 High
- **Location:** Entire sidebar (13+ fieldsets visible simultaneously)
- **Problem:** A new user sees ~50+ controls immediately. There is no progressive disclosure. The sidebar presents Quick Start, Dataset, Visualisation, Hyperparameters, Training Config, Training Controls, Metrics, Training History, Classification, Model Internals, LR Finder, Research Tools, and Session—all at once.
- **Nielsen Violation:** "Recognition rather than recall" — users cannot possibly remember what each control does.
- **The Fix:** Implement a **wizard-style onboarding** or **tabbed interface**. Group controls into 3 tabs:
  1. **Setup** (Dataset + Hyperparameters)
  2. **Train** (Controls + Metrics + History)
  3. **Analyse** (Classification + Model Internals + Research Tools)
  
  Alternatively, collapse all sections by default except "Quick Start" and "Training Controls".

### Issue 2: Ambiguous Primary Action

- **Severity:** 🔴 High
- **Location:** Multiple "start" buttons
- **Problem:** Users see "Apply & Start Training" (Quick Start), "Fetch" (Dataset), "Initialise Network" (Hyperparameters), and "Start" (Training). Which one do I click first? The workflow is non-linear and confusing.
- **Nielsen Violation:** "Visibility of system status" — the system doesn't guide the user through the required sequence.
- **The Fix:**
  1. Add a **stepper indicator** showing: Dataset → Network → Train
  2. Disable downstream buttons until prerequisites are met (already partially done, but not visually communicated)
  3. Add inline helper text: "Step 1 of 3: Load a dataset"

### Issue 3: Collapsible Sections Require Multiple Clicks

- **Severity:** 🟡 Medium
- **Location:** All collapsible fieldsets (Classification, Model Internals, etc.)
- **Problem:** Users report needing 2-3 clicks to fully expand sections. The animation/state management is unreliable.
- **The Fix:** Replace JavaScript `scrollHeight` manipulation with pure CSS `max-height: none` for expanded state. Ensure single-click toggle works consistently.

### Issue 4: Chart Sizing Inconsistency

- **Severity:** 🟡 Medium
- **Location:** Confusion Matrix, Weight Distribution, Gradients
- **Problem:** At 100% browser zoom, the Confusion Matrix is disproportionately large. Weight Distribution and Gradients are cut off or too small. Charts don't respect their containers.
- **The Fix:**
  - Confusion Matrix: Add `max-width: 200px; max-height: 160px`
  - Weight/Gradient charts: Set `min-height: 100px; max-height: 120px`
  - Use `overflow: hidden` on containers

### Issue 5: No Clear "Empty State" Guidance

- **Severity:** 🟡 Medium
- **Location:** Main visualisation panel, charts
- **Problem:** When no data is loaded, the main panel is blank. Empty states exist but lack actionable CTAs.
- **The Fix:** Add a prominent "Get Started" button in the empty state that triggers the Quick Start preset. Example: "No data loaded. [Load Demo Dataset]"

---

## 3. Visual Polish & "Googliness" (UI Focus)

### Typography Hierarchy

- **Critique:** The typography is functional but lacks personality. Labels use `text-[10px]` extensively, which is below WCAG minimum (12px). The monospace font (JetBrains Mono) is well-chosen for numerical data but overused.
- **Recommendation:**
  - Increase minimum label size to 11px (0.6875rem)
  - Reserve monospace for metrics only, not for all labels
  - Add more weight variation: use `font-semibold` for section headers, `font-normal` for body

### Whitespace & Density

- **Critique:** The sidebar is extremely dense. Controls are packed with `gap-2` (8px) spacing throughout. This works for power users but feels cramped. The main visualisation panel, conversely, has generous padding.
- **Recommendation:**
  - Increase `gap` to `gap-3` (12px) between fieldsets
  - Add `padding-bottom: 1rem` inside each fieldset for breathing room
  - Consider a "Compact Mode" toggle for power users who prefer density

### Visual Consistency

- **Critique:**
  - Button styles are inconsistent: some use icons + text, some use only icons, some use emojis (📊, 🎨, ⚡)
  - The emoji usage in legends (⚡ Quick Start, 📊 Dataset) feels unprofessional for a technical tool
  - Colour usage is good (teal accent, semantic colours for metrics) but the navy-on-navy borders are too subtle in dark mode
- **Recommendation:**
  - Replace emojis with consistent Lucide/Heroicons throughout
  - Increase border opacity: `border-navy-600` → `border-navy-500`
  - Standardise button patterns: always icon + label, or always label-only

### Elevation & Depth

- **Critique:** The glassmorphism effect (`.panel-glow`) is tasteful but the hover glow is too subtle to notice. Cards lack sufficient elevation differentiation.
- **Recommendation:**
  - Increase hover glow: `box-shadow: 0 0 40px rgba(20, 184, 166, 0.15)`
  - Add subtle `box-shadow` to fieldsets: `0 1px 3px rgba(0,0,0,0.1)`

### Does It Feel Premium?

### Verdict: 6/10

The dark theme is modern and the accent colour is well-chosen. However, the density, emoji usage, and lack of micro-interactions prevent it from feeling "Google-quality". It feels more like a developer tool than a polished product.

---

## 4. Accessibility Check

### Flagged Item 1: Contrast Ratio Failures

- **Location:** `.input-label` (`color: rgba(148, 163, 184, 0.8)`)
- **Issue:** This translucent grey on dark background likely fails WCAG AA (4.5:1 for small text)
- **Fix:** Use solid `#94a3b8` (slate-400) minimum, or increase to `#cbd5e1` (slate-300)

### Flagged Item 2: Touch Target Sizes

- **Location:** Checkboxes (Zoom/Pan, Tooltips, etc.), small buttons (text-xs)
- **Issue:** Many interactive elements are below 44×44px minimum
- **Fix:**
  - Wrap checkboxes in larger clickable labels with `min-height: 44px`
  - Increase button padding: `py-2 px-3` minimum for all buttons

### Flagged Item 3: Font Size Below Minimum

- **Location:** `text-[10px]` used extensively for labels
- **Issue:** 10px is below WCAG recommended minimum of 12px
- **Fix:** Replace `text-[10px]` with `text-xs` (12px) or `text-[11px]`

### Flagged Item 4: Keyboard Navigation

- **Location:** Collapsible sections use `onclick` on `<legend>`
- **Issue:** `<legend>` is not keyboard-focusable by default
- **Fix:** Add `tabindex="0"` and `onkeydown` handler for Enter/Space

### Flagged Item 5: Screen Reader Announcements

- **Location:** Training status changes
- **Issue:** Status changes (Idle → Training → Paused) should be announced
- **Fix:** Add `aria-live="polite"` to `#status-state` (already present ✓) but ensure text changes trigger announcements

---

## 5. Quick Wins (Immediate Action Items)

### Quick Win 1: Collapse All Sections by Default

**File:** `index.html`  
**Change:** Add `collapsed` class to all `.section-content` divs except Training Controls and Metrics.

```html
<!-- Before -->
<div class="section-content">

<!-- After -->
<div class="section-content collapsed">
```

**Impact:** Immediately reduces cognitive load. Users see only essential controls on first load.

---

### Quick Win 2: Increase Minimum Font Size

**File:** `src/presentation/styles.css`  
**Change:** Replace all `text-[10px]` with `text-[11px]`

```css
/* Before */
.input-label {
  @apply block text-[10px] font-medium uppercase tracking-wider mb-1;
}

/* After */
.input-label {
  @apply block text-[11px] font-medium uppercase tracking-wider mb-1;
}
```

**Impact:** Improves readability and moves towards WCAG compliance.

---

### Quick Win 3: Constrain Chart Sizes

**File:** `src/presentation/styles.css`  
**Change:** Add explicit max dimensions to chart containers

```css
#confusion-matrix-container {
  max-width: 200px;
  max-height: 160px;
  margin: 0 auto;
}

#weight-histogram-container,
#gradient-flow-container {
  min-height: 100px;
  max-height: 120px;
  overflow: hidden;
}
```

**Impact:** Prevents oversized charts from breaking layout at 100% zoom.

---

## 6. Recommended Roadmap

| Priority | Task | Effort | Impact | Status |
|----------|------|--------|--------|--------|
| P0 | Collapse sections by default | 5 min | High | ✅ Done |
| P0 | Fix chart sizing | 15 min | High | ✅ Done |
| P1 | Replace emojis with icons | 1 hr | Medium | ✅ Done |
| P1 | Increase font sizes | 10 min | Medium | ✅ Done |
| P1 | Add stepper/workflow indicator | 2 hr | High | ✅ Done |
| P2 | Implement tabbed sidebar | 4 hr | High | ✅ Done |
| P2 | Add empty state CTAs | 1 hr | Medium | ✅ Done |
| P3 | Full accessibility audit | 8 hr | Medium | Pending |

---

## 7. Closing Remarks

NeuroViz has the bones of an excellent educational tool. The technical implementation is impressive—real-time training visualisation, multiple chart types, extensive configuration options. However, the UX has been treated as an afterthought.

The path forward is clear: **simplify the default experience** whilst preserving power-user capabilities behind progressive disclosure. A first-time user should be able to see a neural network training within 10 seconds of landing on the page. Currently, that journey takes 30+ seconds and requires reading multiple labels.

With 2-3 hours of focused CSS and HTML work, this could move from a C+ to a B+. With a proper information architecture redesign (tabbed interface, wizard onboarding), it could reach A-tier.

**The potential is there. Now ship the polish.**

---

*Report generated by Senior Staff Designer, Google UX/UI Division*  
*Frameworks: Material Design 3 • Nielsen's Heuristics • WCAG 2.1 AA*
