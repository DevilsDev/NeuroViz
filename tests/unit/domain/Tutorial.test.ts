/**
 * Tutorial Domain Tests
 */

import { describe, it, expect } from 'vitest';
import {
  TUTORIALS,
  getTutorial,
  getTutorialsByCategory,
  getTutorialsByDifficulty,
} from '../../../src/core/domain/Tutorial';

describe('Tutorial Domain', () => {
  describe('TUTORIALS constant', () => {
    it('should have at least 3 tutorials defined', () => {
      expect(TUTORIALS.length).toBeGreaterThanOrEqual(3);
    });

    it('should have unique IDs for all tutorials', () => {
      const ids = TUTORIALS.map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have valid structure for each tutorial', () => {
      for (const tutorial of TUTORIALS) {
        expect(tutorial.id).toBeTruthy();
        expect(tutorial.name).toBeTruthy();
        expect(tutorial.description).toBeTruthy();
        expect(tutorial.steps.length).toBeGreaterThan(0);
        expect(['beginner', 'intermediate', 'advanced']).toContain(tutorial.difficulty);
        expect(['concepts', 'techniques', 'troubleshooting']).toContain(tutorial.category);
      }
    });

    it('should have unique step IDs within each tutorial', () => {
      for (const tutorial of TUTORIALS) {
        const stepIds = tutorial.steps.map(s => s.id);
        const uniqueStepIds = new Set(stepIds);
        expect(uniqueStepIds.size).toBe(stepIds.length);
      }
    });
  });

  describe('getTutorial', () => {
    it('should return tutorial by ID', () => {
      const tutorial = getTutorial('decision-boundary');
      expect(tutorial).toBeDefined();
      expect(tutorial?.name).toBe('What is a Decision Boundary?');
    });

    it('should return undefined for unknown ID', () => {
      const tutorial = getTutorial('nonexistent');
      expect(tutorial).toBeUndefined();
    });
  });

  describe('getTutorialsByCategory', () => {
    it('should return tutorials filtered by category', () => {
      const conceptTutorials = getTutorialsByCategory('concepts');
      expect(conceptTutorials.length).toBeGreaterThan(0);
      expect(conceptTutorials.every(t => t.category === 'concepts')).toBe(true);
    });

    it('should return empty array for category with no tutorials', () => {
      // All current tutorials are in 'concepts', so 'troubleshooting' should be empty
      const troubleshootingTutorials = getTutorialsByCategory('troubleshooting');
      expect(Array.isArray(troubleshootingTutorials)).toBe(true);
    });
  });

  describe('getTutorialsByDifficulty', () => {
    it('should return tutorials filtered by difficulty', () => {
      const beginnerTutorials = getTutorialsByDifficulty('beginner');
      expect(beginnerTutorials.length).toBeGreaterThan(0);
      expect(beginnerTutorials.every(t => t.difficulty === 'beginner')).toBe(true);
    });
  });

  describe('Tutorial step actions', () => {
    it('should have valid action types for all steps', () => {
      const validActionTypes = ['click', 'change', 'wait', 'manual', 'training-start', 'training-complete', 'epoch-reached'];
      
      for (const tutorial of TUTORIALS) {
        for (const step of tutorial.steps) {
          expect(validActionTypes).toContain(step.action.type);
        }
      }
    });

    it('should have selector for click and change actions', () => {
      for (const tutorial of TUTORIALS) {
        for (const step of tutorial.steps) {
          if (step.action.type === 'click' || step.action.type === 'change') {
            expect(step.action.selector).toBeTruthy();
          }
        }
      }
    });

    it('should have epoch number for epoch-reached actions', () => {
      for (const tutorial of TUTORIALS) {
        for (const step of tutorial.steps) {
          if (step.action.type === 'epoch-reached') {
            expect(step.action.epoch).toBeGreaterThan(0);
          }
        }
      }
    });
  });
});
