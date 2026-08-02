import { createContext, useContext, useReducer, useEffect, useCallback, useState, useRef } from 'react';
import { sampleProjects, sampleContractors, sampleEngineers, sampleSchemes, sampleConstituencies, sampleGrants, sampleCategories, samplePanchayats } from '../data/sampleData';
import { db, auth } from '../utils/firebase';
import { doc, onSnapshot, setDoc, enableNetwork, getDocFromServer } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { isSessionUnlocked } from '../components/SessionGate';
import { normalizeProject, normalizeProjects, getSecurityDepositReleaseStatus } from '../utils/projectStatus';

const FIRESTORE_DOC = doc(db, 'civil_dashboard', 'master_data');
const SERVER_CHECK_TIMEOUT_MS = 10000;
const UPLOAD_CONFIRM_TIMEOUT_MS = 20000;
const FIRESTORE_DOC_MAX_BYTES = 900_000;
const FIRESTORE_ENABLE_URL =
  'https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=civildashboard-fb026';
const FIRESTORE_SETUP_URL =
  'https://console.firebase.google.com/project/civildashboard-fb026/firestore';

function formatFirestoreError(error) {
  const msg = error?.message || String(error);
  if (msg.includes('does not exist for project') || msg.includes('datastore/setup')) {
    return `Firestore database is not created yet. Create one in Firebase Console: ${FIRESTORE_SETUP_URL}`;
  }
  if (msg.includes('Cloud Firestore API has not been used') || msg.includes('firestore.googleapis.com')) {
    return `Firestore API is not enabled for this project. Enable it in Google Cloud Console, then retry: ${FIRESTORE_ENABLE_URL}`;
  }
  if (error?.code === 'permission-denied') {
    return 'Firestore access denied. Unlock the app with your password and apply the secured rules from firestore.rules in Firebase Console.';
  }
  if (error?.code === 'unavailable' || msg === 'FIRESTORE_TIMEOUT') {
    return `Cannot reach Firestore. Create the database in Firebase Console or enable the Firestore API: ${FIRESTORE_SETUP_URL}`;
  }
  return msg;
}

async function readDocFromServerWithTimeout(timeoutMs = 5000) {
  return Promise.race([
    getDocFromServer(FIRESTORE_DOC),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('FIRESTORE_TIMEOUT')), timeoutMs);
    }),
  ]);
}

async function verifyServerReachable() {
  if (!auth.currentUser) {
    throw new Error('Not signed in. Unlock the app with your 6-digit password first.');
  }
  await auth.currentUser.getIdToken(true);
  await enableNetwork(db);
  await readDocFromServerWithTimeout(SERVER_CHECK_TIMEOUT_MS);
}

function confirmWriteOnServer(expectedUpdatedAt) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      unsub();
      fn(value);
    };

    const timer = setTimeout(async () => {
      try {
        const snap = await readDocFromServerWithTimeout(4000);
        if (snap.exists() && snap.data().updatedAt === expectedUpdatedAt) {
          finish(resolve, snap);
          return;
        }
      } catch (e) {
        finish(reject, new Error(formatFirestoreError(e)));
        return;
      }
      finish(
        reject,
        new Error(
          'Cloud upload timed out. Check Firestore rules (signed-in users only) and your internet connection, then try again.'
        )
      );
    }, UPLOAD_CONFIRM_TIMEOUT_MS);

    const unsub = onSnapshot(
      FIRESTORE_DOC,
      { includeMetadataChanges: true },
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        if (!snap.metadata.fromCache && snap.exists() && snap.data().updatedAt === expectedUpdatedAt) {
          finish(resolve, snap);
        }
      },
      (err) => finish(reject, new Error(formatFirestoreError(err)))
    );
  });
}

let writeChain = Promise.resolve();

function buildFirestorePayload(state) {
  // JSON round-trip strips undefined values Firestore rejects
  return JSON.parse(JSON.stringify({
    projects: state.projects || [],
    contractors: state.contractors || [],
    engineers: state.engineers || [],
    schemes: state.schemes || [],
    constituencies: state.constituencies || [],
    panchayats: state.panchayats || [],
    grants: state.grants || [],
    categories: state.categories || [],
    updatedAt: new Date().toISOString(),
  }));
}

