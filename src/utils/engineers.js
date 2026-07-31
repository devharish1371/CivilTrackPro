const normalizeDesignation = (designation) => String(designation || '')
  .trim()
  .toLowerCase()
  .replace(/[._-]/g, ' ')
  .replace(/\s+/g, ' ');

const compactDesignation = (designation) => normalizeDesignation(designation).replace(/\s/g, '');

export const isJuniorEngineer = (designation) => {
  const normalized = normalizeDesignation(designation);
  const compact = compactDesignation(designation);
  return normalized === 'junior engineer' || normalized === 'junior' || compact === 'je' || compact === 'juniorengineer';
};

export const isAssistantEngineer = (designation) => {
  const normalized = normalizeDesignation(designation);
  const compact = compactDesignation(designation);
  return normalized === 'assistant engineer' || normalized === 'assistant' || compact === 'ae' || compact === 'assistantengineer';
};
