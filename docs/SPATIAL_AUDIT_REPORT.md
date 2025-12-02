# Spatial Audit Report: NeuroViz

**Audit Date:** 2 December 2025  
**Auditor:** Lead Information Architect & Spatial Designer, Google  
**Frameworks Applied:** F-Pattern/Z-Pattern, Material Layout, Gestalt Principles

---

## 1. The "Above the Fold" Assessment

### Desktop Viewport (1920×1080)

| Element | Position | Verdict |
|---------|----------|---------|
| Header + Branding | Top centre | ✓ Appropriate |
| Visualisation Panel | Left 60% | ✓ Prime real estate |
| Sidebar Controls | Right 40% | ⚠️ Competing for attention |
| Workflow Stepper | Top of sidebar | ✓ Good orientation |

**The Hook:**
The primary value proposition—the neural network visualisation canvas—occupies the correct position (left/centre, ~60% width). However, on first load with no data, users see an empty state rather than an immediate demonstration of capability. The "Quick Demo" CTA is present but buried within the empty canvas rather than being the dominant visual element.

**The CTA:**
The primary CTA ("Quick Demo" button) is positioned in the centre of the visualisation panel, which is geometrically correct. However, it competes with the sidebar's "Apply & Start Training" button, creating **CTA fragmentation**. Users face a choice paralysis: which button starts the experience?

### Verdict: CONDITIONAL PASS

The layout structure is sound, but the empty state fails to immediately demonstrate value. A first-time visitor sees a dark rectangle with a small button, not a compelling preview of what the tool can do.

**Recommendation:** Auto-load a demo dataset on first visit, or show an animated preview/GIF in the empty state.

---

## 2. Heatmap Prediction (Eye-Tracking Simulation)

Based on F-Pattern scanning behaviour for tool interfaces:

### Hot Zones (High Attention)

| Zone | Element | Is This Correct? |
|------|---------|------------------|
| **F1** (Top-left) | "NeuroViz" branding | ⚠️ Low-value content in prime spot |
| **F2** (Top-right) | Theme/Help/Fullscreen icons | ✓ Appropriate for utilities |
| **F3** (Centre-left) | Visualisation canvas | ✓ Correct—this is the product |
| **F4** (Upper sidebar) | Workflow stepper + tabs | ✓ Good orientation aids |

**Analysis:**

The F1 position (top-left) is occupied by empty space on desktop due to the centred header layout. This is **wasted prime real estate**. The eye naturally lands here first, but finds nothing actionable.

### Cold Zones (Low Attention)

| Zone | Element | Is Important Info Lost? |
|------|---------|------------------------|
| **Below fold** | Session Management, Research Tools | ✓ Appropriate—advanced features |
| **Right sidebar bottom** | Model Comparison, Ensemble | ⚠️ Potentially valuable features hidden |
| **Footer** | "Hexagonal Architecture Demo" | ✓ Correctly deprioritised |

**Critical Finding:**

The "Metrics" panel (Epoch, Loss, Accuracy) is positioned mid-sidebar, requiring scroll on smaller viewports. These are **high-value real-time feedback elements** that should be visible at all times during training.

---

## 3. Real Estate "Squatters" (Waste Identification)

### Squatter 1: The Header

**Current State:** 80-100px vertical height  
**Content:** Logo, tagline, 3 utility buttons  
**ROI:** Low—branding consumes 8-10% of viewport height

**The Fix:**

- Reduce header to 48-56px (single line)
- Move tagline to footer or remove entirely
- Consider a collapsible/minimal header during training

### Squatter 2: The Workflow Stepper

**Current State:** ~60px height, always visible  
**Content:** 3-step indicator (Data → Network → Train)  
**ROI:** Medium on first use, near-zero for returning users

**The Fix:**

- Make stepper collapsible after first session
- Or integrate into header as a compact breadcrumb
- Current implementation is 3× taller than necessary

### Squatter 3: Sidebar Tab Bar

**Current State:** ~44px height  
**Content:** 3 tabs (Setup, Train, Analyse)  
**ROI:** High—essential navigation

**The Fix:** None required. This is appropriately sized.

### Squatter 4: Empty State CTA Container

**Current State:** Entire visualisation panel (~420px height)  
**Content:** Icon, 2 lines of text, 1 button  
**ROI:** Extremely low—vast empty space

**The Fix:**
- Show a static preview image or animated demo
- Or auto-load sample data to demonstrate capability immediately

---

## 4. Gestalt & Grouping Check

### Principle: Common Region

| Grouping | Elements | Assessment |
|----------|----------|------------|
| **Quick Start** | Preset dropdown + Apply button + Bookmark buttons | ✓ Well-grouped in fieldset |
| **Dataset** | Type selector + Samples/Noise/Balance sliders + Fetch button | ✓ Logical grouping |
| **Training Controls** | Start/Pause/Step/Reset buttons | ✓ Excellent 2×2 grid |
| **Metrics** | Epoch/Loss/Accuracy hero row + secondary metrics | ✓ Clear visual hierarchy |

**Observation:** The tabbed interface creates strong common regions. Each tab content area is visually bounded, reducing cognitive load. This is a significant improvement over the previous flat list.

### Principle: Proximity

