// Feature Importance
export { calculateFeatureImportance, formatFeatureImportanceHTML } from './FeatureImportance';
export type { FeatureImportanceResult, FeatureImportanceConfig } from './FeatureImportance';

// Adversarial Examples
export { generateAdversarialFGSM, generateAdversarialBatch, calculateRobustnessMetrics, formatAdversarialResultHTML } from './AdversarialExamples';
export type { AdversarialResult, FGSMConfig } from './AdversarialExamples';

// NOTE: The following modules have been moved to src/experimental/research/
// as they are not currently wired into the application:
// - LIMEExplainer (Local Interpretable Model-agnostic Explanations)
// - SaliencyMaps (Gradient-based visualization)
// - BayesianNN (MC Dropout uncertainty estimation)
// - NeuralArchitectureSearch (Automated architecture optimization)
