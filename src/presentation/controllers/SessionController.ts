import { TrainingSession } from '../../core/application/TrainingSession';
import { D3Chart } from '../../infrastructure/d3/D3Chart';
import { LocalStorageService } from '../../infrastructure/storage/LocalStorageService';
import { toast } from '../toast';
import { Point, ColourScheme } from '../../core/domain';

export interface SessionElements {
    btnSaveSession: HTMLButtonElement;
    btnLoadSession: HTMLButtonElement;
    btnClearSession: HTMLButtonElement;
    btnShareUrl: HTMLButtonElement;
    btnLoadConfig: HTMLButtonElement;

    // Bookmarks
    inputBookmarkName: HTMLInputElement;
    btnSaveBookmark: HTMLButtonElement;
    bookmarkOptions: HTMLDivElement;
    btnDeleteBookmark: HTMLButtonElement;
    presetSelect: HTMLSelectElement; // Reused for bookmarks

    // Theme
    iconSun: HTMLElement;
    iconMoon: HTMLElement;
    btnThemeToggle: HTMLButtonElement;

    // Inputs for config application
    datasetSelect: HTMLSelectElement;
    inputSamples: HTMLInputElement;
    samplesValue: HTMLSpanElement;
    inputNoise: HTMLInputElement;
    noiseValue: HTMLSpanElement;
    inputNumClasses: HTMLSelectElement;
    inputLr: HTMLInputElement;
    inputLayers: HTMLInputElement;
    inputOptimizer: HTMLSelectElement;
    inputActivation: HTMLSelectElement;
    inputL2: HTMLInputElement;
    inputBatchSize: HTMLInputElement;
    inputMaxEpochs: HTMLInputElement;
    inputFps: HTMLInputElement;
    fpsValue: HTMLSpanElement;
    inputValSplit: HTMLSelectElement;
    inputColourScheme: HTMLSelectElement;
    inputPointSize: HTMLInputElement;
    inputOpacity: HTMLInputElement;
    opacityValue: HTMLSpanElement;
    inputZoom: HTMLInputElement;
    inputTooltips: HTMLInputElement;
    inputBalance: HTMLInputElement;
    balanceValue: HTMLSpanElement;

    // Additional inputs for sharing
    inputMomentum: HTMLInputElement;
    momentumValue: HTMLSpanElement;
    inputL1: HTMLInputElement;
    inputDropout: HTMLSelectElement;
    inputClipNorm: HTMLSelectElement;
    inputBatchNorm: HTMLInputElement;
    inputLrSchedule: HTMLSelectElement;
    inputWarmup: HTMLInputElement;
    inputCycleLength: HTMLInputElement;
    inputMinLr: HTMLInputElement;
    momentumControl: HTMLDivElement; // To toggle visibility
}

const SESSION_KEY = 'neuroviz-session';
const BOOKMARKS_KEY = 'neuroviz-bookmarks';
const THEME_KEY = 'neuroviz-theme';

export interface BookmarkConfig {
    id: string;
    name: string;
    createdAt: number;
    config: {
        datasetType: string;
        samples: number;
        noise: number;
        numClasses: number;
        classBalance: number;
        learningRate: number;
        layers: string;
        optimizer: string;
        activation: string;
        l2Regularization: number;
        batchSize: number;
        maxEpochs: number;
        targetFps: number;
        validationSplit: number;
    };
}

export interface SessionData {
    version: number;
    timestamp: number;
    config: {
        datasetType: string;
        samples: number;
        noise: number;
        numClasses: number;
        learningRate: number;
        layers: string;
        optimizer: string;
        activation: string;
        l2Regularization: number;
        batchSize: number;
        maxEpochs: number;
        targetFps: number;
        validationSplit: number;
        colourScheme: string;
        pointSize: string;
        opacity: number;
        zoomEnabled: boolean;
        tooltipsEnabled: boolean;
    };
    data: Point[];
    history: any; // Using any to avoid readonly mismatch with TrainingHistory
}

export class SessionController {
    constructor(
        private session: TrainingSession,
        private visualizerService: D3Chart,
        private storage: LocalStorageService,
        private elements: SessionElements,
        private callbacks: {
            onConfigLoaded: () => void;
            onThemeChanged: (theme: 'light' | 'dark') => void;
        }
    ) {
        this.bindEvents();
        this.initTheme();
        this.renderBookmarkOptions();
    }

