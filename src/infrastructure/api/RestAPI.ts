/**
 * REST API for Programmatic Control
 *
 * Exposes NeuroViz functionality via a REST-like API that can be called
 * from browser console, bookmarklets, or external tools via postMessage.
 */

import type { Point } from '../../core/domain';
import { logger } from '../logging/Logger';

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface TrainingStatus {
  isRunning: boolean;
  isPaused: boolean;
  epoch: number;
  loss: number | null;
  accuracy: number | null;
  valLoss: number | null;
  valAccuracy: number | null;
}

export interface ModelConfig {
  layers: number[];
  activation: string;
  optimizer: string;
  learningRate: number;
  dropoutRate: number;
  l2Regularization: number;
}

export interface DatasetInfo {
  type: string;
  samples: number;
  noise: number;
  points: Point[];
}

type APIHandler = (params: Record<string, unknown>) => Promise<APIResponse>;

/**
 * REST-like API controller for NeuroViz.
 */
export class RestAPI {
  private handlers: Map<string, APIHandler> = new Map();
  private isEnabled: boolean = false;

  constructor() {
    this.registerDefaultHandlers();
  }

  /**
   * Enables the API and sets up message listeners.
   */
  enable(): void {
    if (this.isEnabled) return;
    
    window.addEventListener('message', this.handleMessage.bind(this));
    
    // Expose API on window for console access
    (window as Window & { neurovizAPI?: RestAPI }).neurovizAPI = this;

    this.isEnabled = true;
    logger.info('NeuroViz REST API enabled. Access via window.neurovizAPI', {
      component: 'RestAPI',
      action: 'enable',
    });
  }

  /**
   * Disables the API.
   */
  disable(): void {
    if (!this.isEnabled) return;
    
    window.removeEventListener('message', this.handleMessage.bind(this));
    delete (window as Window & { neurovizAPI?: RestAPI }).neurovizAPI;
    
    this.isEnabled = false;
  }

  /**
   * Registers a handler for an endpoint.
   */
  registerHandler(endpoint: string, handler: APIHandler): void {
    this.handlers.set(endpoint, handler);
  }

  /**
   * Calls an API endpoint.
   */
  async call(endpoint: string, params: Record<string, unknown> = {}): Promise<APIResponse> {
    const handler = this.handlers.get(endpoint);
    
    if (!handler) {
      return {
        success: false,
        error: `Unknown endpoint: ${endpoint}`,
        timestamp: Date.now(),
      };
    }

    try {
      return await handler(params);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Handles postMessage events.
   */
  private handleMessage(event: MessageEvent): void {
    if (!event.data || typeof event.data !== 'object') return;
    
    const { type, endpoint, params, requestId } = event.data;
    
    if (type !== 'neuroviz-api') return;

    void this.call(endpoint, params).then(response => {
      event.source?.postMessage({
        type: 'neuroviz-api-response',
        requestId,
        response,
      }, { targetOrigin: event.origin });
    });
  }

  /**
   * Registers default API handlers.
   */
  private registerDefaultHandlers(): void {
    // Status endpoints
    this.registerHandler('GET /status', async () => ({
      success: true,
      data: { ready: true, version: '0.1.0' },
      timestamp: Date.now(),
    }));

    this.registerHandler('GET /training/status', async () => {
      // This will be connected to actual session in main.ts
      return {
        success: true,
        data: {
          isRunning: false,
          isPaused: false,
          epoch: 0,
          loss: null,
          accuracy: null,
          valLoss: null,
          valAccuracy: null,
        } as TrainingStatus,
        timestamp: Date.now(),
      };
    });

    // Training control endpoints
    this.registerHandler('POST /training/start', async () => ({
      success: true,
      data: { message: 'Training started' },
      timestamp: Date.now(),
    }));

    this.registerHandler('POST /training/pause', async () => ({
      success: true,
      data: { message: 'Training paused' },
      timestamp: Date.now(),
    }));

    this.registerHandler('POST /training/reset', async () => ({
      success: true,
      data: { message: 'Training reset' },
      timestamp: Date.now(),
    }));

    this.registerHandler('POST /training/step', async () => ({
      success: true,
      data: { message: 'Step executed' },
      timestamp: Date.now(),
    }));

    // Model configuration
    this.registerHandler('GET /model/config', async () => ({
      success: true,
      data: {
        layers: [8, 4],
        activation: 'relu',
        optimizer: 'adam',
        learningRate: 0.03,
        dropoutRate: 0,
        l2Regularization: 0,
      } as ModelConfig,
      timestamp: Date.now(),
    }));

    this.registerHandler('POST /model/config', async (params) => ({
      success: true,
      data: { message: 'Config updated', config: params },
      timestamp: Date.now(),
    }));

    // Dataset endpoints
    this.registerHandler('GET /dataset/info', async () => ({
      success: true,
      data: {
        type: 'circle',
        samples: 200,
        noise: 0.1,
        points: [],
      } as DatasetInfo,
      timestamp: Date.now(),
    }));

    this.registerHandler('POST /dataset/load', async (params) => ({
      success: true,
      data: { message: 'Dataset loaded', type: params.type },
      timestamp: Date.now(),
    }));

    // Export endpoints
    this.registerHandler('GET /export/json', async () => ({
      success: true,
      data: { format: 'json', content: {} },
      timestamp: Date.now(),
    }));

    this.registerHandler('GET /export/csv', async () => ({
      success: true,
      data: { format: 'csv', content: '' },
      timestamp: Date.now(),
    }));

    // Prediction endpoint
    this.registerHandler('POST /predict', async (params) => {
      const { x, y } = params as { x: number; y: number };
      return {
        success: true,
        data: { x, y, prediction: 0, confidence: 0.5 },
        timestamp: Date.now(),
      };
    });

    // Batch prediction
    this.registerHandler('POST /predict/batch', async (params) => {
      const { points } = params as { points: Array<{ x: number; y: number }> };
      return {
        success: true,
        data: {
          predictions: points?.map(p => ({
            x: p.x,
            y: p.y,
            prediction: 0,
            confidence: 0.5,
          })) ?? [],
        },
        timestamp: Date.now(),
      };
    });

    // Help endpoint
    this.registerHandler('GET /help', async () => ({
      success: true,
      data: {
        endpoints: [
          'GET /status - API status',
          'GET /training/status - Training status',
          'POST /training/start - Start training',
          'POST /training/pause - Pause training',
          'POST /training/reset - Reset model',
          'POST /training/step - Single training step',
          'GET /model/config - Get model configuration',
          'POST /model/config - Update model configuration',
          'GET /dataset/info - Get dataset info',
          'POST /dataset/load - Load dataset',
          'GET /export/json - Export as JSON',
          'GET /export/csv - Export as CSV',
          'POST /predict - Single prediction',
          'POST /predict/batch - Batch predictions',
        ],
        usage: 'window.neurovizAPI.call("GET /status")',
      },
      timestamp: Date.now(),
    }));
  }

  /**
   * Lists all available endpoints.
   */
  listEndpoints(): string[] {
    return Array.from(this.handlers.keys());
  }
}

/**
 * Singleton API instance.
 */
export const restAPI = new RestAPI();