| Issue | Elements | Assessment |
|-------|----------|------------|
| **Separated siblings** | "Initialise Network" button is far from layer configuration | ⚠️ Action separated from inputs |
| **Orphaned controls** | "What-If Analysis" is nested inside Training fieldset | ⚠️ Conceptually belongs in Analyse tab |

**Recommendation:**
1. Move "Initialise Network" button directly below the layer/activation inputs
2. Relocate "What-If Analysis" to the Analyse tab

### Principle: Similarity

**Observation:** Button styles are now consistent (primary teal, secondary navy, danger red). Icon usage is uniform (Heroicons-style SVGs). This creates strong visual similarity for interactive elements.

**Issue:** The "Export / Import" dropdown button uses a different interaction pattern (dropdown) than other buttons (immediate action). Consider making this visually distinct.

---

## 5. Responsive Breakpoint Strategy

### Current Breakpoints

```css
/* Mobile-first approach */
grid-cols-1                    /* < 768px: Single column, stacked */
md:grid-cols-[1fr_340px]       /* ≥ 768px: 2-column, 340px sidebar */
lg:grid-cols-[1fr_380px]       /* ≥ 1024px: 2-column, 380px sidebar */
```

### Assessment by Viewport

| Viewport | Layout | Verdict |
|----------|--------|---------|
| **Mobile (<768px)** | Stacked: Viz on top, controls below | ⚠️ Problematic |
| **Tablet (768-1024px)** | 2-column, 340px sidebar | ✓ Functional |
| **Desktop (>1024px)** | 2-column, 380px sidebar | ✓ Optimal |

### Mobile Concerns

1. **Visualisation height:** Fixed at 320px on mobile. This may be too small for meaningful interaction with the decision boundary.

2. **Control access during training:** User must scroll past the visualisation to access Start/Pause buttons. This breaks the feedback loop—you can't watch training AND control it simultaneously.

3. **Thumb zone violations:** The sidebar tabs and workflow stepper are at the top of the scrollable area, outside the natural thumb zone (bottom 40% of screen).

### Recommendations

1. **Add a floating action button (FAB)** for Start/Pause on mobile, positioned bottom-right
2. **Increase mobile viz height** to 280-360px (currently 320px is acceptable)
3. **Consider a bottom sheet** for controls on mobile, allowing the visualisation to remain visible
4. **Sticky metrics bar:** Keep Epoch/Loss/Accuracy visible at all times during training

---

## 6. Grid Alignment Audit

### Current Grid System

The layout uses a **2-column asymmetric grid**:

- Left column: Fluid (1fr)
- Right column: Fixed (340-380px)

This is **not a 12-column Material grid**, but the asymmetry is appropriate for a tool interface where the canvas needs maximum space.

### Alignment Issues

| Element | Issue |
|---------|-------|
| Header | Centred content doesn't align with grid columns |
| Fieldset padding | Consistent 16px (1rem) internal padding ✓ |
| Button grid | 2×2 grid with 8px gap ✓ |
| Metric cards | 4-column grid, well-aligned ✓ |

### Gutter Consistency

- Main grid gap: 16-20px (consistent)
- Fieldset internal gap: 8-12px (consistent)
- Button gaps: 8px (consistent)

**Verdict:** Grid alignment is acceptable. The asymmetric layout is justified by the use case.

---

## 7. Spatial ROI Summary

| Screen Zone | Current Content | ROI | Recommendation |
|-------------|-----------------|-----|----------------|
| Top-left (F1) | Empty (centred header) | 0% | Add quick-action or status |
| Top-centre | Branding | 20% | Reduce height |
| Top-right | Utility icons | 60% | Appropriate |
| Centre-left | Visualisation | 90% | Optimal placement |
| Centre-right | Sidebar tabs + controls | 70% | Good structure |
| Below fold | Advanced features | 40% | Appropriate |

### Overall Spatial Efficiency Score: **72/100**

**Breakdown:**

- Layout structure: 85/100
- Above-fold value density: 65/100
- Mobile responsiveness: 60/100
- Gestalt grouping: 80/100

---

## 8. Priority Fixes

### Immediate (P0)

1. **Reduce header height** to 48-56px
2. **Add floating controls** on mobile for Start/Pause
3. **Make metrics sticky** during training

### Short-term (P1)

1. **Relocate "Initialise Network"** closer to layer inputs
2. **Move "What-If Analysis"** to Analyse tab
3. **Compress workflow stepper** to 40px or make collapsible

### Medium-term (P2)

1. **Auto-demo on first visit** — load sample data automatically
2. **Bottom sheet controls** for mobile
3. **Collapsible header** during active training

---

## 9. Closing Assessment

NeuroViz demonstrates competent spatial design for a technical tool. The 2-column asymmetric layout correctly prioritises the visualisation canvas, and the tabbed sidebar significantly reduces cognitive load compared to a flat control list.

However, the layout suffers from **vertical inefficiency**—the header, stepper, and empty state collectively consume ~200px of prime viewport space before the user sees any value. On a 768px tablet viewport, this represents 26% of the screen dedicated to orientation rather than functionality.

The mobile experience requires attention. A tool that visualises real-time training cannot afford to hide the controls below the fold. Consider a split-screen or floating control pattern for viewports under 768px.

**Final Verdict:** The bones are solid. Tighten the vertical rhythm, and this layout will sing.

---

*Report generated by Lead Information Architect & Spatial Designer, Google*  
*Frameworks: F-Pattern, Material Layout, Gestalt Principles*
