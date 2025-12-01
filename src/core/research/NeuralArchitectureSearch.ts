/**
 * Neural Architecture Search (NAS)
 * 
 * Implements a simple random search and evolutionary approach
 * to find optimal network architectures for a given dataset.
 */

import type { Point, Hyperparameters, ActivationType, OptimizerType } from '../domain';
import type { INeuralNetworkService } from '../ports';

export interface ArchitectureCandidate {
  /** Unique ID */
  id: string;
  /** Layer configuration */
  layers: number[];
  /** Activation function */
  activation: ActivationType;
  /** Optimizer */
  optimizer: OptimizerType;
  /** Learning rate */
  learningRate: number;
  /** Dropout rate */
  dropoutRate: number;
  /** L2 regularization */
  l2Regularization: number;
}

export interface ArchitectureResult {
  /** The architecture */
  architecture: ArchitectureCandidate;
  /** Final accuracy */
  accuracy: number;
  /** Final loss */
  loss: number;
  /** Training time (ms) */
  trainingTime: number;
  /** Number of parameters */
  numParameters: number;
  /** Epochs trained */
  epochsTrained: number;
}

export interface NASConfig {
  /** Number of architectures to try */
  numCandidates: number;
  /** Epochs to train each candidate */
  epochsPerCandidate: number;
  /** Search strategy */
  strategy: 'random' | 'evolutionary' | 'grid';
  /** Population size for evolutionary search */
  populationSize: number;
  /** Mutation rate for evolutionary search */
  mutationRate: number;
}

export interface NASResult {
  /** Best architecture found */
  best: ArchitectureResult;
  /** All evaluated architectures */
  history: ArchitectureResult[];
  /** Search configuration */
  config: NASConfig;
  /** Total search time (ms) */
  totalTime: number;
}

// Search space bounds
const SEARCH_SPACE = {
  minLayers: 1,
  maxLayers: 4,
  minNeurons: 2,
  maxNeurons: 32,
  learningRates: [0.001, 0.003, 0.01, 0.03, 0.1],
  activations: ['relu', 'tanh', 'sigmoid'] as ActivationType[],
  optimizers: ['adam', 'sgd', 'rmsprop'] as OptimizerType[],
  dropoutRates: [0, 0.1, 0.2, 0.3],
  l2Values: [0, 0.001, 0.01],
};

/**
 * Runs neural architecture search.
 */
export async function runNAS(
  createModel: () => INeuralNetworkService,
  trainingData: Point[],
  validationData: Point[],
  config: NASConfig = {
    numCandidates: 20,
    epochsPerCandidate: 30,
    strategy: 'random',
    populationSize: 10,
    mutationRate: 0.3,
  },
  onProgress?: (current: number, total: number, best: ArchitectureResult | null) => void
): Promise<NASResult> {
  const startTime = Date.now();
  const history: ArchitectureResult[] = [];
  let best: ArchitectureResult | null = null;

  switch (config.strategy) {
    case 'random':
      await runRandomSearch(createModel, trainingData, validationData, config, history, (current, result) => {
        if (!best || result.accuracy > best.accuracy) {
          best = result;
        }
        onProgress?.(current, config.numCandidates, best);
      });
      break;

    case 'evolutionary':
      await runEvolutionarySearch(createModel, trainingData, validationData, config, history, (current, result) => {
        if (!best || result.accuracy > best.accuracy) {
          best = result;
        }
        onProgress?.(current, config.numCandidates, best);
      });
      break;

    case 'grid':
      await runGridSearch(createModel, trainingData, validationData, config, history, (current, result) => {
        if (!best || result.accuracy > best.accuracy) {
          best = result;
        }
        onProgress?.(current, config.numCandidates, best);
      });
      break;
  }

  if (!best && history.length > 0) {
    best = history.reduce((a, b) => a.accuracy > b.accuracy ? a : b);
  }

  return {
    best: best!,
    history,
    config,
    totalTime: Date.now() - startTime,
  };
}

/**
 * Random search strategy.
 */
async function runRandomSearch(
  createModel: () => INeuralNetworkService,
  trainingData: Point[],
  validationData: Point[],
  config: NASConfig,
  history: ArchitectureResult[],
  onResult: (current: number, result: ArchitectureResult) => void
): Promise<void> {
  for (let i = 0; i < config.numCandidates; i++) {
    const candidate = generateRandomArchitecture();
    const result = await evaluateArchitecture(createModel, candidate, trainingData, validationData, config.epochsPerCandidate);
    history.push(result);
    onResult(i + 1, result);
  }
}

/**
 * Evolutionary search strategy.
 */
