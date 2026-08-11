import { useState, useRef } from 'react';
import { useProjects } from '../context/ProjectContext';
import { Cloud, CloudOff, Upload, Download, Plus, RefreshCw, AlertTriangle, CheckCircle, Info, FileStack, FileSpreadsheet, Trash2, Database, CloudUpload } from 'lucide-react';
import { exportProjectsToExcel } from '../utils/excelExport';
import { importProjectsFromExcel } from '../utils/excelImport';
import { FIREBASE_AUTH_EMAIL } from '../utils/firebase';
import { verifyMasterPassword, formatMasterPasswordError } from '../utils/appAuth';

const FIRESTORE_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /civil_dashboard/{doc} {
      allow read, write: if request.auth != null;
    }
  }
}`;

export default function Settings() {
  const { projects, contractors, engineers, schemes, constituencies, panchayats, grants, categories, dispatch, firebaseConnected, firestoreDocExists, firebaseSyncError, forcePush } = useProjects();
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [exportStart, setExportStart] = useState('');
  const [exportEnd, setExportEnd] = useState('');
  const fileInputRef = useRef(null);

  const handleExportExcel = () => {
    try {
      exportProjectsToExcel(projects, { contractors, engineers, schemes, constituencies, panchayats, grants, filename: 'CivilTrack_Sync.xlsx', startDate: exportStart, endDate: exportEnd });
      setStatus(`Exported Excel ${exportStart || exportEnd ? 'for selected dates' : 'for all data'} ✓`);
    } catch (e) { setError('Export failed: ' + e.message); }
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true); setError('');
    try {
      const data = await importProjectsFromExcel(file, projects, contractors, engineers, schemes, constituencies, panchayats, grants);
      
      const updateEntity = (existing, imported) => {
        const updated = [...existing];
        let added = 0; let modified = 0;
        imported.forEach(imp => {
          const idx = updated.findIndex(item => item.id === imp.id);
          if (idx >= 0) { updated[idx] = imp; modified++; }
          else { updated.push(imp); added++; }
        });
        return { updated, added, modified };
      };

      if (data.projects) {
        const res = updateEntity(projects, data.projects);
        dispatch({ type: 'SET_PROJECTS', payload: res.updated });
        setStatus(`Import successful: ${res.added} projects added, ${res.modified} updated ✓`);
      }
      if (data.contractors) dispatch({ type: 'SET_CONTRACTORS', payload: updateEntity(contractors, data.contractors).updated });
      if (data.engineers) dispatch({ type: 'SET_ENGINEERS', payload: updateEntity(engineers, data.engineers).updated });
      if (data.schemes) dispatch({ type: 'SET_SCHEMES', payload: updateEntity(schemes, data.schemes).updated });
      if (data.constituencies) dispatch({ type: 'SET_CONSTITUENCIES', payload: updateEntity(constituencies, data.constituencies).updated });
      if (data.panchayats) dispatch({ type: 'SET_PANCHAYATS', payload: updateEntity(panchayats, data.panchayats).updated });
      if (data.grants) dispatch({ type: 'SET_GRANTS', payload: updateEntity(grants, data.grants).updated });
      
    } catch (err) {
      setError('Import failed: ' + err.message);
    }
    setLoading(false);
    e.target.value = '';
  };

  const handleForcePush = async () => {
    setLoading(true); setError(''); setStatus('');
    try {
      await forcePush();
      setStatus(`✓ All data (${projects.length} projects) uploaded to Firebase cloud successfully!`);
    } catch (e) {
      setError('Upload failed: ' + e.message);
    }
    setLoading(false);
  };


  const [eraseModal, setEraseModal] = useState(false);
  const [erasePw, setErasePw] = useState('');
  const [eraseError, setEraseError] = useState('');

  const confirmErase = async () => {
    if (!erasePw) {
      setEraseError('Enter your 6-digit password');
      return;
    }
    setLoading(true);
    setEraseError('');
    try {
      await verifyMasterPassword(erasePw);
      dispatch({ type: 'ERASE_ALL' });
      setStatus('All data erased successfully ✓');
      setEraseModal(false);
      setErasePw('');
    } catch (e) {
      setEraseError(formatMasterPasswordError(e));
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header"><div><h1>Settings</h1><p>Database & Data Management</p></div></div>

      {/* First-time setup banner */}
      {firestoreDocExists === false && (
        <div style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(139,92,246,0.15))', border: '1px solid var(--cyan)', borderRadius: 8, padding: 20, marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <CloudUpload size={28} style={{ color: 'var(--cyan)', flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 16, marginBottom: 6, color: 'var(--cyan)' }}>📱 Upload Your Phone Data to Cloud</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
              Firebase cloud is currently empty{!firebaseConnected ? ' or unreachable' : ''}. Your local data ({projects.length} projects) is only stored on this device.
              Click below to upload it so all other users can access the same data.
            </p>
            <button className="btn btn-primary" onClick={handleForcePush} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CloudUpload size={16} /> {loading ? 'Uploading...' : `Upload ${projects.length} Projects to Cloud`}
            </button>
          </div>
        </div>
      )}
      {/* Firebase Database Sync */}
      <div className="card" style={{ marginBottom:16 }}>
        <div className="card-header">
          <span className="card-title" style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Database size={16} /> Firebase Real-time Sync
          </span>
          {firebaseConnected ? (
             <span className="status-badge completed">Connected & Syncing</span>
          ) : (
             <span className="status-badge pending">Working Offline</span>
          )}
        </div>

        <div className="alert-item info" style={{ marginBottom:16 }}>
          <div className="alert-icon info"><Info size={16} /></div>
          <div className="alert-content">
            <h4>How syncing works</h4>
            <p>Your dashboard is connected to a powerful Firebase Firestore database. All changes you make are instantly synchronized to all other users in real-time.</p>
            <p style={{ marginTop: 8 }}><strong>Field Worker Offline Mode:</strong> If you lose internet access, you can continue to use the app normally! Changes are cached locally on your device and will seamlessly upload in the background the moment you regain internet connection.</p>
          </div>
        </div>
        <div className="alert-item info" style={{ marginBottom:16 }}>
          <div className="alert-icon info"><Info size={16} /></div>
          <div className="alert-content">
            <h4>Fix the “public rules” warning (one-time)</h4>
            <p style={{ marginBottom: 8, fontSize: 13 }}>
              Firebase shows that warning while rules are <code>allow read, write: if true</code>.
              The app already signs in with Firebase Auth when you unlock — apply these steps and the warning goes away.
            </p>
            <ol style={{ fontSize: 13, paddingLeft: 18, marginBottom: 12 }}>
              <li>
                <a href="https://console.firebase.google.com/project/civildashboard-fb026/authentication/providers" target="_blank" rel="noopener noreferrer">
                  Enable Email/Password sign-in
                </a>
              </li>
              <li>
                <a href="https://console.firebase.google.com/project/civildashboard-fb026/authentication/users" target="_blank" rel="noopener noreferrer">
                  Add user
                </a>
                : <code>{FIREBASE_AUTH_EMAIL}</code> — use your 6-digit app password (set in Firebase, not stored in this codebase)
              </li>
              <li>
                <a href="https://console.firebase.google.com/project/civildashboard-fb026/authentication/settings" target="_blank" rel="noopener noreferrer">
                  Authentication → Settings → Authorized domains
                </a>
                : add <code>devharish1371.github.io</code> so GitHub Pages can sign in
              </li>
              <li>
                <a href="https://console.firebase.google.com/project/civildashboard-fb026/firestore/rules" target="_blank" rel="noopener noreferrer">
                  Firestore → Rules
                </a>
                : replace everything with the rules below, then click <strong>Publish</strong>
              </li>
              <li>Lock session and unlock again so the app re-signs in to Firebase</li>
            </ol>
            <pre
              style={{
                fontSize: 11,
                padding: 12,
                borderRadius: 6,
                background: 'var(--surface-color)',
                border: '1px solid var(--border-subtle)',
                overflow: 'auto',
                marginBottom: 8,
                whiteSpace: 'pre-wrap',
              }}
            >
              {FIRESTORE_RULES}
            </pre>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                navigator.clipboard.writeText(FIRESTORE_RULES);
                setStatus('Firestore rules copied — paste in Firebase Console → Rules → Publish');
              }}
            >
              Copy rules to clipboard
            </button>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
              After publishing, only signed-in users can read or write <code>civil_dashboard</code> data (not the whole internet).
            </p>
          </div>
        </div>
        <div className="btn-group">
          <button className="btn btn-primary btn-sm" onClick={handleForcePush} disabled={loading}>
            <Upload size={14} /> {loading ? 'Uploading...' : 'Upload My Data to Cloud'}
          </button>
        </div>
      </div>

      {/* Offline Excel Sync */}
      <div className="card" style={{ marginBottom:16 }}>
        <div className="card-header">
          <span className="card-title" style={{ display:'flex', alignItems:'center', gap:8 }}>
            <FileSpreadsheet size={16} /> Offline Excel Backup
          </span>
        </div>
        <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:16 }}>
          Export your data to an Excel file to keep physical backups. 
          If you specify dates, it will only export records that were created or updated within that range.
        </p>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Export From Date (Optional)</label>
            <input className="form-input" type="date" value={exportStart} onChange={e => setExportStart(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Export To Date (Optional)</label>
            <input className="form-input" type="date" value={exportEnd} onChange={e => setExportEnd(e.target.value)} />
          </div>
        </div>

        <div className="btn-group" style={{ marginTop:16 }}>
          <button className="btn btn-primary btn-sm" onClick={handleExportExcel} disabled={loading}>
            <Download size={14} /> Export to Excel
          </button>
          
          <input type="file" accept=".xlsx" ref={fileInputRef} style={{ display:'none' }} onChange={handleImportExcel} />
          <button className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()} disabled={loading}>
            <Upload size={14} /> Import from Excel
          </button>
        </div>
      </div>

      {/* Status / Error */}
      {status && <div className="alert-item info" style={{ marginBottom:16 }}><div className="alert-icon info"><CheckCircle size={16} /></div><div className="alert-content"><p>{status}</p></div></div>}
      {(error || firebaseSyncError) && (
        <div className="alert-item danger" style={{ marginBottom:16 }}>
          <div className="alert-icon danger"><AlertTriangle size={16} /></div>
          <div className="alert-content">
            <p>{error || firebaseSyncError}</p>
            {(error || firebaseSyncError)?.includes('console.firebase.google.com') && (
              <p style={{ marginTop: 8 }}>
                <a href="https://console.firebase.google.com/project/civildashboard-fb026/firestore" target="_blank" rel="noopener noreferrer">
                  Open Firebase Firestore setup →
                </a>
              </p>
            )}
            {(error || firebaseSyncError)?.includes('console.developers.google.com') && (
              <p style={{ marginTop: 8 }}>
                <a href="https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=civildashboard-fb026" target="_blank" rel="noopener noreferrer">
                  Open Firestore API settings →
                </a>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Data Stats */}
      <div className="card" style={{ marginBottom:16 }}>
        <div className="card-header"><span className="card-title">Data Summary</span></div>
        <div className="stats-grid">
          <div className="stat-card cyan"><div className="stat-value">{projects.length}</div><div className="stat-label">Projects</div></div>
          <div className="stat-card purple"><div className="stat-value">{contractors.length}</div><div className="stat-label">Contractors</div></div>
          <div className="stat-card emerald"><div className="stat-value">{engineers.length}</div><div className="stat-label">Engineers</div></div>
          <div className="stat-card amber"><div className="stat-value">{schemes.length}</div><div className="stat-label">Schemes</div></div>
          <div className="stat-card rose"><div className="stat-value">{grants.length}</div><div className="stat-label">Grants</div></div>
          <div className="stat-card cyan"><div className="stat-value">{constituencies.length}</div><div className="stat-label">Constituencies</div></div>
        </div>
      </div>

      {/* Erase Data */}
      <div className="card" style={{ marginBottom:16 }}>
        <div className="card-header"><span className="card-title" style={{ color:'var(--rose)' }}>Danger Zone</span></div>
        <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:12 }}>Erase all local data and start with a clean slate.</p>
        <button className="btn btn-danger btn-sm" onClick={() => { setEraseModal(true); setErasePw(''); setEraseError(''); }}><Trash2 size={14} /> Erase All Data</button>
      </div>

      {eraseModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={() => setEraseModal(false)}>
          <div className="card" style={{ width:360, maxWidth:'90vw' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom:12, color:'var(--rose)' }}>⚠️ Erase All Data</h3>
            <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:16 }}>
              This will permanently delete all projects, engineers, contractors, schemes, and grants from this device and Firestore. Enter master password to confirm:
            </p>
            <input className="form-input" type="password" inputMode="numeric" maxLength={6} autoComplete="current-password" placeholder="6-digit password" value={erasePw} onChange={e => { setErasePw(e.target.value.replace(/\D/g, '').slice(0, 6)); setEraseError(''); }}
              onKeyDown={e => e.key==='Enter' && confirmErase()} autoFocus />
            {eraseError && <p style={{ color:'var(--rose)', fontSize:12, marginTop:6 }}>{eraseError}</p>}
            <div className="btn-group" style={{ marginTop:16, justifyContent:'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setEraseModal(false)}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={confirmErase}>Erase Data</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
