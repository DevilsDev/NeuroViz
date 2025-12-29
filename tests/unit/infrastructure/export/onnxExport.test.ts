/**
 * ONNX Export Infrastructure Tests
 */

import { describe, it, expect } from 'vitest';
import { generateONNXModel, generateONNXPythonScript } from '../../../../src/infrastructure/export/onnxExport';

describe('onnxExport', () => {
  describe('generateONNXModel', () => {
    it('should generate ONNX model for simple network', () => {
      const layers = [2, 4, 1];
      const activations = ['', 'relu', 'sigmoid'];
      const weights = [
        [[0.1, 0.2, 0.3, 0.4], [0.5, 0.6, 0.7, 0.8]],
        [[0.1], [0.2], [0.3], [0.4]],
      ];
      const biases = [
        [0.1, 0.2, 0.3, 0.4],
        [0.1],
      ];

      const model = generateONNXModel(layers, activations, weights, biases);

      expect(model.opsetVersion).toBe(13);
      expect(model.producerName).toBe('NeuroViz');
      expect(model.producerVersion).toBe('1.0.0');
    });

    it('should create correct input shape', () => {
      const layers = [3, 5, 2];
      const activations = ['', 'relu', 'softmax'];
      const weights = [
        [[0.1, 0.2, 0.3, 0.4, 0.5], [0.1, 0.2, 0.3, 0.4, 0.5], [0.1, 0.2, 0.3, 0.4, 0.5]],
        [[0.1, 0.2], [0.1, 0.2], [0.1, 0.2], [0.1, 0.2], [0.1, 0.2]],
      ];
      const biases = [
        [0.1, 0.2, 0.3, 0.4, 0.5],
        [0.1, 0.2],
      ];

      const model = generateONNXModel(layers, activations, weights, biases);

      expect(model.inputs).toHaveLength(1);
      expect(model.inputs[0]?.name).toBe('input');
      expect(model.inputs[0]?.shape).toEqual([-1, 3]);
      expect(model.inputs[0]?.dataType).toBe('float32');
    });

    it('should create correct output shape', () => {
      const layers = [2, 3];
      const activations = ['', 'sigmoid'];
      const weights = [
        [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]],
      ];
      const biases = [[0.1, 0.2, 0.3]];

      const model = generateONNXModel(layers, activations, weights, biases);

      expect(model.outputs).toHaveLength(1);
      expect(model.outputs[0]?.name).toBe('output');
      expect(model.outputs[0]?.shape).toEqual([-1, 3]);
      expect(model.outputs[0]?.dataType).toBe('float32');
    });

    it('should create nodes for each layer', () => {
      const layers = [2, 4, 3, 1];
      const activations = ['', 'relu', 'tanh', 'sigmoid'];
      const weights = [
        [[0.1, 0.2, 0.3, 0.4], [0.5, 0.6, 0.7, 0.8]],
        [[0.1, 0.2, 0.3], [0.1, 0.2, 0.3], [0.1, 0.2, 0.3], [0.1, 0.2, 0.3]],
        [[0.1], [0.2], [0.3]],
      ];
      const biases = [
        [0.1, 0.2, 0.3, 0.4],
        [0.1, 0.2, 0.3],
        [0.1],
      ];

      const model = generateONNXModel(layers, activations, weights, biases);

      // Each layer should have Gemm + activation node (except last layer output)
      // Layer 0: Gemm + Relu = 2 nodes
      // Layer 1: Gemm + Tanh = 2 nodes
      // Layer 2: Gemm + Sigmoid = 2 nodes
      expect(model.nodes.length).toBeGreaterThanOrEqual(3);
    });

    it('should include Gemm nodes', () => {
      const layers = [2, 3];
      const activations = ['', 'relu'];
      const weights = [[[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]]];
      const biases = [[0.1, 0.2, 0.3]];

      const model = generateONNXModel(layers, activations, weights, biases);

      const gemmNode = model.nodes.find(n => n.opType === 'Gemm');
      expect(gemmNode).toBeDefined();
      expect(gemmNode?.attributes?.alpha).toBe(1.0);
      expect(gemmNode?.attributes?.beta).toBe(1.0);
      expect(gemmNode?.attributes?.transB).toBe(1);
    });

    it('should create initializers for weights', () => {
      const layers = [2, 3];
      const activations = ['', 'relu'];
      const weights = [[[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]]];
      const biases = [[0.1, 0.2, 0.3]];

      const model = generateONNXModel(layers, activations, weights, biases);

      const weightInit = model.initializers.find(i => i.name === 'layer0_weight');
      expect(weightInit).toBeDefined();
      expect(weightInit?.shape).toEqual([3, 2]); // Transposed
      expect(weightInit?.data).toHaveLength(6);
    });

    it('should create initializers for biases', () => {
      const layers = [2, 4];
      const activations = ['', 'sigmoid'];
      const weights = [[[0.1, 0.2, 0.3, 0.4], [0.5, 0.6, 0.7, 0.8]]];
      const biases = [[0.1, 0.2, 0.3, 0.4]];

      const model = generateONNXModel(layers, activations, weights, biases);

      const biasInit = model.initializers.find(i => i.name === 'layer0_bias');
      expect(biasInit).toBeDefined();
      expect(biasInit?.shape).toEqual([4]);
      expect(biasInit?.data).toEqual([0.1, 0.2, 0.3, 0.4]);
    });

    it('should handle ReLU activation', () => {
      const layers = [2, 3];
      const activations = ['', 'relu'];
      const weights = [[[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]]];
      const biases = [[0.1, 0.2, 0.3]];

      const model = generateONNXModel(layers, activations, weights, biases);

      const reluNode = model.nodes.find(n => n.opType === 'Relu');
      expect(reluNode).toBeDefined();
    });

    it('should handle Sigmoid activation', () => {
      const layers = [2, 3];
      const activations = ['', 'sigmoid'];
      const weights = [[[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]]];
      const biases = [[0.1, 0.2, 0.3]];

      const model = generateONNXModel(layers, activations, weights, biases);

      const sigmoidNode = model.nodes.find(n => n.opType === 'Sigmoid');
      expect(sigmoidNode).toBeDefined();
    });

    it('should handle Tanh activation', () => {
      const layers = [2, 3];
      const activations = ['', 'tanh'];
      const weights = [[[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]]];
      const biases = [[0.1, 0.2, 0.3]];

      const model = generateONNXModel(layers, activations, weights, biases);

      const tanhNode = model.nodes.find(n => n.opType === 'Tanh');
      expect(tanhNode).toBeDefined();
    });

    it('should handle ELU activation', () => {
      const layers = [2, 3];
      const activations = ['', 'elu'];
      const weights = [[[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]]];
      const biases = [[0.1, 0.2, 0.3]];

      const model = generateONNXModel(layers, activations, weights, biases);

      const eluNode = model.nodes.find(n => n.opType === 'Elu');
      expect(eluNode).toBeDefined();
    });

    it('should handle Softmax activation', () => {
      const layers = [2, 3];
      const activations = ['', 'softmax'];
      const weights = [[[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]]];
      const biases = [[0.1, 0.2, 0.3]];

      const model = generateONNXModel(layers, activations, weights, biases);

      const softmaxNode = model.nodes.find(n => n.opType === 'Softmax');
      expect(softmaxNode).toBeDefined();
    });

    it('should handle linear activation', () => {
      const layers = [2, 3];
      const activations = ['', 'linear'];
      const weights = [[[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]]];
      const biases = [[0.1, 0.2, 0.3]];

      const model = generateONNXModel(layers, activations, weights, biases);

      // Linear activation should not add an activation node
      const identityNode = model.nodes.find(n => n.opType === 'Identity');
      expect(identityNode).toBeUndefined();
    });

    it('should handle deep network', () => {
      const layers = [2, 8, 6, 4, 2, 1];
      const activations = ['', 'relu', 'relu', 'relu', 'tanh', 'sigmoid'];
      const weights = [
        Array(2).fill(null).map(() => Array(8).fill(0.1)),
        Array(8).fill(null).map(() => Array(6).fill(0.1)),
        Array(6).fill(null).map(() => Array(4).fill(0.1)),
        Array(4).fill(null).map(() => Array(2).fill(0.1)),
        Array(2).fill(null).map(() => [0.1]),
      ];
      const biases = [
        Array(8).fill(0.1),
        Array(6).fill(0.1),
        Array(4).fill(0.1),
        Array(2).fill(0.1),
        [0.1],
      ];

      const model = generateONNXModel(layers, activations, weights, biases);

      expect(model.nodes.length).toBeGreaterThan(0);
      expect(model.initializers.length).toBe(10); // 5 layers × 2 (weights + biases)
    });

    it('should handle empty biases', () => {
      const layers = [2, 3];
      const activations = ['', 'relu'];
      const weights = [[[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]]];
      const biases: number[][] = [[]];

      const model = generateONNXModel(layers, activations, weights, biases);

      const biasInit = model.initializers.find(i => i.name === 'layer0_bias');
      expect(biasInit).toBeDefined();
      expect(biasInit?.data).toEqual([0, 0, 0]); // Should fill with zeros
    });

    it('should transpose weights correctly', () => {
      const layers = [2, 3];
      const activations = ['', 'relu'];
      const weights = [
        [
          [1, 2, 3], // from neuron 0
          [4, 5, 6], // from neuron 1
        ],
      ];
      const biases = [[0.1, 0.2, 0.3]];

      const model = generateONNXModel(layers, activations, weights, biases);

      const weightInit = model.initializers.find(i => i.name === 'layer0_weight');

      // ONNX format is [output_size, input_size] = [3, 2]
      // Flattened as: [weights_to_0, weights_to_1, weights_to_2]
      // = [1, 4, 2, 5, 3, 6]
      expect(weightInit?.data).toEqual([1, 4, 2, 5, 3, 6]);
    });

    it('should handle single-layer network', () => {
      const layers = [4, 1];
      const activations = ['', 'sigmoid'];
      const weights = [[[0.1], [0.2], [0.3], [0.4]]];
      const biases = [[0.1]];

      const model = generateONNXModel(layers, activations, weights, biases);

      expect(model.inputs[0]?.shape).toEqual([-1, 4]);
      expect(model.outputs[0]?.shape).toEqual([-1, 1]);
      expect(model.nodes.length).toBeGreaterThan(0);
    });
  });

  describe('generateONNXPythonScript', () => {
    it('should generate Python script', () => {
      const layers = [2, 3, 1];
      const activations = ['', 'relu', 'sigmoid'];
      const weights = [
        [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]],
        [[0.1], [0.2], [0.3]],
      ];
      const biases = [
        [0.1, 0.2, 0.3],
        [0.1],
      ];

      const model = generateONNXModel(layers, activations, weights, biases);
      const script = generateONNXPythonScript(model);

      expect(script).toContain('import numpy as np');
      expect(script).toContain('import onnx');
      expect(script).toContain('from onnx import helper');
    });

    it('should include opset version', () => {
      const layers = [2, 1];
      const activations = ['', 'sigmoid'];
      const weights = [[[0.1], [0.2]]];
      const biases = [[0.1]];

      const model = generateONNXModel(layers, activations, weights, biases);
      const script = generateONNXPythonScript(model);

      expect(script).toContain('opset_version = 13');
    });

    it('should include producer metadata', () => {
      const layers = [2, 1];
      const activations = ['', 'sigmoid'];
      const weights = [[[0.1], [0.2]]];
      const biases = [[0.1]];

      const model = generateONNXModel(layers, activations, weights, biases);
      const script = generateONNXPythonScript(model);

      expect(script).toContain('producer_name = "NeuroViz"');
      expect(script).toContain('producer_version = "1.0.0"');
    });

    it('should include initializers', () => {
      const layers = [2, 3];
      const activations = ['', 'relu'];
      const weights = [[[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]]];
      const biases = [[0.1, 0.2, 0.3]];

      const model = generateONNXModel(layers, activations, weights, biases);
      const script = generateONNXPythonScript(model);

      expect(script).toContain('layer0_weight');
      expect(script).toContain('layer0_bias');
      expect(script).toContain('helper.make_tensor');
    });

    it('should include node creation', () => {
      const layers = [2, 3];
      const activations = ['', 'relu'];
      const weights = [[[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]]];
      const biases = [[0.1, 0.2, 0.3]];

      const model = generateONNXModel(layers, activations, weights, biases);
      const script = generateONNXPythonScript(model);

      expect(script).toContain('helper.make_node');
      expect(script).toContain('Gemm');
    });

    it('should include model saving', () => {
      const layers = [2, 1];
      const activations = ['', 'sigmoid'];
      const weights = [[[0.1], [0.2]]];
      const biases = [[0.1]];

      const model = generateONNXModel(layers, activations, weights, biases);
      const script = generateONNXPythonScript(model);

      expect(script).toContain('onnx.save');
      expect(script).toContain('neuroviz_model.onnx');
    });

    it('should include model validation', () => {
      const layers = [2, 1];
      const activations = ['', 'sigmoid'];
      const weights = [[[0.1], [0.2]]];
      const biases = [[0.1]];

      const model = generateONNXModel(layers, activations, weights, biases);
      const script = generateONNXPythonScript(model);

      expect(script).toContain('onnx.checker.check_model');
    });

    it('should include inference test code', () => {
      const layers = [2, 1];
      const activations = ['', 'sigmoid'];
      const weights = [[[0.1], [0.2]]];
      const biases = [[0.1]];

      const model = generateONNXModel(layers, activations, weights, biases);
      const script = generateONNXPythonScript(model);

      expect(script).toContain('onnxruntime');
      expect(script).toContain('InferenceSession');
    });

    it('should handle input/output shapes correctly', () => {
      const layers = [4, 8, 2];
      const activations = ['', 'relu', 'softmax'];
      const weights = [
        Array(4).fill(null).map(() => Array(8).fill(0.1)),
        Array(8).fill(null).map(() => Array(2).fill(0.1)),
      ];
      const biases = [
        Array(8).fill(0.1),
        Array(2).fill(0.1),
      ];

      const model = generateONNXModel(layers, activations, weights, biases);
      const script = generateONNXPythonScript(model);

      expect(script).toContain('[-1,4]'); // Input shape (JSON.stringify format)
      expect(script).toContain('[-1,2]'); // Output shape (JSON.stringify format)
    });

    it('should be valid Python syntax', () => {
      const layers = [2, 4, 1];
      const activations = ['', 'relu', 'sigmoid'];
      const weights = [
        [[0.1, 0.2, 0.3, 0.4], [0.5, 0.6, 0.7, 0.8]],
        [[0.1], [0.2], [0.3], [0.4]],
      ];
      const biases = [
        [0.1, 0.2, 0.3, 0.4],
        [0.1],
      ];

      const model = generateONNXModel(layers, activations, weights, biases);
      const script = generateONNXPythonScript(model);

      // Check for balanced parentheses
      const openParens = (script.match(/\(/g) || []).length;
      const closeParens = (script.match(/\)/g) || []).length;
      expect(openParens).toBe(closeParens);

      // Check for balanced brackets
      const openBrackets = (script.match(/\[/g) || []).length;
      const closeBrackets = (script.match(/\]/g) || []).length;
      expect(openBrackets).toBe(closeBrackets);
    });
  });
});
