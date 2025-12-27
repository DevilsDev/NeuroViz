# NeuroViz User Documentation

**Complete end-user documentation for the NeuroViz Neural Network Visualizer**

Welcome to the NeuroViz user documentation! This directory contains
comprehensive guides designed for students, educators, and ML enthusiasts - no
programming knowledge required.

---

## Documentation Overview

### For First-Time Users

**Start here:** [Quick Start Guide](QUICK-START.md) (5 minutes)
- Get up and running in under 5 minutes
- Train your first neural network
- See it learn in real-time
- Understand the basic workflow

### For Regular Users

**Complete reference:** [User Guide](USER-GUIDE.md) (Complete Manual)
- Comprehensive coverage of all features
- Step-by-step instructions
- Best practices and tips
- Troubleshooting section
- Glossary of terms

### For Finding Specific Features

**Detailed reference:** [Features Reference](FEATURES-REFERENCE.md)
- Every feature explained in detail
- Visual descriptions (what you see)
- Use cases and examples
- Configuration options
- Educational value notes

### For Navigation

**Application map:** [Sitemap](SITEMAP.md)
- Complete UI layout overview
- Navigation paths and workflows
- Where to find every feature
- User journey diagrams
- Quick reference table

### For Common Questions

**Q&A:** [FAQ](FAQ.md)
- Frequently asked questions
- Quick solutions to common problems
- Configuration recommendations
- Troubleshooting guide
- Educational use tips

---

## Quick Navigation

### I want to...

**Learn the basics** → [Quick Start Guide](QUICK-START.md)

**Understand all features** → [User Guide](USER-GUIDE.md)

