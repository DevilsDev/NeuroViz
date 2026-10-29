import { MULTI_CLASS_COLOURS, COLOUR_PALETTES, type ColourScheme } from '../../core/domain';

/**
 * What the decision-boundary plot is currently showing, used to build its legend.
 */
export interface PlotLegendState {
  /** Class labels present in the rendered data, ascending */
  classes: number[];
  /** Whether any rendered point belongs to the validation split */
  hasValidation: boolean;
  /** Whether misclassified points are currently highlighted */
  showMisclassified: boolean;
  /** Whether a binary confidence boundary is rendered (shows the gradient key) */
  binaryBoundary: boolean;
  colourScheme: ColourScheme;
}

export const EMPTY_LEGEND_STATE: PlotLegendState = {
  classes: [],
  hasValidation: false,
  showMisclassified: false,
  binaryBoundary: false,
  colourScheme: 'default',
};

function item(swatch: HTMLElement, label: string): HTMLElement {
  const el = document.createElement('span');
  el.className = 'viz-legend-item';
  swatch.setAttribute('aria-hidden', 'true');
  el.append(swatch, document.createTextNode(label));
  return el;
}

function dot(className: string, colour?: string): HTMLElement {
  const el = document.createElement('span');
  el.className = `viz-legend-swatch ${className}`;
  if (colour) el.style.background = colour;
  return el;
}

/**
 * Renders the plot legend into `container` using DOM APIs (no innerHTML).
 * Hidden entirely when there is nothing to explain yet.
 */
export function renderPlotLegend(container: HTMLElement, state: PlotLegendState): void {
  container.replaceChildren();
  container.hidden = state.classes.length === 0;
  if (container.hidden) return;

  for (const label of state.classes) {
    const colour = MULTI_CLASS_COLOURS[label % MULTI_CLASS_COLOURS.length] ?? '#888888';
    container.append(item(dot('viz-legend-dot', colour), `Class ${label}`));
  }
  if (state.hasValidation) {
    container.append(item(dot('viz-legend-validation'), 'Validation point'));
  }
  if (state.showMisclassified) {
    container.append(item(dot('viz-legend-misclassified'), 'Misclassified'));
  }
  if (state.binaryBoundary) {
    const palette = COLOUR_PALETTES[state.colourScheme];
    const gradient = document.createElement('span');
    gradient.className = 'viz-legend-gradient';
    gradient.style.background = `linear-gradient(90deg, ${palette.low}, #f5f5f5 50%, ${palette.high})`;
    container.append(item(gradient, 'Model confidence (class 0 ↔ class 1)'));
  }
}
