// Feature Importance
export { calculateFeatureImportance, formatFeatureImportanceHTML } from './FeatureImportance';
export type { FeatureImportanceResult, FeatureImportanceConfig } from './FeatureImportance';

// LIME Explanations
export { explainPrediction, formatLIMEExplanationHTML } from './LIMEExplainer';
export type { LIMEExplanation, FeatureContribution, LIMEConfig } from './LIMEExplainer';

// Saliency Maps
export { computeSaliencyMap, saliencyToColors, formatSaliencyStatsHTML } from './SaliencyMaps';
export type { SaliencyResult, SaliencyCell, SaliencyConfig } from './SaliencyMaps';

// Adversarial Examples
export { generateAdversarialFGSM, generateAdversarialBatch, calculateRobustnessMetrics, formatAdversarialResultHTML } from './AdversarialExamples';
export type { AdversarialResult, FGSMConfig } from './AdversarialExamples';

// Bayesian Neural Networks
export { estimateUncertainty, computeUncertaintyMap, formatUncertaintyHTML } from './BayesianNN';
export type { UncertaintyResult, UncertaintyMapResult, UncertaintyCell, MCDropoutConfig } from './BayesianNN';

// Neural Architecture Search
export { runNAS, formatNASResultHTML } from './NeuralArchitectureSearch';
export type { ArchitectureCandidate, ArchitectureResult, NASConfig, NASResult } from './NeuralArchitectureSearch';