function payloadEquals(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function writeToFirestore(payload, { waitForServer = false } = {}) {
  const payloadBytes = JSON.stringify(payload).length;
  if (payloadBytes > FIRESTORE_DOC_MAX_BYTES) {
    throw new Error(
      `Data is too large for a single Firestore document (${(payloadBytes / 1024).toFixed(0)} KB). ` +
      'Firestore limit is ~1 MB. Export to Excel and split data, or remove old projects first.'
    );
  }

  const doWrite = async () => {
    if (!auth.currentUser) {
      throw new Error('Not signed in. Unlock the app with your 6-digit password first.');
    }
    await auth.currentUser.getIdToken(true);
    await enableNetwork(db);
    await setDoc(FIRESTORE_DOC, payload);
    if (waitForServer) {
      await confirmWriteOnServer(payload.updatedAt);
    }
  };

  // Explicit uploads must not queue behind background sync writes
  if (waitForServer) {
    await writeChain.catch(() => {});
    writeChain = Promise.resolve();
    await verifyServerReachable();
    return doWrite();
  }

  writeChain = writeChain.then(doWrite, doWrite);
  return writeChain;
}

const ProjectContext = createContext();
const KEYS = { 
  projects: 'ct_projects', contractors: 'ct_contractors', engineers: 'ct_engineers', 
  schemes: 'ct_schemes', constituencies: 'ct_constituencies', grants: 'ct_grants', categories: 'ct_categories',
  panchayats: 'ct_panchayats' 
};

function load(key, fallback) {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; }
}

function reducer(state, action) {
  const { type, payload } = action;
  // Map of plural key -> singular action suffix
  const entities = {
    PROJECTS: 'PROJECT', CONTRACTORS: 'CONTRACTOR', ENGINEERS: 'ENGINEER',
    SCHEMES: 'SCHEME', CONSTITUENCIES: 'CONSTITUENCY', GRANTS: 'GRANT', CATEGORIES: 'CATEGORY',
    PANCHAYATS: 'PANCHAYAT'
  };
  for (const [plural, singular] of Object.entries(entities)) {
    const stateKey = plural.toLowerCase();
    if (type === `SET_${plural}`) return { ...state, [stateKey]: stateKey === 'projects' ? normalizeProjects(payload) : payload };
    if (type === `ADD_${singular}`) {
      const item = stateKey === 'projects' ? normalizeProject(payload) : payload;
      return { ...state, [stateKey]: [...state[stateKey], { ...item, updatedAt: new Date().toISOString() }] };
    }
    if (type === `UPDATE_${singular}`) {
      const item = stateKey === 'projects' ? normalizeProject(payload) : payload;
      return { ...state, [stateKey]: state[stateKey].map(i => i.id === payload.id ? { ...item, updatedAt: new Date().toISOString() } : i) };
    }
    if (type === `DELETE_${singular}`) return { ...state, [stateKey]: state[stateKey].filter(i => i.id !== payload) };
  }


  if (type === 'SET_ALL') {
    return {
      ...state,
      ...payload,
      projects: payload.projects === undefined ? state.projects : normalizeProjects(payload.projects),
    };
  }

  if (type === 'ERASE_ALL') {
    return { projects: [], contractors: [], engineers: [], schemes: [], constituencies: [], grants: [], categories: [], panchayats: [] };
  }
  return state;
}

