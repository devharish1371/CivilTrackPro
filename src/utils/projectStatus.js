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

export function normalizeProject(project) {
  const ucSent = getUcSentStatus(project);
  return {
    ...project,
    ucSent,
    ucSentDate: ucSent === 'Yes' ? (project?.ucSentDate || '') : '',
    securityDepositReleased: getSecurityDepositReleaseStatus(project),
  };
}

export function normalizeProjects(projects) {
  return Array.isArray(projects) ? projects.map(normalizeProject) : [];
}
