/**
 * Plugin System for NeuroViz
 * 
 * Enables extensibility through a plugin architecture.
 * Plugins can add new datasets, visualizations, export formats, and more.
 */

export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  homepage?: string;
}

export interface PluginHooks {
  /** Called when plugin is loaded */
  onLoad?: () => void | Promise<void>;
  /** Called when plugin is unloaded */
  onUnload?: () => void | Promise<void>;
  /** Called before each training step */
  onBeforeTrainStep?: (epoch: number) => void;
  /** Called after each training step */
  onAfterTrainStep?: (epoch: number, loss: number, accuracy: number) => void;
  /** Called when dataset changes */
  onDatasetChange?: (datasetType: string, points: unknown[]) => void;
  /** Called when model config changes */
  onConfigChange?: (config: Record<string, unknown>) => void;
  /** Called when visualization updates */
  onVisualizationUpdate?: () => void;
}

export interface PluginCapabilities {
  /** Custom dataset generators */
  datasets?: Array<{
    id: string;
    name: string;
    generate: (samples: number, noise: number) => Array<{ x: number; y: number; label: number }>;
  }>;
  /** Custom visualization panels */
  visualizations?: Array<{
    id: string;
    name: string;
    render: (container: HTMLElement) => void;
    update?: () => void;
  }>;
  /** Custom export formats */
  exportFormats?: Array<{
    id: string;
    name: string;
    extension: string;
    export: () => string | Blob;
  }>;
  /** Custom toolbar buttons */
  toolbarButtons?: Array<{
    id: string;
    label: string;
    icon?: string;
    onClick: () => void;
  }>;
  /** Custom metrics */
  metrics?: Array<{
    id: string;
    name: string;
    compute: (predictions: number[], labels: number[]) => number;
  }>;
}

export interface Plugin {
  metadata: PluginMetadata;
  hooks?: PluginHooks;
  capabilities?: PluginCapabilities;
}

export interface PluginState {
  plugin: Plugin;
  isLoaded: boolean;
  loadedAt: number;
  error?: string;
}

/**
 * Manages plugin lifecycle and provides extension points.
 */
export class PluginManager {
  private plugins: Map<string, PluginState> = new Map();
  private hookListeners: Map<keyof PluginHooks, Set<(...args: unknown[]) => void>> = new Map();

  constructor() {
    // Initialize hook listener sets
    const hookNames: Array<keyof PluginHooks> = [
      'onLoad', 'onUnload', 'onBeforeTrainStep', 'onAfterTrainStep',
      'onDatasetChange', 'onConfigChange', 'onVisualizationUpdate',
    ];
    hookNames.forEach(name => this.hookListeners.set(name, new Set()));
  }

  /**
   * Registers a plugin.
   */
  async register(plugin: Plugin): Promise<boolean> {
    const { id } = plugin.metadata;

    if (this.plugins.has(id)) {
      console.warn(`Plugin ${id} is already registered`);
      return false;
    }

    const state: PluginState = {
      plugin,
      isLoaded: false,
      loadedAt: 0,
    };

    this.plugins.set(id, state);
    console.log(`Plugin registered: ${plugin.metadata.name} v${plugin.metadata.version}`);

    return true;
  }

  /**
   * Loads a registered plugin.
   */
  async load(pluginId: string): Promise<boolean> {
    const state = this.plugins.get(pluginId);
    
    if (!state) {
      console.error(`Plugin ${pluginId} not found`);
      return false;
    }

    if (state.isLoaded) {
      console.warn(`Plugin ${pluginId} is already loaded`);
      return true;
    }

    try {
      // Call onLoad hook
      if (state.plugin.hooks?.onLoad) {
        await state.plugin.hooks.onLoad();
      }

      // Register hook listeners
      if (state.plugin.hooks) {
        this.registerHooks(state.plugin.hooks);
      }

      state.isLoaded = true;
      state.loadedAt = Date.now();
      state.error = undefined;

      console.log(`Plugin loaded: ${state.plugin.metadata.name}`);
      return true;
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to load plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Unloads a plugin.
   */
  async unload(pluginId: string): Promise<boolean> {
    const state = this.plugins.get(pluginId);
    
    if (!state) {
      console.error(`Plugin ${pluginId} not found`);
      return false;
    }

    if (!state.isLoaded) {
      console.warn(`Plugin ${pluginId} is not loaded`);
      return true;
    }

    try {
      // Call onUnload hook
      if (state.plugin.hooks?.onUnload) {
        await state.plugin.hooks.onUnload();
      }

      // Unregister hook listeners
      if (state.plugin.hooks) {
        this.unregisterHooks(state.plugin.hooks);
      }

      state.isLoaded = false;
      console.log(`Plugin unloaded: ${state.plugin.metadata.name}`);
      return true;
    } catch (error) {
      console.error(`Failed to unload plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Unregisters a plugin completely.
   */
  async unregister(pluginId: string): Promise<boolean> {
    await this.unload(pluginId);
    return this.plugins.delete(pluginId);
  }

  /**
   * Gets a plugin by ID.
   */
  get(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId)?.plugin;
  }

  /**
   * Gets all registered plugins.
   */
  getAll(): Plugin[] {
    return Array.from(this.plugins.values()).map(s => s.plugin);
  }

  /**
   * Gets all loaded plugins.
   */
  getLoaded(): Plugin[] {
    return Array.from(this.plugins.values())
      .filter(s => s.isLoaded)
      .map(s => s.plugin);
  }

  /**
   * Checks if a plugin is loaded.
   */
  isLoaded(pluginId: string): boolean {
    return this.plugins.get(pluginId)?.isLoaded ?? false;
  }

  /**
   * Triggers a hook on all loaded plugins.
   */
  triggerHook<K extends keyof PluginHooks>(
    hookName: K,
    ...args: Parameters<NonNullable<PluginHooks[K]>>
  ): void {
    const listeners = this.hookListeners.get(hookName);
    if (!listeners) return;

    listeners.forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Hook ${hookName} error:`, error);
      }
    });
  }

