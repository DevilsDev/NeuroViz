import { describe, it, expect } from 'vitest';
import { TFNeuralNet } from '../../src/infrastructure/tensorflow/TFNeuralNet';
import { DEFAULT_HYPERPARAMETERS } from '../../src/core/domain/Hyperparameters';

describe('TFNeuralNet Crash Repro', () => {
    it('should not crash when setting learning rate', async () => {
        const nn = new TFNeuralNet();
        await nn.initialize({
            ...DEFAULT_HYPERPARAMETERS,
            learningRate: 0.03,
            layers: [4, 2], // Simple architecture
        });

        // Simulate training loop
        const data = [
            { x: 0, y: 0, label: 0 },
            { x: 1, y: 1, label: 1 }
        ];

        console.log('First training step...');
        await nn.train(data);

        // Update LR
        console.log('Setting learning rate...');
        nn.setLearningRate(0.01);
        console.log('Learning rate set.');

        // Train again
        console.log('Second training step...');
        await nn.train(data);
        console.log('Training continued successfully.');
    });
});
