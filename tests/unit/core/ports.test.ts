import { describe, it, expect } from 'vitest';
import type {
  ILossChartService,
  ILearningRateChartService,
  INetworkDiagramService,
  IConfusionMatrixService,
  IWeightHistogramService,
  IActivationHistogramService,
} from '../../../src/core/ports/IChartService';
import type { INeuralNetworkService } from '../../../src/core/ports/INeuralNetworkService';

describe('Port Interfaces - Contract Compliance', () => {
  it('ILossChartService requires update, clear, dispose', () => {
    const service: ILossChartService = {
      update: () => {},
      clear: () => {},
      dispose: () => {},
    };
    expect(service.update).toBeDefined();
    expect(service.clear).toBeDefined();
    expect(service.dispose).toBeDefined();
  });

  it('ILearningRateChartService requires render, clear, dispose', () => {
    const service: ILearningRateChartService = {
      render: () => {},
      clear: () => {},
      dispose: () => {},
    };
    expect(service.render).toBeDefined();
  });

  it('INetworkDiagramService requires render with optional dropoutMask', () => {
    const service: INetworkDiagramService = {
      render: (_layers, _activations, _weights, _mask) => {},
      clear: () => {},
      dispose: () => {},
    };
    // Verify it can be called with and without dropout mask
    service.render([2, 4, 1], ['relu'], [[[1]]], [[true]]);
    service.render([2, 4, 1], ['relu'], [[[1]]]);
    expect(service.render).toBeDefined();
  });

  it('IConfusionMatrixService requires render with ConfusionMatrixData', () => {
    const service: IConfusionMatrixService = {
      render: () => {},
      clear: () => {},
      dispose: () => {},
    };
    service.render({ matrix: [[1, 0], [0, 1]], labels: ['A', 'B'], total: 2 });
    expect(service.render).toBeDefined();
  });

  it('IWeightHistogramService requires update with number array', () => {
    const service: IWeightHistogramService = {
      update: () => {},
      clear: () => {},
      dispose: () => {},
    };
    service.update([0.1, -0.3, 0.5]);
    expect(service.update).toBeDefined();
  });

  it('IActivationHistogramService requires update with layer data', () => {
    const service: IActivationHistogramService = {
      update: () => {},
      clear: () => {},
      dispose: () => {},
    };
    service.update([{ layerIndex: 0, layerName: 'Input', activations: [0.5, 0.8] }]);
    expect(service.update).toBeDefined();
  });

  it('INeuralNetworkService includes dispose, getConfig, getWeights, generateDropoutMask, exportModel', () => {
    // Type-level check: the interface requires these methods
    const _typeCheck = (svc: INeuralNetworkService): void => {
      svc.dispose();
      svc.getConfig();
      svc.getWeights();
      svc.generateDropoutMask(0.5);
      void svc.exportModel();
    };
    expect(_typeCheck).toBeDefined();
  });
});
