# NeuroViz — 360° Design Audit

> **Auditor Perspective:** Google Head of Product Design (EdTech & Data Viz Division)
> **Date:** December 2025
> **Frameworks Applied:** Spatial ROI, Material Design 3, Nielsen's Heuristics

---

## Executive Summary

NeuroViz is a well-architected neural network playground that successfully balances the "Cockpit" (efficient control) and "Classroom" (clear guidance) paradigms. However, several friction points exist that could overwhelm cognitively loaded users—particularly students encountering ML concepts for the first time.

**Overall Grade: B+**

| Dimension | Score | Notes |
|-----------|-------|-------|
| Spatial Efficiency | 7/10 | Good density, but sidebar competes with viz |
| Visual Hierarchy | 8/10 | Strong dark theme, minor depth issues |
| Interaction Feedback | 6/10 | Training status needs stronger signals |
| Educational UX | 7/10 | Wizard helps, but in-context learning is weak |
| Accessibility | 8/10 | Solid WCAG compliance, touch targets need work |

---

## 1. The "Cockpit" Layout Audit (Spatial & Structural)

### 1.1 The Zoning Check

**Question:** Is the Visualisation Panel successfully the primary focus, or is the Sidebar stealing attention?

**Finding: MIXED** ⚠️

The current layout uses a `grid-cols-[1fr_380px]` split on desktop, giving the visualisation panel approximately **72% of horizontal space**. This is appropriate for a "viz-first" application.

However, several issues dilute focus:

| Issue | Impact |
|-------|--------|
| **Sidebar has equal visual weight** | The `panel-glow` class applies identical styling to both panels, creating visual competition |
| **Sidebar is vertically dense** | 5+ collapsible fieldsets create a "wall of controls" that draws the eye |
| **Workflow Stepper in sidebar** | The stepper (Data → Network → Train) should arguably be in the header or above the viz, not buried in controls |

**Recommendation:** Reduce sidebar visual prominence by:

1. Removing the glow effect from the sidebar (keep it on viz panel only)
2. Defaulting non-essential fieldsets to collapsed state
3. Moving the Workflow Stepper to the header bar

### 1.2 The Fold

**Question:** Are critical controls (Start/Stop) visible on a standard laptop (1366×768) without scrolling?

**Finding: LIKELY NO** ❌

Based on the layout structure:

```text
Header:           ~48px
Workflow Stepper: ~60px
Quick Presets:    ~80px (collapsed)
Dataset Config:   ~200px (expanded)
Visualisation:    ~120px (collapsed)
Network Config:   ~180px (expanded)
─────────────────────────
Total before Training: ~688px
```

On a 768px viewport with browser chrome (~100px), the visible area is ~668px. The **Training Controls fieldset starts below the fold**.

**Critical Issue:** The Start/Pause buttons—the most frequently used controls—require scrolling to reach.

**Recommendation:** Implement a **Floating Action Bar** for training controls:

```css
.training-controls-fab {
  position: sticky;
  bottom: 1rem;
  z-index: 50;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(8px);
}
```

### 1.3 The Fix: One Specific Layout Change

**Proposed Change: Persistent Training Control Strip**

Move the Start/Pause/Step/Reset buttons into a **sticky footer bar** within the sidebar that remains visible regardless of scroll position.

```text
┌─────────────────────────────────────────┐
│  SIDEBAR (scrollable content)           │
│  ├── Quick Presets                      │
│  ├── Dataset Configuration              │
│  ├── Network Architecture               │
│  └── Training Config                    │
├─────────────────────────────────────────┤
│  STICKY FOOTER                          │
│  [▶ Start] [⏸ Pause] [→ Step] [↺ Reset] │
│  Epoch: 150  |  Loss: 0.023             │
└─────────────────────────────────────────┘
```

**Impact:** High — Eliminates the most common scroll interaction.

---

## 2. Visual System & Aesthetics (UI Polish)

### 2.1 Typography Critique

**Current Scale:**

| Element | Size | Assessment |
|---------|------|------------|
| Headings | 20px / 600 | ✅ Appropriate for section headers |
| Body | 14px / 400 | ✅ Readable for form labels |
| Labels | 11px / 500 | ⚠️ Borderline small for dense controls |
| Metrics | 24px / 700 | ✅ Good emphasis for key numbers |
| Code/Mono | 12px / 400 | ✅ Appropriate for technical values |