async function runEvolutionarySearch(
  createModel: () => INeuralNetworkService,
  trainingData: Point[],
  validationData: Point[],
  config: NASConfig,
  history: ArchitectureResult[],
  onResult: (current: number, result: ArchitectureResult) => void
): Promise<void> {
  // Initialize population
  let population: ArchitectureResult[] = [];
  
  for (let i = 0; i < config.populationSize; i++) {
    const candidate = generateRandomArchitecture();
    const result = await evaluateArchitecture(createModel, candidate, trainingData, validationData, config.epochsPerCandidate);
    population.push(result);
    history.push(result);
    onResult(history.length, result);
  }

  // Evolve
  const generations = Math.floor((config.numCandidates - config.populationSize) / 2);
  
  for (let gen = 0; gen < generations; gen++) {
    // Sort by fitness (accuracy)
    population.sort((a, b) => b.accuracy - a.accuracy);

    // Select top half as parents
    const parents = population.slice(0, Math.ceil(population.length / 2));

    // Generate offspring
    const offspring: ArchitectureResult[] = [];
    
    for (let i = 0; i < 2; i++) {
      // Select two parents
      const parent1 = parents[Math.floor(Math.random() * parents.length)]!;
      const parent2 = parents[Math.floor(Math.random() * parents.length)]!;

      // Crossover and mutate
      const childArch = crossover(parent1.architecture, parent2.architecture);
      const mutatedArch = mutate(childArch, config.mutationRate);

      const result = await evaluateArchitecture(createModel, mutatedArch, trainingData, validationData, config.epochsPerCandidate);
      offspring.push(result);
      history.push(result);
      onResult(history.length, result);
    }

    // Replace worst with offspring
    population = [...parents, ...offspring].sort((a, b) => b.accuracy - a.accuracy).slice(0, config.populationSize);
  }
}

/**
 * Grid search strategy (simplified).
 */
async function runGridSearch(
  createModel: () => INeuralNetworkService,
  trainingData: Point[],
  validationData: Point[],
  config: NASConfig,
  history: ArchitectureResult[],
  onResult: (current: number, result: ArchitectureResult) => void
): Promise<void> {
  // Simplified grid: try different layer configs
  const layerConfigs = [
    [4],
    [8],
    [8, 4],
    [16, 8],
    [16, 8, 4],
  ];

  let count = 0;
  for (const layers of layerConfigs) {
    for (const lr of [0.01, 0.03, 0.1]) {
      for (const activation of ['relu', 'tanh'] as ActivationType[]) {
        if (count >= config.numCandidates) return;

        const candidate: ArchitectureCandidate = {
          id: `grid-${count}`,
          layers,
          activation,
          optimizer: 'adam',
          learningRate: lr,
          dropoutRate: 0,
          l2Regularization: 0,
        };

        const result = await evaluateArchitecture(createModel, candidate, trainingData, validationData, config.epochsPerCandidate);
        history.push(result);
        count++;
        onResult(count, result);
      }
    }
  }
}

/**
 * Generates a random architecture.
 */
function generateRandomArchitecture(): ArchitectureCandidate {
  const numLayers = randomInt(SEARCH_SPACE.minLayers, SEARCH_SPACE.maxLayers);
  const layers: number[] = [];
  
  for (let i = 0; i < numLayers; i++) {
    // Layers typically decrease in size
    const maxNeurons = i === 0 ? SEARCH_SPACE.maxNeurons : (layers[i - 1] ?? SEARCH_SPACE.maxNeurons);
    layers.push(randomInt(SEARCH_SPACE.minNeurons, maxNeurons));
  }

  return {
    id: `random-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    layers,
    activation: randomChoice(SEARCH_SPACE.activations),
    optimizer: randomChoice(SEARCH_SPACE.optimizers),
    learningRate: randomChoice(SEARCH_SPACE.learningRates),
    dropoutRate: randomChoice(SEARCH_SPACE.dropoutRates),
    l2Regularization: randomChoice(SEARCH_SPACE.l2Values),
  };
}

/**
 * Crossover two architectures.
 */
function crossover(a: ArchitectureCandidate, b: ArchitectureCandidate): ArchitectureCandidate {
  return {
    id: `cross-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    layers: Math.random() < 0.5 ? [...a.layers] : [...b.layers],
    activation: Math.random() < 0.5 ? a.activation : b.activation,
    optimizer: Math.random() < 0.5 ? a.optimizer : b.optimizer,
    learningRate: Math.random() < 0.5 ? a.learningRate : b.learningRate,
    dropoutRate: Math.random() < 0.5 ? a.dropoutRate : b.dropoutRate,
    l2Regularization: Math.random() < 0.5 ? a.l2Regularization : b.l2Regularization,
  };
}

