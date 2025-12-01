# NeuroViz UI Improvement Plan

## Overview

This document outlines the UI/UX improvements for NeuroViz, prioritised by impact and effort.

---

## Phase 1: Critical Fixes (High Impact, Low Effort)

### 1.1 Fix Chart Empty Space Around Axes

**Problem**: Empty space below X-axis and beside Y-axis wastes screen real estate.

**Root Cause**: SVG viewBox and margins not optimised; container aspect-ratio forces square shape.

**Solution**:
- Reduce SVG margins
- Remove forced aspect-ratio on container
- Let chart fill available space dynamically

**Files to modify**:
- `src/presentation/styles.css` - Remove `aspect-square`, adjust max-height
- `src/infrastructure/d3/D3Chart.ts` - Reduce margins, optimise viewBox

**Effort**: 1-2 hours

---

### 1.2 Sticky Training Controls

**Problem**: Users must scroll to find Start/Pause/Reset buttons.

**Solution**: Make training controls sticky at top of sidebar.

**Files to modify**:
- `index.html` - Restructure training fieldset
- `src/presentation/styles.css` - Add sticky positioning

**Effort**: 1 hour

---

### 1.3 Collapsible Sections

**Problem**: 15+ fieldsets create 3000px+ scroll.

**Solution**: Make fieldsets collapsible with localStorage persistence.

**Files to modify**:
- `index.html` - Add collapse toggles to legends
- `src/presentation/styles.css` - Add collapse animations
- `src/main.ts` - Add toggle handlers

**Effort**: 2-3 hours

---

## Phase 2: Visual Hierarchy (Medium Impact, Medium Effort)

### 2.1 Section Grouping with Tabs

**Problem**: All sections have equal visual weight.

**Solution**: Group into 4 tabs: Data | Model | Training | Analysis

**Structure**:
```
Tab: Data
  - Quick Start (presets)
  - Dataset
  - Visualization

Tab: Model  
  - Hyperparameters
  - Training Config

Tab: Training
  - Training Controls (always visible)
  - Metrics
  - Training History

Tab: Analysis
  - Classification Metrics
  - Research Tools
  - Session Management
```

**Effort**: 4-6 hours

---

### 2.2 Improved Metrics Display

**Problem**: Dense 4-column grid is hard to scan.

**Solution**: Hero metrics with clear visual hierarchy.

**Effort**: 2 hours

---

### 2.3 Button Size & Touch Targets

**Problem**: Many buttons < 44px touch target.

**Solution**: Minimum 44px height, clearer spacing.

**Effort**: 1-2 hours

---

## Phase 3: Polish & Feedback (Lower Priority)

### 3.1 Loading States & Skeletons
### 3.2 Empty State Messages
### 3.3 Floating Action Bar (optional)
### 3.4 Micro-animations

---

## Implementation Order

| Sprint | Task | Priority | Effort | Status |
|--------|------|----------|--------|--------|
| 1 | Fix chart empty space | 🔴 Critical | 2h | ✅ Done |
| 1 | Sticky training controls | 🔴 Critical | 1h | ✅ Done |
| 1 | Collapsible sections | 🔴 Critical | 3h | ✅ Done |
| 2 | Tab-based navigation | 🟠 High | 5h | ⬜ Future |
| 2 | Improved metrics display | 🟠 High | 2h | ✅ Done |
| 2 | Button sizing fixes | 🟠 High | 2h | ✅ Done |
| 2 | Section icons | 🟠 High | 1h | ✅ Done |
| 3 | Loading states | 🟢 Medium | 2h | ✅ Done |
| 3 | Empty states | 🟢 Medium | 1h | ✅ Done |
| 3 | Micro-animations | 🟢 Low | 2h | ⬜ Future |

---

## Technical Details

### Chart Empty Space Fix

Current CSS:
```css
#viz-container {
  @apply w-full aspect-square;
  @apply max-h-[300px] sm:max-h-[400px] md:max-h-[500px] lg:max-h-[600px];
}
```

Proposed CSS:
```css
#viz-container {
  @apply w-full;
  @apply h-[280px] sm:h-[380px] md:h-[480px] lg:h-[580px];
}
```

Current D3 margins:
```typescript
const margin = { top: 20, right: 20, bottom: 40, left: 50 };
```

Proposed D3 margins:
```typescript
const margin = { top: 10, right: 10, bottom: 30, left: 35 };
```

### Collapsible Sections

HTML pattern:
```html
<fieldset class="control-fieldset" data-section="dataset">
  <legend class="control-legend collapsible" data-collapsed="false">
    <span>Dataset</span>
    <svg class="collapse-icon">...</svg>
  </legend>
  <div class="section-content">
    <!-- Content -->
  </div>
</fieldset>
```

CSS:
```css
.section-content {
  overflow: hidden;
  transition: max-height 0.3s ease-out, opacity 0.2s ease-out;
}

.section-content.collapsed {
  max-height: 0;
  opacity: 0;
  padding: 0;
  margin: 0;
}

.collapse-icon {
  transition: transform 0.2s ease-out;
}

.collapsed .collapse-icon {
  transform: rotate(-90deg);
}
```

### Sticky Training Controls

```css
.training-controls-sticky {
  position: sticky;
  top: 0;
  z-index: 20;
  margin: -1rem -1rem 1rem -1rem;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(51, 65, 85, 0.5);
}
```

---

## Success Metrics

- [ ] Chart fills available space without empty margins
- [ ] Training controls visible without scrolling
- [ ] Sidebar scroll reduced by 50%+
- [ ] All buttons meet 44px touch target
- [ ] Section state persists across page loads