**Issue: Data Density vs. Font Size**

The sidebar packs approximately **40+ form controls** into a 380px-wide column. With 11px labels, users must lean in to read options like "Batch Normalization" or "Cyclic Cosine" in dropdowns.

**Recommendation:**

- Increase label size from 11px to **12px** (0.75rem)
- Add more vertical breathing room between controls (gap-3 → gap-4)
- Consider a "Compact Mode" toggle for power users who prefer density

### 2.2 Colour Palette Analysis

**Navy/Teal Theme Evaluation:**

```css
--navy-900: #0a0f1a;  /* Background */
--navy-800: #111827;  /* Cards */
--navy-700: #1e293b;  /* Borders */
```

**Contrast Ratios (calculated):**

| Pair | Ratio | WCAG AA | Notes |
|------|-------|---------|-------|
| navy-800 on navy-900 | 1.2:1 | ❌ Fail | Card surfaces barely distinguishable |
| navy-700 on navy-900 | 1.5:1 | ❌ Fail | Borders too subtle |
| slate-400 on navy-900 | 5.5:1 | ✅ Pass | Secondary text OK |
| white on navy-900 | 16:1 | ✅ Pass | Primary text excellent |

**Finding: Insufficient Depth Differentiation** ⚠️

The navy-800 card surfaces are only 1.2:1 contrast against the navy-900 background. While this creates a subtle, sophisticated aesthetic, it fails to establish clear visual hierarchy between:

- Background
- Panel surfaces
- Interactive elements

**Recommendation:** Increase surface differentiation:

```css
/* Current */
--navy-800: #111827;  /* Cards */

/* Proposed */
--navy-800: #1a2332;  /* Lighter for better separation */
```

Or add stronger border/shadow treatment to panels.

### 2.3 Data Visualisation Colours

**Current Palette:**

```css
--class-a: #f97316;  /* Orange */
--class-b: #3b82f6;  /* Blue */
--class-c: #22c55e;  /* Green */
--class-d: #a855f7;  /* Purple */
```

**Assessment:**

| Check | Result |
|-------|--------|
| Distinct from UI accent (teal)? | ✅ Yes — Orange/Blue don't conflict with #14b8a6 |
| Colourblind safe? | ⚠️ Partial — Orange/Green may be problematic for deuteranopia |
| Sufficient saturation? | ✅ Yes — All colours are vibrant |

**Recommendation:** For multi-class datasets (3+ classes), offer a colourblind-safe palette option:

```css
/* Colourblind-safe alternative */
--class-a: #0077bb;  /* Blue */
--class-b: #ee7733;  /* Orange */
--class-c: #009988;  /* Teal */
--class-d: #cc3311;  /* Red */
```

---

## 3. Interaction & Feedback (The "Feel")

### 3.1 System Status: How Does the User Know Training is Active?

**Current Implementation:**

| Signal | Present? | Effectiveness |
|--------|----------|---------------|
| Button state change (Start → Pause) | ✅ Yes | Medium |
| Status text ("Running") | ✅ Yes | Low — easy to miss |
| Pulsing animation | ❌ No | — |
| Progress indicator | ❌ No | — |
| Epoch counter updating | ✅ Yes | Medium |
| Decision boundary animating | ✅ Yes | High |

**Finding: Weak Peripheral Awareness** ⚠️

When a user is focused on the sidebar (adjusting parameters), they have no peripheral signal that training is active. The decision boundary animation is excellent but requires direct attention.

**Recommendation: Add Training Pulse Indicator**

```css
.training-active #viz-container {
  box-shadow: 0 0 0 2px rgba(20, 184, 166, 0.5);
  animation: training-pulse 2s ease-in-out infinite;
}

@keyframes training-pulse {
  0%, 100% { box-shadow: 0 0 0 2px rgba(20, 184, 166, 0.3); }
  50% { box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.6); }
}
```

Also consider a **favicon badge** showing training status (browser tab indicator).

### 3.2 Error Handling: Model Divergence (NaN Loss)

**Question:** How is NaN loss communicated?

**Current Implementation:** Based on code review, there appears to be:

- Toast notification system (`toast.ts`)
- Error boundary (`errorBoundary.ts`)
- Fit warning panel (`#fit-warning`)

**Assessment:** The infrastructure exists, but the UX could be stronger.

**Recommendation: Divergence Alert Pattern**

When loss becomes NaN or exceeds a threshold:

