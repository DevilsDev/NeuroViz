import type { TrainingHistory } from '../../core/domain/TrainingHistory';
import type { Hyperparameters } from '../../core/domain/Hyperparameters';

/**
 * Training report data
 */
export interface TrainingReportData {
  readonly config: Hyperparameters;
  readonly history: TrainingHistory;
  readonly datasetInfo: {
    readonly name: string;
    readonly samples: number;
    readonly classes: number;
  };
  readonly finalMetrics: {
    readonly loss: number;
    readonly accuracy: number;
    readonly valLoss?: number;
    readonly valAccuracy?: number;
  };
  readonly confusionMatrix?: number[][];
  readonly classMetrics?: {
    readonly precision: number;
    readonly recall: number;
    readonly f1: number;
  };
}

/**
 * Generates an HTML training report
 */
export function generateHTMLReport(data: TrainingReportData): string {
  const timestamp = new Date().toLocaleString();
  const duration = (data.history.totalTimeMs / 1000).toFixed(1);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NeuroViz Training Report - ${timestamp}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #e2e8f0;
      padding: 2rem;
      line-height: 1.6;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: #1e293b;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 { color: #38bdf8; margin-bottom: 0.5rem; font-size: 2rem; }
    h2 { color: #22d3ee; margin-top: 2rem; margin-bottom: 1rem; border-bottom: 2px solid #334155; padding-bottom: 0.5rem; }
    h3 { color: #94a3b8; margin-top: 1.5rem; margin-bottom: 0.5rem; }
    .timestamp { color: #64748b; font-size: 0.9rem; margin-bottom: 2rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1rem 0; }
    .metric-card {
      background: #0f172a;
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid #334155;
    }
    .metric-label { color: #94a3b8; font-size: 0.85rem; margin-bottom: 0.25rem; }
    .metric-value { color: #38bdf8; font-size: 1.5rem; font-weight: bold; }
    .config-table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }
    .config-table td {
      padding: 0.5rem;
      border-bottom: 1px solid #334155;
    }
    .config-table td:first-child {
      color: #94a3b8;
      font-weight: 500;
      width: 200px;
    }
    .config-table td:last-child {
      color: #e2e8f0;
      font-family: 'Courier New', monospace;
    }
    .chart-placeholder {
      background: #0f172a;
      border: 2px dashed #334155;
      border-radius: 8px;
      padding: 3rem;
      text-align: center;
      color: #64748b;
      margin: 1rem 0;
    }
    .footer {
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid #334155;
      text-align: center;
      color: #64748b;
      font-size: 0.85rem;
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: #38bdf8;
      color: #0f172a;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: bold;
      margin-left: 0.5rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧠 NeuroViz Training Report</h1>
    <div class="timestamp">Generated: ${timestamp}</div>

    <h2>Summary</h2>
    <div class="grid">
      <div class="metric-card">
        <div class="metric-label">Final Loss</div>
        <div class="metric-value">${data.finalMetrics.loss.toFixed(4)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Final Accuracy</div>
        <div class="metric-value">${(data.finalMetrics.accuracy * 100).toFixed(1)}%</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Total Epochs</div>
        <div class="metric-value">${data.history.records.length}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Training Time</div>
        <div class="metric-value">${duration}s</div>
      </div>
    </div>

    ${data.classMetrics ? `
    <h3>Classification Metrics</h3>
    <div class="grid">
      <div class="metric-card">
        <div class="metric-label">Precision</div>
        <div class="metric-value">${(data.classMetrics.precision * 100).toFixed(1)}%</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Recall</div>
        <div class="metric-value">${(data.classMetrics.recall * 100).toFixed(1)}%</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">F1 Score</div>
        <div class="metric-value">${(data.classMetrics.f1 * 100).toFixed(1)}%</div>
      </div>
    </div>
    ` : ''}

    <h2>Configuration</h2>
    <table class="config-table">
      <tr>
        <td>Dataset</td>
        <td>${data.datasetInfo.name} <span class="badge">${data.datasetInfo.samples} samples</span></td>
      </tr>
      <tr>
        <td>Architecture</td>
        <td>[2, ${data.config.layers.join(', ')}, ${data.datasetInfo.classes}]</td>
      </tr>
      <tr>
        <td>Learning Rate</td>
        <td>${data.config.learningRate}</td>
      </tr>
      <tr>
        <td>Optimizer</td>
        <td>${data.config.optimizer ?? 'adam'}</td>
      </tr>
      <tr>
        <td>Activation</td>
        <td>${data.config.activation ?? 'relu'}</td>
      </tr>
      ${data.config.l2Regularization ? `
      <tr>
        <td>L2 Regularization</td>
        <td>${data.config.l2Regularization}</td>
      </tr>
      ` : ''}
      ${data.config.dropoutRate ? `
      <tr>
        <td>Dropout Rate</td>
        <td>${data.config.dropoutRate}</td>
      </tr>
      ` : ''}
    </table>

    <h2>Training Progress</h2>
    <div class="chart-placeholder">
      📊 Loss curve would be rendered here<br>
      <small>Best Loss: ${data.history.bestLoss?.toFixed(4) ?? 'N/A'} at epoch ${data.history.bestEpoch ?? 'N/A'}</small>
    </div>

    ${data.confusionMatrix ? `
    <h2>Confusion Matrix</h2>
    <div class="chart-placeholder">
      📈 Confusion matrix visualization would appear here
    </div>
    ` : ''}

    <div class="footer">
      <p>Generated by <strong>NeuroViz</strong> - Interactive Neural Network Playground</p>
      <p style="margin-top: 0.5rem;">Learn more at <a href="https://github.com" style="color: #38bdf8;">github.com/NeuroViz</a></p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Downloads the HTML report as a file
 */
export function downloadHTMLReport(html: string, filename: string = 'neuroviz-report.html'): void {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