    private bindEvents(): void {
        this.elements.btnSaveSession.addEventListener('click', () => this.saveSession());
        this.elements.btnLoadSession.addEventListener('click', () => void this.loadSession());
        this.elements.btnClearSession.addEventListener('click', () => this.clearSession());
        this.elements.btnShareUrl.addEventListener('click', () => this.handleShareUrl());
        this.elements.btnLoadConfig.addEventListener('click', () => this.handleLoadConfigCode());

        this.elements.btnSaveBookmark.addEventListener('click', () => this.handleSaveBookmark());
        this.elements.btnDeleteBookmark.addEventListener('click', () => this.handleDeleteBookmark());
        this.elements.btnThemeToggle.addEventListener('click', () => this.handleThemeToggle());

        // Handle bookmark selection via preset select
        this.elements.presetSelect.addEventListener('change', () => {
            const value = this.elements.presetSelect.value;
            if (value.startsWith('bookmark:')) {
                const bookmarkId = value.replace('bookmark:', '');
                const bookmarks = this.loadBookmarks();
                const bookmark = bookmarks.find(b => b.id === bookmarkId);
                if (bookmark) {
                    this.applyBookmarkConfig(bookmark);
                    this.elements.btnDeleteBookmark.disabled = false;
                }
            } else {
                this.elements.btnDeleteBookmark.disabled = true;
            }
        });
    }

    // Theme Management

    private initTheme(): void {
        const stored = this.storage.getItem<string>(THEME_KEY).data;
        const theme = stored === 'light' || stored === 'dark'
            ? stored
            : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

        this.applyTheme(theme);
    }

    private applyTheme(theme: 'light' | 'dark'): void {
        const html = document.documentElement;

        if (theme === 'dark') {
            html.classList.add('dark');
            document.body.removeAttribute('data-theme');
            this.elements.iconSun.classList.remove('hidden');
            this.elements.iconMoon.classList.add('hidden');
        } else {
            html.classList.remove('dark');
            document.body.setAttribute('data-theme', 'light');
            this.elements.iconSun.classList.add('hidden');
            this.elements.iconMoon.classList.remove('hidden');
        }

        this.storage.setItem(THEME_KEY, theme);
        this.callbacks.onThemeChanged(theme);
    }

    private handleThemeToggle(): void {
        const isDark = document.documentElement.classList.contains('dark');
        const newTheme = isDark ? 'light' : 'dark';
        this.applyTheme(newTheme);
        toast.info(`Switched to ${newTheme} theme`);
    }

    // Session Management

    private collectSessionConfig(): SessionData['config'] {
        return {
            datasetType: this.elements.datasetSelect.value,
            samples: parseInt(this.elements.inputSamples.value, 10) || 200,
            noise: parseInt(this.elements.inputNoise.value, 10) || 10,
            numClasses: parseInt(this.elements.inputNumClasses.value, 10) || 2,
            learningRate: parseFloat(this.elements.inputLr.value) || 0.03,
            layers: this.elements.inputLayers.value,
            optimizer: this.elements.inputOptimizer.value,
            activation: this.elements.inputActivation.value,
            l2Regularization: parseFloat(this.elements.inputL2.value) || 0,
            batchSize: parseInt(this.elements.inputBatchSize.value, 10) || 0,
            maxEpochs: parseInt(this.elements.inputMaxEpochs.value, 10) || 0,
            targetFps: parseInt(this.elements.inputFps.value, 10) || 60,
            validationSplit: parseInt(this.elements.inputValSplit.value, 10) / 100,
            colourScheme: this.elements.inputColourScheme.value,
            pointSize: this.elements.inputPointSize.value,
            opacity: parseInt(this.elements.inputOpacity.value, 10),
            zoomEnabled: this.elements.inputZoom.checked,
            tooltipsEnabled: this.elements.inputTooltips.checked,
        };
    }