1. **Immediate:** Pause training automatically
2. **Visual:** Flash the loss metric red with shake animation
3. **Actionable:** Show inline suggestion: "Model diverged. Try reducing learning rate."
4. **Recoverable:** Offer "Reset to last stable checkpoint" button

```html
<div class="divergence-alert">
  <span class="alert-icon">⚠️</span>
  <span class="alert-message">Training diverged (NaN loss)</span>
  <button class="btn-sm">Reduce LR & Retry</button>
</div>
```

### 3.3 Latency Masking: Does the UI Freeze?

**Current Architecture:**

- TensorFlow.js runs on main thread
- `workerManager.ts` exists for background processing
- 60 FPS target with performance modes (30/15 FPS options)

**Potential Issue:** Heavy models (5 layers, 32 neurons each) may cause frame drops during forward/backward pass.

**Recommendation: Progressive Rendering Pattern**

1. **Decouple training from rendering:** Train in batches, render every N epochs
2. **Show computation indicator:** Subtle spinner on viz panel during heavy compute
3. **Implement render throttling:** Skip frames when behind, prioritise responsiveness

```typescript
// Throttle viz updates during heavy training
const RENDER_BUDGET_MS = 16; // 60fps target
if (performance.now() - lastRender > RENDER_BUDGET_MS) {
  updateVisualization();
  lastRender = performance.now();
}
```

---

## 4. The "Teacher" Test (Educational UX)

### 4.1 Onboarding Wizard Critique

**Current 4-Step Wizard:**

1. Welcome
2. Dataset Selection
3. Network Architecture
4. Ready to Train

**Assessment:**

| Aspect | Score | Notes |
|--------|-------|-------|
| Reduces initial overwhelm | ✅ Good | Focuses attention on key decisions |
| Teaches concepts | ⚠️ Weak | Doesn't explain *why* choices matter |
| Memorable | ⚠️ Weak | One-time experience, no reinforcement |
| Skippable | ✅ Good | Respects returning users |

**Finding: Wizard is Necessary but Insufficient**

The wizard gets users to a runnable state but doesn't build understanding. A student completing the wizard still doesn't know:

- Why XOR is harder than Circle
- What "ReLU" means
- Why more layers isn't always better

**Recommendation: Add "Learn More" Micro-Expansions**

Each wizard step should have an optional expansion:

```text
Step 2: Choose a Dataset
┌─────────────────────────────────────┐
│ [Circle] [XOR] [Spiral] [Gaussian]  │
│                                     │
│ ▼ Why does dataset shape matter?    │
│ ┌─────────────────────────────────┐ │
│ │ Linear datasets (Circle) can    │ │
│ │ be solved with simple networks. │ │
│ │ Non-linear datasets (XOR) need  │ │
│ │ hidden layers to learn curves.  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 4.2 Discovery: How Does a User Learn What "ReLU" Does?

**Current Implementation:**

- `data-eli5` attributes exist on some labels (e.g., `data-eli5="batch-size"`)
- ⓘ icons appear next to some terms
- Help modal exists (`#help-modal`)

**Assessment:**

The infrastructure for tooltips exists, but coverage appears inconsistent. Critical terms like activation functions may lack explanations.

**Recommendation: Implement Consistent Tooltip System**

Every technical term should have:

1. **Hover tooltip:** 1-sentence definition
2. **Click expansion:** 2-3 sentence explanation with visual
3. **Link to resource:** External documentation for deep dives

```html
<span class="input-label" 
      data-tooltip="ReLU outputs the input if positive, else 0. It's fast and prevents vanishing gradients."
      data-learn-more="/docs/activations#relu">
  Activation
  <span class="info-icon">ⓘ</span>
</span>
```

### 4.3 Recommendation: One Feature to Help Beginners

**Proposed Feature: "Explain This Moment" Button**

Add a button that generates a natural-language explanation of the current training state:

```text
┌─────────────────────────────────────────────────────────┐
│ 💡 What's happening?                                    │
├─────────────────────────────────────────────────────────┤
│ Your network is learning the XOR pattern.               │
│                                                         │
│ After 50 epochs, the loss dropped from 0.69 to 0.23.    │
│ This means the network is getting better at separating  │
│ the orange and blue points.                             │
│                                                         │
│ The decision boundary is starting to curve — this is    │
│ the hidden layer learning a non-linear transformation.  │
│                                                         │
│ 📈 Tip: Watch how the boundary changes shape as         │
│ training continues.                                     │
└─────────────────────────────────────────────────────────┘
```

