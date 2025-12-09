#!/bin/bash
# Automated lint fix script

# Fix Application.ts - remove unused import
sed -i '/^import { calculateModelComplexity }/d' src/core/application/Application.ts

# Fix Application.ts - add void to floating promises
sed -i 's/this\.speedComparisonController\.compareModels/void this.speedComparisonController.compareModels/g' src/core/application/Application.ts
sed -i 's/this\.reportService\.generateReport/void this.reportService.generateReport/g' src/core/application/Application.ts

# Fix ApplicationBuilder.ts - add void to floating promise
sed -i 's/controller\.loadDataset/void controller.loadDataset/g' src/core/application/ApplicationBuilder.ts

# Fix ApplicationBuilder.ts - prefix unused err with underscore
sed -i 's/(err)/(\_err)/g' src/core/application/ApplicationBuilder.ts

# Fix LearningRateScheduler.ts - remove unused import
sed -i 's/, LRScheduleType//g' src/core/application/training/LearningRateScheduler.ts

# Fix AdversarialExample.ts - prefix unused param with underscore
sed -i 's/gridSize: number/_gridSize: number/g' src/core/domain/AdversarialExample.ts

# Fix AdvancedFeaturesService.ts - remove unused imports
sed -i 's/, Hyperparameters//g' src/infrastructure/ml/AdvancedFeaturesService.ts
sed -i '/generateSimpleAdversarial,/d' src/infrastructure/ml/AdvancedFeaturesService.ts

# Fix AdvancedFeaturesService.ts - remove unused variables
sed -i '/const syncPredict/,/};/d' src/infrastructure/ml/AdvancedFeaturesService.ts
sed -i '/const generateBtn/d' src/infrastructure/ml/AdvancedFeaturesService.ts

# Fix EducationController.ts - remove unused imports
sed -i 's/ChallengeState, //g' src/presentation/controllers/EducationController.ts
sed -i 's/Challenge, //g' src/presentation/controllers/EducationController.ts

# Fix TrainingController.ts - remove unused imports
sed -i 's/OptimizerType, //g' src/presentation/controllers/TrainingController.ts
sed -i 's/, LRScheduleType//g' src/presentation/controllers/TrainingController.ts

# Fix UIFactory.ts - remove unused imports
sed -i 's/safeGetElement, //g' src/utils/UIFactory.ts
sed -i 's/, getRequiredElement//g' src/utils/UIFactory.ts

# Fix TooltipService.ts - fix constant binary expression on line 60
# Fix TooltipService.ts - prefix unused variable with underscore
sed -i 's/spaceLeft = /_spaceLeft = /g' src/infrastructure/education/TooltipService.ts

echo "Lint fixes applied"
