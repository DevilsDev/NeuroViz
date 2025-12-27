# Quick Start Guide

Welcome to NeuroViz! This 5-minute guide will help you train your first neural
network and see it learn in real-time.

## What You'll Do

You'll train a neural network to separate colored dots into two groups by
learning where to draw a decision boundary between them.

## Step 1: Open NeuroViz

Open NeuroViz in your web browser. You'll see:
- A central canvas area (currently empty)
- A left panel with dataset options
- A right panel with network settings
- A top bar with controls

## Step 2: Choose a Dataset

In the left panel, you'll see colorful dataset cards. Click on the **Circle**
card to load your first dataset.

What happens:
- Blue and orange dots appear on the canvas
- Blue dots form a circle in the center
- Orange dots surround them

This is your training data. The network will learn to separate these two colors.

## Step 3: Initialize Your Network

In the right panel under "Hyperparameters":

1. Leave the default settings as they are:
   - Learning Rate: 0.03
   - Hidden Layers: 8, 4

2. Click the blue **Initialise Network** button

What happens:
- The network is created with your settings
- The canvas is ready for training
- The Start Training button becomes active

## Step 4: Start Training

Click the blue **Start Training** button in the center panel.

What happens:
- Colored regions begin to appear on the canvas
- Blue regions show where the network predicts blue dots
- Orange regions show where it predicts orange dots
- Numbers at the top show training progress:
  - **Epoch**: How many training cycles completed
  - **Loss**: How wrong the network is (lower is better)
  - **Accuracy**: Percentage of correct predictions

## Step 5: Watch It Learn

As training progresses (10-30 seconds), watch the colored background change:

- Initially, the colors may look random
- Gradually, blue forms in the center
- Orange fills the outer areas
- The boundary between colors becomes clearer

The network is learning to draw a circular decision boundary!

## Step 6: See Your Results

When training reaches 100 epochs (or you click Pause):

- Check the **Accuracy** at the top (should be 95%+)
- Look at the **Training History** chart below showing loss decreasing
- The decision boundary (colored background) should match the data points

Congratulations! You just trained a neural network!

## What Next?

Now that you know the basics:

### Try Different Datasets
Click other dataset cards to see how the network handles different patterns:
- **XOR**: Four corners pattern (harder to learn)
- **Spiral**: Twisted spiral shape (very challenging)
- **Gaussian**: Overlapping clusters

### Adjust Settings
Experiment with the controls in the right panel:
- Move the **Learning Rate** slider to see training speed change
- Change **Hidden Layers** to "16, 8" for a bigger network
- Try different **Activation** functions (ReLU, Tanh, Sigmoid)

### Use Quick Presets
In the left panel, select from **Quick Start** dropdown:
- **Quick Demo**: Fast training for demonstrations
- **Deep Network**: Complex architecture for harder problems
- **High Accuracy**: Slower but more accurate results

### Learn More
Click the **Learn** button in the top-right corner to access:
- **Guided Tutorials**: Step-by-step lessons on ML concepts
- **Challenge Mode**: Test your skills with specific goals
- **Keyboard Shortcuts**: Press **?** to see all shortcuts

## Common Questions

### Why isn't the boundary perfect?
Neural networks learn approximations. Small errors are normal, especially with
simpler networks.

### What if accuracy is stuck at 50%?
This means the network isn't learning. Try:
- Clicking **Start Over** to reset
- Increasing the learning rate
- Adding more neurons to hidden layers

### What do the charts mean?
- **Training History** (bottom): Shows how loss and accuracy change over time
- **Learning Rate** (middle): Shows how the learning rate changes during training

### Can I save my work?
Yes! In the left panel under "Session":
- **Save**: Download your configuration
- **Load**: Upload a saved session
- **Copy**: Copy a shareable URL
- **Paste**: Load from a shared configuration

## Keyboard Shortcuts

Speed up your workflow:
- **Space**: Start/Pause training
- **S**: Step one epoch at a time
- **R**: Reset training and start over
- **F**: Toggle fullscreen mode
- **?**: Show all keyboard shortcuts

## What's Happening Behind the Scenes?

When you train a neural network in NeuroViz:

1. **Data Loading**: The colored dots are your training examples
2. **Network Creation**: Neural network layers are built based on your settings
3. **Training Loop**: The network repeatedly:
   - Makes predictions for each dot
   - Calculates how wrong it was (loss)
   - Adjusts internal weights to improve
4. **Visualization**: The colored background shows where the network draws
   boundaries between classes

The decision boundary is the line where the network changes its prediction
from one class to another.

## Next Steps

Ready to dive deeper? Check out:
- **[User Guide](USER-GUIDE.md)**: Complete feature reference
- **[Features Reference](FEATURES-REFERENCE.md)**: Detailed explanations
- **[FAQ](FAQ.md)**: Troubleshooting and tips

Or click the **Learn** button in the app to start a guided tutorial!

---

**Need help?** Press **?** in the application to see keyboard shortcuts and
quick tips.
