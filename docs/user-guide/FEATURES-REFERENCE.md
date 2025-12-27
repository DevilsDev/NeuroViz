# Features Reference

Complete reference for all NeuroViz features with detailed explanations, use
cases, and visual guides.

---

## Table of Contents

1. [Dataset Features](#dataset-features)
2. [Network Configuration Features](#network-configuration-features)
3. [Training Features](#training-features)
4. [Visualization Features](#visualization-features)
5. [Advanced Analysis Features](#advanced-analysis-features)
6. [Educational Features](#educational-features)
7. [Export and Sharing Features](#export-and-sharing-features)
8. [Interface Features](#interface-features)

---

## Dataset Features

### Pre-loaded Datasets

#### Circle Dataset
**Location:** Left Panel → Dataset Gallery → Circle card

**Visual Description:**
- Blue dots arranged in a circular cluster in the center
- Orange dots surrounding the blue cluster in a ring
- Clear radial separation between classes

**Pattern Type:** Radially separable (distance from center determines class)

**Difficulty:** Easy

**Typical Use Cases:**
- Introduction to decision boundaries
- Demonstrating non-linear classification
- Quick demos and testing

**Expected Performance:**
- Achievable Accuracy: 95-99%
- Training Time: 20-50 epochs
- Recommended Architecture: 4-8 neurons in one hidden layer

**Learning Objectives:**
- Understand circular decision boundaries
- See how networks learn non-linear patterns
- Compare to linear classifiers (which fail here)

**Customization Options:**
- Samples: More samples → smoother circle
- Noise: Higher noise → less perfect circle, some overlap
- Balance: Shifts ratio of blue to orange points

---

#### XOR Dataset
**Location:** Left Panel → Dataset Gallery → XOR card

**Visual Description:**
- Four quadrants pattern
- Top-left and bottom-right: Blue dots
- Top-right and bottom-left: Orange dots
- Classic "checkerboard" corners pattern

**Pattern Type:** Exclusive OR (not linearly separable)

**Difficulty:** Medium

**Typical Use Cases:**
- Teaching why neural networks need hidden layers
- Demonstrating the XOR problem (famous in ML history)
- Testing minimum architecture requirements

**Expected Performance:**
- Achievable Accuracy: 90-98%
- Training Time: 30-80 epochs
- Minimum Architecture: At least one hidden layer (4-8 neurons)

**Learning Objectives:**
- Understand linear vs. non-linear separability
- See why single-layer perceptrons fail
- Learn the historical importance of XOR problem

**Customization Options:**
- Samples: More samples → clearer quadrant boundaries
- Noise: Higher noise → overlapping quadrants (very hard!)
- Balance: Can create asymmetric XOR

**Why It's Important:**
XOR is the simplest problem that requires a hidden layer. It's a milestone in
understanding neural network necessity.

---

#### Spiral Dataset
**Location:** Left Panel → Dataset Gallery → Spiral card

**Visual Description:**
- Two intertwined spiral arms
- Blue spiral winds clockwise
- Orange spiral winds counter-clockwise
- Arms are interlaced and cannot be separated by a line

**Pattern Type:** Highly non-linear, complex topology

**Difficulty:** Hard

**Typical Use Cases:**
- Testing deep network architectures
- Demonstrating network capacity needs
- Advanced experiments
- Impressive visualizations

**Expected Performance:**
- Achievable Accuracy: 85-95%
- Training Time: 200-500 epochs
- Recommended Architecture: 16, 16, 8 or deeper

**Learning Objectives:**
- See limitations of shallow networks
- Understand role of network depth
- Appreciate complexity of some classification problems

**Customization Options:**
- Samples: 300-500 recommended for smooth spirals
- Noise: Even small noise makes this much harder
- Balance: Asymmetric spirals are unusual but interesting

**Advanced Tip:**
Use Spiral to compare different architectures. Track how many neurons you need
to achieve 90% accuracy.

---

#### Gaussian Dataset
**Location:** Left Panel → Dataset Gallery → Gaussian card

**Visual Description:**
- Two overlapping cloud-like clusters
- Blue cloud on one side
- Orange cloud on the other side
- Fuzzy boundaries (some overlap in the middle)

**Pattern Type:** Probabilistic, normally distributed

**Difficulty:** Easy-Medium

**Typical Use Cases:**
- Simulating realistic data
- Teaching probabilistic classification
- Demonstrating soft boundaries
- Testing regularization

**Expected Performance:**
- Achievable Accuracy: 85-95%
- Training Time: 50-150 epochs
- Recommended Architecture: 8, 4

**Learning Objectives:**
- Understand that not all data is perfectly separable
- See probabilistic decision boundaries
- Learn that 100% accuracy isn't always possible

**Customization Options:**
- Samples: More samples → smoother clouds
- Noise: Controls overlap amount (higher = more overlap)
- Balance: Shifts relative cluster sizes

**Real-World Connection:**
Many real datasets follow Gaussian distributions. This simulates realistic
classification scenarios.

---

#### Clusters Dataset
**Location:** Left Panel → Dataset Gallery → Clusters card

**Visual Description:**
- Multiple distinct groupings
- 3-5 separate clusters
- Each cluster can be a different class
- Clear separation between clusters

**Pattern Type:** Multi-class clustering

**Difficulty:** Medium

**Typical Use Cases:**
- Multi-class classification (3+ classes)
- Clustering demonstrations
- Testing network capacity for multiple categories

**Expected Performance:**
- Achievable Accuracy: 80-95%
- Training Time: 100-200 epochs
- Recommended Architecture: 12, 8 with 3-4 output classes

**Learning Objectives:**
- Understand multi-class classification
- See how networks handle more than 2 categories
- Learn about softmax output layers

**Customization Options:**
- Samples: Spread across clusters
- Noise: Can blur cluster boundaries
- Balance: Can make some clusters much larger

**Configuration Note:**
Set Output Classes to 3 or 4 to match the number of clusters.

---

#### Iris Dataset
**Location:** Left Panel → Dataset Gallery → Iris card

**Visual Description:**
- 2D projection of famous Iris flower dataset
- 3 species: Setosa, Versicolor, Virginica
- Based on petal/sepal measurements
- Real scientific data

**Pattern Type:** Real-world scientific data

**Difficulty:** Medium

**Typical Use Cases:**
- Working with actual datasets
- Scientific/botanical education
- Demonstrating real ML applications

**Expected Performance:**
- Achievable Accuracy: 85-95%
- Training Time: 100-200 epochs
- Recommended Architecture: 8, 4 with 3 output classes

**Learning Objectives:**
- Experience with real data
- Understand dimensionality reduction
- See how ML applies to science

**Background:**
One of the most famous datasets in machine learning, collected by botanist
Edgar Anderson and used by statistician R.A. Fisher in 1936.

**Configuration Note:**
Set Output Classes to 3 for the three iris species.

---

#### Wine Dataset
**Location:** Left Panel → Dataset Gallery → Wine card

**Visual Description:**
- 2D projection of wine chemical analysis
- Multiple wine types
- Based on chemical properties
- Real scientific data

**Pattern Type:** Real-world chemical data

**Difficulty:** Medium

**Typical Use Cases:**
- Real-world classification
- Chemistry education
- Quality assessment demonstrations

**Expected Performance:**
- Achievable Accuracy: 80-90%
- Training Time: 150-250 epochs
- Recommended Architecture: 12, 8 with 3 output classes

**Learning Objectives:**
- Work with real chemical data
- Understand feature importance
- See ML in quality control

**Background:**
Based on chemical analysis of wines from different regions in Italy.

**Configuration Note:**
Set Output Classes to 3 for the different wine types.

---

#### Draw (Custom Dataset)
**Location:** Left Panel → Dataset Gallery → Draw card

**Visual Description:**
- Initially empty canvas
- You create the pattern by clicking
- Class buttons appear to select colors

**Pattern Type:** Completely custom (you design it)

**Difficulty:** Variable (depends on what you draw)

**Typical Use Cases:**
- Testing specific hypotheses
- Creating custom challenges
- Demonstrations with audience participation
- Teaching students about data patterns

**How to Use:**
1. Click Draw card
2. Class buttons appear (different colors)
3. Click a class button to select it
4. Click on canvas to place dots of that class
5. Switch classes and continue drawing
6. Click "Clear Points" to start over

**Example Patterns to Try:**
- Checkerboard: Test network on very complex pattern
- Concentric circles: Multiple rings
- Letters or shapes: Spell out "AI" with dots
- Edge cases: All dots of one class in corners

**Educational Value:**
- Students see how patterns affect learning
- Can test "will this work?" questions
- Interactive and engaging

**Tips:**
- Draw at least 50-100 points total
- Balance classes (roughly equal numbers)
- Spread points evenly across the canvas
- Click Fetch after drawing to finalize

---

### Dataset Options

#### Samples Slider
**Location:** Left Panel → Dataset Options → Samples

**Visual:** Slider from 50 to 500

**What It Controls:**
Number of data points generated

**Effects:**

**50 Samples:**
- Faster loading
- Faster training
- Noisier visualization
- May not capture pattern well

**200 Samples (Default):**
- Good balance
- Smooth visualization
- Reasonable training speed

**500 Samples:**
- Slower training
- Very smooth visualization
- Better pattern representation
- May be overkill for simple patterns

**When to Adjust:**
- Increase for smoother boundaries
- Decrease for faster experiments
- Increase for complex patterns like Spiral

**Performance Impact:**
Training time scales linearly with samples (500 samples ≈ 2.5x slower than 200).

---

#### Noise Slider
**Location:** Left Panel → Dataset Options → Noise

**Visual:** Slider from 0% to 50%

**What It Controls:**
Amount of random perturbation added to data points

**Effects:**

**0% Noise:**
- Perfect pattern
- Clean separation
- Unrealistic
- Easy to achieve 99%+ accuracy

**10% Noise (Default):**
- Slight randomness
- More realistic
- Still learnable
- Good for education

**30-50% Noise:**
- Heavy randomness
- Classes overlap significantly
- Very challenging
- Cannot achieve high accuracy

**Visual Impact:**
- Low noise: Tight clusters, clear patterns
- High noise: Fuzzy, scattered points, overlapping classes

**When to Adjust:**
- Increase to make problem harder
- Increase to simulate real-world data (always has noise)
- Decrease for clean demos
- Use high noise to teach overfitting (network tries to fit noise)

**Educational Use:**
Show students that real data is messy. High noise demonstrates limits of
perfect accuracy.

---

#### Class Balance Slider
**Location:** Left Panel → Dataset Options → Class Balance

**Visual:** Slider from 10% to 90%, displays as percentage

**What It Controls:**
Ratio of Class 0 to Class 1

**Effects:**

**50% (Balanced):**
- Equal numbers of both classes
- Standard scenario
- Network learns both equally

**80% (Imbalanced):**
- 80% Class 0, 20% Class 1
- Minority class is harder to learn
- Network may ignore minority class
- Realistic (many real datasets are imbalanced)

**10% or 90% (Highly Imbalanced):**
- Extreme imbalance
- Network may predict majority class for everything
- Accuracy can be misleading (90% accuracy by always guessing majority!)

**When to Adjust:**
- Use 50% for standard learning
- Use 70-80% to teach imbalanced classification
- Extreme values (10/90) demonstrate real-world challenges

**Educational Value:**
Teaches that accuracy isn't everything. A network that always predicts Class 0
gets 90% accuracy on a 90/10 dataset!

**Metrics to Watch:**
- Confusion Matrix: See if minority class is being predicted
- Precision and Recall: Better metrics for imbalanced data

---

#### Preprocessing Dropdown
**Location:** Left Panel → Dataset Options → Preprocessing

**Options:**
- None (default)
- Normalize
- Standardize

**What It Does:**

**None:**
- Raw data, coordinates typically in 0-1 range
- No transformation

**Normalize:**
- Scales all values to 0-1 range
- Formula: (x - min) / (max - min)
- Ensures consistent scale

**Standardize:**
- Scales to mean=0, standard deviation=1
- Formula: (x - mean) / std
- Centers and scales data

**When to Use:**

**Normalize:**
- When features have different ranges
- When using sigmoid activation (expects 0-1 inputs)
- Real-world data with different units

**Standardize:**
- When features are normally distributed
- For algorithms sensitive to scale
- When you want mean-centered data

**For NeuroViz:**
- Most built-in datasets work fine without preprocessing
- Try it when training is unstable
- Good practice for real-world applications

**Visual Impact:**
- Usually minimal for NeuroViz's synthetic datasets
- More important for Iris and Wine datasets

---

### CSV Upload

**Location:** Left Panel → Dataset Options → CSV button

**Purpose:**
Load your own data from a CSV (Comma-Separated Values) file

**File Format:**

**Structure:**
```
x_coordinate, y_coordinate, class_label
0.2, 0.3, 0
0.7, 0.8, 1
0.5, 0.5, 0
...
```

**Requirements:**
- Exactly 3 columns
- No header row
- Values separated by commas
- x and y coordinates (numeric, typically 0-1)
- Class label (integer: 0, 1, 2, etc.)

**Example CSV:**
```
0.25, 0.25, 0
0.75, 0.25, 1
0.25, 0.75, 1
0.75, 0.75, 0
```

This creates an XOR pattern.

**How to Use:**
1. Create CSV file in text editor or export from Excel
2. Click CSV button in NeuroViz
3. Select your file
4. Data loads to canvas

**Troubleshooting:**
- If nothing loads: Check format (commas, no header, 3 columns)
- If error: Ensure all values are numbers
- If weird pattern: Check x, y are in reasonable range (0-1 typical)

**Use Cases:**
- Load real experimental data
- Share custom patterns
- Import from other tools
- Educational: students create datasets in Excel

---

### Dataset Statistics Panel

**Location:** Left Panel → Dataset Section → Stats Panel (expandable)

**Appears:** After loading any dataset

**Contents:**

#### Total Samples
- Count of all data points
- Should match Samples slider setting
- Useful for confirming data loaded

#### Class Distribution
- Number of points in each class
- Visual bars showing proportions
- Percentages

**Example Display:**
```
Class 0: ██████████████░░░░░░ 140 (70%)
Class 1: ██████░░░░░░░░░░░░░░  60 (30%)
```

**What to Look For:**
- Roughly balanced (50/50) for most experiments
- Imbalanced if you used Balance slider
- If one class is missing: problem with data

#### Outliers
- Points far from their class cluster
- Warning icon if detected
- Count shown

**Interpretation:**
- Outliers may be noise or errors
- Or interesting edge cases
- High outlier count with low noise setting: check data

**Educational Use:**
- Discuss impact of outliers
- Show how noise creates outliers
- Relate to data cleaning in real ML

---

## Network Configuration Features

### Learning Rate

**Location:** Right Panel → Hyperparameters → Learning Rate

**Input Type:** Number input field

**Default:** 0.03

**Range:** 0.001 to 1.0 (but typically 0.001-0.5)

**What It Does:**
Controls the step size when updating network weights during training.

**Analogy:**
Learning rate is like the size of steps you take when hiking downhill:
- Large steps: Faster descent but might overshoot the bottom
- Small steps: Slower but more precise descent

**Mathematical Role:**
In weight update: `weight_new = weight_old - learning_rate × gradient`

**Effects of Different Values:**

**0.001 (Very Low):**
- Training is very slow
- Many epochs needed
- May not reach optimal accuracy in reasonable time
- Very stable (won't diverge)

**0.01 (Low-Moderate):**
- Slow but steady progress
- Good for complex patterns
- Safe choice
- Recommended for Spiral dataset

**0.03 (Default/Moderate):**
- Good balance for most problems
- Fast enough but stable
- Works for Circle, XOR, Gaussian

**0.1 (High):**
- Fast training
- Risk of instability
- Good for simple patterns like Circle
- May overshoot optimal weights

**0.3-1.0 (Very High):**
- Very unstable
- Loss will jump around
- Often diverges (loss → NaN)
- Educational: show students what happens with bad LR

**How to Choose:**

**Start with 0.03**, then adjust:
- If loss decreases too slowly: increase LR (try 0.05 or 0.1)
- If loss jumps around: decrease LR (try 0.01)
- If loss becomes NaN: decrease LR significantly (try 0.01 or 0.001)

**Warning Signs:**
- **Too High**: Loss increases, becomes NaN, unstable training
- **Too Low**: Training is slow, loss decreases very gradually

**Advanced Tip:**
Use LR schedules (see Training Config) to start high and decrease over time.

---

### Hidden Layers

**Location:** Right Panel → Hyperparameters → Hidden Layers

**Input Type:** Text input (comma-separated numbers)

**Default:** "8, 4"

**Format:** Each number is a layer, value is number of neurons

**Examples:**

**"4"**
- 1 hidden layer
- 4 neurons
- Total parameters: ~20-30
- Simple, fast
- Good for: Circle

**"8, 4" (Default)**
- 2 hidden layers
- First layer: 8 neurons
- Second layer: 4 neurons
- Total parameters: ~50-80
- Good for: Most datasets

**"16, 16, 8"**
- 3 hidden layers
- Deep network
- Total parameters: ~300-400
- Good for: Spiral, complex patterns

**"32, 32, 16, 8"**
- 4 hidden layers (very deep)
- Many parameters (~800-1000)
- Risk of overfitting
- Good for: Demonstrating depth, very complex patterns

**What Each Number Means:**
The number of neurons (computational units) in that layer.

**Network Structure:**
```
Input (2) → Layer 1 (8) → Layer 2 (4) → Output (2)
```

For "8, 4" configuration with binary classification.

**How to Choose:**

**Problem Complexity:**
- Simple patterns (Circle): 4-8 neurons, 1 layer
- Medium complexity (XOR, Gaussian): 8-12 neurons, 1-2 layers
- Complex patterns (Spiral): 16+ neurons, 2-3 layers

**Architecture Principles:**
- More layers: Can learn more complex patterns
- More neurons per layer: More capacity
- Too many: Overfitting, slow training
- Too few: Underfitting, poor accuracy

**Common Patterns:**
- Decreasing: "16, 8, 4" (funnel shape)
- Constant: "16, 16, 16" (uniform width)
- Mixed: "8, 16, 8" (bottleneck in middle)

**Performance Trade-offs:**

| Architecture | Parameters | Training Speed | Capacity | Overfitting Risk |
|--------------|------------|----------------|----------|------------------|
| 4 | ~20 | Fast | Low | Low |
| 8, 4 | ~80 | Medium | Medium | Low |
| 16, 16, 8 | ~350 | Slow | High | Medium |
| 32, 32, 16, 8 | ~1000 | Very Slow | Very High | High |

**Check Model Complexity Panel:**
After initialization, open Advanced → Model Complexity to see exact parameter
count and memory usage.

**Educational Use:**
- Compare 1 layer vs 2 layers on XOR (1 layer fails!)
- Show overfitting with huge network on simple pattern
- Demonstrate capacity: how small can you make network and still solve Spiral?

---

### Activation Function

**Location:** Right Panel → Hyperparameters → Activation

**Dropdown Options:**
- ReLU (default)
- Tanh
- Sigmoid

**What It Does:**
Applies a nonlinear transformation to neuron outputs. Without activation
functions, neural networks would just be linear combinations (unable to learn
complex patterns).

**Visual Comparison:**

**ReLU (Rectified Linear Unit):**
```
f(x) = max(0, x)

Graph:
  |     /
  |    /
  |   /
--|--/--------
  | /
```

**Properties:**
- Output range: [0, ∞)
- Fast to compute
- Gradient: 1 for x > 0, else 0
- Can cause "dead neurons" (always output 0)

**When to use:**
- Default choice
- Most modern networks use ReLU
- Fast training
- Works well for most problems

**Tanh (Hyperbolic Tangent):**
```
f(x) = (e^x - e^-x) / (e^x + e^-x)

Graph:
  1 |      ___
    |    /
  0 |   /
    | /
 -1 |---
```

**Properties:**
- Output range: [-1, 1]
- Centered around zero
- Gradient: max at x=0, decreases for extremes
- Symmetric

**When to use:**
- When centered outputs beneficial
- Some recurrent patterns
- If ReLU struggles
- Produces smoother boundaries sometimes

**Sigmoid:**
```
f(x) = 1 / (1 + e^-x)

Graph:
  1 |      ___
    |    /
0.5 |   /
    | /
  0 |---
```

**Properties:**
- Output range: [0, 1]
- S-shaped curve
- Gradient: max at x=0, very small for extremes
- Probabilistic interpretation

**When to use:**
- Output layer for probabilities
- Historical networks (less common in hidden layers now)
- Smoother decision boundaries
- Slower training than ReLU

**Comparison Table:**

| Feature | ReLU | Tanh | Sigmoid |
|---------|------|------|---------|
| Speed | Fastest | Fast | Slower |
| Gradient Flow | Good | Medium | Poor (vanishing) |
| Output Range | [0, ∞) | [-1, 1] | [0, 1] |
| Dead Neurons | Possible | No | No |
| Boundary Smoothness | Sharp | Medium | Smoothest |
| Modern Usage | Very Common | Occasional | Rare (hidden) |

**Decision Boundary Effects:**
- ReLU: Can create sharper, more angular boundaries
- Tanh: Medium smoothness
- Sigmoid: Smoothest, most gradual transitions

**Educational Demonstration:**
Train same dataset with all three activations and compare:
- Decision boundary shapes
- Training speed
- Final accuracy

**Advanced Note:**
The activation function in hidden layers is what makes neural networks
nonlinear and powerful. Without it, the network collapses to a linear model.

---

### Optimizer

**Location:** Right Panel → Hyperparameters → Optimizer

**Dropdown Options:**
- Adam (default)
- SGD
- RMSprop

**What It Does:**
The algorithm used to update network weights based on gradients.

**Adam (Adaptive Moment Estimation):**

**How it works:**
- Adapts learning rate for each parameter
- Combines momentum and RMSprop
- Maintains running averages of gradients and squared gradients

**Advantages:**
- Works well out-of-the-box
- Less sensitive to learning rate choice
- Fast convergence
- Handles sparse gradients well

**When to use:**
- Default choice (recommended)
- When you don't want to tune optimizer settings
- Most problems

**Learning Rate Guidance:**
- Default (0.03) works well
- Range: 0.001 - 0.1

---

**SGD (Stochastic Gradient Descent):**

**How it works:**
- Simple: `weight -= learning_rate × gradient`
- Can add momentum for better performance
- No adaptation

**Advantages:**
- Simplest algorithm
- Well-understood
- Can achieve good results with proper tuning
- Less memory usage

**Disadvantages:**
- Requires careful learning rate tuning
- May need momentum
- Slower convergence than Adam

**When to use:**
- Educational purposes (simplest to explain)
- When you want full control
- Research/comparison

**Learning Rate Guidance:**
- May need different LR than Adam (often lower)
- Typical range: 0.001 - 0.05
- Benefits from momentum (not directly controllable in NeuroViz)

---

**RMSprop (Root Mean Square Propagation):**

**How it works:**
- Adapts learning rate based on moving average of squared gradients
- Divides learning rate by root of this average

**Advantages:**
- Good for recurrent patterns
- Handles varying gradient magnitudes
- Less aggressive adaptation than Adam

**When to use:**
- Alternative to Adam
- When Adam oscillates
- Specific problem types

**Learning Rate Guidance:**
- Similar to Adam
- Range: 0.001 - 0.1

---

**Comparison:**

| Aspect | Adam | SGD | RMSprop |
|--------|------|-----|---------|
| Ease of Use | Easiest | Hardest | Easy |
| Speed | Fast | Slower | Fast |
| Memory | Higher | Lowest | Medium |
| LR Sensitivity | Low | High | Low |
| Recommended Use | General | Educational | Alternative |

**Educational Demonstration:**
Train same dataset with all three optimizers:
- Adam: Fastest, least tuning
- SGD: Requires more epochs or higher LR
- RMSprop: Similar to Adam

**Recommendation:**
Stick with Adam unless you have specific reasons to change.

---

### Loss Function

**Location:** Right Panel → Hyperparameters → Loss Function

**Dropdown Options:**
- Cross Entropy (default)
- MSE (Mean Squared Error)
- Hinge

**What It Does:**
Defines how the network measures its prediction errors.

**Cross Entropy (Categorical Cross-Entropy):**

**Formula:**
`Loss = -Σ y_true × log(y_pred)`

**What it measures:**
- Probabilistic difference between predicted and true distribution
- Penalizes confident wrong predictions heavily

**Advantages:**
- Standard for classification
- Works with softmax output
- Probabilistic interpretation
- Well-suited for multi-class

**When to use:**
- Default choice for classification
- All built-in datasets
- When outputs are class probabilities

**Characteristics:**
- Sharper decision boundaries
- Fast convergence
- Range: 0 to ∞ (0 = perfect)

---

**MSE (Mean Squared Error):**

**Formula:**
`Loss = (1/N) × Σ (y_true - y_pred)²`

**What it measures:**
- Squared difference between predicted and true values
- Treats all errors equally (proportional to square of error)

**Advantages:**
- Simple to understand
- Regression-style loss
- Smooth gradients

**When to use:**
- Experimental (not standard for classification)
- Regression problems (not typical in NeuroViz)
- Produces softer boundaries

**Characteristics:**
- Softer decision boundaries
- May converge differently
- Range: 0 to ∞ (0 = perfect)

---

**Hinge Loss:**

**Formula:**
`Loss = max(0, 1 - y_true × y_pred)`

**What it measures:**
- Margin-based loss (from SVM theory)
- Encourages correct predictions with confidence margin

**Advantages:**
- Creates maximum margin boundaries
- Theory from Support Vector Machines

**When to use:**
- Experimental
- Want SVM-like boundaries
- Educational comparison

**Characteristics:**
- Different boundary styles
- May produce different optimal solutions
- Range: 0 to ∞

---

**Comparison:**

| Loss Function | Best For | Boundary Style | Convergence |
|---------------|----------|----------------|-------------|
| Cross Entropy | Classification | Sharp | Fast |
| MSE | Regression | Soft | Medium |
| Hinge | Max Margin | Sharp | Medium |

**Visual Differences:**
- Cross Entropy: Natural for probability outputs
- MSE: Smoother, more gradual boundaries
- Hinge: Similar to Cross Entropy, margin-focused

**Recommendation:**
Use **Cross Entropy** for classification (NeuroViz's focus). Other losses are
experimental.

**Educational Use:**
Compare decision boundaries produced by different loss functions on same
dataset.

---

### Batch Normalization

**Location:** Right Panel → Hyperparameters → Batch Norm checkbox

**Default:** Unchecked (off)

**What It Does:**
Normalizes inputs to each layer during training (scales to mean=0, variance=1).

**Purpose:**
- Stabilizes training
- Reduces internal covariate shift
- Acts as regularization
- Allows higher learning rates

**How It Works:**
For each mini-batch:
1. Compute mean and variance of layer inputs
2. Normalize: `(x - mean) / sqrt(variance)`
3. Scale and shift: `γ × normalized + β` (learned parameters)

**When to Enable:**

**Use Batch Norm when:**
- Network is deep (3+ hidden layers)
- Training is unstable (loss jumps)
- Want faster convergence
- Using large learning rates

**Skip Batch Norm when:**
- Shallow network (1-2 layers)
- Training is already stable
- Want simplest model
- Performance is concern (adds computation)

**Effects:**

**Advantages:**
- More stable training
- Can use higher learning rates
- Sometimes improves final accuracy
- Reduces dependence on initialization

**Trade-offs:**
- Adds parameters (γ and β for each layer)
- Slightly slower per epoch
- More complex to understand

**In NeuroViz:**
- Helps with deep networks on Spiral
- Less impact on shallow networks
- Try enabling if deep network is unstable

**Educational Value:**
Compare training with and without batch norm on a deep network (16, 16, 8):
- With: More stable loss curve
- Without: May be more erratic

**Visualization:**
Check Layer Activations histogram to see normalized distributions when
batch norm is enabled.

---

### Output Classes

**Location:** Right Panel → Hyperparameters → Output

**Dropdown Options:**
- Binary (2 classes)
- 3 Class
- 4 Class

**What It Does:**
Sets the number of output neurons (classes to predict).

**Binary (2 Classes):**
- Default and most common
- Two categories: Class 0 and Class 1
- Output layer: 2 neurons (or 1 with sigmoid)
- Use for: Circle, XOR, Spiral, Gaussian, most custom datasets

**3 Class:**
- Three categories
- Output layer: 3 neurons with softmax
- Use for: Iris, Wine, Clusters (if configured), custom 3-class data

**4 Class:**
- Four categories
- Output layer: 4 neurons with softmax
- Use for: Clusters (if configured), custom 4-class data

**How to Choose:**
**Must match your dataset!**
- Count distinct class labels in your data
- Built-in datasets:
  - Binary (2): Circle, XOR, Spiral, Gaussian
  - Multi-class (3): Iris, Wine, Clusters
  - Custom: depends on your CSV or drawing

**What Happens If Mismatched:**
- Too few outputs: Can't represent all classes
- Too many outputs: Wasteful, some outputs never used

**Visualization Impact:**
- Binary: Two colors on canvas
- Multi-class: Multiple colors on canvas

**Confusion Matrix:**
- Size matches number of classes (2×2, 3×3, 4×4)

**Output Activation:**
- Binary: Sigmoid or Softmax
- Multi-class: Softmax (automatically applied)

---

## Training Features

### Start Training Button

**Location:** Center Panel → Training Status Bar

**Visual:** Blue button with play icon "Start Training"

**Keyboard Shortcut:** Space (toggle Start/Pause)

**Enabled When:**
- Network has been initialized
- Dataset is loaded
- Not currently training

**Disabled When:**
- Network not initialized
- No dataset loaded
- Already training (button shows "Pause" instead)

**What It Does:**
Begins the training loop:
1. Processes batches of data
2. Computes predictions
3. Calculates loss
4. Updates weights via backpropagation
5. Updates visualization
6. Repeats until max epochs or paused

**Training Loop:**
```
For each epoch:
  For each batch:
    1. Forward pass (make predictions)
    2. Compute loss
    3. Backward pass (compute gradients)
    4. Update weights
  Update visualization
  Update charts
  Check stopping criteria
```

**Automatic Updates:**
- Epoch counter increments
- Loss and accuracy update
- Decision boundary redraws
- Training history chart extends
- Learning rate chart updates (if schedule active)

**Training Speed:**
Controlled by FPS setting (1-60 updates per second).

**Stopping Conditions:**
- User clicks Pause
- Max epochs reached
- Early stopping triggered (if enabled)

---

### Pause Button

**Location:** Replaces Start button during training

**Visual:** Button with pause icon "Pause"

**Keyboard Shortcuts:**
- Space (toggle)
- Esc (pause only)

**What It Does:**
Temporarily halts training loop:
- Current epoch completes
- Network state frozen
- Weights preserved
- Can resume later

**Use Cases:**
- Examine current state
- Take screenshot
- Compare to previous state
- Stop to adjust settings (requires Start Over to apply)

**Resuming:**
Click Start (or press Space) to continue from current epoch.

**State Preservation:**
- Epoch counter maintained
- Loss and accuracy frozen at current values
- Charts don't update (static)
- Network weights unchanged

---

### Step Button

**Location:** Center Panel → Training Status Bar

**Visual:** Button with double-arrow icon

**Keyboard Shortcut:** S

**Enabled When:**
- Network initialized
- Not currently in continuous training mode

**What It Does:**
Trains for exactly one epoch, then pauses automatically.

**Use Cases:**
- **Education**: Show students each update
- **Debugging**: See gradual changes
- **Presentations**: Manual control of demonstration
- **Analysis**: Examine state after each epoch

**How to Use:**
1. Initialize network
2. Click Step (or press S)
3. One epoch trains
4. Updates appear
5. Automatically pauses
6. Repeat as desired

**Visual Updates:**
- Epoch counter: +1
- Loss: updates once
- Accuracy: updates once
- Decision boundary: redraws
- Charts: one new point added

**Combining with Continuous:**
- Can step a few epochs
- Then click Start for continuous
- Or vice versa

**Educational Demonstration:**
Step mode is perfect for showing:
- How learning is incremental
- How decision boundary evolves gradually
- How loss decreases step-by-step

**Performance Note:**
Stepping is slower than continuous (more overhead per epoch) but useful for
control.

---

### Start Over (Reset) Button

**Location:** Center Panel → Training Status Bar

**Visual:** Red button "Start Over"

**Keyboard Shortcut:** R

**Enabled When:**
- Network has been initialized

**What It Does:**
Resets the network to a fresh state:
- Randomizes all weights (new initialization)
- Resets epoch counter to 0
- Clears training history
- Clears charts
- Decision boundary resets
- Keeps configuration (hyperparameters unchanged)

**Does NOT Reset:**
- Hyperparameters
- Dataset
- Dataset options
- Your configuration

**When to Use:**

**Try Again:**
- Training went wrong (NaN loss)
- Want to see if different random initialization helps
- Accidentally trained too long

**Compare Initializations:**
- Train once, note results
- Start Over
- Train again with same config
- Results may differ due to random initialization

**After Changing Settings:**
- Changed hyperparameters mid-training
- Click Start Over
- Click Initialise Network
- Then Start Training (applies new settings)

**Educational Use:**
Demonstrate that neural network training has randomness (different runs produce
slightly different results).

---

### Undo/Redo Configuration

**Location:** Center Panel → Training Status Bar (right side)

**Visual:** Curved arrow buttons

**Keyboard Shortcuts:**
- Ctrl+Z: Undo
- Ctrl+Y: Redo

**What It Tracks:**
Changes to hyperparameters:
- Learning rate
- Hidden layers
- Activation function
- Optimizer
- Loss function
- Batch normalization
- Output classes
- Training config settings

**What It Does NOT Track:**
- Training progress
- Dataset changes
- Drawing custom points

**How It Works:**

**Undo:**
- Reverts to previous configuration
- Can undo multiple times (up to 20 changes)
- Button disabled when at oldest state

**Redo:**
- Moves forward through changes
- Only available after undo
- Button disabled when at newest state

**Use Cases:**

**Experimentation:**
1. Try learning rate 0.1
2. Initialize and train
3. Undo to revert learning rate
4. Try 0.03
5. Compare results

**Recovery:**
- Accidentally changed setting
- Undo immediately
- Back to working configuration

**Comparison:**
- Configure setup A
- Train and note results
- Modify to setup B
- Train and compare
- Undo to return to A

**Limitations:**
- History limited to recent changes
- Doesn't restore training progress
- Must re-initialize and re-train after undo

**Visual Feedback:**
- Buttons enabled/disabled based on history position
- No visual indication of what will undo/redo (just tries it)

---

### Batch Size

**Location:** Right Panel → Training Config → Batch Size

**Input Type:** Number input

**Default:** 10

**Range:** 1 to dataset size (typically 1-50)

**What It Does:**
Number of training examples processed together before updating weights.

**How It Affects Training:**

**Batch Size = 1 (Online Learning):**
- Update weights after every single example
- Maximum updates per epoch
- Noisier updates (high variance)
- Can escape local minima
- Slower (many small updates)

**Batch Size = 10 (Default):**
- Good balance
- Moderate update frequency
- Reasonable variance
- Fast enough

**Batch Size = 32-64 (Larger Batches):**
- Fewer updates per epoch
- More stable gradient estimates
- Faster computation (GPU benefits)
- Less noise (may get stuck)

**Batch Size = Dataset Size (Batch Gradient Descent):**
- One update per epoch
- Most stable
- Slowest per epoch
- May miss local minima

**Trade-offs:**

| Batch Size | Updates/Epoch | Noise | Speed | Memory |
|------------|---------------|-------|-------|--------|
| 1 | High | High | Slow | Low |
| 10 | Medium | Medium | Medium | Medium |
| 50 | Low | Low | Fast | Higher |

**When to Adjust:**

**Increase (to 20-50):**
- Training is too noisy
- Have large dataset
- Want faster training
- More stable gradients desired

**Decrease (to 1-5):**
- Training is stuck (plateau)
- Want noisier updates to escape local minima
- Small dataset (but not smaller than batch size)

**In NeuroViz:**
- Most datasets work well with default (10)
- Larger batches may speed up Spiral training
- Smaller batches for exploration/experimentation

**Educational Value:**
Compare training with batch size 1 vs 50:
- Batch 1: Loss curve more erratic
- Batch 50: Loss curve smoother

**Note:**
NeuroViz processes batches sequentially (browser-based). GPU-based systems
benefit more from larger batches.

---

### Max Epochs

**Location:** Right Panel → Training Config → Max Epochs

**Input Type:** Number input

**Default:** 100

**Range:** 1 to 10000+ (practical: 50-1000)

**What It Does:**
Maximum number of training cycles (epochs) before automatic stop.

**One Epoch:**
One complete pass through the entire training dataset.

**Effects:**

**Too Few (10-20):**
- Training may not complete
- Accuracy may be suboptimal
- Faster experiments

**Appropriate (50-200):**
- Most datasets reach convergence
- Good balance
- Circle: 50-100
- XOR: 50-100
- Gaussian: 100-200
- Spiral: 200-500

**Too Many (1000+):**
- Longer training time
- Risk of overfitting (training beyond optimal point)
- May be necessary for complex patterns
- Can always stop early manually

**When to Adjust:**

**Increase:**
- Complex pattern (Spiral)
- Accuracy still improving near max epochs
- Want to ensure full convergence

**Decrease:**
- Quick experiments
- Simple patterns (Circle)
- Testing configurations

**Interaction with Early Stopping:**
If early stopping enabled:
- May stop before max epochs
- Max epochs acts as upper limit

**Monitoring:**
Watch Training History chart:
- If accuracy plateaus before max epochs: can reduce max epochs
- If still improving at max epochs: increase max epochs

**Performance:**
More epochs = longer total training time (scales linearly).

---

### Speed (FPS) Slider

**Location:** Right Panel → Training Config → Speed (FPS)

**Visual:** Slider from 1 to 60

**Display:** Shows current value (e.g., "60")

**Default:** 60

**What It Does:**
Controls visualization update frequency (frames per second).

**Understanding FPS:**

**FPS = Frames Per Second**
- How many times per second the visualization updates
- Higher = smoother animation
- Lower = choppier but less CPU usage

**60 FPS:**
- Smoothest animation
- Updates 60 times per second
- Standard for modern displays
- Highest CPU usage

**30 FPS:**
- Still smooth
- Balanced performance
- Good for older computers

**15 FPS:**
- Choppier animation
- Battery-saving mode
- Minimal CPU usage

**1 FPS:**
- One update per second
- Slow-motion effect
- Educational: see each step clearly
- Minimum CPU usage

**Effects:**

**Visual Smoothness:**
- 60 FPS: Butter-smooth decision boundary evolution
- 30 FPS: Smooth, slight judder
- 15 FPS: Visible choppiness
- 1 FPS: Slow-motion, step-by-step

**CPU Usage:**
- 60 FPS: High (fan may spin up)
- 30 FPS: Medium
- 15 FPS: Low
- 1 FPS: Minimal

**Training Speed:**
- FPS only affects visualization frequency
- Actual training speed (epochs/second) is separate
- Lower FPS doesn't slow learning, just display updates

**When to Adjust:**

**Increase to 60:**
- Modern computer
- Want smoothest visuals
- Presentations (looks professional)

**Decrease to 15-30:**
- Older computer
- Battery saving (laptop)
- Computer fan is loud
- Other apps running

**Set to 1-5:**
- Educational: slow-motion learning
- Debugging: see each update clearly
- Screen recording (easier to capture)

**Performance Mode:**
Quick presets for FPS (see next section).

---

### Performance Mode

**Location:** Right Panel → Training Config → Performance Mode

**Dropdown Options:**
- Full Speed (60 FPS)
- Balanced (30 FPS)
- Battery Saver (15 FPS)

**What It Does:**
Quickly sets FPS to predefined values for different use cases.

**Full Speed (60 FPS):**
- Maximum smoothness
- Modern computers
- Presentations
- When plugged in

**Balanced (30 FPS):**
- Good compromise
- Most computers
- Daily use
- Still smooth

**Battery Saver (15 FPS):**
- Minimal CPU usage
- Laptops on battery
- Older computers
- Background training

**Relationship to FPS Slider:**
- Performance Mode sets the FPS slider
- Or, moving FPS slider doesn't change Performance Mode label
- They control the same setting

**Recommendation:**
- Desktop: Full Speed
- Laptop (plugged in): Balanced or Full Speed
- Laptop (battery): Battery Saver
- Older computer: Battery Saver

---

### LR Schedule

**Location:** Right Panel → Training Config → LR Schedule

**Dropdown Options:**
- None (Constant) - default
- Step Decay
- Exponential Decay
- Cosine Annealing

**What It Does:**
Automatically adjusts learning rate during training.

**Why Use LR Schedules:**
- Start with high LR for fast progress
- Reduce LR later for fine-tuning
- Can improve final accuracy
- Prevents overshooting near optimal weights

**None (Constant):**
- Learning rate stays fixed
- Simple and predictable
- Good for most NeuroViz experiments

**Step Decay:**
- LR reduced by factor at specific epochs
- Example: LR × 0.5 every 50 epochs
- Stepwise reduction
- Abrupt changes

**Visual (Learning Rate Chart):**
```
LR
 |
 |-----
 |     -----
 |          -----
 |               -----
 +-----------------------
     Epochs
```

**When to use:**
- Long training runs
- Know when to reduce LR (plateaus around epoch 100, 200, etc.)

**Exponential Decay:**
- LR gradually decreases
- Formula: `LR = LR_initial × decay_rate^epoch`
- Smooth, continuous reduction

**Visual:**
```
LR
 |
 |\
 | \
 |  \___
 |      \_____
 +-----------------------
     Epochs
```

**When to use:**
- Want smooth LR reduction
- Long training (500+ epochs)
- Don't know exact decay points

**Cosine Annealing:**
- LR varies in cosine wave pattern
- Drops then rises, repeats
- Can help escape local minima
- Cyclical learning

**Visual:**
```
LR
 |  _       _
 | / \     / \
 |/   \___/   \___
 +-----------------------
     Epochs
```

**When to use:**
- Advanced experimentation
- Cyclic learning rate approach
- Research comparisons

**Choosing a Schedule:**

**Use Constant (None) when:**
- Short training (< 200 epochs)
- Simple datasets (Circle, XOR)
- Default recommendation

**Use Step or Exponential when:**
- Long training (500+ epochs)
- Complex datasets (Spiral)
- Accuracy plateaus mid-training

**Use Cosine when:**
- Experimenting with advanced techniques
- Training is stuck in local minimum

**Monitoring:**
Check Learning Rate Chart to see schedule in action.

**Educational Value:**
Compare constant LR vs scheduled:
- Constant: May overshoot near end
- Scheduled: Can achieve better final accuracy

---

## Visualization Features

### Decision Boundary Visualization

**Location:** Center Panel → Main Canvas

**What You See:**
Colored background representing network's predictions across entire 2D space.

**How It Works:**
1. Create a grid of points covering the canvas (e.g., 50×50 = 2500 points)
2. Feed each grid point through the network
3. Get prediction (Class 0, Class 1, etc.)
4. Color that pixel according to predicted class

**Color Meaning:**

**Binary Classification:**
- Blue regions: Network predicts Class 0
- Orange regions: Network predicts Class 1
- Boundary is where color changes

**Multi-class:**
- Multiple colors (blue, orange, green, etc.)
- Each color represents a different predicted class

**Opacity/Intensity:**
- May indicate prediction confidence (darker = more confident)
- Implementation-specific

**Evolution During Training:**

**Epoch 0 (Initialization):**
- Random-looking, patchy colors
- Boundary makes no sense
- Network hasn't learned anything

**Early Training (Epochs 1-20):**
- Boundary starts taking shape
- Still rough, evolving quickly
- Large changes between epochs

**Mid Training (Epochs 20-70):**
- Boundary becoming clearer
- Matches data pattern more closely
- Slower changes

**Late Training (Epochs 70-100+):**
- Boundary is smooth and stable
- Minor refinements
- Closely matches training data

**Interpreting Quality:**

**Good Boundary:**
- Separates most training points correctly
- Smooth, continuous
- Makes sense for the pattern
- Not overly complex

**Underfitting (Too Simple):**
- Straight line through XOR pattern
- Doesn't capture data structure
- Many misclassifications
- Network too simple

**Overfitting (Too Complex):**
- Extremely wiggly, convoluted paths
- Fits every training point perfectly (even noise)
- Suspicious "peninsulas" reaching for outliers
- Network too complex for data amount

**Dataset-Specific Expectations:**

**Circle:**
- Should see circular boundary
- Blue in center, orange outside
- Smooth circle if trained well

**XOR:**
- Two diagonal regions per class
- Four quadrants
- Cannot be a straight line

**Spiral:**
- Curved arms following spirals
- Complex shape
- May have imperfections (hard problem!)

**Gaussian:**
- Roughly diagonal or curved boundary
- Some overlap in middle (probabilistic)
- Won't be perfect (data overlaps)

**Educational Use:**
- Pause at different epochs to show evolution
- Compare underfitting (too simple) vs overfitting (too complex) boundaries
- Ask students: "Does this boundary make sense?"

---

### Training Data Points

**Location:** Center Panel → Main Canvas (overlaid on decision boundary)

**What You See:**
Small colored dots scattered across the canvas.

**Colors:**
- Blue dots: Class 0 (true label)
- Orange dots: Class 1 (true label)
- Additional colors for multi-class

**Size:**
- Small dots (a few pixels)
- Large enough to see, small enough not to clutter
- May be adjustable (not directly exposed in current UI)

**Position:**
- X-coordinate: Horizontal position
- Y-coordinate: Vertical position
- Represents feature values

**Purpose:**
- Show the training data the network is learning from
- Visual reference to judge boundary quality
- See if boundary separates dots correctly

**Relationship to Decision Boundary:**
- Ideally, blue dots in blue regions, orange dots in orange regions
- Misclassified points: blue dot in orange region (or vice versa)
- Boundary should "wrap around" each class's dots

**Opacity:**
- Usually opaque (solid dots)
- May be semi-transparent to show overlaps

**Overlapping Points:**
- If dots overlap: classes are not perfectly separable
- Happens with noise or inherently overlapping data (Gaussian)

**Visualizing Errors:**

**Correctly Classified:**
- Dot color matches background color

**Misclassified:**
- Dot color doesn't match background
- Example: Blue dot in orange region

**At Boundary:**
- Dots very close to color change
- Hardest to classify correctly
- Small weight changes flip predictions

**Educational Use:**
- Count misclassified dots to estimate error
- See which regions are hardest to learn
- Understand that network sees these (x, y) positions as input

---

### 3D View Mode

**Location:** Center Panel → Canvas Footer → View Controls → 3D Mode toggle

**Keyboard Shortcut:** None (click toggle)

**What It Does:**
Switches canvas from 2D top-down view to 3D perspective.

**3D Visualization:**

**Axes:**
- X-axis: Horizontal (same as 2D)
- Y-axis: Depth (perpendicular to screen)
- Z-axis: Height (vertical, represents network output)

**Surface:**
- 3D surface represents network's output values
- Height = network's prediction confidence
- Color = predicted class

**Interpretation:**

**Peaks (High Z):**
- Strong Class 1 prediction
- Network is confident it's Class 1

**Valleys (Low Z):**
- Strong Class 0 prediction
- Network is confident it's Class 0

**Flat Regions (Mid Z):**
- Uncertain predictions
- Near decision boundary

**Decision Boundary in 3D:**
- Where surface crosses Z = 0.5 (or midpoint)
- The "cliff" or "ridge" between peaks and valleys

**Camera Controls:**

**Rotate:**
- Click and drag to rotate view
- See surface from different angles

**Zoom:**
- Scroll wheel to zoom in/out
- Get closer or farther view

**Reset View:**
- Button (if available) to reset camera
- Or manually rotate back

**Visual Benefits:**

**Understanding:**
- See confidence as height
- Understand "decision surface" concept
- More intuitive for some learners

**Presentations:**
- Impressive, engaging visual
- Shows 3D nature of ML
- Captivates audience

**Analysis:**
- Identify uncertain regions (flat areas)
- See sharp vs. gradual transitions
- Spot overfitting (extremely jagged surface)

**Performance Note:**
3D rendering is more CPU/GPU intensive:
- May slow down on older computers
- Toggle off if lagging
- Reduce FPS if keeping 3D on

**Educational Use:**
- Explain "decision surface" terminology
- Show how networks compute continuous outputs
- Demonstrate that classification is threshold on continuous value

**Limitations:**
- Only works for 2D input data (x, y)
- 3D representation of 2D → 1D mapping
- Higher dimensional data can't be visualized this way

---

### Weights Overlay

**Location:** Center Panel → Canvas Footer → View Controls → Weights toggle

**What It Does:**
Overlays network connection weights as lines on the canvas.

**Visual Elements:**

**Lines:**
- Connections between neurons (from network diagram projected onto 2D)
- Starting points: Input neurons
- Ending points: Hidden layer neurons

**Line Properties:**

**Thickness:**
- Thicker line = larger weight magnitude
- Thin line = small weight

**Color:**
- Blue = positive weight
- Red = negative weight
- Intensity indicates magnitude

**Interpreting the Visualization:**

**Strong Connections (Thick Lines):**
- These features strongly influence neuron
- Important pathways

**Weak Connections (Thin Lines):**
- Little influence
- May indicate dead neurons

**Positive vs Negative:**
- Blue (positive): Increases neuron activation
- Red (negative): Decreases neuron activation

**Educational Use:**
- Show students that weights are real numbers
- Demonstrate how network "wires" itself
- See which connections matter most

**Limitations:**
- Can be cluttered for large networks
- Only shows first layer weights clearly
- Hard to interpret for deep networks

**Performance:**
Minimal impact on performance.

**Best Used With:**
- Simple networks (1-2 layers)
- After training completes (to see learned weights)
- Educational demonstrations

---

### Voronoi Diagram Overlay

**Location:** Center Panel → Canvas Footer → View Controls → Voronoi toggle

**What It Does:**
Overlays Voronoi diagram based on training data points.

**What is Voronoi Diagram:**
- Partitions space into regions
- Each region: closest to a specific training point
- Boundaries: equidistant from two points

**Visual Elements:**
- Cell boundaries (lines)
- Each cell corresponds to one training point
- Cells colored by that point's class

**Purpose:**

**Comparison:**
- Compare network's learned boundary to nearest-neighbor approach
- See how network differs from simple distance-based classification

**Educational:**
- Show alternative classification method
- Discuss pros/cons of neural networks vs simple approaches
- Voronoi = nearest neighbor classifier

**Interpretation:**

**If Network Boundary Matches Voronoi:**
- Network learned a nearest-neighbor-like solution
- May be underfitting (too simple)

**If Network Boundary Differs:**
- Network found a smoother, more general boundary
- Better generalization expected

**Use Cases:**
- Teaching: show different classification approaches
- Analysis: compare learned vs distance-based boundaries
- Understanding: see geometric interpretation

**Performance:**
Minimal impact.

---

### Learning Rate Chart

**Location:** Center Panel → Below Main Canvas

**Visual:** Line chart, 100px height

**Axes:**
- X-axis: Epoch number
- Y-axis: Learning rate value

**What It Shows:**
Learning rate value over epochs.

**Patterns:**

**Flat Line (Constant LR):**
- No schedule
- LR doesn't change
- Default

**Decreasing Line:**
- Step Decay: Stepwise drops
- Exponential Decay: Smooth curve downward

**Wavy Line:**
- Cosine Annealing: Up and down cycles

**Why It's Useful:**

**Verification:**
- Confirm LR schedule is working
- See exact LR at each epoch

**Debugging:**
- If training unstable, check if LR is dropping
- If training slow, check if LR too low

**Correlation:**
- Compare LR drops to accuracy jumps
- Often see accuracy improve after LR reduces

**Educational:**
- Show effect of LR schedules
- Explain dynamic learning rates

---

### Training History Chart

**Location:** Center Panel → Bottom of Panel

**Visual:** Dual-axis line chart, ~180px height

**Axes:**
- X-axis: Epoch number
- Left Y-axis: Loss (orange line)
- Right Y-axis: Accuracy (green line)

**Lines:**

**Loss (Orange):**
- Error metric
- Should trend downward
- Starts high, ends low

**Accuracy (Green):**
- Classification performance (%)
- Should trend upward
- Starts low, ends high

**Header Statistics:**

**Best Loss:**
- Lowest loss achieved during training
- Shown in orange

**Best Acc:**
- Highest accuracy achieved
- Shown in green

**Improvement:**
- Percentage change from start to current
- Shows overall progress

**Reading the Chart:**

**Healthy Training:**
- Loss: Steep drop early, gradual flatten
- Accuracy: Steep rise early, gradual flatten
- Both plateau around same epoch (convergence)

**Overfitting Warning:**
- Training loss keeps decreasing
- Validation loss increases
- Gap between them widens

**Underfitting:**
- Both plateau early
- At suboptimal values (high loss, low accuracy)

**Unstable Training:**
- Jagged, erratic lines
- Loss jumping up and down
- Sign of too-high learning rate

**Educational Use:**
- Point to different phases: rapid learning, plateau, convergence
- Compare runs with different hyperparameters
- Teach convergence concept

**Export:**
Use Export Stats to get raw data for external analysis.

---

## Advanced Analysis Features

### Network Diagram

**Location:** Right Panel → Advanced → Network Diagram (open by default)

**Visual:** Graphical representation of network architecture.

**Elements:**

**Circles (Neurons):**
- Each circle is one neuron
- Arranged in vertical columns (layers)

**Columns (Layers):**
- Left: Input layer (2 neurons for x, y)
- Middle: Hidden layers (variable count)
- Right: Output layer (2+ neurons for classes)

**Lines (Connections):**
- Lines between neurons represent weights
- Connect every neuron in layer N to every neuron in layer N+1

**Visual Encoding:**

**Line Thickness:**
- Thicker = larger weight magnitude
- Thin = small weight

**Line Color:**
- Blue = positive weight (strengthens connection)
- Red = negative weight (inhibits connection)
- Opacity = strength

**Neuron Color:**
- May indicate activation level (if shown during training)
- Or simple class color

**Reading the Diagram:**

**Count Structure:**
- Visual confirmation of architecture
- Example: See "8, 4" as 8 circles, then 4 circles

**Identify Important Connections:**
- Thick lines = important for predictions
- Thin lines = less relevant

**Dead Neurons:**
- Neurons with only thin/no outgoing connections
- May indicate ReLU killed the neuron

**Interpreting Patterns:**

**Many Strong Blue Lines from Neuron:**
- That neuron is important activator

**Many Strong Red Lines:**
- That neuron is important inhibitor

**Fan-out Pattern:**
- One neuron connects strongly to many
- Key feature detector

**Educational Use:**
- Show network structure visually
- Explain layers and connections
- Demonstrate that weights are learned (change during training)

**Updating:**
- Diagram updates after initialization
- Weights visualized after training

**Performance:**
Minimal overhead.

---

### Weight Distribution Histogram

**Location:** Right Panel → Advanced → Weight Distribution (collapsed by default)

**Visual:** Histogram (bar chart) showing distribution of all network weights.

**Axes:**
- X-axis: Weight value (e.g., -1 to +1)
- Y-axis: Count (number of weights in that range)

**Healthy Pattern:**

**Bell Curve (Normal Distribution):**
- Most weights near zero
- Symmetric spread
- Few extreme values
- Indicates good initialization and learning

**Visual:**
```
 Count
   |     *
   |    ***
   |   *****
   |  *******
   |*********
   +----------
  -1  0  +1
```

**Problem Patterns:**

**All Weights Near Zero:**
- Histogram has one tall bar at zero
- Network not learning
- Dead neurons
- Gradient vanishing issue

**Huge Weights:**
- Bars at extreme ends (±5, ±10)
- Network may be overfitting
- Or gradient exploding

**Bimodal (Two Peaks):**
- Two separate humps
- Unusual, may indicate:
  - Two subnetworks formed
  - Or artifact of specific initialization

**When to Check:**

**After Initialization:**
- Should see reasonable distribution
- Centered around zero
- Some spread

**After Training:**
- Should still be reasonable
- May shift slightly
- Check for extremes

**Educational Use:**
- Show that weights are real numbers
- Demonstrate initialization
- Explain weight regularization (L2 penalizes large weights)

**Actionable Insights:**

**All zeros:**
- Check initialization
- Learning rate may be too low
- Or network is broken

**Extreme values:**
- Add L2 regularization
- Reduce learning rate
- Check for gradient explosion

---

### Confusion Matrix

**Location:** Right Panel → Advanced → Confusion Matrix (collapsed by default)

**Visual:** Square grid (2×2 for binary, 3×3 for 3-class, etc.)

**Structure:**

```
              Predicted
           Class 0  Class 1
Actual     ┌────────────────┐
Class 0    │   TP   │  FN   │
Class 1    │   FP   │  TN   │
           └────────────────┘
```

**Cell Meanings:**

**True Positive (TP):**
- Actual: Class 0, Predicted: Class 0
- Correct!

**False Negative (FN):**
- Actual: Class 0, Predicted: Class 1
- Missed Class 0 (Type II error)

**False Positive (FP):**
- Actual: Class 1, Predicted: Class 0
- Incorrectly predicted Class 0 (Type I error)

**True Negative (TN):**
- Actual: Class 1, Predicted: Class 1
- Correct!

**Visual Encoding:**
- Darker cells = more examples
- Lighter cells = fewer examples
- Numbers show exact counts

**Reading the Matrix:**

**Perfect Classification:**
- Diagonal is dark (TP and TN)
- Off-diagonal is light/zero (FP and FN)

**Biased Classifier:**
- One row much darker
- Network favors one class

**Random Guessing:**
- All cells similar darkness
- ~50% accuracy

**Below Confusion Matrix:**
Three derived metrics:

**F1 Score:**
- Harmonic mean of precision and recall
- Range: 0-1 (1 is best)
- Balances precision and recall

**Precision:**
- Of predicted positives, how many correct?
- Formula: TP / (TP + FP)
- "How precise is our positive prediction?"

**Recall:**
- Of actual positives, how many did we catch?
- Formula: TP / (TP + FN)
- "How good is our recall?"

**Educational Use:**
- Show that accuracy isn't the full story
- Explain precision vs recall trade-off
- Discuss class imbalance

**Multi-Class:**
Matrix expands to NxN (N = number of classes).

---

### Layer Activations Histogram

**Location:** Right Panel → Advanced → Layer Activations (collapsed by default)

**Visual:** Histogram showing distribution of neuron activation values.

**Axes:**
- X-axis: Activation value
- Y-axis: Count (number of neurons)

**Displays:** Activations from hidden layers (after activation function).

**Healthy Patterns by Activation:**

**ReLU:**
- Many values at exactly zero (ReLU clamps negatives)
- Spread of positive values
- Should not be ALL zeros

**Tanh:**
- Centered around zero
- Range: -1 to +1
- Should be spread, not all at extremes

**Sigmoid:**
- Range: 0 to 1
- Should be spread
- Avoid all at 0 or all at 1 (saturation)

**Problem Patterns:**

**All Zero (ReLU):**
- Dead neurons
- Network not learning
- Solutions:
  - Lower learning rate
  - Different initialization
  - Try Leaky ReLU (not in NeuroViz)

**All Saturated (Tanh/Sigmoid):**
- All at -1/+1 or 0/1
- Vanishing gradients
- Solutions:
  - Lower learning rate
  - Batch normalization
  - Fewer layers

**Skewed Distribution:**
- All positive or all negative
- May indicate bias in data or network

**Educational Use:**
- Show what "activations" are (neuron outputs)
- Demonstrate saturation concept
- Explain dead neurons

**When to Check:**
- During training (watch evolution)
- After training (final state)
- If training stalls (check for dead neurons)

---

### Model Complexity Panel

**Location:** Right Panel → Advanced → Model Complexity (open by default)

**Contents:**

#### Parameters Count
- Total number of trainable weights in network
- Includes all layer weights and biases
- Example: "347 params"

**Interpretation:**
- More parameters = more capacity
- But also more data needed to train
- Risk of overfitting with too many

**Typical Ranges:**
- Simple (50-100): Small networks, simple patterns
- Moderate (100-500): Most NeuroViz experiments
- Large (500-2000): Deep networks for complex patterns

---

#### FLOPs per Forward Pass
- Floating-Point Operations
- Computational cost of one prediction
- Measures inference speed

**Interpretation:**
- Higher FLOPs = slower predictions
- Matters for real-time applications
- Less relevant in NeuroViz (small networks)

---

#### Memory Usage

**Params Memory:**
- Memory to store weights
- Formula: params × 4 bytes (float32)
- Example: 347 params ≈ 1.4 KB

**Activations Memory:**
- Memory during forward pass (storing layer outputs)
- Larger for bigger batch sizes
- Example: ~2 KB

**Total Memory:**
- Sum of above
- Example: ~3.4 KB

**Interpretation:**
- NeuroViz networks are tiny (KB range)
- Real models can be GB (GPT-3: 700 GB)
- Demonstrates concept of model size

---

#### Complexity Rating
- Text assessment: "Small", "Medium", "Large", "Very Large"
- Based on parameter count

**Ratings:**
- **Small** (< 100 params): Simple networks
- **Medium** (100-500 params): Moderate
- **Large** (500-2000 params): Deep networks
- **Very Large** (> 2000 params): Overkill for NeuroViz datasets

---

**Educational Use:**
- Discuss model size vs accuracy trade-offs
- Explain parameter count
- Introduce computational cost concepts
- Compare different architectures objectively

**Actionable Insights:**
- Very Large on simple dataset: likely overfitting
- Small on Spiral: likely underfitting
- Use to compare architectures

---

### Adversarial Examples

**Location:** Right Panel → Advanced → Adversarial Examples (collapsed by default)

**What They Are:**
Inputs that fool the network despite being close to correctly classified inputs.

**Example:**
- Point at (0.5, 0.5) is Class 0 with 90% confidence
- Perturb slightly to (0.51, 0.52)
- Network now predicts Class 1 with 90% confidence
- This perturbed point is adversarial

**How to Generate:**

1. **Train network first**
2. **Click "Generate Adversarial Examples"**
3. **Algorithm searches for:**
   - Points near decision boundary
   - Small perturbations that flip prediction
4. **Results appear in list**

**Results Display:**

**Count:**
- Number of adversarial examples found
- Typically 5-20

**List:**
- Each entry shows:
  - Original position (x, y)
  - True class
  - Predicted class
  - Confidence

**Visual:**
- Adversarial points appear on canvas
- Different marker (e.g., X instead of dot)
- Color indicates predicted class

**Interpretation:**

**Many Adversarials:**
- Network boundary is uncertain in places
- Decision boundary is complex
- May indicate overfitting

**Few Adversarials:**
- Network is confident in most regions
- Clean decision boundary

**Adversarials in Overlapping Regions:**
- Expected (data itself is ambiguous)
- Not a flaw

**Adversarials Far from Boundary:**
- Unusual, indicates network weakness
- May be overconfident

**Educational Use:**
- Demonstrate that networks aren't perfect
- Show uncertainty near boundaries
- Discuss adversarial robustness (real-world concern)

**Real-World Relevance:**
- Adversarial examples are a big problem in ML
- Self-driving cars: sticker on stop sign → go sign
- Face recognition: small perturbations → different person

**Clearing:**
Click "Clear Adversarial Points" to remove from visualization.

---

### Training Speed Comparison

**Location:** Right Panel → Advanced → Training Speed (collapsed by default)

**Purpose:**
Benchmark and compare training performance.

**How to Use:**

**Set Baseline:**
1. Configure network
2. Train for a bit (e.g., 50 epochs)
3. Click "Save Baseline"
4. Speed saved

**Compare:**
1. Change configuration (e.g., add layer, change optimizer)
2. Train again
3. See comparison automatically

**Results Display:**

**Current Speed:**
- Examples/second or epochs/second
- Example: "45 ex/sec"

**Baseline:**
- Previously saved speed
- Example: "60 ex/sec"

**Comparison:**
- Relative performance
- Example: "1.3x slower than baseline"
- Or: "1.2x faster than baseline"

**Typical Comparisons:**

**Adding Layers:**
- "16, 16, 8" is slower than "8, 4"
- Proportional to parameter count

**Batch Size:**
- Larger batches may be slightly faster
- (Less difference in browser than GPU)

**Optimizer:**
- Adam slightly slower than SGD (more computation)

**Batch Norm:**
- Adds overhead, slightly slower

**Educational Use:**
- Demonstrate speed/accuracy trade-offs
- Show that complexity has a cost
- Quantify performance impact

**Clearing:**
Click "Clear" to remove baseline.

---

## Educational Features

### Guided Tutorials

**Access:** Top Navigation → Learn → Guided Tutorials

**Purpose:**
Step-by-step interactive lessons teaching ML concepts.

**Tutorial List:**

#### 1. What is a Decision Boundary?
- **Duration:** 3 minutes
- **Difficulty:** Beginner
- **Topics:**
  - What decision boundaries are
  - How networks create them
  - Visual interpretation

**Steps:**
1. Introduction
2. Load Circle dataset
3. Observe data
4. Start training
5. Watch boundary form
6. Explanation
7. Completion

**What You Learn:**
- Decision boundaries separate classes
- Networks learn these boundaries
- Different patterns need different boundaries

---

#### 2. Why Does Learning Rate Matter?
- **Duration:** 5 minutes
- **Difficulty:** Beginner
- **Topics:**
  - Learning rate effects
  - Too high vs too low
  - Tuning strategy

**Steps:**
1. Introduction to LR
2. Find LR control
3. Load Spiral dataset
4. Train with normal LR
5. Observe stable training
6. Reset
7. Set high LR
8. Train with high LR
9. Observe instability
10. Key takeaway

**What You Learn:**
- Learning rate controls update size
- Too high → unstable, may diverge
- Too low → slow, may not converge
- Critical hyperparameter

---

#### 3. Understanding Overfitting
- **Duration:** 6 minutes
- **Difficulty:** Intermediate
- **Topics:**
  - What overfitting is
  - How to recognize it
  - Prevention techniques

**Steps:**
1. Introduction
2. Analogy (memorizing vs understanding)
3. Load noisy data
4. Increase noise
5. Create complex network
6. Train for many epochs
7. Spot overfitting in charts
8. Observe boundary overfitting
9. Prevention methods
10. Summary

**What You Learn:**
- Overfitting = memorizing training data
- Symptoms: gap between train and validation loss
- Causes: too complex model, too little data, too much training
- Solutions: regularization, dropout, early stopping, more data

---

**How Tutorials Work:**

**Tutorial Overlay:**
- Appears over main interface
- Shows current step
- Provides instructions
- Highlights relevant UI elements

**Progression:**
- **Manual steps:** Click "Next" to proceed
- **Action steps:** Perform required action (e.g., click button)
- **Wait steps:** Automatic after duration or event

**UI Locking:**
- Some steps disable other UI (focus on task)
- Can always abandon tutorial

**Highlighting:**
- Glowing outline on relevant UI elements
- Arrow or indicator pointing to action

**Progress:**
- Step counter: "Step 3/7"
- Can skip tutorial anytime

**Completion:**
- Congratulations message
- Tutorial marked as complete
- Can retry anytime

**Educational Value:**
- Self-paced learning
- Interactive, not just reading
- Immediate feedback
- Hands-on experimentation

---

### Challenge Mode

**Access:** Top Navigation → Learn → Challenge Mode

**Purpose:**
Test your skills with specific goals and constraints.

**Challenge List:** 7 challenges total

**Difficulty Levels:**
- Easy: 2 challenges (100 pts each)
- Medium: 2 challenges (200 pts each)
- Hard: 3 challenges (300-400 pts each)

**Challenge Structure:**

Each challenge has:
- **Name**
- **Description** (brief)
- **Long Description** (detailed explanation)
- **Difficulty**
- **Category** (Accuracy, Efficiency, Architecture, Special)
- **Dataset** (required dataset)
- **Goals** (targets to achieve)
- **Constraints** (limits to follow)
- **Hint** (help if stuck)
- **Points** (reward for completion)

**Examples:**

#### XOR Speed Run (Easy, 100 pts)
- **Goal:** 95% accuracy in under 50 epochs
- **Dataset:** XOR
- **Constraint:** Must use XOR dataset
- **Hint:** "XOR needs at least one hidden layer. Try 4-8 neurons with moderate LR."

#### Minimal Spiral (Medium, 200 pts)
- **Goal:** 90% accuracy
- **Dataset:** Spiral
- **Constraint:** Maximum 2 hidden layers
- **Hint:** "Need enough neurons per layer. Try 16-32 with ReLU."

#### Architecture Master (Hard, 400 pts)
- **Goal:** 95% accuracy on Spiral
- **Constraints:** Specific architecture requirements
- **Points:** Highest reward

**How to Complete:**

1. **Browse Challenges:** Read descriptions
2. **Start Challenge:** Click "Start" button
3. **Banner Appears:** Top of screen shows active challenge
4. **Configure Network:** Meet constraints
5. **Train:** Reach goals
6. **Automatic Validation:** Every epoch checks if goals met
7. **Completion:** Badge appears, points awarded

**Active Challenge Banner:**
- Shows challenge name
- Current status (in progress, goals met, etc.)
- Abandon button

**Validation:**
- Checks after each epoch
- Requirements:
  - All goals met
  - All constraints satisfied
- Feedback on what's missing

**Completion:**
- Check mark on challenge card
- Points added to total
- Leaderboard entry created

**Leaderboard Tab:**
- Switch from Challenges to Leaderboard
- See all your completions
- Ranked by score
- Shows configuration used

**Score Calculation:**
- Base: Meeting goals
- Bonus: Exceeding goals (higher accuracy, fewer epochs)
- Efficiency bonus

**Retrying:**
- Can retry completed challenges
- New attempt if you beat previous score
- Competition with yourself

**Educational Value:**
- Structured practice
- Clear objectives
- Incremental difficulty
- Gamification (points, badges)
- Self-assessment

---

### Keyboard Shortcuts

**Access:**
- Top Navigation → Learn → Keyboard Shortcuts
- Press **?** anywhere
- Click Help button (question mark icon)

**Modal Shows:**
- All available shortcuts
- Organized by category
- Key combinations in special formatting

**Categories:**

#### Training Controls
- **Space:** Start/Pause
- **S:** Step one epoch
- **R:** Reset training
- **Esc:** Pause

#### Configuration
- **Ctrl+Z:** Undo config change
- **Ctrl+Y:** Redo config change

#### Datasets
- **1:** Circle dataset
- **2:** XOR dataset
- **3:** Gaussian dataset
- **4:** Spiral dataset
- **5:** Moons dataset (if available)

#### View
- **F:** Toggle fullscreen
- **?:** Show shortcuts (this modal)

**Footer:**
- Instructions: Press ? or Esc to close

**Educational Use:**
- Teach efficient navigation
- Speed up demonstrations
- Accessibility (keyboard-only use)

**Power Users:**
- Faster workflow
- No mouse needed
- Professional feel

---

## Export and Sharing Features

(Continued in next section due to length...)

---

**End of Features Reference Part 1**

This reference continues with Export/Sharing features and Interface features.
For complete documentation, see also:
- [Quick Start Guide](QUICK-START.md)
- [User Guide](USER-GUIDE.md)
- [FAQ](FAQ.md)
