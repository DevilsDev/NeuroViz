/**
 * Rule-of-thumb overfitting risk for a model before it is trained: how many
 * trainable parameters it has compared with the number of training points,
 * adjusted for label noise and for regularisation that is switched on.
 */

export type RiskLevel = 'low' | 'moderate' | 'high';

export interface OverfittingRiskInput {
  /** Trainable weights and biases */
  readonly parameters: number;
  /** Points the model is fitted on (validation points excluded) */
  readonly trainingPoints: number;
  /** Dataset noise, 0–1 */
  readonly noise?: number;
  readonly l1?: number;
  readonly l2?: number;
  readonly dropout?: number;
}

export interface OverfittingRisk {
  readonly level: RiskLevel;
  /** Position on the Low→High meter, 0–1 */
  readonly score: number;
  /** Parameters per training point */
  readonly ratio: number;
  readonly regularised: boolean;
  readonly explanation: string;
  readonly suggestion: string;
}

/** Ratios below MODERATE_AT are low risk; at or above HIGH_AT they are high. */
export const MODERATE_AT = 0.5;
export const HIGH_AT = 2;
/** Noise above this makes memorising mislabelled points a real danger */
const NOISY_AT = 0.3;
/** Noise and regularisation each move the risk by one band (the bands are 4× wide) */
const BAND_FACTOR = HIGH_AT / MODERATE_AT;

export function assessOverfittingRisk(input: OverfittingRiskInput): OverfittingRisk {
  const points = Math.max(1, input.trainingPoints);
  const ratio = input.parameters / points;
  const regularised = (input.l1 ?? 0) > 0 || (input.l2 ?? 0) > 0 || (input.dropout ?? 0) > 0;
  const noisy = (input.noise ?? 0) > NOISY_AT;

  // One effective ratio drives both the level and the meter, so the fill
  // always sits inside the band its label names
  const effective = ratio * (noisy ? BAND_FACTOR : 1) / (regularised ? BAND_FACTOR : 1);
  const level: RiskLevel = effective >= HIGH_AT ? 'high' : effective >= MODERATE_AT ? 'moderate' : 'low';

  // Log scale: Low, Moderate and High each get a third of the meter
  const low = Math.log10(MODERATE_AT / BAND_FACTOR);
  const high = Math.log10(HIGH_AT * BAND_FACTOR);
  const score = Math.max(0, Math.min(1, (Math.log10(Math.max(effective, 1e-6)) - low) / (high - low)));

  const explanation =
    ratio >= 1
      ? `More parameters than training points, so the model can memorise individual points${noisy ? ', including noisy ones' : ''}.`
      : ratio >= MODERATE_AT
        ? `Roughly one parameter for every ${Math.max(1, Math.round(1 / ratio))} training points: enough capacity to start fitting noise.`
        : `About ${Math.round(1 / Math.max(ratio, 1e-6))} training points per parameter: enough data that this model is unlikely to memorise it.`;

  const suggestion =
    level === 'high'
      ? regularised
        ? 'Use fewer neurons, add more data or stop training early when validation loss rises.'
        : 'Turn on L2 (try 0.001) or 20% dropout above, or use fewer neurons.'
      : level === 'moderate'
        ? regularised
          ? 'Regularisation is on. Watch the validation curve as it trains.'
          : 'Watch the validation curve. If it starts rising, add L2 or dropout above.'
        : 'Overfitting is unlikely with this much data.';

  return { level, score, ratio, regularised, explanation, suggestion };
}
