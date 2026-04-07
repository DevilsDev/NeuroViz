function a(e){const i=new Date().toLocaleString(),t=(e.history.totalTimeMs/1e3).toFixed(1);return`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NeuroViz Training Report - ${i}</title>
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
    <div class="timestamp">Generated: ${i}</div>

    <h2>Summary</h2>
    <div class="grid">
      <div class="metric-card">
        <div class="metric-label">Final Loss</div>
        <div class="metric-value">${e.finalMetrics.loss.toFixed(4)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Final Accuracy</div>
        <div class="metric-value">${(e.finalMetrics.accuracy*100).toFixed(1)}%</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Total Epochs</div>
        <div class="metric-value">${e.history.records.length}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Training Time</div>
        <div class="metric-value">${t}s</div>
      </div>
    </div>

    ${e.classMetrics?`
    <h3>Classification Metrics</h3>
    <div class="grid">
      <div class="metric-card">
        <div class="metric-label">Precision</div>
        <div class="metric-value">${(e.classMetrics.precision*100).toFixed(1)}%</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Recall</div>
        <div class="metric-value">${(e.classMetrics.recall*100).toFixed(1)}%</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">F1 Score</div>
        <div class="metric-value">${(e.classMetrics.f1*100).toFixed(1)}%</div>
      </div>
    </div>
    `:""}

    <h2>Configuration</h2>
    <table class="config-table">
      <tr>
        <td>Dataset</td>
        <td>${e.datasetInfo.name} <span class="badge">${e.datasetInfo.samples} samples</span></td>
      </tr>
      <tr>
        <td>Architecture</td>
        <td>[2, ${e.config.layers.join(", ")}, ${e.datasetInfo.classes}]</td>
      </tr>
      <tr>
        <td>Learning Rate</td>
        <td>${e.config.learningRate}</td>
      </tr>
      <tr>
        <td>Optimizer</td>
        <td>${e.config.optimizer??"adam"}</td>
      </tr>
      <tr>
        <td>Activation</td>
        <td>${e.config.activation??"relu"}</td>
      </tr>
      ${e.config.l2Regularization?`
      <tr>
        <td>L2 Regularization</td>
        <td>${e.config.l2Regularization}</td>
      </tr>
      `:""}
      ${e.config.dropoutRate?`
      <tr>
        <td>Dropout Rate</td>
        <td>${e.config.dropoutRate}</td>
      </tr>
      `:""}
    </table>

    <h2>Training Progress</h2>
    <div class="chart-placeholder">
      📊 Loss curve would be rendered here<br>
      <small>Best Loss: ${e.history.bestLoss?.toFixed(4)??"N/A"} at epoch ${e.history.bestEpoch??"N/A"}</small>
    </div>

    ${e.confusionMatrix?`
    <h2>Confusion Matrix</h2>
    <div class="chart-placeholder">
      📈 Confusion matrix visualization would appear here
    </div>
    `:""}

    <div class="footer">
      <p>Generated by <strong>NeuroViz</strong> - Interactive Neural Network Playground</p>
      <p style="margin-top: 0.5rem;">Learn more at <a href="https://github.com" style="color: #38bdf8;">github.com/NeuroViz</a></p>
    </div>
  </div>
</body>
</html>`}function d(e,i="neuroviz-report.html"){const t=new Blob([e],{type:"text/html"}),o=URL.createObjectURL(t),r=document.createElement("a");r.href=o,r.download=i,r.click(),URL.revokeObjectURL(o)}export{d as downloadHTMLReport,a as generateHTMLReport};
//# sourceMappingURL=TrainingReport-_2ZvuTs2.js.map
