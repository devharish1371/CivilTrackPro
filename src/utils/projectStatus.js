export function getUcSentStatus(project) {
  const status = String(project?.ucSent || '').trim().toLowerCase();
  if (status === 'yes') return 'Yes';
  if (status === 'no') return 'No';
  return project?.ucSentDate ? 'Yes' : 'No';
}

export function normalizeProject(project) {
  const ucSent = getUcSentStatus(project);
  return {
    ...project,
    ucSent,
    ucSentDate: ucSent === 'Yes' ? (project?.ucSentDate || '') : '',
  };
}

export function normalizeProjects(projects) {
  return Array.isArray(projects) ? projects.map(normalizeProject) : [];
}
