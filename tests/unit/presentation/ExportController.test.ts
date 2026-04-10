import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock toast
vi.mock('../../../src/presentation/toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

describe('ExportController — epoch+timestamp filenames', () => {
  function createMockSession(epoch = 42) {
    return {
      getState: vi.fn(() => ({
        isInitialised: true,
        currentEpoch: epoch,
      })),
      exportHistory: vi.fn(() => '{"records":[]}'),
    };
  }

  function createMockNeuralNet() {
    return {
      exportModel: vi.fn(async () => ({
        modelJson: new Blob(['{}'], { type: 'application/json' }),
        weightsBlob: new Blob([new ArrayBuffer(8)], { type: 'application/octet-stream' }),
      })),
    };
  }

  function createMockElements() {
    return {
      btnExportHistorySticky: document.createElement('button'),
      btnExportModelSticky: document.createElement('button'),
    };
  }

  it('should include epoch and timestamp in JSON export filename', async () => {
    const { ExportController } = await import('../../../src/presentation/controllers/ExportController');

    const session = createMockSession(50);
    const neuralNet = createMockNeuralNet();
    const elements = createMockElements();

    const controller = new ExportController(session as any, neuralNet as any, elements as any);

    // Access private method to test filename prefix
    const prefix = (controller as any).buildExportPrefix();

    expect(prefix).toMatch(/^epoch-50-\d{4}-\d{2}-\d{2}T/);

    controller.dispose();
  });

  it('should build prefix with epoch 0 before training starts', async () => {
    const { ExportController } = await import('../../../src/presentation/controllers/ExportController');

    const session = createMockSession(0);
    const neuralNet = createMockNeuralNet();
    const elements = createMockElements();

    const controller = new ExportController(session as any, neuralNet as any, elements as any);

    const prefix = (controller as any).buildExportPrefix();

    expect(prefix).toMatch(/^epoch-0-/);

    controller.dispose();
  });
});
