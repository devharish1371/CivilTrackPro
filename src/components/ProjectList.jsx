import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects, hashPassword } from '../context/ProjectContext';
import { statusOptions } from '../data/sampleData';
import { exportProjectsToExcel } from '../utils/excelExport';
import { generateProjectListPDF, savePDF, sharePDF } from '../utils/pdfExport';
import { downloadKML } from '../utils/kmlExport';
import { Eye, Edit, Trash2, Download, FileText, Share2, Filter, X, Lock, Unlock, MapPin, Search } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(n);

export default function ProjectList() {
  const { projects, contractors, engineers, schemes, constituencies, grants, dispatch } = useProjects();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ year:'', scheme:'', category:'', phase:'', status:'', constituency:'', search:'', engineer:'', contractor:'' });
  const [showFilters, setShowFilters] = useState(true);
  const [lockModal, setLockModal] = useState(null); // { projectId, action:'lock'|'unlock' }
  const [lockPw, setLockPw] = useState('');
  const [lockError, setLockError] = useState('');

  const years = useMemo(() => [...new Set(projects.map(p => p.yearOfSanction))].sort((a,b) => b-a), [projects]);
  const uniqueEngineers = useMemo(() => [...new Set(projects.flatMap(p => [p.juniorEngineer, p.assistantEngineer]).filter(Boolean))].sort(), [projects]);
  const uniqueContractors = useMemo(() => [...new Set(projects.map(p => p.contractorName).filter(Boolean))].sort(), [projects]);
  const uniqueCategories = useMemo(() => [...new Set(projects.map(p => p.category).filter(Boolean))].sort(), [projects]);

  const filtered = useMemo(() => {
    return projects.filter(p => {
      if (filters.year && p.yearOfSanction !== Number(filters.year)) return false;
      if (filters.scheme && p.scheme !== filters.scheme) return false;
      if (filters.category && p.category !== filters.category) return false;
      if (filters.phase && p.phase !== filters.phase) return false;
      if (filters.status && p.statusOfWork !== filters.status) return false;
      if (filters.constituency && p.constituency !== filters.constituency) return false;
      if (filters.engineer && p.juniorEngineer !== filters.engineer && p.assistantEngineer !== filters.engineer) return false;
      if (filters.contractor && p.contractorName !== filters.contractor) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        return [p.projectName, p.contractorName, p.juniorEngineer, p.assistantEngineer, p.goNumber, p.mBookNumber, p.constituency, p.scheme, p.category]
          .some(f => (f||'').toLowerCase().includes(q));
      }
      return true;
    });
  }, [projects, filters]);

  const handleDelete = (id, name) => { if (confirm(`Delete "${name}"?`)) dispatch({ type:'DELETE_PROJECT', payload:id }); };

  const handleLockToggle = async (p) => {
    if (!p.isLocked) { setLockModal({ projectId: p.id, action:'lock' }); setLockPw(''); setLockError(''); }
    else { setLockModal({ projectId: p.id, action:'unlock' }); setLockPw(''); setLockError(''); }
  };

  const confirmLock = async () => {
    if (!lockPw) { setLockError('Enter password'); return; }
    if (lockPw !== '1970') { setLockError('Incorrect password'); return; }
    
    const p = projects.find(x => x.id === lockModal.projectId);
    if (lockModal.action === 'lock') {
      dispatch({ type:'UPDATE_PROJECT', payload: { ...p, isLocked:true } });
      setLockModal(null);
    } else {
      dispatch({ type:'UPDATE_PROJECT', payload: { ...p, isLocked:false } });
      setLockModal(null);
    }
  };

  const clearFilters = () => setFilters({ year:'', scheme:'', category:'', phase:'', status:'', constituency:'', search:'', engineer:'', contractor:'' });
  const hasFilters = Object.values(filters).some(v => v);

  return (
    <div>
      <div className="page-header">
        <div><h1>Projects</h1><p>{filtered.length} of {projects.length} projects</p></div>
        <div className="btn-group">
          <button className="btn btn-secondary btn-sm" onClick={() => setShowFilters(!showFilters)}><Filter size={14} /> Filters</button>
          <button className="btn btn-secondary btn-sm" onClick={() => exportProjectsToExcel(filtered, grants)}><Download size={14} /> Excel</button>
          <button className="btn btn-secondary btn-sm" onClick={() => savePDF(generateProjectListPDF(filtered, filters),'Report.pdf')}><FileText size={14} /> PDF</button>
          <button className="btn btn-secondary btn-sm" onClick={() => sharePDF(generateProjectListPDF(filtered, filters),'Report.pdf')}><Share2 size={14} /> Share</button>
          <button className="btn btn-secondary btn-sm" onClick={() => downloadKML(filtered)}><MapPin size={14} /> KML</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/projects/new')}>+ Add</button>
        </div>
      </div>

      {showFilters && (
        <div className="filter-bar">
          <div className="form-group" style={{ minWidth:200 }}>
            <label className="form-label">Search</label>
            <div style={{ position:'relative' }}>
              <Search size={14} style={{ position:'absolute', left:10, top:10, color:'var(--text-muted)' }} />
              <input className="form-input" style={{ paddingLeft:30 }} placeholder="Name, GO, M-Book..." value={filters.search} onChange={e => setFilters(f => ({...f, search:e.target.value}))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Year</label>
            <select className="form-select" value={filters.year} onChange={e => setFilters(f => ({...f, year:e.target.value}))}>
              <option value="">All</option>{years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Scheme</label>
            <select className="form-select" value={filters.scheme} onChange={e => setFilters(f => ({...f, scheme:e.target.value}))}>
              <option value="">All</option>{schemes.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={filters.category} onChange={e => setFilters(f => ({...f, category:e.target.value}))}>
              <option value="">All</option>{uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Phase</label>
            <select className="form-select" value={filters.phase} onChange={e => setFilters(f => ({...f, phase:e.target.value}))}>
              <option value="">All</option>
              <option value="Phase 1">Phase 1</option>
              <option value="Phase 2">Phase 2</option>
              <option value="Phase 3">Phase 3</option>
              <option value="Phase 4">Phase 4</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={filters.status} onChange={e => setFilters(f => ({...f, status:e.target.value}))}>
              <option value="">All</option>{statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Constituency</label>
            <select className="form-select" value={filters.constituency} onChange={e => setFilters(f => ({...f, constituency:e.target.value}))}>
              <option value="">All</option>{constituencies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Engineer</label>
            <select className="form-select" value={filters.engineer} onChange={e => setFilters(f => ({...f, engineer:e.target.value}))}>
              <option value="">All</option>{uniqueEngineers.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Contractor</label>
            <select className="form-select" value={filters.contractor} onChange={e => setFilters(f => ({...f, contractor:e.target.value}))}>
              <option value="">All</option>{uniqueContractors.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {hasFilters && <button className="btn btn-danger btn-sm" onClick={clearFilters} style={{ alignSelf:'flex-end' }}><X size={14} /> Clear</button>}
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th><th>Project</th><th>Category</th><th>Year</th><th>Constituency</th><th>Scheme</th>
              <th>Sanctioned</th><th>Expenditure</th><th>Balance</th><th>Progress</th>
              <th>Status</th><th>JE</th><th>AE</th><th>Updated</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={13} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>No projects found</td></tr>
            ) : filtered.map((p, i) => (
              <tr key={p.id} style={p.isLocked ? { opacity:0.85 } : {}}>
                <td>{i+1}</td>
                <td style={{ maxWidth:200, overflow:'hidden', textOverflow:'ellipsis' }} title={p.projectName}>
                  {p.isLocked && <Lock size={11} style={{ color:'var(--amber)', marginRight:4, verticalAlign:'middle' }} />}
                  {p.projectName}
                </td>
                <td>{p.category}</td><td>{p.yearOfSanction}</td><td>{p.constituency}</td><td>{p.scheme}</td>
                <td style={{ textAlign:'right' }}>{fmt(p.sanctionedAmount)}</td>
                <td style={{ textAlign:'right' }}>{fmt(p.expenditureIncurred)}</td>
                <td style={{ textAlign:'right', color:(p.sanctionedAmount - p.expenditureIncurred) < 0 ? 'var(--rose)' : 'var(--emerald)' }}>{fmt(p.sanctionedAmount - p.expenditureIncurred)}</td>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div className="progress-bar" style={{ width:50 }}><div className={`progress-fill ${p.progress>=80?'green':p.progress>=40?'amber':'red'}`} style={{ width:`${p.progress}%` }} /></div>
                    <span style={{ fontSize:11 }}>{p.progress}%</span>
                  </div>
                </td>
                <td><span className={`status-badge ${p.statusOfWork}`}>{p.statusOfWork==='completed'?'Done':p.statusOfWork==='in_progress'?'Active':'Pending'}</span></td>
                <td>{p.juniorEngineer}</td><td>{p.assistantEngineer}</td>
                <td style={{ fontSize:11, color:'var(--text-muted)', whiteSpace:'nowrap' }}>{p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('en-IN') : '—'}</td>
                <td>
                  <div style={{ display:'flex', gap:3 }}>
                    <button className="btn btn-secondary btn-icon btn-sm" onClick={() => navigate(`/projects/${p.id}`)} title="View"><Eye size={14} /></button>
                    <button className="btn btn-secondary btn-icon btn-sm" onClick={() => !p.isLocked && navigate(`/projects/${p.id}/edit`)} disabled={p.isLocked} title="Edit"><Edit size={14} /></button>
                    <button className="btn btn-danger btn-icon btn-sm" onClick={() => !p.isLocked && handleDelete(p.id, p.projectName)} disabled={p.isLocked} title="Delete"><Trash2 size={14} /></button>
                    <button className={`btn btn-icon btn-sm ${p.isLocked ? 'btn-success' : 'btn-secondary'}`} onClick={() => handleLockToggle(p)} title={p.isLocked?'Unlock':'Lock'}>
                      {p.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Lock/Unlock Modal */}
      {lockModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={() => setLockModal(null)}>
          <div className="card" style={{ width:360, maxWidth:'90vw' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom:12 }}>{lockModal.action==='lock' ? '🔒 Lock Project' : '🔓 Unlock Project'}</h3>
            <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:16 }}>
              {lockModal.action==='lock' ? 'Enter master password to lock this project:' : 'Enter master password to unlock:'}
            </p>
            <input className="form-input" type="password" placeholder="Password" value={lockPw} onChange={e => { setLockPw(e.target.value); setLockError(''); }}
              onKeyDown={e => e.key==='Enter' && confirmLock()} autoFocus />
            {lockError && <p style={{ color:'var(--rose)', fontSize:12, marginTop:6 }}>{lockError}</p>}
            <div className="btn-group" style={{ marginTop:16, justifyContent:'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setLockModal(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={confirmLock}>{lockModal.action==='lock' ? 'Lock' : 'Unlock'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