  /**
   * Gets all custom datasets from loaded plugins.
   */
  getCustomDatasets(): NonNullable<PluginCapabilities['datasets']> {
    const datasets: NonNullable<PluginCapabilities['datasets']> = [];
    
    for (const state of this.plugins.values()) {
      if (state.isLoaded && state.plugin.capabilities?.datasets) {
        datasets.push(...state.plugin.capabilities.datasets);
      }
    }
    
    return datasets;
  }

  /**
   * Gets all custom visualizations from loaded plugins.
   */
  getCustomVisualizations(): NonNullable<PluginCapabilities['visualizations']> {
    const visualizations: NonNullable<PluginCapabilities['visualizations']> = [];
    
    for (const state of this.plugins.values()) {
      if (state.isLoaded && state.plugin.capabilities?.visualizations) {
        visualizations.push(...state.plugin.capabilities.visualizations);
      }
    }
    
    return visualizations;
  }

  /**
   * Gets all custom export formats from loaded plugins.
   */
  getCustomExportFormats(): NonNullable<PluginCapabilities['exportFormats']> {
    const formats: NonNullable<PluginCapabilities['exportFormats']> = [];
    
    for (const state of this.plugins.values()) {
      if (state.isLoaded && state.plugin.capabilities?.exportFormats) {
        formats.push(...state.plugin.capabilities.exportFormats);
      }
    }
    
    return formats;
  }

  /**
   * Gets all custom toolbar buttons from loaded plugins.
   */
  getCustomToolbarButtons(): NonNullable<PluginCapabilities['toolbarButtons']> {
    const buttons: NonNullable<PluginCapabilities['toolbarButtons']> = [];
    
    for (const state of this.plugins.values()) {
      if (state.isLoaded && state.plugin.capabilities?.toolbarButtons) {
        buttons.push(...state.plugin.capabilities.toolbarButtons);
      }
    }
    
    return buttons;
  }

  /**
   * Gets all custom metrics from loaded plugins.
   */
  getCustomMetrics(): NonNullable<PluginCapabilities['metrics']> {
    const metrics: NonNullable<PluginCapabilities['metrics']> = [];
    
    for (const state of this.plugins.values()) {
      if (state.isLoaded && state.plugin.capabilities?.metrics) {
        metrics.push(...state.plugin.capabilities.metrics);
      }
    }
    
    return metrics;
  }

  /**
   * Registers hook listeners from a plugin.
   */
  private registerHooks(hooks: PluginHooks): void {
    for (const [name, handler] of Object.entries(hooks)) {
      if (typeof handler === 'function') {
        this.hookListeners.get(name as keyof PluginHooks)?.add(handler);
      }
    }
  }

  /**
   * Unregisters hook listeners from a plugin.
   */
  private unregisterHooks(hooks: PluginHooks): void {
    for (const [name, handler] of Object.entries(hooks)) {
      if (typeof handler === 'function') {
        this.hookListeners.get(name as keyof PluginHooks)?.delete(handler);
      }
    }
  }
}

/**
 * Singleton plugin manager instance.
 */
export const pluginManager = new PluginManager();

/**
 * Helper to create a plugin with type safety.
 */
export function definePlugin(plugin: Plugin): Plugin {
  return plugin;
}