**Find a specific feature** → [Sitemap](SITEMAP.md#quick-reference-finding-features)

**Look up detailed feature info** → [Features Reference](FEATURES-REFERENCE.md)

**Solve a problem** → [FAQ](FAQ.md#troubleshooting)

**Learn about datasets** → [Features Reference: Dataset Features](FEATURES-REFERENCE.md#dataset-features)

**Configure hyperparameters** → [User Guide: Configuring Your Network](USER-GUIDE.md#configuring-your-network)

**Understand visualizations** → [User Guide: Understanding Visualizations](USER-GUIDE.md#understanding-visualizations)

**Use for teaching** → [FAQ: Educational Use](FAQ.md#educational-use)

**Export my work** → [User Guide: Exporting and Sharing](USER-GUIDE.md#exporting-and-sharing)

---

## Documentation Structure

```
docs/user-guide/
├── README.md                   ← You are here
├── QUICK-START.md              ← 5-minute getting started (6 KB)
├── USER-GUIDE.md               ← Complete manual (52 KB)
├── FEATURES-REFERENCE.md       ← Detailed feature docs (74 KB)
├── SITEMAP.md                  ← Application navigation (17 KB)
└── FAQ.md                      ← Common questions (22 KB)
```

**Total:** ~170 KB of user documentation

---

## Target Audience

These guides are written for:
- **Students** learning machine learning concepts
- **Educators** teaching neural networks
- **ML Enthusiasts** exploring deep learning
- **Anyone curious** about how AI works

**No programming or math background required!**

---

## Key Features Documented

### Core Functionality
- 8 pre-loaded datasets (Circle, XOR, Spiral, Gaussian, Clusters, Iris, Wine, Custom)
- Custom dataset drawing and CSV upload
- Real-time training visualization
- Decision boundary evolution
- Interactive neural network configuration

### Configuration Options
- Hyperparameters (learning rate, layers, activation, optimizer)
- Training settings (batch size, epochs, FPS, LR schedules)
- Regularization (L1, L2, dropout, batch normalization)
- Advanced options (early stopping, performance modes)

### Visualizations
- 2D decision boundary with training points
- 3D decision surface view
- Network architecture diagram
- Training history charts (loss, accuracy)
- Learning rate timeline
- Weight distribution histograms
- Confusion matrix
- Layer activation histograms

### Educational Features
- 3 guided tutorials (decision boundaries, learning rate, overfitting)
- 7 challenges with points and leaderboard
- Keyboard shortcuts reference
- Preset configurations for quick starts
- Step-by-step training mode

### Advanced Tools
- Model complexity metrics
- Adversarial example generation
- Training speed comparison
- Configuration undo/redo
- Multiple export formats

---

## Learning Paths

### Beginner Path (30 minutes)
1. Read [Quick Start](QUICK-START.md) (5 min)
2. Try it: Train Circle dataset (5 min)
3. Complete tutorial: "What is a Decision Boundary?" (3 min)
4. Complete tutorial: "Why Does Learning Rate Matter?" (5 min)
5. Try different datasets (10 min)
6. Skim [User Guide](USER-GUIDE.md) for overview (2 min)

### Intermediate Path (2 hours)
1. Complete Beginner Path (30 min)
2. Read [User Guide: Configuring Your Network](USER-GUIDE.md#configuring-your-network) (15 min)
3. Complete tutorial: "Understanding Overfitting" (6 min)
4. Try challenges: XOR Speed Run, Perfect Circle (20 min)
5. Experiment with hyperparameters (30 min)
6. Read [Features Reference: Advanced Features](FEATURES-REFERENCE.md#advanced-analysis-features) (20 min)

### Educator Path (1 hour)
1. Complete Beginner Path (30 min)
2. Read [FAQ: Educational Use](FAQ.md#educational-use) (10 min)
3. Review all tutorials (15 min)
4. Explore challenges and leaderboard (10 min)
5. Practice creating custom datasets (10 min)
6. Review export features for student submissions (5 min)

### Power User Path (3+ hours)
1. Complete all tutorials (15 min)
2. Read entire [User Guide](USER-GUIDE.md) (60 min)
3. Read [Features Reference](FEATURES-REFERENCE.md) (90 min)
4. Complete all challenges (60+ min)
5. Experiment with all advanced features (30 min)
6. Create custom datasets and test edge cases (30 min)

---

## Common Workflows

### Quick Demo (5 minutes)
```
1. Select "Quick Demo" preset
2. Click "Apply Preset"
3. Click "Initialise Network"
4. Click "Start Training"
5. Watch network learn!
```

### Experimenting with Hyperparameters (15 minutes)
```
1. Load XOR dataset
2. Set learning rate: 0.03, layers: "8, 4"
3. Initialize and train
4. Note final accuracy
5. Click "Start Over"
6. Change learning rate to 0.1
7. Initialize and train
8. Compare results
```

### Completing a Challenge (20 minutes)
```
1. Click "Learn" → "Challenge Mode"
2. Read "XOR Speed Run" challenge
3. Start challenge
4. Configure: LR 0.05, Layers "8"
5. Train and monitor progress
6. Achieve 95% accuracy under 50 epochs
7. Celebrate completion!
```

### Creating a Training Report (10 minutes)
```
1. Configure and train network
2. Achieve desired accuracy
3. Click "Export Training Report"
4. Download HTML/PDF
5. Submit as homework/documentation
```

---

## Glossary Quick Reference

| Term | Simple Explanation |
|------|-------------------|
| **Accuracy** | Percentage of correct predictions (0-100%) |
| **Activation Function** | Mathematical function in neurons (ReLU, Tanh, Sigmoid) |
| **Batch Size** | Number of examples processed together |
| **Decision Boundary** | Line where network changes prediction from one class to another |
| **Epoch** | One complete pass through all training data |
| **Hidden Layer** | Layer between input and output (not directly visible) |
| **Hyperparameter** | Setting chosen before training (learning rate, layers, etc.) |
| **Learning Rate** | How big the steps are when adjusting weights |
| **Loss** | How wrong the network is (lower is better) |
| **Optimizer** | Algorithm for updating weights (Adam, SGD, RMSprop) |
| **Overfitting** | Network memorizes training data, fails on new data |
| **Regularization** | Techniques to prevent overfitting (L1, L2, dropout) |
| **Training** | Process of adjusting weights to minimize loss |
| **Underfitting** | Network too simple to learn pattern |
| **Weight** | Connection strength between neurons (learned parameter) |

For complete glossary, see [User Guide: Appendix](USER-GUIDE.md#appendix-glossary).

---

## Tips for Getting the Most Out of NeuroViz

### For Learning
1. **Start simple** - Use Circle dataset and default settings first
2. **One change at a time** - Isolate the effect of each hyperparameter
3. **Complete tutorials** - Interactive lessons teach core concepts
4. **Try challenges** - Test your understanding with specific goals
5. **Experiment freely** - You can't break anything, exploration is encouraged

### For Teaching
1. **Use fullscreen mode** (Press F) for classroom visibility
2. **Step mode** (Press S) for slow-motion demonstrations
3. **Quick presets** for fast, reliable demos
4. **Guided tutorials** for self-paced student learning
5. **Challenges** for homework and assessment
6. **Export reports** for student submissions

### For Research/Experimentation
1. **Save configurations** regularly to track experiments
2. **Export stats** for detailed analysis in Excel/Python
3. **Use speed comparison** to benchmark architectures
4. **Document findings** with screenshots and reports
5. **Try edge cases** - extreme learning rates, minimal networks, etc.

---

## Support and Resources

### In-App Help
- Press **?** anywhere to see keyboard shortcuts
- Hover over UI elements for tooltips
- Click "Help" button in top navigation
- Access tutorials: "Learn" → "Guided Tutorials"

### Documentation
- This directory contains all user documentation
- For technical/developer docs, see main [README.md](../../README.md)
- For architecture details, see [docs/ROADMAP.md](../ROADMAP.md)

### External Learning Resources
- **3Blue1Brown** - Neural Network series on YouTube (highly recommended)
- **Andrew Ng** - Machine Learning course on Coursera
- **Fast.ai** - Practical Deep Learning course
- **TensorFlow Playground** - Similar interactive tool

### Community
- NeuroViz is open source
- Contributions welcome
- Report issues on GitHub
- Share your findings and experiments

---

## Version Information

**Documentation Version:** 1.0
**Last Updated:** December 2025
**Covers NeuroViz Version:** Latest

**Documentation Scope:**
- End-user features and workflows
- Educational use cases
- No programming required
- Beginner to advanced users

For developer documentation, see the main repository README.

---

## Feedback

Found an issue with the documentation?
- Unclear explanations?
- Missing information?
- Suggestions for improvement?

Please report documentation issues alongside code issues on the GitHub
repository.

---

## Document Conventions

Throughout this documentation:

**Visual Indicators:**
- **Bold** = UI elements, buttons, important terms
- `Code style` = Exact values to enter, keyboard keys
- "Quotes" = Specific text or labels
- → = Navigation path (e.g., Left Panel → Dataset Section)

**Code Blocks:**
```
Step-by-step instructions
Or configuration examples
```

**Educational Notes:**
Sections marked "Educational Use" explain how to use features for teaching.

**Tips:**
Sections marked "Tips" provide best practices and recommendations.

**Warnings:**
Important caveats or common mistakes to avoid.

---

## License

This documentation is part of the NeuroViz project and is licensed under the
Apache 2.0 License. See [LICENSE](../../LICENSE) for details.

---

**Ready to get started?**

Begin with the [Quick Start Guide](QUICK-START.md) and start visualizing
neural networks in action!

**Questions?**

Check the [FAQ](FAQ.md) for answers to common questions.

**Need detailed reference?**

See the complete [User Guide](USER-GUIDE.md) for comprehensive documentation.

---

**NeuroViz** - Making neural networks visible, interactive, and understandable
for everyone.
