import { createContext, useContext, useReducer, useEffect, useCallback, useState, useRef } from 'react';
import { sampleProjects, sampleContractors, sampleEngineers, sampleSchemes, sampleConstituencies, sampleGrants, sampleCategories } from '../data/sampleData';
import { pushToSheet, pullFromSheet } from '../utils/googleSheets';

const ProjectContext = createContext();
const KEYS = { 
  projects: 'ct_projects', contractors: 'ct_contractors', engineers: 'ct_engineers', 
  schemes: 'ct_schemes', constituencies: 'ct_constituencies', grants: 'ct_grants', categories: 'ct_categories',
  gsheet: 'ct_gsheet' 
};

function load(key, fallback) {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; }
}

function reducer(state, action) {
  const { type, payload } = action;
  // Map of plural key -> singular action suffix
  const entities = {
    PROJECTS: 'PROJECT', CONTRACTORS: 'CONTRACTOR', ENGINEERS: 'ENGINEER',
    SCHEMES: 'SCHEME', CONSTITUENCIES: 'CONSTITUENCY', GRANTS: 'GRANT', CATEGORIES: 'CATEGORY'
  };
  for (const [plural, singular] of Object.entries(entities)) {
    const stateKey = plural.toLowerCase();
    if (type === `SET_${plural}`) return { ...state, [stateKey]: payload };
    if (type === `ADD_${singular}`) return { ...state, [stateKey]: [...state[stateKey], payload] };
    if (type === `UPDATE_${singular}`) return { ...state, [stateKey]: state[stateKey].map(i => i.id === payload.id ? payload : i) };
    if (type === `DELETE_${singular}`) return { ...state, [stateKey]: state[stateKey].filter(i => i.id !== payload) };
  }


  if (type === 'SET_ALL') {
    return { ...state, ...payload };
  }

  if (type === 'RESET_ALL') {
    return { projects: sampleProjects, contractors: sampleContractors, engineers: sampleEngineers, schemes: sampleSchemes, constituencies: sampleConstituencies, grants: sampleGrants, categories: sampleCategories };
  }
  return state;
}

