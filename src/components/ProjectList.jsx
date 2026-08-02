import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { verifyMasterPassword, formatMasterPasswordError } from '../utils/appAuth';
import { statusOptions } from '../data/sampleData';
import { exportProjectsToExcel } from '../utils/excelExport';
import { generateProjectListPDF, generateProjectDetailPDF, savePDF, sharePDF } from '../utils/pdfExport';
import { downloadKML } from '../utils/kmlExport';
import { getUcSentStatus } from '../utils/projectStatus';
import { Eye, Edit, Trash2, Download, FileText, Share2, Filter, X, Lock, Unlock, MapPin, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(n);
const fmtLakhs = (value) => {
  const amount = Number(value) || 0;
  return `${amount < 0 ? '-' : ''}₹${(Math.abs(amount) / 100000).toFixed(2)} L`;
};

const ALL_COLUMNS = [
  { id: 'projectName', label: 'Project Name' },
  { id: 'yearOfSanction', label: 'Year' },
  { id: 'constituency', label: 'Constituency' },
  { id: 'villagePanchayat', label: 'Village Panchayat' },
  { id: 'scheme', label: 'Scheme' },
  { id: 'phase', label: 'Phase' },
  { id: 'contractorName', label: 'Contractor' },
  { id: 'workOrderDate', label: 'WO Date' },
  { id: 'completionDateContract', label: 'Comp (C)' },
  { id: 'actualCompletionDate', label: 'Act Comp' },
  { id: 'sanctionedAmount', label: 'Sanc.' },
  { id: 'tenderedCost', label: 'Tender' },
  { id: 'expenditureIncurred', label: 'Expend.' },
  { id: 'utilisedAmount', label: 'Utilised' },
  { id: 'balanceAmount', label: 'Balance' },
  { id: 'statusOfWork', label: 'Status' },
  { id: 'ucSentDate', label: 'UC Date' },
  { id: 'remarks', label: 'Remarks' }
];

export default function ProjectList() {
  const { projects, contractors, engineers, schemes, constituencies, panchayats, grants, dispatch } = useProjects();
  const navigate = useNavigate();
  const location = useLocation();

  const [filters, setFilters] = useState(() => {
    const defaultFilters = { year:'', scheme:'', category:'', phase:'', status:'', constituency:'', villagePanchayat:'', search:'', engineer:'', contractor:'', geoTagged: false, ucSent: '' };
    if (location.state && location.state.filters) {
      return { ...defaultFilters, ...location.state.filters };
    }
    const saved = sessionStorage.getItem('ct-project-filters');
    if (saved) {
      try { return { ...defaultFilters, ...JSON.parse(saved) }; } catch (e) {}
    }
    return defaultFilters;
  });

  useEffect(() => {
    sessionStorage.setItem('ct-project-filters', JSON.stringify(filters));
  }, [filters]);
  
  const [showFilters, setShowFilters] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const [lockModal, setLockModal] = useState(null); // { projectId, action:'lock'|'unlock' }
  const [lockPw, setLockPw] = useState('');
  const [lockError, setLockError] = useState('');
  
  const [pdfModal, setPdfModal] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(ALL_COLUMNS.map(c => c.id));


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
      if (filters.villagePanchayat && p.villagePanchayat !== filters.villagePanchayat) return false;
      if (filters.engineer && p.juniorEngineer !== filters.engineer && p.assistantEngineer !== filters.engineer) return false;
      if (filters.contractor && p.contractorName !== filters.contractor) return false;
      if (filters.geoTagged && (!p.latitude || !p.longitude || Number(p.latitude) === 0)) return false;
      if (filters.ucSent && getUcSentStatus(p) !== filters.ucSent) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        return [p.projectName, p.contractorName, p.juniorEngineer, p.assistantEngineer, p.goNumber, p.mBookNumber, p.constituency, p.scheme, p.category]
          .some(f => (f||'').toLowerCase().includes(q));
      }
      return true;
    });
  }, [projects, filters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, projects.length]);

  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const handleDelete = (id, name) => { if (confirm(`Delete "${name}"?`)) dispatch({ type:'DELETE_PROJECT', payload:id }); };

  const handleLockToggle = async (p) => {
    if (!p.isLocked) { setLockModal({ projectId: p.id, action:'lock' }); setLockPw(''); setLockError(''); }
    else { setLockModal({ projectId: p.id, action:'unlock' }); setLockPw(''); setLockError(''); }
  };

  const confirmLock = async () => {
    if (!lockPw) { setLockError('Enter your 6-digit password'); return; }
    try {
      await verifyMasterPassword(lockPw);
    } catch (e) {
      setLockError(formatMasterPasswordError(e));
      return;
    }

    const p = projects.find(x => x.id === lockModal.projectId);
    if (lockModal.action === 'lock') {
      dispatch({ type:'UPDATE_PROJECT', payload: { ...p, isLocked:true } });
      setLockModal(null);
    } else {
      dispatch({ type:'UPDATE_PROJECT', payload: { ...p, isLocked:false } });
      setLockModal(null);
    }
  };

  const clearFilters = () => setFilters({ year:'', scheme:'', category:'', phase:'', status:'', constituency:'', villagePanchayat:'', search:'', engineer:'', contractor:'', geoTagged: false, ucSent: '' });
  const hasFilters = Object.values(filters).some(v => v);

  return (
    <div>
      <div className="page-header">
        <div><h1>Projects</h1><p>{filtered.length} of {projects.length} projects</p></div>
        <div className="btn-group">
          <button className="btn btn-secondary btn-sm" onClick={() => setShowFilters(!showFilters)}><Filter size={14} /> Filters</button>
          <button className="btn btn-secondary btn-sm" onClick={() => exportProjectsToExcel(filtered, grants)}><Download size={14} /> Excel</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setPdfModal(true)}><FileText size={14} /> PDF</button>
          <button className="btn btn-secondary btn-sm" onClick={() => sharePDF(generateProjectListPDF(filtered, filters, selectedColumns),'Report.pdf')}><Share2 size={14} /> Share</button>
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
            <label className="form-label">Village Panchayat</label>
            <select className="form-select" value={filters.villagePanchayat} onChange={e => setFilters(f => ({...f, villagePanchayat:e.target.value}))}>
              <option value="">All</option>{panchayats.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
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
          <div className="form-group">
            <label className="form-label">UC Sent</label>
            <select className="form-select" value={filters.ucSent} onChange={e => setFilters(f => ({...f, ucSent:e.target.value}))}>
              <option value="">All</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          {hasFilters && <button className="btn btn-danger btn-sm" onClick={clearFilters} style={{ alignSelf:'flex-end' }}><X size={14} /> Clear</button>}
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th><th>Project</th><th>Scheme</th><th>Location</th>
              <th>Expense</th><th>Progress & Status</th>
              <th>Engineers</th><th>Updated</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProjects.length === 0 ? (
              <tr><td colSpan={13} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>No projects found</td></tr>
            ) : paginatedProjects.map((p, index) => {
              const i = (currentPage - 1) * itemsPerPage + index;
              const expenditure = Number(p.expenditureIncurred) || 0;
              const sanctioned = Number(p.sanctionedAmount) || 0;
              const expensePercent = sanctioned > 0 ? Math.min(100, Math.max(0, (expenditure / sanctioned) * 100)) : 0;
              const expenseOverBudget = sanctioned > 0 && expenditure > sanctioned;
              return (
              <tr key={p.id} style={p.isLocked ? { opacity:0.85 } : {}}>
                <td data-label="#">{i+1}. {p.isLocked && <Lock size={11} style={{ color:'var(--amber)', marginRight:4, verticalAlign:'middle' }} />}</td>
                <td data-label="Project">
                  <div className="project-cell-content project-name-cell">
                    {p.projectName}
                  </div>
                </td>
                <td data-label="Scheme">
                  <div className="project-cell-content">
                    <strong>{p.scheme}</strong> <span className="project-year-value">({p.yearOfSanction})</span><br />
                    <span className="project-category-value" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{p.category}</span>
                  </div>
                </td>
                <td data-label="Location" className="mobile-secondary-cell">
                  <div className="project-cell-content">
                    {p.constituency}<br />
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{p.villagePanchayat}</span>
                  </div>
                </td>
                <td data-label="Expense">
                  <div className="project-cell-content project-financials-cell">
                    <div className="project-expense-value" style={{ color: expenseOverBudget ? 'var(--rose)' : 'var(--text-primary)', fontWeight: 600 }}>
                      {fmtLakhs(expenditure)}
                    </div>
                    <div className="progress-bar project-expense-bar" role="progressbar" aria-label="Expenditure against sanctioned amount" aria-valuenow={Math.round(expensePercent)} aria-valuemin="0" aria-valuemax="100">
                      <div className={`progress-fill ${expenseOverBudget ? 'red' : 'green'}`} style={{ width:`${expensePercent}%` }} />
                    </div>
                  </div>
                </td>
                <td data-label="Progress & Status" className="mobile-secondary-cell">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div><span className={`status-badge ${p.statusOfWork}`}>{p.statusOfWork==='completed'?'Done':p.statusOfWork==='in_progress'?'Active':'Pending'}</span></div>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div className="progress-bar" style={{ width:50 }}><div className={`progress-fill ${p.progress>=80?'green':p.progress>=40?'amber':'red'}`} style={{ width:`${p.progress}%` }} /></div>
                      <span style={{ fontSize:11 }}>{p.progress}%</span>
                    </div>
                  </div>
                </td>
                <td data-label="Engineers" className="mobile-secondary-cell">
                  <div className="project-cell-content project-engineers-cell">
                    <div><span style={{ color:'var(--text-secondary)' }}>JE:</span> {p.juniorEngineer}</div>
                    <div><span style={{ color:'var(--text-secondary)' }}>AE:</span> {p.assistantEngineer}</div>
                  </div>
                </td>
                <td data-label="Updated" className="project-updated-cell mobile-secondary-cell">
                  {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('en-IN') : '—'}
                </td>
                <td>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/projects/${p.id}`)} title="View"><Eye size={14} /> View</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => !p.isLocked && navigate(`/projects/${p.id}/edit`)} disabled={p.isLocked} title="Edit"><Edit size={14} /> Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => !p.isLocked && handleDelete(p.id, p.projectName)} disabled={p.isLocked} title="Delete"><Trash2 size={14} /></button>
                    <button className={`btn btn-sm ${p.isLocked ? 'btn-success' : 'btn-secondary'}`} onClick={() => handleLockToggle(p)} title={p.isLocked?'Unlock':'Lock'}>
                      {p.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                    </button>
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '0 8px', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} entries
          </div>
          <div className="btn-group">
            <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} title="First Page"><ChevronsLeft size={16} /></button>
            <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} title="Previous Page"><ChevronLeft size={16} /></button>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 12px', fontSize: 13, fontWeight: 500 }}>Page {currentPage} of {totalPages}</span>
            <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} title="Next Page"><ChevronRight size={16} /></button>
            <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} title="Last Page"><ChevronsRight size={16} /></button>
          </div>
        </div>
      )}

      {/* Lock/Unlock Modal */}
      {lockModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={() => setLockModal(null)}>
          <div className="card" style={{ width:360, maxWidth:'90vw' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom:12 }}>{lockModal.action==='lock' ? '🔒 Lock Project' : '🔓 Unlock Project'}</h3>
            <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:16 }}>
              {lockModal.action==='lock' ? 'Enter master password to lock this project:' : 'Enter master password to unlock:'}
            </p>
            <input className="form-input" type="password" inputMode="numeric" maxLength={6} autoComplete="current-password" placeholder="6-digit password" value={lockPw} onChange={e => { setLockPw(e.target.value.replace(/\D/g, '').slice(0, 6)); setLockError(''); }}
              onKeyDown={e => e.key==='Enter' && confirmLock()} autoFocus />
            {lockError && <p style={{ color:'var(--rose)', fontSize:12, marginTop:6 }}>{lockError}</p>}
            <div className="btn-group" style={{ marginTop:16, justifyContent:'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setLockModal(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={confirmLock}>{lockModal.action==='lock' ? 'Lock' : 'Unlock'}</button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Export Columns Modal */}
      {pdfModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={() => setPdfModal(false)}>
          <div className="card" style={{ width:500, maxWidth:'90vw', maxHeight:'90vh', overflowY:'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom:12 }}>Export PDF — Select Columns</h3>
            <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:16 }}>Choose the columns you want to include in the PDF export. Layout will scale automatically.</p>
            
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
              {ALL_COLUMNS.map(col => (
                <label key={col.id} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, cursor:'pointer' }}>
                  <input type="checkbox" checked={selectedColumns.includes(col.id)} 
                    onChange={(e) => {
                      if (e.target.checked) setSelectedColumns([...selectedColumns, col.id]);
                      else setSelectedColumns(selectedColumns.filter(id => id !== col.id));
                    }} 
                  />
                  {col.label}
                </label>
              ))}
            </div>

            <div className="btn-group" style={{ justifyContent:'flex-end', borderTop:'1px solid var(--border-subtle)', paddingTop:16 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedColumns(ALL_COLUMNS.map(c=>c.id))}>Select All</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedColumns([])}>Deselect All</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setPdfModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={() => {
                savePDF(generateProjectListPDF(filtered, filters, selectedColumns), 'Report.pdf');
                setPdfModal(false);
              }} disabled={selectedColumns.length === 0}>Generate PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