    private saveSession(): void {
        try {
            const data: SessionData = {
                version: 1,
                timestamp: Date.now(),
                config: this.collectSessionConfig(),
                data: this.session.getData(),
                history: this.session.getHistory(),
            };

            this.storage.setItem(SESSION_KEY, data);
            toast.success('Session saved successfully!');
        } catch (error) {
            console.error('Failed to save session:', error);
            toast.error('Failed to save session');
        }
    }

    private async loadSession(): Promise<void> {
        try {
            const result = this.storage.getItem<SessionData>(SESSION_KEY);
            if (!result.success || !result.data) {
                toast.info('No saved session found');
                return;
            }

            const data = result.data;

            // Restore config
            this.elements.datasetSelect.value = data.config.datasetType;
            this.elements.inputSamples.value = data.config.samples.toString();
            this.elements.samplesValue.textContent = data.config.samples.toString();
            this.elements.inputNoise.value = data.config.noise.toString();
            this.elements.noiseValue.textContent = data.config.noise.toString();
            this.elements.inputNumClasses.value = data.config.numClasses.toString();
            this.elements.inputLr.value = data.config.learningRate.toString();
            this.elements.inputLayers.value = data.config.layers;
            this.elements.inputOptimizer.value = data.config.optimizer;
            this.elements.inputActivation.value = data.config.activation;
            this.elements.inputL2.value = data.config.l2Regularization.toString();
            this.elements.inputBatchSize.value = data.config.batchSize.toString();
            this.elements.inputMaxEpochs.value = data.config.maxEpochs.toString();
            this.elements.inputFps.value = data.config.targetFps.toString();
            this.elements.fpsValue.textContent = data.config.targetFps.toString();
            this.elements.inputValSplit.value = (data.config.validationSplit * 100).toString();
            this.elements.inputColourScheme.value = data.config.colourScheme;
            this.elements.inputPointSize.value = data.config.pointSize;
            this.elements.inputOpacity.value = data.config.opacity.toString();
            this.elements.opacityValue.textContent = data.config.opacity.toString();
            this.elements.inputZoom.checked = data.config.zoomEnabled;
            this.elements.inputTooltips.checked = data.config.tooltipsEnabled;

            // Trigger updates
            this.callbacks.onConfigLoaded();

            // Restore data
            if (data.data && data.data.length > 0) {
                this.session.setCustomData(data.data);
            }

            toast.success('Session loaded successfully!');
        } catch (error) {
            console.error('Failed to load session:', error);
            toast.error('Failed to load session');
        }
    }

    private clearSession(): void {
        this.storage.removeItem(SESSION_KEY);
        toast.info('Saved session cleared');
    }

    // Bookmarks

    private loadBookmarks(): BookmarkConfig[] {
        const result = this.storage.getItem<BookmarkConfig[]>(BOOKMARKS_KEY);
        return result.success && result.data ? result.data : [];
    }

    private saveBookmarks(bookmarks: BookmarkConfig[]): void {
        this.storage.setItem(BOOKMARKS_KEY, bookmarks);
    }

    private renderBookmarkOptions(): void {
        const bookmarks = this.loadBookmarks();

        // Remove existing bookmarks from select
        if (this.elements.presetSelect && this.elements.presetSelect.options) {
            Array.from(this.elements.presetSelect.options).forEach(option => {
                if (option.value.startsWith('bookmark:') || option.text === '──────────') {
                    option.remove();
                }
            });
        }

        // Add divider if needed
        if (bookmarks.length > 0) {
            const divider = document.createElement('option');
            divider.disabled = true;
            divider.text = '──────────';
            this.elements.presetSelect.add(divider);

            // Add bookmarks
            bookmarks.forEach(b => {
                const option = document.createElement('option');
                option.value = `bookmark:${b.id}`;
                option.text = `🔖 ${b.name}`;
                this.elements.presetSelect.add(option);
            });
        }
    }

