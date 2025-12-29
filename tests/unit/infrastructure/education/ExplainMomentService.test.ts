/**
 * ExplainMomentService Infrastructure Tests
 */

import { describe, it, expect } from 'vitest';
import { ExplainMomentService, type ExplanationContext } from '../../../../src/infrastructure/education/ExplainMomentService';

describe('ExplainMomentService', () => {
  let service: ExplainMomentService;

  beforeEach(() => {
    service = new ExplainMomentService();
  });

  describe('explainMoment', () => {
    describe('initial state (epoch 0, not training)', () => {
      it('should explain initial state for circle dataset', () => {
        const context: ExplanationContext = {
          datasetType: 'circle',
          currentEpoch: 0,
          totalEpochs: 100,
          currentLoss: 1.0,
          initialLoss: 1.0,
          lossHistory: [],
          accuracy: 0,
          architecture: { layers: [{ units: 4, activation: 'relu' }] },
          isTraining: false,
        };

        const explanation = service.explainMoment(context);

        expect(explanation.type).toBe('info');
        expect(explanation.title).toBe('Ready to Learn');
        expect(explanation.message).toContain('Circle');
        expect(explanation.tip).toBeTruthy();
      });

      it('should explain initial state for XOR dataset', () => {
        const context: ExplanationContext = {
          datasetType: 'xor',
          currentEpoch: 0,
          totalEpochs: 100,
          currentLoss: 1.0,
          initialLoss: 1.0,
          lossHistory: [],
          accuracy: 0,
          architecture: { layers: [{ units: 8, activation: 'relu' }] },
          isTraining: false,
        };

        const explanation = service.explainMoment(context);

        expect(explanation.type).toBe('info');
        expect(explanation.message).toContain('XOR');
        expect(explanation.message).toContain('non-linear');
      });

      it('should explain initial state for spiral dataset', () => {
        const context: ExplanationContext = {
          datasetType: 'spiral',
          currentEpoch: 0,
          totalEpochs: 200,
          currentLoss: 1.5,
          initialLoss: 1.5,
          lossHistory: [],
          accuracy: 0,
          architecture: { layers: [{ units: 16, activation: 'relu' }, { units: 8, activation: 'relu' }] },
          isTraining: false,
        };

        const explanation = service.explainMoment(context);

        expect(explanation.type).toBe('info');
        expect(explanation.message).toContain('Spiral');
        expect(explanation.message).toContain('highly non-linear');
      });

      it('should explain initial state for gaussian dataset', () => {
        const context: ExplanationContext = {
          datasetType: 'gaussian',
          currentEpoch: 0,
          totalEpochs: 100,
          currentLoss: 1.0,
          initialLoss: 1.0,
          lossHistory: [],
          accuracy: 0,
          architecture: { layers: [{ units: 4, activation: 'relu' }] },
          isTraining: false,
        };

        const explanation = service.explainMoment(context);

        expect(explanation.type).toBe('info');
        expect(explanation.message).toContain('Gaussian');
        expect(explanation.message).toContain('overlapping');
      });

      it('should describe architecture for shallow network', () => {
        const context: ExplanationContext = {
          datasetType: 'circle',
          currentEpoch: 0,
          totalEpochs: 100,
          currentLoss: 1.0,
          initialLoss: 1.0,
          lossHistory: [],
          accuracy: 0,
          architecture: { layers: [{ units: 4, activation: 'relu' }] },
          isTraining: false,
        };

        const explanation = service.explainMoment(context);

        expect(explanation.message).toContain('shallow network');
        expect(explanation.message).toContain('4 neurons');
      });

      it('should describe architecture for deep network', () => {
        const context: ExplanationContext = {
          datasetType: 'spiral',
          currentEpoch: 0,
          totalEpochs: 100,
          currentLoss: 1.0,
          initialLoss: 1.0,
          lossHistory: [],
          accuracy: 0,
          architecture: { layers: [{ units: 8, activation: 'relu' }, { units: 4, activation: 'relu' }] },
          isTraining: false,
        };

        const explanation = service.explainMoment(context);

        expect(explanation.message).toContain('2-layer network');
        expect(explanation.message).toContain('12 total neurons');
      });

      it('should describe linear model (no hidden layers)', () => {
        const context: ExplanationContext = {
          datasetType: 'circle',
          currentEpoch: 0,
          totalEpochs: 100,
          currentLoss: 1.0,
          initialLoss: 1.0,
          lossHistory: [],
          accuracy: 0,
          architecture: { layers: [] },
          isTraining: false,
        };

        const explanation = service.explainMoment(context);

        expect(explanation.message).toContain('linear model');
      });
    });

    describe('early training (epochs 1-9)', () => {
      it('should explain early training progress', () => {
        const context: ExplanationContext = {
          datasetType: 'circle',
          currentEpoch: 5,
          totalEpochs: 100,
          currentLoss: 0.8,
          initialLoss: 1.0,
          lossHistory: [1.0, 0.95, 0.9, 0.85, 0.8],
          accuracy: 0.65,
          architecture: { layers: [{ units: 4, activation: 'relu' }] },
          isTraining: true,
        };

        const explanation = service.explainMoment(context);

        expect(explanation.type).toBe('progress');
        expect(explanation.title).toBe('Learning Started');
        expect(explanation.message).toContain('5 epochs');
        expect(explanation.message).toContain('decreased');
        expect(explanation.tip).toBeTruthy();
      });

      it('should handle singular epoch count', () => {
        const context: ExplanationContext = {
          datasetType: 'circle',
          currentEpoch: 1,
          totalEpochs: 100,
          currentLoss: 0.95,
          initialLoss: 1.0,
          lossHistory: [0.95],
          accuracy: 0.55,
          architecture: { layers: [{ units: 4, activation: 'relu' }] },
          isTraining: true,
        };

        const explanation = service.explainMoment(context);

        expect(explanation.message).toContain('1 epoch');
        expect(explanation.message).not.toContain('1 epochs');
      });

      it('should show loss improvement percentage', () => {
        const context: ExplanationContext = {
          datasetType: 'circle',
          currentEpoch: 5,
          totalEpochs: 100,
          currentLoss: 0.5,
          initialLoss: 1.0,
          lossHistory: [1.0, 0.9, 0.7, 0.6, 0.5],
          accuracy: 0.75,
          architecture: { layers: [{ units: 4, activation: 'relu' }] },
          isTraining: true,
        };

        const explanation = service.explainMoment(context);

        expect(explanation.message).toContain('50%');
        expect(explanation.message).toContain('improvement');
      });
    });

    describe('normal training progress', () => {
      it('should explain mid-training progress', () => {
        const context: ExplanationContext = {
          datasetType: 'xor',
          currentEpoch: 50,
          totalEpochs: 100,
          currentLoss: 0.3,
          initialLoss: 1.2,
          lossHistory: new Array(50).fill(null).map((_, i) => 1.2 - (i * 0.018)),
          accuracy: 0.88,
          architecture: { layers: [{ units: 8, activation: 'relu' }] },
          isTraining: true,
        };

        const explanation = service.explainMoment(context);

        expect(explanation.type).toBe('progress');
        expect(explanation.title).toContain('50%');
        expect(explanation.message).toContain('XOR');
        expect(explanation.message).toContain('88.0%');
      });

      it('should provide contextual tips based on progress', () => {
        const earlyContext: ExplanationContext = {
          datasetType: 'circle',
          currentEpoch: 20,
          totalEpochs: 100,
          currentLoss: 0.6,
          initialLoss: 1.0,
          lossHistory: new Array(20).fill(null).map((_, i) => 1.0 - (i * 0.02)),
          accuracy: 0.7,
          architecture: { layers: [{ units: 4, activation: 'relu' }] },
          isTraining: true,
        };

        const earlyExplanation = service.explainMoment(earlyContext);
        expect(earlyExplanation.tip).toContain('Early in training');

        const midContext: ExplanationContext = {
          ...earlyContext,
          currentEpoch: 50,
        };

        const midExplanation = service.explainMoment(midContext);
        expect(midExplanation.tip).toContain('refining');

        const lateContext: ExplanationContext = {
          ...earlyContext,
          currentEpoch: 80,
        };

        const lateExplanation = service.explainMoment(lateContext);
        expect(lateExplanation.tip).toContain('nearly complete');
      });
    });

    describe('plateau detection', () => {
      it('should detect plateau when loss is not improving', () => {
        const lossHistory = [
          ...new Array(10).fill(null).map((_, i) => 1.0 - (i * 0.05)),
          ...new Array(10).fill(0.5),
        ];

        const context: ExplanationContext = {
          datasetType: 'circle',
          currentEpoch: 20,
          totalEpochs: 100,
          currentLoss: 0.5,
          initialLoss: 1.0,
          lossHistory,
          accuracy: 0.7,
          architecture: { layers: [{ units: 4, activation: 'relu' }] },
          isTraining: true,
        };

        const explanation = service.explainMoment(context);

        expect(explanation.type).toBe('plateau');
        expect(explanation.title).toBe('Learning Has Plateaued');
        expect(explanation.message).toContain('hasn\'t improved');
        expect(explanation.tip).toBeTruthy();
      });

      it('should suggest increasing learning rate on plateau', () => {
        const lossHistory = new Array(15).fill(0.5);

        const context: ExplanationContext = {
          datasetType: 'circle',
          currentEpoch: 15,
          totalEpochs: 100,
          currentLoss: 0.5,
          initialLoss: 1.0,
          lossHistory,
          accuracy: 0.7,
          architecture: { layers: [{ units: 4, activation: 'relu' }] },
          isTraining: true,
        };

        const explanation = service.explainMoment(context);

        expect(explanation.tip).toContain('learning rate');
      });
    });

    describe('divergence detection', () => {
      it('should detect when loss is increasing', () => {
        const lossHistory = [
          ...new Array(10).fill(null).map((_, i) => 1.0 - (i * 0.05)),
          ...new Array(5).fill(null).map((_, i) => 0.5 + (i * 0.1)),
        ];

        const context: ExplanationContext = {
          datasetType: 'circle',
          currentEpoch: 15,
          totalEpochs: 100,
          currentLoss: 0.9,
          initialLoss: 1.0,
          lossHistory,
          accuracy: 0.5,
          architecture: { layers: [{ units: 4, activation: 'relu' }] },
          isTraining: true,
        };

        const explanation = service.explainMoment(context);

        expect(explanation.type).toBe('warning');
        expect(explanation.title).toBe('Training Instability Detected');
        expect(explanation.message).toContain('increasing');
      });

      it('should suggest reducing learning rate on divergence', () => {
        const lossHistory = new Array(10).fill(null).map((_, i) => 1.0 + (i * 0.1));

        const context: ExplanationContext = {
          datasetType: 'circle',
          currentEpoch: 10,
          totalEpochs: 100,
          currentLoss: 2.0,
          initialLoss: 1.0,
          lossHistory,
          accuracy: 0.4,
          architecture: { layers: [{ units: 4, activation: 'relu' }] },
          isTraining: true,
        };

        const explanation = service.explainMoment(context);

        expect(explanation.tip).toContain('reducing the learning rate');
      });
    });

    describe('convergence detection', () => {
      it('should detect convergence with very low loss', () => {
        const context: ExplanationContext = {
          datasetType: 'circle',
          currentEpoch: 50,
          totalEpochs: 100,
          currentLoss: 0.03,
          initialLoss: 1.0,
          lossHistory: new Array(50).fill(null).map((_, i) => 1.0 - (i * 0.019)),
          accuracy: 0.98,
          architecture: { layers: [{ units: 4, activation: 'relu' }] },
          isTraining: true,
        };

        const explanation = service.explainMoment(context);

        expect(explanation.type).toBe('success');
        expect(explanation.title).toBe('Approaching Optimal Performance');
        expect(explanation.message).toContain('Great progress');
      });

      it('should detect convergence with very low loss regardless of plateau', () => {
        // When loss is below 0.05, it should be considered converged
        const context: ExplanationContext = {
          datasetType: 'xor',
          currentEpoch: 60,
          totalEpochs: 100,
          currentLoss: 0.03,
          initialLoss: 1.0,
          lossHistory: new Array(60).fill(null).map((_, i) => 1.0 - (i * 0.016)),
          accuracy: 0.97,
          architecture: { layers: [{ units: 8, activation: 'relu' }] },
          isTraining: true,
        };

        const explanation = service.explainMoment(context);

        expect(explanation.type).toBe('success');
      });

      it('should show accuracy in convergence message', () => {
        const context: ExplanationContext = {
          datasetType: 'circle',
          currentEpoch: 50,
          totalEpochs: 100,
          currentLoss: 0.02,
          initialLoss: 1.0,
          lossHistory: new Array(50).fill(null).map((_, i) => 1.0 - (i * 0.019)),
          accuracy: 0.96,
          architecture: { layers: [{ units: 4, activation: 'relu' }] },
          isTraining: true,
        };

        const explanation = service.explainMoment(context);

        expect(explanation.message).toContain('96.0%');
      });
    });

    describe('dataset-specific insights', () => {
      it('should provide circle-specific insights', () => {
        const context: ExplanationContext = {
          datasetType: 'circle',
          currentEpoch: 30,
          totalEpochs: 100,
          currentLoss: 0.5,
          initialLoss: 1.0,
          lossHistory: new Array(30).fill(null).map((_, i) => 1.0 - (i * 0.016)),
          accuracy: 0.75,
          architecture: { layers: [{ units: 4, activation: 'relu' }] },
          isTraining: true,
        };

        const explanation = service.explainMoment(context);

        expect(explanation.message).toContain('Circle');
        expect(explanation.message).toContain('relatively easy');
      });

      it('should provide XOR-specific insights', () => {
        const context: ExplanationContext = {
          datasetType: 'xor',
          currentEpoch: 30,
          totalEpochs: 100,
          currentLoss: 0.5,
          initialLoss: 1.0,
          lossHistory: new Array(30).fill(null).map((_, i) => 1.0 - (i * 0.016)),
          accuracy: 0.75,
          architecture: { layers: [{ units: 8, activation: 'relu' }] },
          isTraining: true,
        };

        const explanation = service.explainMoment(context);

        expect(explanation.message).toContain('XOR');
        expect(explanation.message).toContain('non-linear transformations');
      });

      it('should provide spiral-specific insights', () => {
        const context: ExplanationContext = {
          datasetType: 'spiral',
          currentEpoch: 30,
          totalEpochs: 200,
          currentLoss: 0.5,
          initialLoss: 1.5,
          lossHistory: new Array(30).fill(null).map((_, i) => 1.5 - (i * 0.033)),
          accuracy: 0.7,
          architecture: { layers: [{ units: 16, activation: 'relu' }, { units: 8, activation: 'relu' }] },
          isTraining: true,
        };

        const explanation = service.explainMoment(context);

        expect(explanation.message).toContain('Spiral');
        expect(explanation.message).toContain('challenging');
      });

      it('should provide gaussian-specific insights', () => {
        const context: ExplanationContext = {
          datasetType: 'gaussian',
          currentEpoch: 30,
          totalEpochs: 100,
          currentLoss: 0.5,
          initialLoss: 1.0,
          lossHistory: new Array(30).fill(null).map((_, i) => 1.0 - (i * 0.016)),
          accuracy: 0.75,
          architecture: { layers: [{ units: 4, activation: 'relu' }] },
          isTraining: true,
        };

        const explanation = service.explainMoment(context);

        expect(explanation.message).toContain('Gaussian');
        expect(explanation.message).toContain('overlapping');
      });

      it('should handle custom dataset', () => {
        const context: ExplanationContext = {
          datasetType: 'custom',
          currentEpoch: 30,
          totalEpochs: 100,
          currentLoss: 0.5,
          initialLoss: 1.0,
          lossHistory: new Array(30).fill(null).map((_, i) => 1.0 - (i * 0.016)),
          accuracy: 0.75,
          architecture: { layers: [{ units: 4, activation: 'relu' }] },
          isTraining: true,
        };

        const explanation = service.explainMoment(context);

        expect(explanation.message).toContain('Custom');
      });
    });

    describe('edge cases', () => {
      it('should handle zero initial loss', () => {
        const context: ExplanationContext = {
          datasetType: 'circle',
          currentEpoch: 30,
          totalEpochs: 100,
          currentLoss: 0.1,
          initialLoss: 0,
          lossHistory: new Array(30).fill(0.1),
          accuracy: 0.9,
          architecture: { layers: [{ units: 4, activation: 'relu' }] },
          isTraining: true,
        };

        const explanation = service.explainMoment(context);

        expect(explanation).toBeDefined();
        expect(explanation.type).toBeTruthy();
      });

      it('should handle short loss history', () => {
        const context: ExplanationContext = {
          datasetType: 'circle',
          currentEpoch: 12,
          totalEpochs: 100,
          currentLoss: 0.5,
          initialLoss: 1.0,
          lossHistory: [1.0, 0.9, 0.8],
          accuracy: 0.7,
          architecture: { layers: [{ units: 4, activation: 'relu' }] },
          isTraining: true,
        };

        const explanation = service.explainMoment(context);

        expect(explanation).toBeDefined();
        expect(explanation.type).toBe('progress');
      });

      it('should handle zero accuracy', () => {
        const context: ExplanationContext = {
          datasetType: 'circle',
          currentEpoch: 30,
          totalEpochs: 100,
          currentLoss: 0.5,
          initialLoss: 1.0,
          lossHistory: new Array(30).fill(null).map((_, i) => 1.0 - (i * 0.016)),
          accuracy: 0,
          architecture: { layers: [{ units: 4, activation: 'relu' }] },
          isTraining: true,
        };

        const explanation = service.explainMoment(context);

        expect(explanation.message).not.toContain('accuracy');
      });

      it('should handle negative accuracy gracefully', () => {
        const context: ExplanationContext = {
          datasetType: 'circle',
          currentEpoch: 30,
          totalEpochs: 100,
          currentLoss: 0.5,
          initialLoss: 1.0,
          lossHistory: new Array(30).fill(null).map((_, i) => 1.0 - (i * 0.016)),
          accuracy: -0.1,
          architecture: { layers: [{ units: 4, activation: 'relu' }] },
          isTraining: true,
        };

        const explanation = service.explainMoment(context);

        expect(explanation).toBeDefined();
      });
    });
  });
});
