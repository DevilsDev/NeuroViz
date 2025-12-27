# NeuroViz User Guide

**Complete Manual for NeuroViz Neural Network Visualizer**

Version 1.0 | For Students, Educators, and ML Enthusiasts

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Understanding the Interface](#understanding-the-interface)
4. [Working with Datasets](#working-with-datasets)
5. [Configuring Your Network](#configuring-your-network)
6. [Training Your Network](#training-your-network)
7. [Understanding Visualizations](#understanding-visualizations)
8. [Advanced Features](#advanced-features)
9. [Learning Resources](#learning-resources)
10. [Exporting and Sharing](#exporting-and-sharing)
11. [Tips and Best Practices](#tips-and-best-practices)
12. [Troubleshooting](#troubleshooting)

---

## Introduction

### What is NeuroViz?

NeuroViz is an interactive web application that helps you understand how neural
networks learn. Watch in real-time as a neural network learns to classify 2D
data points by drawing decision boundaries.

### Who is this for?

- **Students** learning machine learning concepts
- **Educators** demonstrating neural networks to classes
- **ML Enthusiasts** experimenting with hyperparameters
- **Anyone curious** about how AI learns

### What will you learn?

- How neural networks separate data into classes
- The impact of different hyperparameters (learning rate, layers, etc.)
- What decision boundaries look like
- How to recognize overfitting and underfitting
- The relationship between network architecture and learning capacity

### No Programming Required

NeuroViz runs entirely in your browser. No installation, no coding, no setup
needed.

---

## Getting Started

### Opening NeuroViz

1. Navigate to NeuroViz in your web browser
2. Wait for the application to load (a few seconds)
3. You'll see the main interface with three panels

### Your First Neural Network in 60 Seconds

Follow these steps to train your first network:

1. **Left Panel**: Click the **Circle** dataset card
2. **Right Panel**: Leave default settings (Learning Rate: 0.03, Layers: 8, 4)
3. **Right Panel**: Click the blue **Initialise Network** button
4. **Center Panel**: Click **Start Training**
5. **Watch**: See colored regions appear as the network learns!

In about 20 seconds, you'll see the network learn to draw a circular decision
boundary.

### Understanding What Just Happened

- **Data**: Blue dots in center, orange dots outside = your training examples
- **Network**: Created with 2 hidden layers (8 neurons, then 4 neurons)
- **Training**: Network adjusted internal weights to separate blue from orange
- **Decision Boundary**: The line/curve where color changes from blue to orange
- **Accuracy**: Percentage of dots the network correctly classified

---

## Understanding the Interface

### Layout Overview

NeuroViz has three main areas:

```
┌─────────────────────────────────────────────────────────┐
│  Top Navigation: [Help] [Fullscreen] [Learn] [Theme]   │
├──────────┬──────────────────────────┬───────────────────┤
│          │                          │                   │
│   LEFT   │        CENTER            │      RIGHT        │
│  PANEL   │        CANVAS            │      PANEL        │
│          │       & CHARTS           │                   │
│ Datasets │  Training Visualization  │  Configuration    │
│ Presets  │  Progress Charts         │  Advanced Tools   │
│ Session  │                          │  Export           │
└──────────┴──────────────────────────┴───────────────────┘
```

### Top Navigation Bar

**Left Side: NeuroViz Logo**
- Application name
- No action (decorative)

**Right Side Buttons (left to right):**

1. **Help Button** (question mark icon)
   - Click to see keyboard shortcuts
   - Quick reference card
   - Press **?** anywhere to open this

2. **Fullscreen Toggle** (expand icon)
   - Click to enter fullscreen mode
   - Click again (or press **F**) to exit
   - Useful for presentations and focus

3. **Learn Menu** (book icon with dropdown)
   - **Guided Tutorials**: Step-by-step lessons
   - **Challenge Mode**: Test your skills
   - **Keyboard Shortcuts**: View all shortcuts
   - Dropdown opens on click

4. **Theme Toggle** (sun/moon icon)
   - Sun icon = currently in dark mode (click for light)
   - Moon icon = currently in light mode (click for dark)
   - Preference is saved

### Left Panel: Datasets & Session

**Quick Start Section**
- Preset configurations dropdown
- Description of selected preset
- Apply button to load preset

**Dataset Section**
- Grid of 8 dataset cards with previews
- Dataset options (samples, noise, balance, preprocessing)
- Fetch button to load data
- CSV upload button for custom data
- Draw controls (when custom dataset selected)
- Statistics panel showing dataset info

**Session Management**
- Save: Download configuration as file
- Load: Upload a saved configuration
- Copy: Get shareable URL
- Paste: Load from shared URL

### Center Panel: Visualization & Training

**Training Status Bar** (top of center)
- **Epoch Counter**: Number of training cycles completed
- **Loss**: Error metric (how wrong the network is)
- **Accuracy**: Percentage of correct predictions
- **Control Buttons**:
  - Start Over (red): Reset everything
  - Step (arrows): Train one epoch
  - Start/Pause (play/pause): Run training continuously
  - Undo/Redo (curved arrows): Revert configuration changes

**Main Canvas**
- Shows your data points (colored dots)
- Shows decision boundary (colored background)
- Interactive area for custom drawing (if custom dataset)
- Can toggle 3D view, weights overlay, Voronoi diagram

**Learning Rate Chart** (below canvas)
- Shows how learning rate changes over epochs
- Only varies if using LR schedule

**Training History Chart** (bottom)
- Orange line: Loss over time (should decrease)
- Green line: Accuracy over time (should increase)
- Header shows best values and improvement percentage

### Right Panel: Configuration & Analysis

**Hyperparameters Section**
- Learning Rate: How fast the network learns
- Optimizer: Algorithm for updating weights
- Loss Function: How error is calculated
- Batch Normalization: Stabilization technique
- Hidden Layers: Network architecture (comma-separated)
- Activation: Nonlinear transformation function
- Output Classes: Number of categories to predict
- Initialise Network button: Creates the network

**Training Config Section**
- Batch Size: Examples processed together
- Max Epochs: Maximum training cycles
- Speed (FPS): Visual update frequency
- Performance Mode: Presets for different devices
- LR Schedule: Learning rate adjustment strategy

**Advanced Section** (collapsible panels)
- Regularization: L1, L2, Dropout settings
- Network Diagram: Visual architecture representation
- Weight Distribution: Histogram of network weights
- Confusion Matrix: Classification performance table
- Layer Activations: Neuron activation distributions
- Model Complexity: Parameters, FLOPs, memory usage
- Adversarial Examples: Generate fooling examples
- Training Speed: Benchmark comparison

**Export Tools** (bottom)
- Export Model: Download trained model
- Export Stats: Download training metrics
- Export Training Report: Comprehensive PDF/HTML report

### Visual Indicators

**Colors**
- **Blue/Cyan**: Primary actions, positive metrics
- **Orange**: Loss values, warnings
- **Green/Emerald**: Accuracy, success states
- **Red**: Reset actions, errors
- **Amber/Yellow**: Challenges, attention needed
- **Purple**: Advanced features

**Status Indicators**
- **Glowing buttons**: Ready for action
- **Disabled buttons**: Prerequisites not met (greyed out)
- **Pulsing elements**: Active training
- **Check marks**: Completed items
- **Badges**: Numerical indicators (e.g., challenge count)

**Chart Elements**
- **Solid lines**: Actual data
- **Dashed lines**: Validation data
- **Colored backgrounds**: Decision boundaries
- **Dots**: Training data points
- **Opacity**: Confidence levels

---

## Working with Datasets

### Pre-loaded Datasets

NeuroViz includes 8 built-in datasets:

#### 1. Circle
- **Pattern**: Blue dots in center circle, orange dots outside
- **Difficulty**: Easy
- **Best For**: Learning basics, quick demos
- **Why Useful**: Simple non-linear pattern
- **Typical Accuracy**: 95-99%

#### 2. XOR
- **Pattern**: Four quadrants, alternating blue and orange corners
- **Difficulty**: Medium
- **Best For**: Understanding non-linear separability
- **Why Useful**: Classic problem requiring hidden layers
- **Typical Accuracy**: 90-98%

#### 3. Spiral
- **Pattern**: Two intertwined spiral arms
- **Difficulty**: Hard
- **Best For**: Testing complex architectures
- **Why Useful**: Requires deep networks or many neurons
- **Typical Accuracy**: 85-95% (challenging!)

#### 4. Gaussian
- **Pattern**: Two overlapping cloud-like clusters
- **Difficulty**: Easy-Medium
- **Best For**: Realistic data simulation
- **Why Useful**: Similar to real-world data distributions
- **Typical Accuracy**: 85-95%

#### 5. Clusters
- **Pattern**: Multiple distinct groupings
- **Difficulty**: Medium
- **Best For**: Multi-class classification
- **Why Useful**: Tests clustering ability
- **Typical Accuracy**: 80-95%

#### 6. Iris
- **Pattern**: Famous iris flower dataset (2D projection)
- **Difficulty**: Medium
- **Best For**: Real-world dataset experience
- **Why Useful**: Actual scientific data
- **Typical Accuracy**: 85-95%

#### 7. Wine
- **Pattern**: Wine quality dataset (2D projection)
- **Difficulty**: Medium
- **Best For**: Real-world classification
- **Why Useful**: Actual scientific data
- **Typical Accuracy**: 80-90%

#### 8. Draw (Custom)
- **Pattern**: You create it by clicking!
- **Difficulty**: Variable
- **Best For**: Experimentation, demonstrations
- **Why Useful**: Test specific hypotheses
- **Typical Accuracy**: Depends on your pattern

### Loading a Dataset

**Method 1: Click a Dataset Card**
1. In left panel, click any dataset card
2. Data loads immediately to canvas
3. Dataset statistics appear below options

**Method 2: Use Quick Start Preset**
1. Select a preset from dropdown (e.g., "Quick Demo")
2. Click "Apply Preset"
3. Dataset loads automatically

### Dataset Options

Before clicking Fetch (or after clicking a dataset card), you can adjust:

#### Samples Slider (50-500)
- **What it does**: Controls number of data points
- **More samples**: Slower training, smoother boundaries
- **Fewer samples**: Faster training, noisier boundaries
- **Recommended**: 200 for most experiments

#### Noise Slider (0-50%)
- **What it does**: Adds randomness to data
- **Higher noise**: Harder to achieve perfect accuracy
- **Lower noise**: Cleaner patterns, easier learning
- **Recommended**: 10% for realistic data

#### Class Balance Slider (10-90%)
- **What it does**: Ratio of Class 0 to Class 1
- **50%**: Equal numbers of each class
- **80%**: Imbalanced dataset (80% Class 0, 20% Class 1)
- **Why adjust**: Tests network's handling of imbalanced data
- **Recommended**: 50% for beginners

#### Preprocessing Dropdown
- **None**: Raw data as-is
- **Normalize**: Scale values to 0-1 range
- **Standardize**: Scale to mean=0, std=1
- **When to use**: Normalization helps with some datasets

### Creating Custom Datasets (Draw Mode)

1. Click the **Draw** dataset card
2. You'll see class buttons appear (different colors)
3. Click a color button to select that class
4. Click on the canvas to place dots of that color
5. Click "Clear Points" to start over

**Tips for Drawing:**
- Create interesting patterns to test the network
- Mix classes together to make it challenging
- Draw boundaries where you think the network should learn
- Try creating patterns like checkerboards, concentric circles, etc.

### Uploading CSV Data

1. Click the **CSV** button in dataset section
2. Select a CSV file from your computer
3. Format required:
   - First two columns: x, y coordinates
   - Third column: class label (0, 1, 2, etc.)
   - No header row

Example CSV:
```
0.5, 0.3, 0
0.2, 0.7, 1
0.8, 0.1, 0
```

### Dataset Statistics Panel

After loading data, expand the stats panel to see:

- **Total Samples**: Count of data points
- **Class Distribution**: Number in each class
  - Shown as colored bars
  - Percentage of dataset
- **Outliers**: Points far from their class cluster
  - Warning icon if detected
  - Count of outlier points

This helps you understand if your data is balanced and clean.

---

## Configuring Your Network

### Understanding Hyperparameters

Hyperparameters are settings you choose before training. They dramatically
affect how well and how fast your network learns.

### Learning Rate

**What it is:**
The step size for adjusting network weights during training.

**How to set:**
- Input field in Hyperparameters section
- Default: 0.03
- Range: 0.001 to 1.0

**Effects:**
- **Too low** (0.001): Slow learning, may not converge
- **Good range** (0.01-0.1): Steady learning
- **Too high** (0.5+): Unstable, may diverge (loss becomes NaN)

**Tips:**
- Start with 0.03 for most datasets
- Use 0.01 for complex patterns like Spiral
- Use 0.1 for simple patterns like Circle
- Watch the loss chart: if it jumps around, reduce learning rate

### Hidden Layers

**What it is:**
The architecture of your neural network, defined as comma-separated numbers.

**How to set:**
- Text input: e.g., "8, 4" or "16, 16, 8"
- Each number is a layer with that many neurons

**Examples:**
- `4` = 1 layer with 4 neurons (simple)
- `8, 4` = 2 layers: 8 neurons, then 4 neurons (moderate)
- `16, 16, 8` = 3 layers (complex)
- `32, 32, 16, 8` = 4 layers (very deep)

**Effects:**
- **Fewer layers/neurons**: Faster training, may underfit
- **More layers/neurons**: Slower training, more capacity, may overfit

**Guidelines by Dataset:**
- Circle: `4` or `8`
- XOR: `4` or `8, 4`
- Gaussian: `8, 4`
- Spiral: `16, 16, 8` or larger
- Custom: Experiment!

### Activation Function

**What it is:**
The nonlinear transformation applied to each neuron's output.

**Options:**
- **ReLU** (Rectified Linear Unit): f(x) = max(0, x)
- **Tanh** (Hyperbolic Tangent): f(x) = tanh(x)
- **Sigmoid**: f(x) = 1 / (1 + e^-x)

**When to use:**
- **ReLU**: Default choice, works well for most problems
- **Tanh**: Centered output, good for some patterns
- **Sigmoid**: Smooth boundaries, good for probabilistic outputs

**Tips:**
- Start with ReLU
- Try Tanh if ReLU struggles
- Sigmoid is slower but can give smoother boundaries

### Optimizer

**What it is:**
The algorithm used to update network weights.

**Options:**
- **Adam**: Adaptive Moment Estimation (default)
- **SGD**: Stochastic Gradient Descent
- **RMSprop**: Root Mean Square Propagation

**When to use:**
- **Adam**: Best all-around choice, adaptive learning rate
- **SGD**: Simple, use with momentum for best results
- **RMSprop**: Good for recurrent patterns

**Tips:**
- Stick with Adam unless you have a reason to change
- SGD may need a different learning rate than Adam

### Loss Function

**What it is:**
How the network measures its errors.

**Options:**
- **Cross Entropy**: Standard for classification (default)
- **MSE** (Mean Squared Error): Regression-style loss
- **Hinge**: Support vector machine style

**When to use:**
- **Cross Entropy**: Use for most classification tasks
- **MSE**: Experimental, produces softer boundaries
- **Hinge**: Experimental, margin-based classification

### Output Classes

**What it is:**
How many categories to predict.

**Options:**
- **Binary (2)**: Two classes (e.g., blue vs orange)
- **3 Class**: Three distinct classes
- **4 Class**: Four distinct classes

**How to use:**
- Match this to your dataset
- Most built-in datasets are binary
- Clusters, Iris, and Wine support multiple classes

### Batch Normalization

**What it is:**
A technique that normalizes layer inputs to stabilize training.

**How to enable:**
- Check the "Batch Norm" checkbox

**When to use:**
- Deep networks (3+ layers)
- When training is unstable
- For faster convergence

**Trade-offs:**
- Slightly slower per epoch
- Can improve final accuracy
- Helps with deeper networks

### Training Configuration

Beyond hyperparameters, you can configure how training runs:

#### Batch Size
- **What**: Number of examples processed together
- **Default**: 10
- **Smaller**: More updates, noisier but can escape local minima
- **Larger**: Fewer updates, more stable but slower

#### Max Epochs
- **What**: Maximum training cycles
- **Default**: 100
- **Adjust**: Set higher for complex patterns
- **Note**: You can always stop early with Pause

#### Speed (FPS)
- **What**: How fast the visualization updates
- **Range**: 1-60 frames per second
- **Higher**: Smoother animation, more CPU usage
- **Lower**: Choppier but less resource-intensive

#### Performance Mode
Quick presets for FPS:
- **Full Speed (60 FPS)**: Smooth, modern computers
- **Balanced (30 FPS)**: Good middle ground
- **Battery Saver (15 FPS)**: Minimal CPU usage

#### LR Schedule
- **None (Constant)**: Learning rate stays fixed
- **Step Decay**: Reduces LR at set epochs
- **Exponential Decay**: Gradual LR reduction
- **Cosine Annealing**: Cyclical LR changes

**When to use LR schedules:**
- Training plateaus (accuracy stops improving)
- Want to fine-tune near end of training
- Long training runs (500+ epochs)

### Regularization (Advanced)

Found in the Advanced → Regularization panel:

#### L1 Regularization
- **What**: Penalty for large weights (promotes sparsity)
- **Default**: 0 (off)
- **Range**: 0 to 0.01
- **Use**: Prevents overfitting, creates sparse networks

#### L2 Regularization
- **What**: Penalty for large weights (weight decay)
- **Default**: 0 (off)
- **Range**: 0 to 0.01
- **Use**: Prevents overfitting, common choice

#### Dropout
- **What**: Randomly disables neurons during training
- **Options**: 0% (off), 20%, 50%
- **Use**: Strong anti-overfitting technique
- **Note**: Slows training but improves generalization

### Applying Your Configuration

After setting all options:

1. Click the blue **Initialise Network** button
2. Wait a moment (network is being created)
3. The canvas will prepare for training
4. Start button becomes active
5. Network diagram updates to show architecture

**Important**: You must initialize after changing hyperparameters. If you
change settings mid-training, you need to reset and initialize again.

---

## Training Your Network

### Starting Training

**Three ways to train:**

#### 1. Continuous Training
- Click **Start Training** button (or press **Space**)
- Network trains automatically
- Updates every frame (based on FPS setting)
- Loss and accuracy update in real-time

#### 2. Step-by-Step Training
- Click **Step** button (or press **S**)
- Network trains one epoch
- Useful for:
  - Debugging
  - Understanding each update
  - Presentations (manual control)

#### 3. Combination
- Start continuous training
- Pause to examine (press **Space** or **Esc**)
- Step through a few epochs
- Resume continuous training

### Monitoring Progress

#### Status Numbers (Top Center)

**Epoch Counter**
- Shows current training cycle
- Increments after each batch is processed
- Resets to 0 when you click Start Over

**Loss**
- Measures how wrong the network is
- **Lower is better** (0 = perfect)
- Should generally decrease over time
- If it increases or becomes NaN: problem! (see Troubleshooting)

**Accuracy**
- Percentage of correct predictions
- **Higher is better** (100% = perfect)
- Should generally increase over time
- Real-world: 90-98% is often excellent

**Validation Loss** (bottom-left overlay on canvas)
- Loss on data not used for training
- Should track training loss
- If it diverges (goes up while training loss goes down): overfitting!

#### Training History Chart

The chart at the bottom shows:

**Orange Line: Loss**
- Should trend downward
- May bounce around (normal)
- Steep drops early, flatter later

**Green Line: Accuracy**
- Should trend upward
- Often sigmoid-shaped (S-curve)
- Fast improvement early, slows later

**Header Statistics**
- **Best Loss**: Lowest loss achieved
- **Best Acc**: Highest accuracy achieved
- **Improvement**: Percentage gain since start

**What to look for:**
- Smooth curves = stable training
- Jumpy curves = learning rate too high
- Flat curves = learning stalled (decrease LR or train longer)

#### Learning Rate Chart

Shows how learning rate changes:
- Flat line if no schedule
- Decreasing if using decay
- Cyclical if using cosine annealing

### Decision Boundary Visualization

The colored background on the canvas represents the network's current
predictions across the entire space.

**Colors:**
- Each color represents a class prediction
- For binary: typically blue and orange
- For multi-class: multiple colors

**Evolution:**
- **Early**: Random-looking, patchy colors
- **Mid-training**: Boundaries start forming
- **Late**: Clear, smooth boundaries (if trained well)

**What good boundaries look like:**
- Smooth transitions (not jagged)
- Separate most training points correctly
- Make intuitive sense for the pattern

**What bad boundaries look like:**
- Overly complex (snaking through data)
- Flat (no separation)
- Ignoring obvious patterns

### When to Stop Training

**Automatic Stop:**
- When max epochs is reached
- If using early stopping (more in Advanced section)

**Manual Stop:**
- Click Pause or press Space/Esc
- When accuracy plateaus (stops improving)
- When you're satisfied with the boundary

**Signs training is done:**
- Accuracy above 95% for simple datasets
- Loss below 0.1
- Validation loss stopped decreasing
- Boundary looks clean and correct

**Signs to keep training:**
- Accuracy still rising steadily
- Loss still decreasing
- Boundary still evolving

**Signs of problems:**
- Loss increasing or NaN
- Accuracy stuck at 50% (random guessing)
- Boundary looks wrong despite high accuracy (overfitting)

### Pausing and Resuming

- Click **Pause** (or press **Space**) to pause
- Click **Start** again to resume from where you left off
- Network state is preserved
- Useful for examining current state

### Resetting Training

Click **Start Over** (or press **R**) to:
- Reset epoch counter to 0
- Randomize network weights (fresh start)
- Clear training history
- Keep current configuration

**When to reset:**
- Training went wrong (NaN loss)
- Want to try same config with different random initialization
- Accidentally changed something mid-training

### Using Step Mode for Learning

Step-by-step training is great for education:

1. Click **Step** (or press **S**)
2. Observe what changed:
   - Loss value
   - Decision boundary (subtle shift)
   - Accuracy (may change slightly)
3. Repeat to see gradual learning

**Teaching tip**: Use step mode to show students how learning is incremental,
not instantaneous.

---

## Understanding Visualizations

### Main Canvas: Decision Boundary

#### What You See

**Background Colors**
- Each pixel is colored by the network's prediction
- Blue regions: Network predicts Class 0
- Orange regions: Network predicts Class 1
- Color intensity may indicate confidence

**Data Points**
- Small colored dots
- Blue dots: Class 0 training examples
- Orange dots: Class 1 training examples
- Position is their feature values (x, y coordinates)

**The Boundary**
- Where background color changes
- Represents the decision rule
- Points on one side: Class 0
- Points on other side: Class 1

#### Interpreting the Visualization

**Good Signs:**
- Boundary separates most dots correctly
- Smooth, continuous boundary
- Makes sense given the data pattern

**Warning Signs:**
- Boundary too simple (underfitting):
  - Straight line through XOR pattern
  - Ignoring obvious structure
- Boundary too complex (overfitting):
  - Wiggly, snake-like paths
  - Fitting every training point perfectly
  - Likely won't generalize to new data

**Example Interpretations:**

Circle Dataset:
- Good: Circular boundary around blue dots
- Underfit: Diagonal line (network too simple)
- Overfit: Jagged circle with peninsulas reaching for outliers

XOR Dataset:
- Good: Two diagonal regions for each class
- Underfit: One straight line (no hidden layer)
- Overfit: Extremely sharp corners

Spiral Dataset:
- Good: Smooth spiral-following curves
- Underfit: Blocky regions, misses spiral structure
- Overfit: Perfectly traces every point, too detailed

### Optional Visualizations (Canvas Footer)

Click toggles in the bottom-right of the canvas:

#### Weights Toggle
- Shows network weights as lines
- Thickness indicates weight magnitude
- Color indicates sign (positive/negative)
- Helps understand what network learned

#### Voronoi Toggle
- Overlays Voronoi diagram
- Shows nearest-neighbor boundaries
- Useful for comparing to network's learned boundary
- Educational tool

#### 3D Mode Toggle
- Switches canvas to 3D view
- Z-axis represents network output/confidence
- Rotate camera to see "decision surface"
- Great for presentations and deeper understanding

**In 3D view:**
- Height represents confidence
- Peaks = strong Class 1 prediction
- Valleys = strong Class 0 prediction
- Camera controls: drag to rotate, scroll to zoom

### Network Diagram (Right Panel)

Found in Advanced → Network Diagram (open by default):

**What it shows:**
- Visual representation of network layers
- Circles = neurons
- Lines = connections (weights)
- Input layer (left) → Hidden layers (middle) → Output layer (right)

**Color coding:**
- Line thickness = weight magnitude (thicker = stronger connection)
- Line color = weight sign (blue = positive, red = negative)

**How to read it:**
- Count neurons per layer
- See which connections are strongest
- Identify which neurons are "dead" (no outgoing connections)

### Training History Chart

Dual-axis chart showing two metrics over epochs:

#### Left Y-Axis: Loss (Orange Line)
- Error metric
- Should decrease
- Often drops sharply early, then plateaus

#### Right Y-Axis: Accuracy (Green Line)
- Classification performance
- Should increase
- Often rises quickly, then asymptotes

**Reading the chart:**
- X-axis: Epoch number
- Hover over lines to see exact values
- Look for trends, not individual points

**Patterns to recognize:**

**Healthy Training:**
```
Loss: High → Decreasing → Low (plateau)
Acc:  Low → Increasing → High (plateau)
```

**Overfitting:**
```
Training Loss: Decreasing
Validation Loss: Decreasing then INCREASING
(Gap widens between them)
```

**Underfitting:**
```
Loss: Decreases but plateaus high (>0.5)
Acc: Increases but plateaus low (<80%)
```

**Learning Rate Too High:**
```
Loss: Jumps around, never settles
Acc: Erratic, no clear trend
```

### Learning Rate Chart

Timeline showing LR value over epochs:

- Flat line: Constant learning rate
- Downward slope: Decay schedule
- Steps: Step decay
- Waves: Cosine annealing

**Why it matters:**
- Helps debug training issues
- Confirms your schedule is working
- Shows when LR drops trigger accuracy jumps

### Confusion Matrix (Advanced Panel)

Shows classification performance in detail:

**Matrix Layout:**
```
              Predicted
           Class 0  Class 1
Actual     ┌────────────────┐
Class 0    │   TP   │  FP   │
Class 1    │   FN   │  TN   │
           └────────────────┘
```

**Reading it:**
- Diagonal (TP, TN): Correct predictions
- Off-diagonal (FP, FN): Errors
- Darker = more examples

**Metrics Below:**
- **F1 Score**: Harmonic mean of precision and recall (0-1, higher better)
- **Precision**: Of predicted positives, how many were right?
- **Recall**: Of actual positives, how many did we find?

### Weight Distribution (Advanced Panel)

Histogram showing distribution of all network weights:

**Healthy patterns:**
- Bell-shaped (normal distribution)
- Centered near zero
- Some spread (not all identical)

**Problem patterns:**
- All weights near zero: Network not learning (dead neurons)
- Huge weights: May be overfitting or exploding gradients
- Bimodal (two peaks): Unusual but sometimes okay

### Layer Activations (Advanced Panel)

Histogram showing neuron activation values:

**For ReLU:**
- Should see values from 0 to some positive number
- If all zero: Dead neurons (problem)
- If all high: Saturated (may be okay)

**For Tanh/Sigmoid:**
- Should be spread across range
- If all at extremes (-1/1 or 0/1): Saturated (can be problem)

### Model Complexity Panel (Advanced)

Shows computational characteristics:

**Parameters**
- Total number of trainable weights
- More = more capacity, but slower
- Example: "347 params"

**FLOPs per Forward Pass**
- Floating-point operations
- Measures computational cost
- Higher = more computation needed

**Memory Usage**
- Params: Memory for storing weights
- Activations: Memory during forward pass
- Total: Sum of both

**Complexity Rating**
- Text assessment: "Small", "Medium", "Large", "Very Large"
- Helps gauge if network is appropriate

---

## Advanced Features

### Quick Start Presets

Pre-configured setups for common scenarios:

#### Quick Demo
- **Use case**: Fast demonstrations, first-time users
- **Dataset**: Circle
- **Architecture**: Simple (4 neurons)
- **Learning Rate**: High (0.1)
- **Expected**: Trains in ~30 seconds, 95%+ accuracy

#### Deep Network
- **Use case**: Complex patterns, showing depth
- **Dataset**: Spiral
- **Architecture**: Deep (16, 16, 8)
- **Learning Rate**: Moderate (0.01)
- **Expected**: Trains slower, handles complexity

#### High Accuracy
- **Use case**: Demonstrations of well-tuned training
- **Dataset**: XOR
- **Architecture**: Moderate (12, 8)
- **Learning Rate**: Low (0.005)
- **Expected**: Slow but steady, very high final accuracy

#### Overfit Demo
- **Use case**: Teaching overfitting concepts
- **Dataset**: Gaussian
- **Architecture**: Very deep (32, 32, 16, 8)
- **Learning Rate**: Medium, no regularization
- **Expected**: Overfits to training data, complex boundaries

**How to use:**
1. Select preset from dropdown
2. Read description
3. Click Apply Preset
4. Everything configures automatically
5. Just click Initialise → Start Training

### Guided Tutorials

Interactive lessons that teach ML concepts:

#### Accessing Tutorials
1. Click **Learn** menu (top-right)
2. Select **Guided Tutorials**
3. Modal opens with tutorial list

#### Available Tutorials

**What is a Decision Boundary?** (3 min, Beginner)
- Learn what boundaries are
- See how they form during training
- Understand class separation

**Why Does Learning Rate Matter?** (5 min, Beginner)
- Experiment with different LR values
- See effects of too-high and too-low LR
- Learn to tune this critical parameter

**Understanding Overfitting** (6 min, Intermediate)
- Create an overfit model
- See validation loss diverge
- Learn prevention techniques

#### Using Tutorials
1. Click **Start** on a tutorial
2. Tutorial overlay appears
3. Follow step-by-step instructions
4. UI elements highlight as needed
5. Click **Next** or perform action to proceed
6. Complete all steps to finish

**Tips:**
- Tutorials can be paused/abandoned anytime
- Some steps require specific actions (e.g., click a button)
- Highlighted elements glow to guide you
- Read carefully; hints provide useful info

### Challenge Mode

Test your skills with specific goals:

#### Accessing Challenges
1. Click **Learn** menu
2. Select **Challenge Mode**
3. Modal opens with challenge list

#### Challenge Structure

Each challenge has:
- **Name**: E.g., "XOR Speed Run"
- **Description**: Goal summary
- **Difficulty**: Easy, Medium, Hard
- **Points**: Reward for completion
- **Dataset**: Required dataset
- **Goals**: Targets to achieve (e.g., 95% accuracy)
- **Constraints**: Limits (e.g., max 2 layers, under 50 epochs)
- **Hint**: Help if you're stuck

#### Available Challenges (7 Total)

1. **XOR Speed Run** (Easy, 100 pts)
   - 95% accuracy in under 50 epochs
   - Dataset: XOR

2. **Minimal Spiral** (Medium, 200 pts)
   - 90% accuracy with only 2 layers
   - Dataset: Spiral

3. **Perfect Circle** (Easy, 100 pts)
   - 99% accuracy
   - Dataset: Circle

4. **Tiny Genius** (Medium, 200 pts)
   - 90% accuracy with max 12 total neurons
   - Dataset: XOR

5. **Efficient Spiral** (Hard, 300 pts)
   - 92% accuracy in under 200 epochs with max 2 layers
   - Dataset: Spiral

6. **No Regularization** (Hard, 300 pts)
   - 95% accuracy without L1/L2/dropout
   - Dataset: Gaussian with noise

7. **Architecture Master** (Hard, 400 pts)
   - 95% accuracy on Spiral with specific architecture requirements

#### How to Complete a Challenge
1. Click **Start** on a challenge
2. Challenge banner appears at top
3. Configure network to meet constraints
4. Train until goals are met
5. Automatic validation on each epoch
6. Completion badge when successful!

**Tracking Progress:**
- Completed challenges show check marks
- Total points displayed in header
- Completion badge in Learn menu: "X/7"
- Leaderboard tracks your best attempts

#### Leaderboard Tab
- Switch to Leaderboard tab in modal
- See all your completed challenges
- Ranked by score
- Shows configuration used
- Metrics achieved

### Adversarial Examples

Generate inputs that fool the network:

#### What Are Adversarial Examples?
Small changes to input that cause misclassification:
- Point looks like Class 0 to humans
- Network predicts Class 1
- Found by searching near decision boundary

#### How to Generate
1. Expand **Advanced → Adversarial Examples**
2. Train a network first
3. Click **Generate Adversarial Examples**
4. Results appear in list

#### Interpreting Results
- Count: Number of adversarial points found
- List: Each point with original class and predicted class
- Visualization: Points appear on canvas (different marker)

**Why use this?**
- Understand network weaknesses
- See where decision boundary is uncertain
- Educational: shows networks aren't perfect

### Speed Comparison

Benchmark training performance:

#### How to Use
1. Expand **Advanced → Training Speed**
2. Train a network
3. Click **Save Baseline** to save current speed
4. Change configuration (e.g., add layers)
5. Train again
6. See comparison: "1.5x slower than baseline"

**Why use this?**
- Compare architectures
- Measure optimization impact
- Understand speed/accuracy trade-offs

### Configuration History (Undo/Redo)

Every config change is tracked:

#### Using Undo
- Click undo button (curved arrow left) or press **Ctrl+Z**
- Reverts to previous configuration
- Can undo multiple times
- Button disabled when at oldest state

#### Using Redo
- Click redo button (curved arrow right) or press **Ctrl+Y**
- Moves forward through changes
- Button disabled when at newest state

**Limitations:**
- Only tracks configuration changes (hyperparameters)
- Does not undo training progress
- Limited history (last 20 changes)

### Early Stopping

Automatically stops training when improvement plateaus:

**How it works:**
- Monitors validation loss
- If no improvement for N epochs, stops training
- Prevents overfitting and wasted computation

**Configuration:**
- Not directly exposed in UI (uses reasonable defaults)
- Automatically enabled when validation data available

**Signs early stopping triggered:**
- Training pauses automatically
- Notification: "Early stopping triggered"
- Final epoch less than max epochs

---

## Learning Resources

### In-App Help

#### Keyboard Shortcuts (Press ?)
- Opens modal with all keyboard shortcuts
- Organized by category
- Quick reference card

**Most Useful Shortcuts:**
- **Space**: Start/Pause training
- **S**: Step one epoch
- **R**: Reset training
- **F**: Fullscreen toggle
- **Ctrl+Z**: Undo config change
- **Ctrl+Y**: Redo config change
- **1-5**: Load datasets 1-5
- **?**: Show shortcuts modal
- **Esc**: Close modals or pause training

#### Tooltips
- Hover over UI elements
- Small popups with explanations
- Available on most buttons and inputs

#### Element Highlights
During tutorials:
- Glowing outlines on relevant UI
- Focus guides you to next action

### Tutorials (Comprehensive Learning Paths)

Use the guided tutorials for structured learning:

**Recommended Order for Beginners:**
1. What is a Decision Boundary? (3 min)
2. Why Does Learning Rate Matter? (5 min)
3. Understanding Overfitting (6 min)

**Time investment:** 15 minutes total for solid foundation

### Challenges (Hands-On Practice)

Progress through challenges to build skills:

**Recommended Order:**
1. Perfect Circle (Easy) - Practice basics
2. XOR Speed Run (Easy) - Learn XOR problem
3. Minimal Spiral (Medium) - Efficiency thinking
4. Tiny Genius (Medium) - Architecture constraints
5. Efficient Spiral (Hard) - Combine skills
6. No Regularization (Hard) - Pure architecture
7. Architecture Master (Hard) - Master level

### External Resources

For deeper learning:

**Concepts:**
- Neural networks fundamentals
- Backpropagation algorithm
- Hyperparameter tuning
- Overfitting and regularization

**Recommended:**
- 3Blue1Brown's Neural Network series (YouTube)
- Andrew Ng's Machine Learning course
- Fast.ai Practical Deep Learning course

---

## Exporting and Sharing

### Exporting Your Model

#### Export Model Button
1. Train your network
2. Click **Export Model** in Export Tools section
3. Downloads JSON file with:
   - Network weights
   - Architecture
   - Configuration

**File format:** Standard TensorFlow.js format

**What you can do:**
- Load in custom code
- Share with developers
- Use in other TensorFlow.js projects

**Note:** Browser-based export, works offline

#### Export Stats Button
1. Train your network
2. Click **Export Stats**
3. Downloads CSV file with:
   - Epoch-by-epoch metrics
   - Loss values
   - Accuracy values
   - Learning rate history

**Use cases:**
- Import into Excel/Google Sheets
- Create custom charts
- Analyze training progression
- Compare multiple runs

#### Export Training Report Button
1. Complete training session
2. Click **Export Training Report**
3. Generates comprehensive HTML/PDF report with:
   - Training configuration
   - Final metrics
   - Charts (loss, accuracy, LR)
   - Network architecture diagram
   - Recommendations

**Use cases:**
- Homework submissions
- Documentation
- Presentations
- Lab reports

### Saving Sessions

#### Save Button (Left Panel)
1. Configure and train your network
2. Click **Save** in Session section
3. Downloads `.json` file
4. File contains:
   - All hyperparameters
   - Training configuration
   - Dataset selection and options
   - Current training state (epoch, metrics)

**Filename:** `neuroviz-session-YYYY-MM-DD.json`

#### Load Button
1. Click **Load** in Session section
2. Select previously saved `.json` file
3. All settings restore
4. Dataset reloads
5. Can resume training from saved epoch

**Use cases:**
- Continue work later
- Share exact configuration with others
- Backup experiments
- Reproduce results

### Sharing via URL

#### Copy Button
1. Configure your network
2. Click **Copy** in Session section
3. URL copied to clipboard
4. Share URL with others

**URL contains:**
- All hyperparameters (encoded)
- Dataset selection
- Training settings

**Limitations:**
- Does not include training progress
- Recipients start from scratch
- URL may be long

#### Paste Button
1. Receive shared URL
2. Copy it to clipboard
3. Click **Paste** in Session section
4. Configuration loads automatically

### Collaboration Tips

**For Educators:**
- Create preset configurations
- Save as files and distribute
- Share URLs in lesson plans
- Students can load and experiment

**For Students:**
- Save work after each experiment
- Export reports for assignments
- Share interesting findings via URL
- Compare results with classmates

**For Researchers:**
- Document all configurations
- Export stats for analysis
- Save baseline configurations
- Track experiments systematically

---

## Tips and Best Practices

### For Beginners

1. **Start Simple**
   - Use Circle dataset
   - Keep default settings
   - Watch one complete training run

2. **One Change at a Time**
   - Adjust only learning rate first
   - Then try different architectures
   - Isolate effects of each change

3. **Use Presets**
   - Quick Demo for first experience
   - Compare to your manual attempts
   - Learn what "good" settings look like

4. **Watch the Charts**
   - Loss should go down
   - Accuracy should go up
   - If not, something's wrong

5. **Don't Fear Mistakes**
   - NaN loss? Just reset and try lower learning rate
   - Poor accuracy? Add layers or neurons
   - Experimentation is how you learn!

### For Educators

1. **Demonstrate Live**
   - Use Quick Demo preset
   - Show in fullscreen mode
   - Step through training for slow-motion effect

2. **Assign Tutorials**
   - Have students complete all three
   - Discuss insights afterward
   - Quiz on concepts covered

3. **Use Challenges as Homework**
   - Assign specific challenges
   - Students submit screenshots/reports
   - Discuss different solution approaches

4. **Create Custom Scenarios**
   - Draw custom datasets (Draw mode)
   - Save and share with students
   - Challenge them to classify

5. **Export Reports**
   - Students submit training reports
   - Show their configurations
   - Discuss trade-offs made

### For Experimentation

1. **Systematic Testing**
   - Change one variable at a time
   - Save baseline configuration
   - Export stats for each run
   - Compare results objectively

2. **Document Everything**
   - Save sessions with descriptive filenames
   - Note observations in external file
   - Screenshot interesting boundaries
   - Track what works and what doesn't

3. **Explore Extremes**
   - Try very high learning rates (see instability)
   - Try very deep networks (overfitting)
   - Try minimal architectures (underfitting)
   - Learn limits by exceeding them

4. **Use Advanced Tools**
   - Generate adversarial examples
   - Study weight distributions
   - Examine activation histograms
   - Understand internals, not just outputs

### Hyperparameter Tuning Strategy

1. **Start with Defaults**
   - LR: 0.03, Layers: 8, 4
   - Train to see baseline

2. **Tune Learning Rate First**
   - Try 0.01, 0.03, 0.1
   - Pick best (lowest final loss)

3. **Adjust Architecture**
   - If underfitting: add layers/neurons
   - If overfitting: simplify or add regularization

4. **Fine-Tune**
   - Try different activations
   - Adjust batch size
   - Add LR schedule

5. **Validate**
   - Check validation loss
   - If diverging from training loss: overfitting
   - Add regularization or simplify

### Common Patterns to Recognize

**Underfit (Network Too Simple):**
- Accuracy plateaus below 85%
- Decision boundary too simple (e.g., straight line for XOR)
- Solution: More layers or neurons

**Overfit (Network Too Complex):**
- Training accuracy 99%, validation accuracy 75%
- Boundary extremely wiggly
- Solution: Regularization or fewer neurons

**Learning Rate Too High:**
- Loss jumps around
- Training unstable
- May see NaN
- Solution: Reduce learning rate

**Learning Rate Too Low:**
- Loss decreases very slowly
- Takes forever to converge
- Solution: Increase learning rate

**Dead Neurons:**
- Weight histogram shows all values near zero
- Activation histogram shows all zeros (ReLU)
- Solution: Different initialization or activation function

---

## Troubleshooting

### Training Problems

#### "Loss is NaN" or "Loss is Infinity"

**Cause:** Learning rate too high, causing gradient explosion

**Solutions:**
1. Click Start Over (reset network)
2. Reduce learning rate (try 1/10 of current)
3. Simplify network (fewer layers)
4. Check data (are values reasonable?)

#### "Accuracy stuck at 50%" (Binary Classification)

**Cause:** Network is guessing randomly (not learning)

**Solutions:**
1. Increase learning rate
2. Add hidden layers (network too simple)
3. Check you initialized network
4. Ensure dataset loaded correctly

#### "Training is extremely slow"

**Causes:**
- Too many neurons
- High FPS setting
- Large dataset

**Solutions:**
1. Reduce FPS in Training Config
2. Use Performance Mode: Battery Saver
3. Simplify architecture
4. Reduce dataset samples

#### "Accuracy goes up then back down"

**Cause:** Learning rate too high or overfitting

**Solutions:**
1. Reduce learning rate
2. Add regularization (L2)
3. Use early stopping
4. Monitor validation loss

### Visualization Problems

#### "Canvas is blank"

**Causes:**
- Dataset not loaded
- Network not initialized

**Solutions:**
1. Click a dataset card
2. Wait for data to appear
3. Click Initialise Network
4. Then click Start Training

#### "Decision boundary looks wrong"

**Causes:**
- Network still training (wait longer)
- Incorrect configuration
- Overfitting or underfitting

**Solutions:**
1. Let training complete
2. Check accuracy (if low, network needs help)
3. Try different architecture
4. Check that dataset matches what you expect

#### "Charts not updating"

**Causes:**
- Browser performance issue
- Training not running

**Solutions:**
1. Ensure training is active (not paused)
2. Reduce FPS
3. Refresh page if frozen
4. Try different browser (Chrome recommended)

### Configuration Problems

#### "Initialise button disabled"

**Cause:** Dataset not loaded

**Solution:**
1. Click a dataset card in left panel
2. Wait for data to load
3. Button will activate

#### "Start Training button disabled"

**Cause:** Network not initialized

**Solution:**
1. Configure hyperparameters
2. Click Initialise Network
3. Wait for initialization
4. Button will activate

#### "Can't change settings during training"

**Behavior:** Inputs disabled while training

**Solution:**
1. Click Pause to stop training
2. Make changes
3. Click Start Over to reset with new config
4. Click Initialise, then Start Training

### Data Problems

#### "Custom dataset won't load"

**Causes:**
- CSV format incorrect
- Missing columns
- Non-numeric values

**Solutions:**
1. Check CSV has exactly 3 columns (x, y, class)
2. Ensure no header row
3. Check all values are numbers
4. Example: `0.5,0.3,0` (no spaces after commas)

#### "Dataset looks different than expected"

**Cause:** Random sampling varies each load

**Solution:**
- Normal! Data is randomly generated
- Use same noise/balance settings for consistency
- Fix random seed (feature not exposed in UI)

#### "Too many/too few points"

**Solution:**
1. Adjust Samples slider in dataset options
2. Click dataset card again to reload

### Performance Problems

#### "Browser is lagging"

**Causes:**
- High FPS with complex network
- Large dataset
- 3D view enabled

**Solutions:**
1. Set Performance Mode: Battery Saver
2. Reduce FPS slider
3. Disable 3D view
4. Simplify network architecture
5. Reduce dataset samples

#### "Training takes forever"

**Causes:**
- Very large network
- Very small learning rate
- Many epochs

**Solutions:**
1. Reduce max epochs
2. Increase learning rate (carefully)
3. Simplify architecture
4. Use Quick Demo preset

### Browser Compatibility

**Recommended:** Chrome, Edge, or Firefox (latest versions)

**Known Issues:**
- Safari: WebGL may have performance issues with 3D view
- Mobile: Limited screen space, some panels may be cramped
- Old browsers: May not support required JavaScript features

**If nothing loads:**
1. Check browser console for errors (F12)
2. Ensure JavaScript enabled
3. Try different browser
4. Clear cache and reload

### Getting Help

If you encounter issues not covered here:

1. **Check browser console** (F12 → Console tab)
   - Look for red error messages
   - Copy exact error text

2. **Try simplest case**
   - Load Circle dataset
   - Use default settings
   - Does it work? If yes, isolate the problem

3. **Clear state**
   - Refresh page (Ctrl+R or Cmd+R)
   - Start fresh
   - Try again

4. **Document the issue**
   - What were you doing?
   - What did you expect?
   - What actually happened?
   - Screenshots help

5. **Ask for help**
   - Include browser and OS
   - Include steps to reproduce
   - Include error messages
   - Share configuration if possible

---

## Appendix: Glossary

**Accuracy:** Percentage of correct predictions (0-100%, higher is better)

**Activation Function:** Nonlinear transformation in neurons (ReLU, Tanh,
Sigmoid)

**Adam:** Adaptive optimizer that adjusts learning rates automatically

**Adversarial Example:** Input crafted to fool the network

**Backpropagation:** Algorithm for computing gradients and updating weights

**Batch:** Group of examples processed together

**Batch Normalization:** Technique to normalize layer inputs for stability

**Batch Size:** Number of examples per batch

**Binary Classification:** Two-class prediction problem

**Cross Entropy:** Common loss function for classification

**Decision Boundary:** The line/surface where predicted class changes

**Dropout:** Regularization that randomly disables neurons during training

**Epoch:** One complete pass through the training dataset

**F1 Score:** Harmonic mean of precision and recall

**FLOPs:** Floating-point operations (measure of computation)

**Gradient:** Direction and magnitude of steepest increase in loss

**Hidden Layer:** Layer between input and output (not directly visible)

**Hyperparameter:** Setting chosen before training (LR, layers, etc.)

**L1 Regularization:** Penalty encouraging sparse weights

**L2 Regularization:** Penalty discouraging large weights (weight decay)

**Learning Rate:** Step size for weight updates (critical hyperparameter)

**Loss:** Measure of prediction error (lower is better)

**Loss Function:** Formula for computing loss (Cross Entropy, MSE, etc.)

**Neuron:** Basic unit in network (receives inputs, produces output)

**Optimizer:** Algorithm for updating weights (Adam, SGD, RMSprop)

**Overfitting:** Model memorizes training data, performs poorly on new data

**Precision:** Of predicted positives, fraction that are correct

**Recall:** Of actual positives, fraction that were detected

**ReLU:** Rectified Linear Unit, activation function max(0, x)

**Regularization:** Techniques to prevent overfitting

**SGD:** Stochastic Gradient Descent, simple optimizer

**Sigmoid:** S-shaped activation function, outputs 0-1

**Tanh:** Hyperbolic tangent activation, outputs -1 to 1

**Underfitting:** Model too simple, fails to capture patterns

**Validation Loss:** Loss on data not used for training (tests generalization)

**Weight:** Connection strength between neurons (learned parameter)

---

**End of User Guide**

For quick reference, see:
- [Quick Start Guide](QUICK-START.md) - 5-minute introduction
- [Features Reference](FEATURES-REFERENCE.md) - Detailed feature documentation
- [FAQ](FAQ.md) - Common questions and answers
- [Sitemap](SITEMAP.md) - Navigate the application

**NeuroViz** - Making neural networks visible and understandable.
