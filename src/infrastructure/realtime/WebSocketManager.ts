/**
 * WebSocket Manager for Real-time Updates
 * 
 * Enables live collaboration and real-time synchronization between
 * multiple NeuroViz instances or external tools.
 */

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
}

export interface RealtimeMessage {
  type: string;
  payload: unknown;
  timestamp: number;
  senderId: string;
}

export interface TrainingUpdate {
  epoch: number;
  loss: number;
  accuracy: number;
  valLoss?: number;
  valAccuracy?: number;
}

export interface ConfigUpdate {
  learningRate?: number;
  layers?: number[];
  activation?: string;
  optimizer?: string;
}

type MessageHandler = (message: RealtimeMessage) => void;

/**
 * Manages WebSocket connections for real-time collaboration.
 */
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private reconnectAttempts: number = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private clientId: string;
  private isConnecting: boolean = false;

  constructor(config?: Partial<WebSocketConfig>) {
    this.config = {
      url: 'ws://localhost:8080',
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      ...config,
    };
    this.clientId = this.generateClientId();
  }

  /**
   * Generates a unique client ID.
   */
  private generateClientId(): string {
    return `neuroviz-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Connects to the WebSocket server.
   */
  connect(url?: string): Promise<void> {
    if (url) this.config.url = url;
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    if (this.isConnecting) {
      return Promise.reject(new Error('Connection already in progress'));
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.emit('connected', { clientId: this.clientId });
          resolve();
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          this.isConnecting = false;
          this.stopHeartbeat();
          this.emit('disconnected', { code: event.code, reason: event.reason });
          this.scheduleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          this.emit('error', { error });
          reject(error);
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as RealtimeMessage;
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnects from the WebSocket server.
   */
  disconnect(): void {
    this.stopHeartbeat();
    this.cancelReconnect();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  /**
   * Sends a message to the server.
   */
  send(type: string, payload: unknown): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected');
      return false;
    }

    const message: RealtimeMessage = {
      type,
      payload,
      timestamp: Date.now(),
      senderId: this.clientId,
    };

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      return false;
    }
  }

  /**
   * Broadcasts a training update.
   */
  broadcastTrainingUpdate(update: TrainingUpdate): boolean {
    return this.send('training:update', update);
  }

  /**
   * Broadcasts a configuration change.
   */
  broadcastConfigUpdate(config: ConfigUpdate): boolean {
    return this.send('config:update', config);
  }

  /**
   * Broadcasts dataset change.
   */
  broadcastDatasetChange(datasetType: string, samples: number): boolean {
    return this.send('dataset:change', { type: datasetType, samples });
  }

  /**
   * Subscribes to a message type.
   */
  on(type: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  /**
   * Unsubscribes from a message type.
   */
  off(type: string, handler: MessageHandler): void {
    this.handlers.get(type)?.delete(handler);
  }

  /**
   * Emits a message to local handlers.
   */
  private emit(type: string, payload: unknown): void {
    const message: RealtimeMessage = {
      type,
      payload,
      timestamp: Date.now(),
      senderId: this.clientId,
    };
    this.handleMessage(message);
  }

  /**
   * Handles incoming messages.
   */
  private handleMessage(message: RealtimeMessage): void {
    // Skip own messages
    if (message.senderId === this.clientId && !message.type.startsWith('local:')) {
      return;
    }

    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Message handler error:', error);
        }
      });
    }

    // Also emit to wildcard handlers
    const wildcardHandlers = this.handlers.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Wildcard handler error:', error);
        }
      });
    }
  }

  /**
   * Starts the heartbeat timer.
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send('heartbeat', { clientId: this.clientId });
    }, this.config.heartbeatInterval);
  }

  /**
   * Stops the heartbeat timer.
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Schedules a reconnection attempt.
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      this.emit('reconnect:failed', { attempts: this.reconnectAttempts });
      return;
    }

    this.reconnectAttempts++;
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts}`);

    this.reconnectTimer = setTimeout(() => {
      this.emit('reconnect:attempt', { attempt: this.reconnectAttempts });
      void this.connect().catch(() => {
        // Error handled in connect()
      });
    }, this.config.reconnectInterval);
  }

  /**
   * Cancels any pending reconnection.
   */
  private cancelReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;
  }

  /**
   * Gets the connection status.
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Gets the client ID.
   */
  getClientId(): string {
    return this.clientId;
  }
}

/**
 * Singleton WebSocket manager instance.
 */
export const wsManager = new WebSocketManager();
