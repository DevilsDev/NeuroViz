# NeuroViz Feature Documentation

Comprehensive guide to all features in NeuroViz with usage examples and best practices.

## Table of Contents

- [Core Training Features](#core-training-features)
- [Visualization Features](#visualization-features)
- [Dataset Management](#dataset-management)
- [Advanced ML Features](#advanced-ml-features)
- [Education System](#education-system)
- [Export & Persistence](#export--persistence)
- [Performance Features](#performance-features)
- [Research Tools](#research-tools)

---

## Core Training Features

### Neural Network Configuration

#### Architecture Definition

Configure network topology with hidden layers:

```typescript
// Simple network: 2 inputs → 8 hidden → 4 hidden → 1 output
Layers: "8, 4"

// Deep network: 2 inputs → 16 → 16 → 8 → 1 output
Layers: "16, 16, 8"

// Wide network: 2 inputs → 32 → 1 output
Layers: "32"
```

**Best Practices**:
- Start simple (8, 4) and increase if needed
- More layers = more capacity but slower training
- First layer should be larger than input dimensions
- Gradual decrease in layer sizes works well

---

#### Learning Rate

Controls how fast the network learns:

```
Low (0.001-0.01):  Slow but stable convergence
Medium (0.01-0.1): Balanced (recommended)
High (0.1-1.0):    Fast but may diverge
```

**Finding Optimal LR**:
1. Click "Tools" → "LR Finder"
2. Observe loss curve
3. Choose LR where loss decreases fastest
4. Typically just before loss starts increasing

**Example Results**:
```
LR = 0.0001 → Loss decreases slowly
LR = 0.03   → Loss decreases rapidly (optimal)
LR = 0.5    → Loss explodes (NaN)
```

---

#### Optimizers

**Available Optimizers**:

**SGD (Stochastic Gradient Descent)**:
- Simple, predictable behavior
- Requires momentum (0.9 recommended)
- Good for understanding training dynamics
- Use when: Learning fundamentals

**Adam (Adaptive Moment Estimation)**:
- Adaptive learning rates per parameter
- Fast convergence, robust to hyperparameters
- Most popular choice
- Use when: General purpose, production

**RMSprop (Root Mean Square Propagation)**:
- Adapts learning rates based on recent gradients
- Good for non-stationary problems
- Use when: Recurrent problems (not typical in 2D)

**Adagrad (Adaptive Gradient)**:
- Larger updates for infrequent parameters
- Learning rate decreases over time
- Use when: Sparse data

**Recommendation**: Start with **Adam**

---

#### Activation Functions

**Available Functions**:

**ReLU (Rectified Linear Unit)** - **Recommended**
```
f(x) = max(0, x)
```
- Fast computation
- Avoids vanishing gradients
- Dead neurons possible (use with proper init)
- Default choice for hidden layers

**Sigmoid**
```
f(x) = 1 / (1 + e^(-x))
```
- Outputs (0, 1)
- Smooth gradient
- Vanishing gradient problem in deep networks
- Use for: Binary output layer only

**Tanh (Hyperbolic Tangent)**
```
f(x) = (e^x - e^(-x)) / (e^x + e^(-x))
```
- Outputs (-1, 1)
- Zero-centered (better than sigmoid)
- Still has vanishing gradient
- Use for: Alternative to ReLU

**ELU (Exponential Linear Unit)**
```
f(x) = x if x > 0 else α(e^x - 1)
```
- Smooth everywhere
- Negative outputs help learning
- Slightly slower than ReLU
- Use for: Better performance than ReLU

**Per-Layer Activation**:
```
Layer Activations: "relu, tanh, elu"
→ Hidden layer 1: ReLU
→ Hidden layer 2: Tanh
→ Hidden layer 3: ELU
```

---

### Regularization

#### L1 Regularization

Encourages sparsity (many weights → 0):

```
Strength: 0.01 - 0.1
Effect: Simpler models, feature selection
Use when: Too many parameters, need interpretability
```

#### L2 Regularization

Encourages small weights:

```
Strength: 0.01 - 0.1
Effect: Prevents overfitting, smooth decision boundaries
Use when: Overfitting observed (training >> validation)
```

#### Dropout

Randomly deactivates neurons during training:

```
Rate: 0.1 - 0.5
Effect: Forces redundant representations, prevents co-adaptation
Use when: Deep networks, large datasets
```

**Example**:
```
Dropout 0.0 → Overfits (train 99%, val 75%)
Dropout 0.2 → Generalizes (train 92%, val 90%)
Dropout 0.5 → Underfits (train 80%, val 78%)
```

#### Batch Normalization

Normalizes layer inputs:

```
Effect: Faster training, higher learning rates possible
Use when: Deep networks (3+ hidden layers)
```

---

### Training Configuration

#### Batch Size

Number of samples per gradient update:

```
0 (Full Batch):    All data, slow but stable
32-64 (Mini-batch): Balanced (recommended)
1 (Stochastic):    Fast updates, noisy gradients
```

**Trade-offs**:
- Larger batch → More stable, slower
- Smaller batch → Faster updates, more noise

---

#### Max Epochs

Training duration limit:

```
0:          Unlimited (manual stop)
100-500:    Typical for small datasets
1000-5000:  Deep networks or hard problems
```

**Stop when**:
- Validation loss stops improving
- Target accuracy reached
- Early stopping triggers

---

#### Validation Split

Percentage of data for validation:

```
0%:    No validation (not recommended)
10%:   Small datasets
20%:   Standard choice (recommended)
30%:   Large datasets
```

**Purpose**:
- Detect overfitting
- Monitor generalization
- Trigger early stopping

---

#### Learning Rate Schedules

**Constant**:
```
LR stays fixed throughout training
Use when: Short training runs, optimal LR known
```

**Exponential Decay**:
```
LR = initial_LR × decay_rate^(epoch / decay_steps)
Use when: Long training, gradual refinement
Parameters: decay_rate=0.95, decay_steps=10
```

**Step Decay**:
```
LR drops by factor every N epochs
Use when: Phased training (exploration → refinement)
Parameters: decay_rate=0.5, decay_steps=50
```

**Cosine Annealing**:
```
LR follows cosine curve from initial to min
Use when: Long training, smooth decay
Parameters: warmup_epochs=10, min_LR=0.001
```

**Cyclic Triangular**:
```
LR oscillates linearly between min and max
Use when: Escaping local minima
Parameters: cycle_length=20, min_LR=0.001
```

**Cyclic Cosine**:
```
LR oscillates smoothly (cosine)
Use when: SGDR (Stochastic Gradient Descent with Restarts)
Parameters: cycle_length=30, min_LR=0.001
```

**Warmup**:
All schedules support warmup:
```
Warmup Epochs: 10
Effect: LR gradually increases from 0 to initial_LR
Use when: Preventing early divergence
```

---

#### Early Stopping

Stops training when validation loss plateaus:

```
Patience: 0 (disabled), 10-50 (typical)
Logic: Stop if val_loss doesn't improve for N epochs
Use when: Preventing overfitting, saving time
```

**Example**:
```
Epoch 100: val_loss = 0.25 (best so far)
Epoch 110: val_loss = 0.27 (patience counter = 10)
Epoch 120: val_loss = 0.28 (patience counter = 20)
→ Stopped at epoch 120, restored weights from epoch 100
```

---

#### Training Speed

Control visualization and training FPS:

```
15 FPS:  Slow (watch every detail)
30 FPS:  Moderate (balanced)
60 FPS:  Fast (standard)
120 FPS: Very fast
Max:     Unlimited (CPU/GPU bound)
```

**Performance Modes**:
- **Smooth**: 15 FPS (educational, visual clarity)
- **Balanced**: 30 FPS (recommended)
- **Fast**: 60 FPS (production training)
- **Maximum**: Unlimited (quick experiments)

---

### Training Controls

#### Start Training

Begins continuous training loop:

```
Behavior:
- Trains at configured FPS
- Updates visualization every render_interval epochs
- Continues until max_epochs or manual stop
```

#### Pause Training

Suspends training (can resume):

```
Behavior:
- Stops at current epoch
- Preserves all state
- Resume with "Start"
```

#### Step Training

Execute single epoch:

```
Use cases:
- Debugging training process
- Understanding gradient updates
- Frame-by-frame analysis
```

#### Reset Training

Clears training progress:

```
Behavior:
- Resets to epoch 0
- Clears history and metrics
- Re-shuffles data (new validation split)
- Keeps network architecture
```

---

## Visualization Features

### Decision Boundary Visualization

#### Binary Classification

**Contour Rendering**:
```
Display: Smooth gradient from class 0 (blue) to class 1 (red)
Resolution: 50x50 grid (2500 predictions)
Update: Every 10 epochs (configurable)
```

**Color Schemes**:
- **Default**: Blue → White → Red
- **Viridis**: Perceptually uniform
- **Plasma**: High contrast
- **Warm**: Red-yellow tones
- **Cool**: Blue-green tones
- **Rainbow**: Full spectrum

---

#### Multi-class Classification

**Region Rendering**:
```
Display: Distinct color per class
Opacity: Scaled by confidence (darker = more confident)
Classes: Up to 10 supported
```

**Color Palette**:
```
Class 0: Blue (#3b82f6)
Class 1: Red (#ef4444)
Class 2: Green (#10b981)
Class 3: Yellow (#f59e0b)
Class 4: Purple (#a855f7)
... (10 total colors)
```

---

### Data Point Rendering

**Training Points**:
```
Shape: Circle
Color: By class label
Border: White (1.5px)
Size: 5px radius (configurable)
```

**Validation Points**:
```
Shape: Circle
Color: By class label
Border: Amber/yellow (2.5px dashed)
Size: 5px radius
Purpose: Visual distinction from training set
```

**Misclassified Points**:
```
Border: Red (3px solid)
Purpose: Identify prediction errors
Trigger: Click "Highlight Errors"
```

---

### Advanced Visualizations

#### Voronoi Diagram

Shows nearest-neighbor decision boundaries:

```
Purpose: Visualize data point influence regions
Use cases: Understanding model behavior, debugging
Enable: Visualization → Voronoi Overlay
```

---

#### Confidence Circles

Uncertainty visualization:

```
Display: Circle radius proportional to (1 - confidence)
Color: Green (correct), Red (incorrect)
Large circle = Low confidence = High uncertainty
```

---

#### Network Diagram

Interactive layer visualization:

```
Display:
- Circles for neurons
- Lines for connections
- Line thickness = weight magnitude
- Line color = weight sign (blue +, red -)

Interaction:
- Hover neuron → See activation value
- Hover connection → See weight value
- Color intensity = activation strength
```

---

#### Activation Heatmap

Neuron activation patterns:

```
Display: 2D heatmap per layer
X-axis: Neuron index
Y-axis: Sample index
Color: Activation strength (blue to red)

Use cases:
- Identify dead neurons (always 0)
- Detect saturated neurons (always 1)
- Understand feature learning
```

---

#### Gradient Flow

Backpropagation visualization:

```
Display: Gradient magnitude per layer
Purpose: Detect vanishing/exploding gradients
Healthy: Similar magnitudes across layers
Problem: Exponential decrease (vanishing) or increase (exploding)
```

---

#### Weight Distribution

Histogram of all weights:

```
Display: Frequency distribution
Healthy: Bell curve centered near 0
Problems:
- Clustered at 0 → Dead neurons
- Wide spread → Gradient explosion risk
- Bimodal → Layer separation
```

---

#### Loss Chart

Training progress over time:

```
Lines:
- Blue: Training loss
- Red: Validation loss
- Green: Learning rate (secondary axis)

Interpretation:
- Both decreasing: Good training
- Train low, val high: Overfitting
- Both high: Underfitting
- Both plateau: Convergence
```

---

#### Confusion Matrix

Multi-class evaluation:

```
Display: Heatmap grid
Rows: True labels
Columns: Predicted labels
Diagonal: Correct predictions
Off-diagonal: Errors

Metrics:
- Accuracy: Sum(diagonal) / Sum(all)
- Per-class precision/recall
```

---

#### ROC Curve

Binary classification evaluation:

```
Display: True Positive Rate vs False Positive Rate
Diagonal: Random classifier
Perfect: Top-left corner
AUC: Area under curve (0.5-1.0)
```

---

## Dataset Management

### Predefined Datasets

#### Circle Dataset

```
Description: Inner vs outer circle
Classes: 2 (binary)
Separability: Linearly separable with radial basis
Difficulty: Easy
Recommended arch: [8, 4]
Sample count: 200-500
```

**Parameters**:
- `noiseLevel`: 0.0-0.3 (adds Gaussian noise)
- `preprocessing`: 'none', 'normalize', 'standardize'

---

#### XOR Dataset

```
Description: Classic XOR problem
Classes: 2 (binary)
Separability: Non-linearly separable
Difficulty: Medium (requires hidden layers)
Recommended arch: [8, 4] minimum
Sample count: 200
```

**Key Challenge**: Cannot be solved with linear model

---

#### Spiral Dataset

```
Description: Two intertwined spirals
Classes: 2 (binary)
Separability: Highly non-linear
Difficulty: Hard
Recommended arch: [16, 16, 8]
Sample count: 300-500
```

**Best Practices**:
- Use deeper networks (3+ hidden layers)
- Higher learning rate (0.05-0.1)
- More epochs (500-1000)

---

#### Gaussian Dataset

```
Description: Two overlapping Gaussian clusters
Classes: 2 (binary)
Separability: Probabilistic (overlap region)
Difficulty: Easy to medium
Recommended arch: [8, 4]
Sample count: 200-400
```

---

#### Iris Dataset

```
Description: Classic flower classification
Classes: 3 (multi-class)
Features: Sepal/petal dimensions (projected to 2D via PCA)
Separability: 2 classes easy, 1 overlap
Difficulty: Medium
Recommended arch: [16, 8]
Sample count: 150 (full dataset)
```

---

#### Wine Dataset

```
Description: Wine quality classification
Classes: 3 (multi-class)
Features: Chemical properties (projected to 2D via PCA)
Separability: Overlapping classes
Difficulty: Medium-hard
Recommended arch: [16, 16]
Sample count: 178 (full dataset)
```

---

### Custom Datasets

#### CSV Upload

Upload CSV files with format:

```csv
x,y,label
0.5,0.3,0
-0.2,0.8,1
0.1,-0.4,0
...
```

**Requirements**:
- Three columns: x, y, label
- Numeric values only
- Labels must be integers (0, 1, 2, ...)
- Max file size: 10MB

**Steps**:
1. Click "Dataset" → "Upload CSV"
2. Select file
3. Data validates automatically
4. Points render on chart

---

#### Draw Mode

Create custom datasets by clicking:

```
Steps:
1. Click "Dataset" → "Draw Points"
2. Select class label (0, 1, 2, ...)
3. Click on chart to add points
4. Switch class and repeat
5. Click "Done" when finished

Tips:
- Create balanced classes (equal points)
- Add noise for realism
- Test model generalization
```

---

### Data Preprocessing

#### Normalization (Min-Max Scaling)

```
Formula: x_norm = (x - min) / (max - min) × 2 - 1
Range: [-1, 1]
Use when: Features have different scales
Effect: Faster convergence, better gradient flow
```

---

#### Standardization (Z-score)

```
Formula: x_std = (x - mean) / std
Range: Unbounded (typically -3 to +3)
Use when: Data has outliers
Effect: More robust than normalization
```

---

## Advanced ML Features

### Model Complexity Analysis

Metrics calculated automatically:

**Parameter Count**:
```
Formula: Sum of all weight and bias parameters
Example: [8, 4] network with 2 inputs, 1 output
= (2×8 + 8) + (8×4 + 4) + (4×1 + 1)
= 24 + 36 + 5
= 65 parameters
```

**Memory Usage**:
```
Calculation: 4 bytes per parameter (float32)
Example: 65 parameters × 4 bytes = 260 bytes
```

**FLOPs (Floating Point Operations)**:
```
Per forward pass: Sum of multiply-adds per layer
Example: (2×8) + (8×4) + (4×1) = 52 FLOPs
Per epoch: FLOPs × batch_size
```

**Complexity Rating**:
```
Tiny:     < 100 params
Small:    100-1K params
Medium:   1K-10K params
Large:    10K-100K params
Very Large: > 100K params
```

---

### Adversarial Examples (FGSM)

Generate adversarial attacks using Fast Gradient Sign Method:

```
Steps:
1. Train network to > 80% accuracy
2. Click "Research" → "Generate Adversarial"
3. Adjust epsilon (perturbation strength)
4. View examples on chart (diamond markers)

Parameters:
- Epsilon: 0.01-0.5 (perturbation magnitude)
- Target class: Which class to fool model into

Result:
- Original: Correctly classified
- Adversarial: Misclassified with tiny perturbation
- Visualization: Shows vulnerability
```

**Use Cases**:
- Model robustness testing
- Security analysis
- Understanding decision boundaries
- Educational demonstrations

---

### Learning Rate Finder

Automatically discover optimal learning rate:

```
Algorithm:
1. Initialize fresh model
2. Train with exponentially increasing LR
3. Record loss at each step
4. Plot loss vs LR
5. Suggest optimal LR (steepest descent point)

Usage:
1. Load dataset
2. Initialize network
3. Click "Tools" → "LR Finder"
4. Wait for completion (100 steps)
5. Review suggested LR
6. Update config and re-initialize

Interpretation:
- Flat region → LR too low
- Steep descent → Optimal range
- Increasing loss → LR too high
```

---

## Education System

### Interactive Tutorials

#### Beginner Tutorials

**"Your First Neural Network"**:
```
Steps:
1. Load circle dataset
2. Set simple architecture (8, 4)
3. Initialize network
4. Start training
5. Observe decision boundary evolution

Learning goals:
- Understand training process
- See decision boundary emerge
- Interpret loss/accuracy metrics
```

**"Understanding Hyperparameters"**:
```
Experiments:
- Try different learning rates
- Compare optimizers (SGD vs Adam)
- Test architecture sizes

Learning goals:
- Impact of hyperparameters
- Trade-offs between choices
- Debugging bad configurations
```

---

#### Intermediate Tutorials

**"Overfitting and Regularization"**:
```
Demonstration:
1. Train on small dataset without regularization
2. Observe train 99%, val 60% (overfitting)
3. Add dropout or L2
4. See improved generalization

Learning goals:
- Detect overfitting
- Apply regularization
- Monitor validation metrics
```

**"Learning Rate Schedules"**:
```
Experiments:
- Constant vs decaying LR
- Step decay vs cosine annealing
- Cyclic schedules for escaping minima

Learning goals:
- LR schedule benefits
- When to use each type
- Fine-tuning convergence
```

---

#### Advanced Tutorials

**"Adversarial Robustness"**:
```
Activities:
1. Train accurate model
2. Generate adversarial examples
3. Observe misclassifications
4. Try adversarial training

Learning goals:
- Model vulnerabilities
- Attack methods
- Defense strategies
```

---

### Challenges

Gamified learning with scoring:

**Beginner Challenge**: "Reach 90% Accuracy"
```
Dataset: Circle
Constraints: Max 2 hidden layers, LR ≤ 0.1
Goal: 90% validation accuracy within 200 epochs
Points: 100
```

**Intermediate Challenge**: "Solve XOR"
```
Dataset: XOR
Constraints: Max 50 parameters
Goal: 95% accuracy within 500 epochs
Points: 250
```

**Advanced Challenge**: "Spiral Master"
```
Dataset: Spiral
Constraints: Max 100 parameters, LR < 0.05
Goal: 98% accuracy within 1000 epochs
Points: 500
```

**Leaderboard**:
- Sorted by score
- Shows epochs, accuracy, parameters
- Challenge completion percentage

---

### Contextual Tooltips

Hover over any UI element for explanations:

```
Examples:
- "Learning Rate": Controls step size during optimization
- "Dropout": Randomly deactivates neurons to prevent overfitting
- "Batch Size": Number of samples per gradient update

Categories:
- Hyperparameters
- Training controls
- Visualization options
- Advanced features
```

---

## Export & Persistence

### Model Export

**TensorFlow.js Format**:
```
Files:
- model.json: Architecture and config
- weights.bin: Trained parameters

Usage:
1. Click "Export" → "Save Model"
2. Download two files
3. Load later: "Import Model"

JavaScript usage:
const model = await tf.loadLayersModel('file://model.json');
const predictions = model.predict(inputs);
```

---

### Training History Export

**JSON Format**:
```json
{
  "records": [
    {
      "epoch": 1,
      "loss": 0.693,
      "accuracy": 0.52,
      "valLoss": 0.701,
      "valAccuracy": 0.50,
      "timestamp": 1234567890,
      "learningRate": 0.03
    },
    ...
  ],
  "startTime": 1234567000
}
```

**CSV Format**:
```csv
epoch,loss,accuracy,valLoss,valAccuracy,learningRate,timestamp
1,0.693,0.52,0.701,0.50,0.03,1234567890
2,0.621,0.68,0.645,0.62,0.03,1234567920
...
```

**Text Format**:
```
Training History
================
Total Epochs: 100
Duration: 45.2s

Epoch 1: Loss=0.693, Acc=52.0%, ValLoss=0.701, ValAcc=50.0%, LR=0.030
Epoch 2: Loss=0.621, Acc=68.0%, ValLoss=0.645, ValAcc=62.0%, LR=0.030
...
```

---

### Visualization Export

**PNG Export**:
```
Resolution: 2× chart size (high-DPI)
Background: Dark (#0a0f1a)
Content: Decision boundary + data points
Filename: neuroviz-boundary.png

With Metadata:
- Network architecture
- Final loss/accuracy
- Learning rate
- Training duration
```

**SVG Export**:
```
Format: Scalable Vector Graphics
Benefits: Infinite zoom, editable in Illustrator
Content: Full chart with axes and labels
```

---

### Session Persistence

**Auto-save to LocalStorage**:
```
Saved data:
- Hyperparameters
- Training configuration
- Dataset points
- Training history
- Current epoch

Trigger: Automatic on state change
Storage key: 'neuroviz-session'
Restore: On page load if exists
```

**Manual Session Management**:
```
Save Session:
1. Click "Session" → "Save"
2. Session stored in browser
3. Survives page refresh

Load Session:
1. Click "Session" → "Load"
2. Restores full state
3. Can resume training
```

---

## Performance Features

### Progressive Rendering

Lazy rendering for large datasets:

```
Behavior:
- Render in chunks during scroll
- Virtualization for 1000+ points
- Prevents UI blocking

Threshold: 500+ data points
```

---

### Frame Rate Limiting

Prevent excessive GPU/CPU usage:

```
Modes:
- 15 FPS: Educational (detailed observation)
- 30 FPS: Balanced (recommended)
- 60 FPS: Standard (smooth)
- 120 FPS: High-performance
- Max: Unlimited (benchmarking)

Implementation:
- requestAnimationFrame throttling
- Skips frames if target not met
- Maintains UI responsiveness
```

---

### Memory Optimization

**Tensor Disposal**:
```
All TensorFlow.js tensors explicitly disposed
Prevents GPU memory leaks
Monitor: TFNeuralNet.getMemoryInfo()
```

**D3 Resource Cleanup**:
```
SVG elements removed on clear
Event listeners unbound on dispose
Resize observers disconnected
```

---

## Research Tools

### LIME (Local Interpretable Model-Agnostic Explanations)

Explains individual predictions:

```
Process:
1. Select a point
2. Generate perturbed samples around it
3. Train linear model on perturbations
4. Show feature importance

Output:
- Feature X contribution: +0.35
- Feature Y contribution: -0.12

Use cases:
- Understanding model decisions
- Debugging predictions
- Building trust
```

---

### Saliency Maps

Gradient-based importance:

```
Process:
1. Compute gradient of output w.r.t. input
2. Visualize gradient magnitude

Output:
- Heatmap showing input sensitivity
- High gradient = important feature

Use cases:
- Feature importance
- Input attribution
- Model interpretation
```

---

### Feature Importance

Global feature ranking:

```
Method: Permutation importance
Process:
1. Baseline accuracy
2. Shuffle feature X → measure accuracy drop
3. Shuffle feature Y → measure accuracy drop
4. Rank by importance

Output:
- Feature X importance: 0.42
- Feature Y importance: 0.38
```

---

### Neural Architecture Search (NAS)

Automated architecture optimization:

```
Search space:
- Layer counts: 1-5
- Neurons per layer: 4-64
- Activations: ReLU, Tanh, ELU

Algorithm:
- Random search or grid search
- Train each configuration briefly
- Select best performer

Output:
- Optimal architecture
- Performance comparison
- Training time vs accuracy
```

---

## Best Practices

### Training Workflow

**1. Start Simple**:
```
1. Load dataset
2. Try [8, 4] architecture
3. Use Adam optimizer
4. LR = 0.03
5. Train for 200 epochs
```

**2. Diagnose Issues**:
```
Loss is NaN → Reduce LR to 0.01
Slow convergence → Increase LR to 0.05
Overfitting → Add dropout 0.2 or L2 0.01
Underfitting → Add more layers or neurons
```

**3. Optimize**:
```
1. Run LR Finder → Find optimal LR
2. Tune architecture → NAS or manual
3. Add regularization → Prevent overfitting
4. Use LR schedule → Fine-tune convergence
```

**4. Validate**:
```
1. Check validation metrics
2. Test on held-out data
3. Generate adversarial examples
4. Export and save
```

---

### Feature Selection Guide

| Feature | When to Use |
|---------|-------------|
| **Dropout** | Deep networks, overfitting |
| **L2 Regularization** | Smooth boundaries, overfitting |
| **L1 Regularization** | Feature selection, sparsity |
| **Batch Normalization** | Deep networks (3+ layers) |
| **LR Schedule** | Long training (>500 epochs) |
| **Early Stopping** | Uncertain epoch count |
| **Gradient Clipping** | Exploding gradients |

---

## Troubleshooting

### Common Issues

**"Loss is NaN"**:
```
Causes: LR too high, gradient explosion
Solutions:
- Reduce LR (try 0.01)
- Add gradient clipping (clipNorm: 1.0)
- Use batch normalization
- Check data normalization
```

**"Training not improving"**:
```
Causes: LR too low, insufficient capacity
Solutions:
- Increase LR (try LR Finder)
- Add more layers/neurons
- Train longer (more epochs)
- Check dataset quality
```

**"Overfitting" (train >> validation)**:
```
Causes: Model too complex, not enough data
Solutions:
- Add dropout (0.2-0.3)
- Add L2 regularization (0.01)
- Increase training data
- Use simpler architecture
```

**"Slow Training"**:
```
Causes: Large batch, complex model, low FPS
Solutions:
- Reduce batch size
- Simplify architecture
- Increase target FPS
- Reduce render interval
```

---

For more details, see:
- [API.md](./API.md) - Technical API reference
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Implementation guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
