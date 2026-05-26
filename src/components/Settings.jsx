import { useState, useRef } from 'react';
import { useProjects } from '../context/ProjectContext';
import { initGoogleAuth, signOut, createSheet, initExistingSheet, pushToSheet, pullFromSheet, getAccessToken } from '../utils/googleSheets';
import { Cloud, CloudOff, Upload, Download, Plus, RefreshCw, AlertTriangle, CheckCircle, Info, FileStack } from 'lucide-react';

export default function Settings() {
  const { projects, contractors, engineers, schemes, constituencies, grants, dispatch, gsheetConfig, setGsheetConfig } = useProjects();
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const tokenClientRef = useRef(null);

  const updateConfig = (key, val) => setGsheetConfig(c => ({ ...c, [key]: val }));

  const handleSignIn = () => {
    if (!gsheetConfig.clientId) { setError('Enter Client ID first'); return; }
    setError('');
    try {
      tokenClientRef.current = initGoogleAuth(gsheetConfig.clientId, (resp) => {
        if (resp.access_token) {
          updateConfig('connected', true);
          setStatus('Signed in with Google ✓');
        }
      });
      if (tokenClientRef.current) tokenClientRef.current.requestAccessToken({ prompt: 'consent' });
      else setError('Google Identity Services not loaded. Check your internet connection.');
    } catch (e) { setError(e.message); }
  };

  const handleSignOut = () => {
    signOut();
    setGsheetConfig(c => ({ ...c, connected: false }));
    setStatus('Signed out');
  };

  const handleCreateSheet = async () => {
    if (!getAccessToken()) { setError('Sign in first'); return; }
    setLoading(true); setError('');
    try {
      const sheetId = await createSheet('CivilTrack Pro Data');
      updateConfig('sheetId', sheetId);
      setStatus(`Sheet created! ID: ${sheetId}`);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleInitSheet = async () => {
    if (!getAccessToken() || !gsheetConfig.sheetId) { setError('Sign in and set Sheet ID'); return; }
    setLoading(true); setError('');
    try {
      await initExistingSheet(gsheetConfig.sheetId);
      setStatus(`Sheet tabs initialized successfully! You can now Push/Pull.`);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handlePush = async () => {
    if (!getAccessToken() || !gsheetConfig.sheetId) { setError('Sign in and set Sheet ID'); return; }
    setLoading(true); setError('');
    try {
      await pushToSheet(gsheetConfig.sheetId, projects, contractors, engineers, schemes, constituencies, grants);
      setStatus(`Pushed data to Google Sheets ✓`);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handlePull = async () => {
    if (!getAccessToken() || !gsheetConfig.sheetId) { setError('Sign in and set Sheet ID'); return; }
    setLoading(true); setError('');
    try {
      const data = await pullFromSheet(gsheetConfig.sheetId);
      if (data.projects.length) dispatch({ type: 'SET_PROJECTS', payload: data.projects });
      if (data.contractors.length) dispatch({ type: 'SET_CONTRACTORS', payload: data.contractors });
      if (data.engineers.length) dispatch({ type: 'SET_ENGINEERS', payload: data.engineers });
      if (data.schemes.length) dispatch({ type: 'SET_SCHEMES', payload: data.schemes });
      if (data.constituencies.length) dispatch({ type: 'SET_CONSTITUENCIES', payload: data.constituencies });
      if (data.grants.length) dispatch({ type: 'SET_GRANTS', payload: data.grants });
      setStatus(`Pulled data from Google Sheets ✓`);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleReset = () => {
    if (confirm('Reset all data to sample defaults? This cannot be undone.')) {
      dispatch({ type: 'RESET_ALL' });
      setStatus('Data reset to defaults ✓');
    }
  };

  return (
    <div>
      <div className="page-header"><div><h1>Settings</h1><p>Google Sheets integration & data management</p></div></div>

      {/* Google Sheets */}
      <div className="card" style={{ marginBottom:16 }}>
        <div className="card-header">
          <span className="card-title" style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Cloud size={16} /> Google Sheets Integration
          </span>
          {gsheetConfig.connected && <span className="status-badge completed">Connected</span>}
        </div>

        <div className="alert-item info" style={{ marginBottom:16 }}>
          <div className="alert-icon info"><Info size={16} /></div>
          <div className="alert-content">
            <h4>Setup Instructions</h4>
            <p>1. Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener" style={{ color:'var(--cyan)' }}>Google Cloud Console</a></p>
            <p>2. Create a project → Enable "Google Sheets API"</p>
            <p>3. Create OAuth 2.0 Client ID (Web application type)</p>
            <p>4. Add <code style={{ color:'var(--cyan)' }}>{window.location.origin}</code> as Authorized JavaScript Origin</p>
            <p>5. Copy the Client ID and paste below</p>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">OAuth Client ID</label>
            <input className="form-input" placeholder="xxxx.apps.googleusercontent.com" value={gsheetConfig.clientId} onChange={e => updateConfig('clientId', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Google Sheet ID</label>
            <input className="form-input" placeholder="Sheet ID from URL (or create new below)" value={gsheetConfig.sheetId||''} onChange={e => updateConfig('sheetId', e.target.value)} />
          </div>
        </div>

        <div className="btn-group" style={{ marginTop:16 }}>
          {!gsheetConfig.connected ? (
            <button className="btn btn-primary btn-sm" onClick={handleSignIn} disabled={loading}><Cloud size={14} /> Sign in with Google</button>
          ) : (
            <button className="btn btn-secondary btn-sm" onClick={handleSignOut}><CloudOff size={14} /> Sign Out</button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={handleCreateSheet} disabled={loading || !gsheetConfig.connected}><Plus size={14} /> Create New</button>
          <button className="btn btn-secondary btn-sm" onClick={handleInitSheet} disabled={loading || !gsheetConfig.connected}><FileStack size={14} /> Init Existing</button>
          <button className="btn btn-success btn-sm" onClick={handlePush} disabled={loading || !gsheetConfig.connected}><Upload size={14} /> Push</button>
          <button className="btn btn-primary btn-sm" onClick={handlePull} disabled={loading || !gsheetConfig.connected}><Download size={14} /> Pull</button>
        </div>

        {gsheetConfig.sheetId && (
          <div style={{ marginTop:12 }}>
            <a href={`https://docs.google.com/spreadsheets/d/${gsheetConfig.sheetId}`} target="_blank" rel="noopener" className="btn btn-secondary btn-sm">
              Open Sheet in Google Sheets ↗
            </a>
          </div>
        )}
      </div>

      {/* Status / Error */}
      {status && <div className="alert-item info" style={{ marginBottom:16 }}><div className="alert-icon info"><CheckCircle size={16} /></div><div className="alert-content"><p>{status}</p></div></div>}
      {error && <div className="alert-item danger" style={{ marginBottom:16 }}><div className="alert-icon danger"><AlertTriangle size={16} /></div><div className="alert-content"><p>{error}</p></div></div>}

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

      {/* Reset */}
      <div className="card">
        <div className="card-header"><span className="card-title" style={{ color:'var(--rose)' }}>Danger Zone</span></div>
        <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:12 }}>Reset all local data back to sample defaults.</p>
        <button className="btn btn-danger btn-sm" onClick={handleReset}><RefreshCw size={14} /> Reset All Data</button>
      </div>
    </div>
  );
}