    private handleSaveBookmark(): void {
        const name = this.elements.inputBookmarkName.value.trim();
        if (!name) {
            toast.warning('Please enter a name for the bookmark');
            return;
        }

        const config: BookmarkConfig = {
            id: crypto.randomUUID(),
            name,
            createdAt: Date.now(),
            config: {
                datasetType: this.elements.datasetSelect.value,
                samples: parseInt(this.elements.inputSamples.value, 10) || 200,
                noise: parseInt(this.elements.inputNoise.value, 10) || 10,
                numClasses: parseInt(this.elements.inputNumClasses.value, 10) || 2,
                classBalance: parseInt(this.elements.inputBalance.value, 10) || 50,
                learningRate: parseFloat(this.elements.inputLr.value) || 0.03,
                layers: this.elements.inputLayers.value,
                optimizer: this.elements.inputOptimizer.value,
                activation: this.elements.inputActivation.value,
                l2Regularization: parseFloat(this.elements.inputL2.value) || 0,
                batchSize: parseInt(this.elements.inputBatchSize.value, 10) || 0,
                maxEpochs: parseInt(this.elements.inputMaxEpochs.value, 10) || 0,
                targetFps: parseInt(this.elements.inputFps.value, 10) || 60,
                validationSplit: parseInt(this.elements.inputValSplit.value, 10) / 100,
            }
        };

        const bookmarks = this.loadBookmarks();
        bookmarks.push(config);
        this.saveBookmarks(bookmarks);
        this.renderBookmarkOptions();

        this.elements.inputBookmarkName.value = '';
        toast.success(`Bookmark "${name}" saved!`);
    }

    private handleDeleteBookmark(): void {
        const value = this.elements.presetSelect.value;
        if (!value.startsWith('bookmark:')) return;

        const bookmarkId = value.replace('bookmark:', '');
        const bookmarks = this.loadBookmarks();
        const newBookmarks = bookmarks.filter(b => b.id !== bookmarkId);

        this.saveBookmarks(newBookmarks);
        this.renderBookmarkOptions();
        this.elements.presetSelect.value = 'circle'; // Default to circle
        this.elements.btnDeleteBookmark.disabled = true;

        toast.info('Bookmark deleted');
    }

    private applyBookmarkConfig(bookmark: BookmarkConfig): void {
        const c = bookmark.config;

        this.elements.datasetSelect.value = c.datasetType;
        this.elements.inputSamples.value = c.samples.toString();
        this.elements.samplesValue.textContent = c.samples.toString();
        this.elements.inputNoise.value = c.noise.toString();
        this.elements.noiseValue.textContent = c.noise.toString();
        this.elements.inputNumClasses.value = c.numClasses.toString();
        this.elements.inputBalance.value = c.classBalance.toString();
        this.elements.balanceValue.textContent = c.classBalance.toString();

        this.elements.inputLr.value = c.learningRate.toString();
        this.elements.inputLayers.value = c.layers;
        this.elements.inputOptimizer.value = c.optimizer;
        this.elements.inputActivation.value = c.activation;
        this.elements.inputL2.value = c.l2Regularization.toString();
        this.elements.inputBatchSize.value = c.batchSize.toString();
        this.elements.inputMaxEpochs.value = c.maxEpochs.toString();
        this.elements.inputFps.value = c.targetFps.toString();
        this.elements.fpsValue.textContent = c.targetFps.toString();
        this.elements.inputValSplit.value = (c.validationSplit * 100).toString();

        this.callbacks.onConfigLoaded();
        toast.success(`Loaded bookmark: ${bookmark.name}`);
    }

    // Sharing

    private handleShareUrl(): void {
        const config = this.collectSessionConfig();
        const json = JSON.stringify(config);
        const encoded = btoa(json);
        const url = `${window.location.origin}${window.location.pathname}?config=${encoded}`;

        navigator.clipboard.writeText(url).then(() => {
            toast.success('Configuration URL copied to clipboard!');
        }).catch(() => {
            toast.error('Failed to copy URL');
        });
    }

    private handleLoadConfigCode(): void {
        const code = prompt('Paste configuration code here:');
        if (!code) return;

        try {
            const json = atob(code);
            const config = JSON.parse(json);

            // Apply config (simplified version of applyBookmarkConfig)
            if (config.datasetType) this.elements.datasetSelect.value = config.datasetType;
            if (config.learningRate) this.elements.inputLr.value = config.learningRate;
            if (config.layers) this.elements.inputLayers.value = config.layers;

            this.callbacks.onConfigLoaded();
            toast.success('Configuration loaded!');
        } catch (error) {
            console.error('Invalid configuration code:', error);
            toast.error('Invalid configuration code');
        }
    }
}