/**
 * Mutate an architecture.
 */
function mutate(arch: ArchitectureCandidate, rate: number): ArchitectureCandidate {
  const mutated = { ...arch, id: `mut-${Date.now()}-${Math.random().toString(36).substring(2, 7)}` };

  if (Math.random() < rate) {
    // Mutate layers
    const mutation = Math.random();
    if (mutation < 0.33 && mutated.layers.length > 1) {
      // Remove a layer
      mutated.layers = mutated.layers.slice(0, -1);
    } else if (mutation < 0.66 && mutated.layers.length < SEARCH_SPACE.maxLayers) {
      // Add a layer
      const lastSize = mutated.layers[mutated.layers.length - 1] ?? 8;
      mutated.layers = [...mutated.layers, Math.max(2, Math.floor(lastSize / 2))];
    } else {
      // Modify a layer size
      const idx = randomInt(0, mutated.layers.length - 1);
      mutated.layers[idx] = randomInt(SEARCH_SPACE.minNeurons, SEARCH_SPACE.maxNeurons);
    }
  }

  if (Math.random() < rate) {
    mutated.activation = randomChoice(SEARCH_SPACE.activations);
  }
  if (Math.random() < rate) {
    mutated.learningRate = randomChoice(SEARCH_SPACE.learningRates);
  }
  if (Math.random() < rate) {
    mutated.dropoutRate = randomChoice(SEARCH_SPACE.dropoutRates);
  }

  return mutated;
}

/**
 * Evaluates an architecture.
 */
async function evaluateArchitecture(
  createModel: () => INeuralNetworkService,
  candidate: ArchitectureCandidate,
  trainingData: Point[],
  validationData: Point[],
  epochs: number
): Promise<ArchitectureResult> {
  const model = createModel();
  const startTime = Date.now();

  const hyperparams: Hyperparameters = {
    learningRate: candidate.learningRate,
    layers: candidate.layers,
    activation: candidate.activation,
    optimizer: candidate.optimizer,
    dropoutRate: candidate.dropoutRate,
    l2Regularization: candidate.l2Regularization,
    numClasses: 2,
  };

  await model.initialize(hyperparams);

  // Train
  for (let epoch = 0; epoch < epochs; epoch++) {
    await model.train(trainingData);
  }

  // Evaluate on validation set
  const evalResult = await model.evaluate(validationData);

  // Estimate number of parameters
  const numParameters = estimateParameters(candidate.layers);

  return {
    architecture: candidate,
    accuracy: evalResult.accuracy,
    loss: evalResult.loss,
    trainingTime: Date.now() - startTime,
    numParameters,
    epochsTrained: epochs,
  };
}

/**
 * Estimates number of parameters in a network.
 */
function estimateParameters(layers: number[]): number {
  let params = 0;
  let prevSize = 2; // Input size

  for (const size of layers) {
    params += prevSize * size + size; // weights + biases
    prevSize = size;
  }

  // Output layer (assuming binary classification)
  params += prevSize * 1 + 1;

  return params;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

/**
 * Formats NAS result as HTML.
 */
export function formatNASResultHTML(result: NASResult): string {
  const { best, history, totalTime } = result;

  const sortedHistory = [...history].sort((a, b) => b.accuracy - a.accuracy).slice(0, 5);

  return `
    <div class="text-xs space-y-3">
      <div class="p-2 bg-emerald-900/30 rounded border border-emerald-700/50">
        <div class="font-medium text-emerald-400 mb-1">Best Architecture</div>
        <div class="text-slate-300">Layers: [${best.architecture.layers.join(', ')}]</div>
        <div class="text-slate-300">Activation: ${best.architecture.activation}</div>
        <div class="text-slate-300">LR: ${best.architecture.learningRate}</div>
        <div class="text-slate-300">Accuracy: ${(best.accuracy * 100).toFixed(1)}%</div>
        <div class="text-slate-400">Params: ${best.numParameters}</div>
      </div>
      
      <div>
        <div class="text-slate-400 mb-1">Top 5 Architectures:</div>
        ${sortedHistory.map((r, i) => `
          <div class="flex justify-between py-1 ${i === 0 ? 'text-emerald-400' : 'text-slate-300'}">
            <span>[${r.architecture.layers.join(',')}] ${r.architecture.activation}</span>
            <span>${(r.accuracy * 100).toFixed(1)}%</span>
          </div>
        `).join('')}
      </div>
      
      <div class="text-slate-500 pt-2 border-t border-navy-600">
        Evaluated ${history.length} architectures in ${(totalTime / 1000).toFixed(1)}s
      </div>
    </div>
  `;
}