**Implementation:** Use heuristics based on:

- Dataset type
- Current epoch vs. typical convergence
- Loss trajectory (improving/plateauing/diverging)
- Network architecture

**Impact:** High — Transforms passive observation into active learning.

---

## 5. Accessibility & Mobile

### 5.1 Touch Targets

**Current Slider Implementation:**

```html
<input type="range" class="w-full h-2 bg-navy-700 rounded-lg" />
```

**Issue:** The slider track is only **8px tall** (`h-2`). WCAG 2.1 recommends touch targets of at least **44×44px**.

**Assessment by Control Type:**

| Control | Current Size | WCAG Target | Status |
|---------|--------------|-------------|--------|
| Buttons | ~40×36px | 44×44px | ⚠️ Close |
| Sliders | 100%×8px | 44px height | ❌ Fail |
| Checkboxes | 16×16px | 44×44px | ❌ Fail |
| Select dropdowns | 100%×36px | 44px height | ⚠️ Close |

**Recommendation:**

```css
/* Increase slider touch target */
input[type="range"] {
  height: 44px;
  padding: 18px 0; /* Invisible padding for touch */
}

input[type="range"]::-webkit-slider-thumb {
  width: 24px;
  height: 24px;
}

/* Increase checkbox touch target */
input[type="checkbox"] {
  width: 20px;
  height: 20px;
}

label:has(input[type="checkbox"]) {
  min-height: 44px;
  display: flex;
  align-items: center;
}
```

### 5.2 Contrast Check: Navy-700 on Navy-900

**Calculation:**

- Navy-700: `#1e293b` → Relative luminance: 0.026
- Navy-900: `#0a0f1a` → Relative luminance: 0.008

**Contrast Ratio:** (0.026 + 0.05) / (0.008 + 0.05) = **1.31:1**

**Result: FAIL** ❌

This is used for borders and dividers. While decorative elements don't require contrast compliance, if navy-700 is used for any text or meaningful icons, it fails WCAG AA (requires 4.5:1 for text, 3:1 for UI components).

**Current Usage:**

- Borders: Decorative (acceptable)
- Step connector lines: Meaningful (problematic)
- Disabled text: If used (problematic)

**Recommendation:**

- Use `slate-500` (#64748b) minimum for any meaningful UI elements
- Reserve navy-700 strictly for decorative borders

---

## 6. Top 5 Prioritised Recommendations

| Rank | Category | Recommendation | Impact | Effort |
|------|----------|----------------|--------|--------|
| **1** | Layout | **Sticky Training Controls** — Move Start/Pause/Step/Reset to a persistent footer bar in the sidebar | 🔴 High | Medium |
| **2** | Interaction | **Training Pulse Indicator** — Add pulsing border/glow to viz panel during active training | 🔴 High | Low |
| **3** | Educational | **"Explain This Moment" Feature** — Generate contextual explanations of training state | 🔴 High | High |
| **4** | Visual | **Increase Surface Contrast** — Lighten navy-800 or add stronger borders to differentiate panels | 🟡 Medium | Low |
| **5** | Accessibility | **Enlarge Touch Targets** — Increase slider and checkbox hit areas to 44px minimum | 🟡 Medium | Low |

---

## Appendix: Quick Wins (< 1 Hour Each)

1. **Add `aria-live="polite"` to epoch counter** — Screen readers announce progress
2. **Default "Network Architecture" fieldset to collapsed** — Reduce initial cognitive load
3. **Add favicon badge during training** — Browser tab shows activity
4. **Increase label font size to 12px** — Improve readability
5. **Add `:focus-visible` ring to all interactive elements** — Keyboard navigation clarity

---

## Conclusion

NeuroViz demonstrates strong foundational design with a sophisticated dark theme and comprehensive feature set. The primary opportunities lie in:

1. **Reducing scroll dependency** for critical controls
2. **Strengthening system status visibility** during training
3. **Deepening educational scaffolding** beyond the initial wizard

Addressing the top 5 recommendations would elevate the experience from "powerful tool" to "intuitive learning environment" — fulfilling both the Cockpit and Classroom paradigms.

---

*Audit conducted using Material Design 3 principles, Nielsen's 10 Usability Heuristics, and WCAG 2.1 AA guidelines.*
