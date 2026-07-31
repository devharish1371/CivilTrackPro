const normalizeDesignation = (designation) => String(designation || '')
  .trim()
  .toLowerCase()
  .replace(/[._-]/g, ' ')
  .replace(/\s+/g, ' ');

const compactDesignation = (designation) => normalizeDesignation(designation).replace(/\s/g, '');

export const getEngineerDesignation = (engineer) => engineer?.designation || engineer?.type || '';

export const isJuniorEngineer = (designation) => {
  const normalized = normalizeDesignation(designation);
  const compact = compactDesignation(designation);
  return normalized === 'junior' || compact === 'je' || compact === 'jr' || compact.includes('juniorengineer') || compact.includes('jrengineer');
};

export const isAssistantEngineer = (designation) => {
  const normalized = normalizeDesignation(designation);
  const compact = compactDesignation(designation);
  return normalized === 'assistant' || compact === 'ae' || compact.includes('assistantengineer');
};
