export type { Point } from './Point';
export type { Prediction } from './Prediction';
export type {
  Hyperparameters,
  TrainingConfig,
  OptimizerType,
  ActivationType,
  LRScheduleType,
  LRScheduleConfig,
  LossType,
} from './Hyperparameters';
export {
  DEFAULT_HYPERPARAMETERS,
  DEFAULT_TRAINING_CONFIG,
  DEFAULT_LR_SCHEDULE,
} from './Hyperparameters';

// Model complexity
export type {
  ModelComplexityMetrics,
  LayerComplexity,
} from './ModelComplexity';
export {
  calculateModelComplexity,
  formatBytes,
  formatNumber,
  getComplexityRating,
  getComplexityExplanation,
} from './ModelComplexity';

// Adversarial examples
export type {
  AdversarialExample,
  AdversarialConfig,
  AdversarialGenerationResult,
} from './AdversarialExample';
export {
  DEFAULT_ADVERSARIAL_CONFIG,
  generateAdversarialExplanation,
  pointDistance,
  perturbPoint,
  findBoundaryPoints,
  generateSimpleAdversarial,
} from './AdversarialExample';
export type {
  TrainingRecord,
  TrainingHistory,
  ExportFormat,
} from './TrainingHistory';
export {
  createEmptyHistory,
  addHistoryRecord,
  exportHistory,
} from './TrainingHistory';
export type {
  VisualizationConfig,
  ColourScheme,
} from './VisualizationConfig';
export {
  DEFAULT_VISUALIZATION_CONFIG,
  COLOUR_PALETTES,
  MULTI_CLASS_COLOURS,
} from './VisualizationConfig';

// Education domain types
export type {
  Tutorial,
  TutorialStep,
  TutorialProgress,
  TutorialCompletion,
  TutorialAction,
  HighlightPosition,
} from './Tutorial';
export {
  TUTORIALS,
  getTutorial,
  getTutorialsByCategory,
  getTutorialsByDifficulty,
} from './Tutorial';

export type {
  TooltipDefinition,
  TooltipCategory,
} from './Tooltip';
export {
  TOOLTIP_REGISTRY,
  getAllTooltips,
  getTooltipForTarget,
  getTooltipsByCategory,
  hasTooltip,
} from './Tooltip';

export type {
  Challenge,
  ChallengeConstraint,
  ChallengeGoal,
  ChallengeDifficulty,
  ChallengeCompletion,
  ChallengeValidationResult,
  LeaderboardEntry,
} from './Challenge';
export {
  CHALLENGES,
  getChallenge,
  getChallengesByDifficulty,
  getChallengesByCategory,
  validateChallenge,
  calculateChallengeScore,
} from './Challenge';