export function ProjectProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, () => ({
    projects: normalizeProjects(load(KEYS.projects, sampleProjects)),
    contractors: load(KEYS.contractors, sampleContractors),
    engineers: load(KEYS.engineers, sampleEngineers),
    schemes: load(KEYS.schemes, sampleSchemes),
    constituencies: load(KEYS.constituencies, sampleConstituencies),
    panchayats: load(KEYS.panchayats, samplePanchayats),
    grants: load(KEYS.grants, sampleGrants),
    categories: load(KEYS.categories, sampleCategories)
  }));
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const [firestoreDocExists, setFirestoreDocExists] = useState(null); // null = unknown, true/false = known
  const [firebaseSyncError, setFirebaseSyncError] = useState('');
  const [authReady, setAuthReady] = useState(!!auth.currentUser);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);
  const userMadeChange = useRef(false);
  const isLocalPush = useRef(false);
  const lastRemotePayload = useRef(null);

  const customDispatch = useCallback((action) => {
    if (action.type !== 'SET_ALL' && action.type !== 'ERASE_ALL') {
      userMadeChange.current = true;
    }
    dispatch(action);
  }, []);

  // Sync to local storage for instant offline loading
  useEffect(() => { localStorage.setItem(KEYS.projects, JSON.stringify(state.projects)); }, [state.projects]);
  useEffect(() => { localStorage.setItem(KEYS.contractors, JSON.stringify(state.contractors)); }, [state.contractors]);
  useEffect(() => { localStorage.setItem(KEYS.engineers, JSON.stringify(state.engineers)); }, [state.engineers]);
  useEffect(() => { localStorage.setItem(KEYS.schemes, JSON.stringify(state.schemes)); }, [state.schemes]);
  useEffect(() => { localStorage.setItem(KEYS.constituencies, JSON.stringify(state.constituencies)); }, [state.constituencies]);
  useEffect(() => { localStorage.setItem(KEYS.panchayats, JSON.stringify(state.panchayats)); }, [state.panchayats]);
  useEffect(() => { localStorage.setItem(KEYS.grants, JSON.stringify(state.grants)); }, [state.grants]);
  useEffect(() => { localStorage.setItem(KEYS.categories, JSON.stringify(state.categories)); }, [state.categories]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAuthReady(!!user);
      if (!user) {
        setFirebaseConnected(false);
        setFirestoreDocExists(null);
      }
    });
    return unsub;
  }, []);

  // Real-time listener from Firestore (requires Firebase Auth)
  useEffect(() => {
    if (!authReady) return;

    const unsub = onSnapshot(
      FIRESTORE_DOC,
      { includeMetadataChanges: true },
      (docSnap) => {
      if (!docSnap.metadata.fromCache) {
        setFirebaseConnected(true);
        setFirebaseSyncError('');
      }

      // Ignore cache-only snapshots while we're uploading — prevents overwriting local edits
      if (isLocalPush.current || docSnap.metadata.hasPendingWrites) return;

      if (docSnap.exists()) {
        setFirestoreDocExists(true);
        const data = docSnap.data();
        const payload = {
          projects: data.projects || [],
          contractors: data.contractors || [],
          engineers: data.engineers || [],
          schemes: data.schemes || [],
          constituencies: data.constituencies || [],
          panchayats: data.panchayats || [],
          grants: data.grants || [],
          categories: data.categories || [],
        };

        // Skip redundant state updates that re-trigger expensive localStorage writes
        if (lastRemotePayload.current && payloadEquals(lastRemotePayload.current, payload)) return;
        lastRemotePayload.current = payload;

        customDispatch({ type: 'SET_ALL', payload });
      } else {
        setFirestoreDocExists(false);
        lastRemotePayload.current = null;
      }
    }, (error) => {
      console.error("Firestore sync error:", error);
      setFirebaseConnected(false);
      setFirebaseSyncError(formatFirestoreError(error));
    });

    return () => unsub();
  }, [authReady, customDispatch]);

  // forcePush: explicitly upload ALL local data to Firestore and wait for server confirmation
  const forcePush = useCallback(async () => {
    const payload = buildFirestorePayload(stateRef.current);
    isLocalPush.current = true;
    try {
      await writeToFirestore(payload, { waitForServer: true });
      lastRemotePayload.current = payload;
      setFirestoreDocExists(true);
      setFirebaseSyncError('');
    } catch (e) {
      console.error('Force push failed:', e);
      const message = formatFirestoreError(e);
      setFirebaseSyncError(message);
      throw new Error(message);
    } finally {
      isLocalPush.current = false;
    }
  }, []);

  // Push changes to Firestore (debounced) — only when session is unlocked
  useEffect(() => {
    if (!userMadeChange.current) return;
    if (!authReady || !isSessionUnlocked()) {
      console.warn('Session locked — Firestore push blocked.');
      userMadeChange.current = false;
      return;
    }
    const timer = setTimeout(() => {
      userMadeChange.current = false;
      const payload = buildFirestorePayload(state);
      isLocalPush.current = true;
      writeToFirestore(payload)
        .then(() => {
          lastRemotePayload.current = payload;
          setFirebaseSyncError('');
        })
        .catch(e => {
          console.error('Firestore push failed:', e);
          setFirebaseSyncError(formatFirestoreError(e));
        })
        .finally(() => {
          isLocalPush.current = false;
        });
    }, 1000);
    return () => clearTimeout(timer);
  }, [state, authReady]);

  const getAlerts = useCallback(() => {
    const now = new Date();
    const alerts = [];
    state.projects.forEach(p => {
      const baseAlert = {
        projectId: p.id,
        projectName: p.projectName,
        juniorEngineer: p.juniorEngineer || '',
        assistantEngineer: p.assistantEngineer || '',
        constituency: p.constituency || '',
        scheme: p.scheme || '',
      };

      // Financial Alert: Over-budget
      if (p.expenditureIncurred > p.sanctionedAmount && p.sanctionedAmount > 0) {
        alerts.push({
          ...baseAlert,
          id: p.id+'_fin',
          type:'danger',
          title:'Budget Exceeded',
          delayText: `Exceeded by ₹${(p.expenditureIncurred - p.sanctionedAmount).toLocaleString('en-IN')}`,
          message:`${p.projectName} — Over budget`,
          date: p.updatedAt
        });
      }

      if (p.expiryDate) {
        const d = Math.ceil((new Date(p.expiryDate) - now) / 86400000);
        if (d < 0) alerts.push({
          ...baseAlert,
          id: p.id+'_exp',
          type:'danger',
          title:'Performance Guarantee Expired',
          delayText: `Expired ${Math.abs(d)} days ago`,
          message:`${p.projectName} — expired ${Math.abs(d)} days ago`,
          date: p.expiryDate
        });
        else if (d <= 30) alerts.push({
          ...baseAlert,
          id: p.id+'_exp',
          type:'warning',
          title:'Guarantee Expiring Soon',
          delayText: `${d} days left`,
          message:`${p.projectName} — ${d} days left`,
          date: p.expiryDate
        });
      }
      if (p.dateOfCompletionContract && p.statusOfWork !== 'completed') {
        const d = Math.ceil((new Date(p.dateOfCompletionContract) - now) / 86400000);
        if (d < 0) alerts.push({
          ...baseAlert,
          id: p.id+'_cont',
          type:'danger',
          title:'Contract Period Expired',
          delayText: `Overdue ${Math.abs(d)} days`,
          message:`${p.projectName} — overdue ${Math.abs(d)} days`,
          date: p.dateOfCompletionContract
        });
        else if (d <= 30) alerts.push({
          ...baseAlert,
          id: p.id+'_cont',
          type:'warning',
          title:'Contract Ending Soon',
          delayText: `${d} days left`,
          message:`${p.projectName} — ${d} days left`,
          date: p.dateOfCompletionContract
        });
      }
      if (p.securityDepositReleaseDate && getSecurityDepositReleaseStatus(p) !== 'Yes') {
        const d = Math.ceil((new Date(p.securityDepositReleaseDate) - now) / 86400000);
        if (d < 0) alerts.push({
          ...baseAlert,
          id: p.id+'_sec',
          type:'danger',
          title:'Security Deposit Overdue',
          delayText: `Overdue ${Math.abs(d)} days`,
          message:`${p.projectName} — overdue ${Math.abs(d)} days`,
          date: p.securityDepositReleaseDate
        });
        else if (d <= 15) alerts.push({
          ...baseAlert,
          id: p.id+'_sec',
          type:'info',
          title:'Security Deposit Release Due',
          delayText: `${d} days left`,
          message:`${p.projectName} — ${d} days left`,
          date: p.securityDepositReleaseDate
        });
      }
    });
    const priority = { danger: 0, warning: 1, info: 2 };
    return alerts.sort((a, b) => (priority[a.type] ?? 99) - (priority[b.type] ?? 99));
  }, [state.projects]);

  return (
    <ProjectContext.Provider value={{ ...state, dispatch: customDispatch, getAlerts, firebaseConnected, firestoreDocExists, firebaseSyncError, forcePush }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProjects must be used inside ProjectProvider');
  return ctx;
}
