export function getUcSentStatus(project) {
  const status = String(project?.ucSent || '').trim().toLowerCase();
  if (status === 'yes') return 'Yes';
  if (status === 'no') return 'No';
  return project?.ucSentDate ? 'Yes' : 'No';
}

export function getSecurityDepositReleaseStatus(project) {
  const status = String(project?.securityDepositReleased || '').trim().toLowerCase();
  if (status === 'yes') return 'Yes';
  if (status === 'no') return 'No';
  return project?.securityDepositReleaseDate ? 'Yes' : 'No';
}

export function getTotalExpenditure(project) {
  return (Number(project?.expenditureIncurred) || 0) + (Number(project?.contingencyExpenditure) || 0);
}

export function getBalanceAmount(project) {
  return (Number(project?.sanctionedAmount) || 0) - getTotalExpenditure(project);
}

export function getTenderPercentage(project) {
  const costPutToTender = project?.costPutToTender;
  const tenderedCost = project?.tenderedCost;
  if (costPutToTender === '' || costPutToTender == null || tenderedCost === '' || tenderedCost == null) return '';

  const base = Number(costPutToTender);
  const tender = Number(tenderedCost);
  if (!Number.isFinite(base) || base <= 0 || !Number.isFinite(tender) || tender <= 0) return '';

  return Number((((base - tender) / base) * 100).toFixed(2));
}

// Keep the original contract date for records, but use a valid later extension
// as the current deadline for alerts and follow-ups.
export function getContractCompletionDate(project) {
  const original = project?.dateOfCompletionContract || '';
  const extended = project?.extendedCompletionDate || '';
  const isValidDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };
  return isValidDate(extended) && (!isValidDate(original) || extended > original) ? extended : original;
}

export function normalizeProject(project) {
  const ucSent = getUcSentStatus(project);
  return {
    ...project,
    tenderPercentage: getTenderPercentage(project),
    ucSent,
    ucSentDate: ucSent === 'Yes' ? (project?.ucSentDate || '') : '',
    securityDepositReleased: getSecurityDepositReleaseStatus(project),
  };
}

export function normalizeProjects(projects) {
  return Array.isArray(projects) ? projects.map(normalizeProject) : [];
}
