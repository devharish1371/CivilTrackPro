import { getTenderPercentage } from './projectStatus.js';

export function matchesTenderDate(project, fromDate, toDate) {
  if (!project?.dateOfTender) return false;
  const date = new Date(project.dateOfTender);
  if (Number.isNaN(date.getTime())) return false;
  if (fromDate && date < new Date(fromDate)) return false;
  if (toDate && date > new Date(toDate)) return false;
  return true;
}

export function matchesTenderPercentage(project, direction, threshold) {
  const percentage = getTenderPercentage(project);
  if (percentage === '') return false;

  const limit = threshold === '' ? 0 : Number(threshold);
  if (!Number.isFinite(limit) || limit < 0) return false;

  if (direction === 'below') return percentage < 0 && percentage <= -limit;
  return percentage > 0 && percentage >= limit;
}
