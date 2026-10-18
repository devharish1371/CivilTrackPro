import test from 'node:test';
import assert from 'node:assert/strict';
import { getTenderPercentage, normalizeProjects } from '../src/utils/projectStatus.js';
import { matchesTenderPercentage } from '../src/utils/reportFilters.js';

test('tendered cost above the base is positive and filters Above', () => {
  const project = { costPutToTender: 100, tenderedCost: 103, tenderPercentage: -3 };
  assert.equal(getTenderPercentage(project), 3);
  assert.equal(matchesTenderPercentage(project, 'above', 3), true);
  assert.equal(matchesTenderPercentage(project, 'below', 3), false);
});

test('tendered cost below the base is negative and filters Below', () => {
  const project = { costPutToTender: 100, tenderedCost: 97, tenderPercentage: 3 };
  assert.equal(getTenderPercentage(project), -3);
  assert.equal(matchesTenderPercentage(project, 'below', 3), true);
  assert.equal(matchesTenderPercentage(project, 'above', 3), false);
});

test('loading existing projects replaces percentages saved with the old sign', () => {
  const projects = normalizeProjects([
    { id: 'higher', costPutToTender: 100, tenderedCost: 103, tenderPercentage: -3 },
    { id: 'lower', costPutToTender: 100, tenderedCost: 97, tenderPercentage: 3 },
  ]);
  assert.deepEqual(projects.map(project => project.tenderPercentage), [3, -3]);
});

test('projects without a valid cost put to tender cannot be filtered', () => {
  const project = { costPutToTender: 0, tenderedCost: 103, tenderPercentage: 3 };
  assert.equal(getTenderPercentage(project), '');
  assert.equal(matchesTenderPercentage(project, 'above', 3), false);
});