export async function hashPassword(pw) {
  const enc = new TextEncoder().encode(pw);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function ProjectProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, () => ({
    projects: load(KEYS.projects, sampleProjects),
    contractors: load(KEYS.contractors, sampleContractors),
    engineers: load(KEYS.engineers, sampleEngineers),
    schemes: load(KEYS.schemes, sampleSchemes),
    constituencies: load(KEYS.constituencies, sampleConstituencies),
    grants: load(KEYS.grants, sampleGrants),
    categories: load(KEYS.categories, sampleCategories)
  }));
  const [gsheetConfig, setGsheetConfig] = useState(() => load(KEYS.gsheet, { 
    clientId: '', 
    sheetId: '1DaVTHRI1hG0tbAGGVmGDvsdExDmK1LquyDLVQld2_Io', // default to user's sheet
    connected: false 
  }));
  const skipNextPush = useRef(false);

  useEffect(() => { localStorage.setItem(KEYS.projects, JSON.stringify(state.projects)); }, [state.projects]);
  useEffect(() => { localStorage.setItem(KEYS.contractors, JSON.stringify(state.contractors)); }, [state.contractors]);
  useEffect(() => { localStorage.setItem(KEYS.engineers, JSON.stringify(state.engineers)); }, [state.engineers]);
  useEffect(() => { localStorage.setItem(KEYS.schemes, JSON.stringify(state.schemes)); }, [state.schemes]);
  useEffect(() => { localStorage.setItem(KEYS.constituencies, JSON.stringify(state.constituencies)); }, [state.constituencies]);
  useEffect(() => { localStorage.setItem(KEYS.grants, JSON.stringify(state.grants)); }, [state.grants]);
  useEffect(() => { localStorage.setItem(KEYS.categories, JSON.stringify(state.categories)); }, [state.categories]);
  useEffect(() => { localStorage.setItem(KEYS.gsheet, JSON.stringify(gsheetConfig)); }, [gsheetConfig]);

  // Auto-sync Push to Google Sheets on data changes
  useEffect(() => {
    if (gsheetConfig.connected && gsheetConfig.sheetId) {
      if (skipNextPush.current) {
        skipNextPush.current = false;
        return;
      }
      const timer = setTimeout(() => {
        pushToSheet(gsheetConfig.sheetId, state.projects, state.contractors, state.engineers, state.schemes, state.constituencies, state.grants)
          .catch(e => console.error('Auto-sync push failed:', e));
      }, 1500); // 1.5 second debounce to batch rapid changes
      return () => clearTimeout(timer);
    }
  }, [state, gsheetConfig]);

  // Auto-sync Pull (refresh every 2 minutes)
  useEffect(() => {
    if (gsheetConfig.connected && gsheetConfig.sheetId) {
      const interval = setInterval(() => {
        pullFromSheet(gsheetConfig.sheetId).then(data => {
          skipNextPush.current = true;
          dispatch({ type: 'SET_ALL', payload: {
            projects: data.projects.length ? data.projects : state.projects,
            contractors: data.contractors.length ? data.contractors : state.contractors,
            engineers: data.engineers.length ? data.engineers : state.engineers,
            schemes: data.schemes.length ? data.schemes : state.schemes,
            constituencies: data.constituencies.length ? data.constituencies : state.constituencies,
            grants: data.grants.length ? data.grants : state.grants,
            categories: state.categories, // Not synced to gsheet currently
          }});
        }).catch(e => console.error('Auto-sync pull failed:', e));
      }, 120000); // 2 minutes
      return () => clearInterval(interval);
    }
  }, [gsheetConfig.connected, gsheetConfig.sheetId]);

  const getAlerts = useCallback(() => {
    const now = new Date();
    const alerts = [];
    state.projects.forEach(p => {
      if (p.expiryDate) {
        const d = Math.ceil((new Date(p.expiryDate) - now) / 86400000);
        if (d < 0) alerts.push({ id: p.id+'_exp', projectId: p.id, type:'danger', title:'Performance Guarantee Expired', message:`${p.projectName} — expired ${Math.abs(d)} days ago`, date: p.expiryDate });
        else if (d <= 30) alerts.push({ id: p.id+'_exp', projectId: p.id, type:'warning', title:'Guarantee Expiring Soon', message:`${p.projectName} — ${d} days left`, date: p.expiryDate });
      }
      if (p.dateOfCompletionContract && p.statusOfWork !== 'completed') {
        const d = Math.ceil((new Date(p.dateOfCompletionContract) - now) / 86400000);
        if (d < 0) alerts.push({ id: p.id+'_cont', projectId: p.id, type:'danger', title:'Contract Period Expired', message:`${p.projectName} — overdue ${Math.abs(d)} days`, date: p.dateOfCompletionContract });
        else if (d <= 30) alerts.push({ id: p.id+'_cont', projectId: p.id, type:'warning', title:'Contract Ending Soon', message:`${p.projectName} — ${d} days left`, date: p.dateOfCompletionContract });
      }
      if (p.securityDepositReleaseDate) {
        const d = Math.ceil((new Date(p.securityDepositReleaseDate) - now) / 86400000);
        if (d < 0) alerts.push({ id: p.id+'_sec', projectId: p.id, type:'danger', title:'Security Deposit Overdue', message:`${p.projectName} — overdue ${Math.abs(d)} days`, date: p.securityDepositReleaseDate });
        else if (d <= 15) alerts.push({ id: p.id+'_sec', projectId: p.id, type:'info', title:'Security Deposit Release Due', message:`${p.projectName} — ${d} days left`, date: p.securityDepositReleaseDate });
      }
    });
    return alerts.sort((a, b) => a.type === 'danger' ? -1 : b.type === 'danger' ? 1 : 0);
  }, [state.projects]);

  return (
    <ProjectContext.Provider value={{ ...state, dispatch, getAlerts, gsheetConfig, setGsheetConfig }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProjects must be used inside ProjectProvider');
  return ctx;
}
