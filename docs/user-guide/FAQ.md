# Frequently Asked Questions (FAQ)

Common questions about using NeuroViz, with clear answers for beginners.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Training Questions](#training-questions)
- [Understanding Results](#understanding-results)
- [Configuration Questions](#configuration-questions)
- [Visualization Questions](#visualization-questions)
- [Performance and Technical](#performance-and-technical)
- [Educational Use](#educational-use)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

### What is NeuroViz?

NeuroViz is a web application that lets you watch neural networks learn in real
time. You can see how a network creates decision boundaries to classify 2D data
points, without any programming required.

### Do I need to install anything?

No! NeuroViz runs entirely in your web browser. Just open the website and
start using it. No downloads, no installation, no setup.

### Do I need programming experience?

No programming knowledge is required. The interface is entirely visual and
uses buttons, sliders, and dropdowns.

### What browser should I use?

**Recommended:** Chrome, Edge, or Firefox (latest versions)

Safari works but may have some performance issues with 3D view.

### Can I use NeuroViz on my phone or tablet?

NeuroViz works on mobile devices, but the experience is better on a larger
screen (laptop or desktop) because there are many panels and controls.

### Is NeuroViz free?

Yes, NeuroViz is completely free to use.

### Can I use NeuroViz offline?

NeuroViz requires an internet connection to load initially. Some browsers may
cache it for offline use, but this isn't guaranteed.

---

## Training Questions

### Why won't my network start training?

**Common reasons:**

1. **Network not initialized**
   - Click the blue "Initialise Network" button first
   - Must do this after changing hyperparameters

2. **No dataset loaded**
   - Click a dataset card in the left panel
   - Wait for data points to appear

3. **Button is disabled**
   - Check that prerequisites are met
   - Dataset loaded + Network initialized = Start button enabled

### How long should training take?

**Typical times:**
- Circle dataset: 20-60 seconds to reach 95%+ accuracy
- XOR dataset: 30-90 seconds
- Gaussian: 1-3 minutes
- Spiral: 3-10 minutes (complex pattern)

**Factors:**
- Complexity of dataset
- Network size (more layers = slower)
- Learning rate (lower = slower convergence)
- Your computer speed

### When should I stop training?

**Stop when:**
- Accuracy plateaus (stops improving)
- Loss plateaus (stops decreasing)
- You've reached max epochs
- You're satisfied with the result

**Indicators training is done:**
- Accuracy above 90-95% (for most datasets)
- Loss below 0.2
- Validation loss stopped decreasing
- Decision boundary looks good

### What if accuracy doesn't improve past 50%?

**50% accuracy = random guessing** (for binary classification)

**Solutions:**
1. Check network is initialized
2. Increase learning rate (try 0.1)
3. Add hidden layers (try "8, 4" instead of "4")
4. Click Start Over and try again
5. Check dataset loaded correctly

### My loss is NaN or Infinity. What happened?

**Cause:** Learning rate is too high (gradient explosion)

**Solution:**
1. Click Start Over to reset network
2. Reduce learning rate (try 0.01 or 0.001)
3. Click Initialise Network
4. Start Training again

### Loss is decreasing very slowly. Is this normal?

**If loss decreases but slowly:** Learning rate may be too low

**Solutions:**
1. Increase learning rate (try 0.05 or 0.1)
2. Or just wait longer (increase max epochs)
3. Use a learning rate schedule

**If loss is stuck (not decreasing at all):** Network may be stuck in local minimum
- Try Start Over (new random initialization)
- Or adjust architecture

### How do I know if my network is overfitting?

**Signs of overfitting:**
1. Training accuracy very high (99%)
2. Validation loss increases while training loss decreases
3. Decision boundary is extremely wiggly and complex
4. Fits every training point perfectly, including noise

**To fix:**
- Add regularization (L2)
- Enable dropout
- Simplify network (fewer layers/neurons)
- Use early stopping
- Get more training data (increase samples)

### How do I know if my network is underfitting?

**Signs of underfitting:**
1. Training accuracy is low (below 85% on simple datasets)
2. Decision boundary is too simple (straight line for XOR)
3. Loss plateaus but is still high (> 0.5)

**To fix:**
- Add hidden layers or neurons (try "16, 8" instead of "4")
- Increase max epochs
- Increase learning rate
- Try different activation function

---

## Understanding Results

### What is a good accuracy?

**Depends on dataset:**

**Circle, XOR, Gaussian:**
- Excellent: 95-99%
- Good: 90-95%
- Okay: 85-90%
- Poor: Below 85%

**Spiral:**
- Excellent: 90-95%
- Good: 85-90%
- Okay: 80-85%
- Poor: Below 80%

**Remember:** 100% is rare and may indicate overfitting!

### What does the loss number mean?

**Loss** measures how wrong the network's predictions are.

**Interpretation:**
- Lower is better
- 0 = perfect predictions
- Typically starts around 0.5-0.8
- Should end around 0.05-0.3

**If loss is:**
- **< 0.1:** Excellent
- **0.1-0.3:** Good
- **0.3-0.5:** Okay
- **> 0.5:** Poor (or still training)
- **NaN/Infinity:** Exploded gradients, reset needed

### What's the difference between loss and accuracy?

**Loss:**
- Continuous measure (any value)
- How confident and correct predictions are
- Used for training (gradient descent minimizes loss)

**Accuracy:**
- Percentage (0-100%)
- Simply: how many predictions are correct
- Easy to interpret
- What users care about

**Relationship:**
- Low loss usually means high accuracy
- But not always perfectly correlated

### Why is my accuracy 90% but the boundary looks wrong?

**Possible reasons:**

1. **90% is low for that dataset**
   - Circle should easily get 95%+
   - Network may be underfitting

2. **Overfitting**
   - High training accuracy
   - But boundary is too complex
   - Won't generalize to new data

3. **Visual vs Mathematical**
   - Boundary may be mathematically correct
   - But not match human intuition
   - Network sees features differently

### What does the decision boundary represent?

The decision boundary is the line (or curve) where the network changes its
prediction from one class to another.

**On the canvas:**
- Blue region: Network predicts Class 0
- Orange region: Network predicts Class 1
- The edge where colors change: Decision boundary

**Interpretation:**
- Points on the blue side → Class 0
- Points on the orange side → Class 1
- Points right on the boundary → Uncertain (50/50)

### Why does my decision boundary change each time?

Neural networks start with random weights, so each training run is different.

**Variation is normal:**
- Shape will be similar
- Exact boundary slightly different
- Final accuracy may vary by 1-5%

**Large variation (completely different boundaries):**
- Learning is unstable
- Try lower learning rate
- Or add regularization

### What are the colored dots on the canvas?

Those are your training data points:
- **Blue dots:** Class 0 (true label)
- **Orange dots:** Class 1 (true label)

The network is learning to separate these dots by drawing a decision boundary.

---

## Configuration Questions

### What should I set the learning rate to?

**Default recommendation:** 0.03

**General guidelines:**
- Simple patterns (Circle): 0.05-0.1
- Medium complexity (XOR, Gaussian): 0.01-0.05
- Complex patterns (Spiral): 0.005-0.02

**If you see:**
- Loss increasing or NaN: Too high, reduce by 10x
- Very slow learning: Too low, increase by 2-3x
- Stable, decreasing loss: Just right!

### How many hidden layers should I use?

**Guideline by dataset:**
- **Circle:** 1 layer (4-8 neurons)
- **XOR:** 1-2 layers (4-8 neurons each)
- **Gaussian:** 2 layers (8, 4)
- **Spiral:** 2-3 layers (16, 16, 8)

**General rule:**
- More complex pattern → more layers or neurons
- Start simple, add complexity if needed

### What does "8, 4" mean in hidden layers?

This defines your network architecture:
- **8:** First hidden layer has 8 neurons
- **4:** Second hidden layer has 4 neurons

**Other examples:**
- "4": One layer with 4 neurons
- "16, 8": Two layers (16 neurons, then 8)
- "16, 16, 16": Three layers, each with 16 neurons

### Which activation function should I choose?

**Recommendation:** Start with **ReLU** (default)

**Alternatives:**
- **Tanh:** If ReLU doesn't work well, try this
- **Sigmoid:** For smoother boundaries (slower)

**Most modern networks use ReLU** because it's fast and works well.

### Which optimizer should I use?

**Recommendation:** Use **Adam** (default)

Adam is adaptive and works well without much tuning. SGD and RMSprop are
alternatives for experimentation or educational comparison.

### What loss function should I use?

**Recommendation:** **Cross Entropy** (default)

This is the standard loss function for classification. MSE and Hinge are
experimental options.

### Should I enable Batch Normalization?

**Enable if:**
- Network is deep (3+ hidden layers)
- Training is unstable
- You want potentially faster convergence

**Skip if:**
- Network is shallow (1-2 layers)
- Training is already stable
- You want the simplest model

**For most NeuroViz experiments:** Not necessary, but doesn't hurt.

### What batch size should I use?

**Default:** 10 (works well for most cases)

**Adjust if:**
- **Increase to 20-50:** Training is noisy, want more stability
- **Decrease to 1-5:** Want to escape local minimum, experiment

**Effect:**
- Larger batch: More stable, faster computation, less noise
- Smaller batch: More noise (can help escape bad solutions)

### How many epochs do I need?

**Typical ranges:**
- Circle, XOR: 50-100 epochs
- Gaussian: 100-200 epochs
- Spiral: 200-500 epochs

**Set max epochs high** and stop manually or let early stopping handle it.
You can always pause early.

---

## Visualization Questions

### The canvas is blank. What's wrong?

**Possible causes:**

1. **No dataset loaded**
   - Click a dataset card in left panel
   - Wait for colored dots to appear

2. **Network not initialized**
   - Dots appear but no background color
   - Click "Initialise Network" button

3. **Browser issue**
   - Refresh page (Ctrl+R or Cmd+R)
   - Try different browser

### Why is the decision boundary so jagged/wiggly?

**If during training (early epochs):**
- Normal! Boundary starts rough and smooths out

**If after training (many epochs):**
- **Overfitting:** Network too complex for data amount
- Solutions: Simplify network, add regularization, or increase data

### What do the charts at the bottom show?

**Learning Rate Chart** (smaller, above):
- Shows learning rate value over epochs
- Flat line if constant
- Decreasing if using schedule

**Training History Chart** (larger, bottom):
- Orange line: Loss (should decrease)
- Green line: Accuracy (should increase)
- Shows training progress over time

### Can I zoom in on the canvas?

The canvas shows a fixed view of the 2D space. There's no zoom functionality
in the current UI, but you can enter fullscreen mode (press F) for a larger
view.

### What does 3D mode show?

3D mode displays the decision surface:
- X and Y: Same as 2D (data coordinates)
- Z (height): Network's output/confidence
- High peaks: Strong Class 1 prediction
- Low valleys: Strong Class 0 prediction
- Decision boundary: Where surface crosses middle height

**Use 3D mode** to understand decision surfaces and confidence levels.

### What are those lines when I enable "Weights"?

These show the network's connection weights:
- Thickness: Weight strength (magnitude)
- Color: Positive (blue) or negative (red)
- Connects input features to neurons

This visualizes what the network has learned.

### What is the Voronoi diagram overlay?

The Voronoi diagram shows nearest-neighbor boundaries (a simpler classifier).
It partitions space based on which training point is closest.

**Use it to:**
- Compare neural network boundary to nearest-neighbor
- See how network differs from simple distance-based classification
- Educational: show alternative approaches

---

## Performance and Technical

### Why is training so slow?

**Possible causes:**

1. **Complex network**
   - Many layers or neurons
   - Solution: Simplify architecture

2. **High FPS setting**
   - Set to 60 FPS (smooth but CPU-intensive)
   - Solution: Use Performance Mode: Battery Saver (15 FPS)

3. **3D view enabled**
   - 3D rendering is slower
   - Solution: Disable 3D toggle

4. **Old computer**
   - Normal for older hardware
   - Solution: Reduce FPS, simplify network

### The app is lagging or my fan is loud. What can I do?

**Reduce CPU usage:**

1. **Lower FPS:**
   - Set Performance Mode to "Battery Saver" (15 FPS)
   - Or manually move FPS slider to 15-30

2. **Disable 3D view:**
   - Toggle off "3D Mode" if enabled

3. **Simplify network:**
   - Fewer layers, fewer neurons

4. **Close other browser tabs:**
   - Free up resources

### Can I run multiple training sessions at once?

No, NeuroViz runs one training session at a time. To compare, train one
configuration, save results, reset, configure differently, and train again.

### Does training use my GPU?

NeuroViz uses TensorFlow.js, which attempts to use WebGL (GPU acceleration)
if available. Most modern browsers support this, giving decent performance
for small networks.

### Can I save my progress and come back later?

**Saved:**
- Configuration (hyperparameters)
- Dataset selection

**NOT saved automatically:**
- Training progress (epoch, weights)

**To save:**
1. Click "Save" in Session section
2. Download file
3. Later: Click "Load" and upload file

This restores configuration but you'll need to train again.

### How do I share my configuration with someone?

**Method 1: URL Sharing**
1. Click "Copy" in Session section
2. URL is copied to clipboard
3. Share URL with others
4. They click "Paste" and load it

**Method 2: File Sharing**
1. Click "Save" to download config file
2. Send file to others
3. They click "Load" and upload it

---

## Educational Use

### I'm a teacher. How can I use NeuroViz in class?

**Demonstration:**
- Use Quick Demo preset for fast results
- Fullscreen mode (press F) for visibility
- Step mode (press S) for slow-motion learning

**Guided Learning:**
- Assign tutorials (students complete on their own)
- Discuss concepts afterward

**Assignments:**
- Assign challenges (specific goals to achieve)
- Students submit exported reports as homework

**Interactive:**
- Draw custom datasets with class input
- Ask students to predict: "Will this learn well?"

### What concepts can I teach with NeuroViz?

**Core Concepts:**
- What decision boundaries are
- How neural networks learn
- Gradient descent (minimizing loss)
- Backpropagation (conceptual)

**Hyperparameters:**
- Learning rate effects
- Network depth and capacity
- Activation functions

**Problems:**
- Overfitting and underfitting
- Class imbalance
- Noisy data

**Comparisons:**
- Linear vs non-linear classifiers
- Different architectures
- Different optimizers

### Are there guided tutorials for students?

Yes! Click "Learn" → "Guided Tutorials" to access three tutorials:
1. What is a Decision Boundary? (3 min, Beginner)
2. Why Does Learning Rate Matter? (5 min, Beginner)
3. Understanding Overfitting (6 min, Intermediate)

These are interactive and self-paced.

### Can students compete with challenges?

Yes! Click "Learn" → "Challenge Mode" for 7 challenges with:
- Specific goals (e.g., "95% accuracy in under 50 epochs")
- Constraints (e.g., "Maximum 2 hidden layers")
- Points for completion
- Leaderboard to track attempts

**Great for engagement and friendly competition!**

### How can I create custom datasets for students?

**Method 1: Draw Mode**
1. Click "Draw" dataset card
2. Use class buttons to select color
3. Click canvas to place dots
4. Create patterns for students to learn

**Method 2: CSV Upload**
1. Create CSV file with x, y, class columns
2. Save as .csv
3. Click CSV button in NeuroViz
4. Upload file

**Examples:**
- Create specific patterns (checkerboard, concentric circles)
- Simulate real-world data
- Test edge cases

### What assignments can I give?

**Beginner:**
- Complete all three tutorials
- Achieve 95% on Circle dataset
- Explain what learning rate does (in writing)

**Intermediate:**
- Complete XOR Speed Run challenge
- Experiment with different architectures, document findings
- Create custom dataset and train network on it

**Advanced:**
- Complete all challenges
- Compare ReLU vs Tanh activation functions (export stats, write report)
- Demonstrate overfitting and prevention

---

## Troubleshooting

### The website won't load

**Check:**
1. Internet connection
2. Browser is up to date
3. JavaScript is enabled
4. Try different browser
5. Clear browser cache

### Buttons are greyed out and won't click

Buttons are disabled until prerequisites are met:

**Initialise Network:**
- Need dataset loaded first

**Start Training:**
- Need network initialized first

**Export Buttons:**
- Need training to have started

### I changed settings but nothing happened

Configuration changes require re-initialization:

1. Change hyperparameters
2. Click "Start Over" to reset
3. Click "Initialise Network" to apply changes
4. Click "Start Training"

### The loss/accuracy stopped updating

**Check if training is paused:**
- Look at button: shows "Start" (paused) or "Pause" (running)
- Press Space to toggle

**If not paused:**
- May have reached max epochs
- Check epoch counter vs max epochs
- Increase max epochs to continue

### I can't see the decision boundary

**If canvas is blank:**
1. Load a dataset (click dataset card)
2. Initialize network
3. Start training

**If you see dots but no colors:**
- Click "Start Training"
- Wait a few epochs for boundary to appear

### Keyboard shortcuts aren't working

**Check:**
1. No modal is open (close any popups)
2. No input field is focused (click elsewhere)
3. Correct key combination (case-sensitive)

**Try:**
- Click on canvas or main area
- Then try shortcut

### Training is stuck and won't progress

**Force refresh:**
1. Save your configuration if you want to keep it
2. Refresh page (Ctrl+R or Cmd+R)
3. Reload configuration
4. Try again

### I lost my work!

**Prevention:**
- Use "Save" button regularly
- Export reports after successful training
- Copy URL for configurations

**Recovery:**
- Check browser downloads for saved files
- Check clipboard for copied URLs
- Unfortunately, no automatic cloud save

### Error message appears

**Common errors and fixes:**

**"Network not initialized"**
- Click "Initialise Network" button

**"Invalid layer configuration"**
- Check Hidden Layers format (e.g., "8, 4")
- Use commas between numbers
- Only positive integers

**"Dataset failed to load"**
- Try clicking dataset again
- Refresh page and try again

**"Training failed"**
- May be gradient explosion (NaN loss)
- Click Start Over
- Lower learning rate
- Try again

---

## Still Have Questions?

### Where can I learn more?

**In-App:**
- Press **?** for keyboard shortcuts
- Click "Learn" → "Guided Tutorials"
- Click "Help" button

**Documentation:**
- [Quick Start Guide](QUICK-START.md) - 5-minute intro
- [User Guide](USER-GUIDE.md) - Complete manual
- [Features Reference](FEATURES-REFERENCE.md) - Detailed feature docs
- [Sitemap](SITEMAP.md) - Navigate the app

**External Resources:**
- 3Blue1Brown's Neural Network series (YouTube)
- Andrew Ng's Machine Learning course (Coursera)
- Fast.ai Practical Deep Learning course

### How can I provide feedback?

NeuroViz is open source! You can:
- Report issues on GitHub
- Suggest features
- Contribute improvements
- Share your experiences

### What if I found a bug?

1. Try refreshing the page first
2. Check if it's a known issue (FAQ or documentation)
3. Document the bug:
   - What you were doing
   - What you expected
   - What actually happened
   - Browser and OS
4. Report on GitHub (if available)

---

## Quick Reference

### Most Common Issues and Solutions

| Problem | Quick Solution |
|---------|---------------|
| Can't start training | Initialize network first |
| Loss is NaN | Lower learning rate, Start Over |
| Accuracy stuck at 50% | Increase LR or add layers |
| Training too slow | Reduce FPS to 15-30 |
| Overfitting | Add regularization or simplify network |
| Underfitting | Add layers/neurons |
| Changed settings don't apply | Start Over → Initialize → Train |

### Quick Settings for Success

**First Time User:**
- Dataset: Circle
- Preset: Quick Demo
- Just click Apply Preset → Initialize → Start

**Common Successful Configs:**

**Circle:**
- LR: 0.05, Layers: "8", Epochs: 100

**XOR:**
- LR: 0.03, Layers: "8, 4", Epochs: 100

**Gaussian:**
- LR: 0.02, Layers: "8, 4", Epochs: 150

**Spiral:**
- LR: 0.01, Layers: "16, 16, 8", Epochs: 500

---

**Happy Learning with NeuroViz!**

Remember: Experimentation is key. Don't be afraid to try different settings
and see what happens. Neural networks are complex, and hands-on experience is
the best teacher.

For more detailed information, check the complete [User Guide](USER-GUIDE.md).
