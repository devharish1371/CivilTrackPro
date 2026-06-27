import { useState, useMemo } from 'react';
import { useProjects } from '../context/ProjectContext';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Edit, Trash2, X, Save, Download } from 'lucide-react';
import { generateGrantsListPDF } from '../utils/pdfExport';
import { exportGrantsToExcel } from '../utils/excelExport';

const empty = { scheme: '', constituency: '', amount: '', date: '', goNumber: '', year: new Date().getFullYear(), phase: '' };
const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function GrantManager() {
  const { grants, schemes, constituencies, dispatch } = useProjects();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  
  const [search, setSearch] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterScheme, setFilterScheme] = useState('');
  const [filterPhase, setFilterPhase] = useState('');
  const [filterConstituency, setFilterConstituency] = useState('');

  const filtered = useMemo(() => {
    return grants.filter(g => {
      if (filterYear && String(g.year) !== String(filterYear)) return false;
      if (filterScheme && g.scheme !== filterScheme) return false;
      if (filterPhase && g.phase !== filterPhase) return false;
      if (filterConstituency && g.constituency !== filterConstituency) return false;
      
      if (!search) return true;
      const q = search.toLowerCase();
      return g.scheme.toLowerCase().includes(q) || (g.constituency||'').toLowerCase().includes(q) || g.goNumber.toLowerCase().includes(q);
    });
  }, [grants, search, filterYear, filterScheme, filterPhase, filterConstituency]);

  const uniqueYears = [...new Set(grants.map(g => g.year))].filter(Boolean).sort().reverse();
  const uniqueSchemes = [...new Set(grants.map(g => g.scheme))].filter(Boolean).sort();
  const uniquePhases = [...new Set(grants.map(g => g.phase))].filter(Boolean).sort();
  const uniqueConstituencies = [...new Set(grants.map(g => g.constituency))].filter(Boolean).sort();

  const startEdit = (g) => { setEditing(g.id); setForm({ scheme: g.scheme, constituency: g.constituency || '', amount: g.amount, date: g.date, goNumber: g.goNumber, year: g.year || new Date().getFullYear(), phase: g.phase || '' }); };
  const startNew = () => { setEditing('new'); setForm(empty); };
  const cancel = () => { setEditing(null); setForm(empty); };

  const save = () => {
    if (!form.scheme) return alert('Scheme is required');
    if (!form.amount || Number(form.amount) <= 0) return alert('Valid amount is required');
    
    const payload = { ...form, amount: Number(form.amount), year: Number(form.year) };
    if (editing === 'new') dispatch({ type: 'ADD_GRANT', payload: { id: uuidv4(), ...payload } });
    else dispatch({ type: 'UPDATE_GRANT', payload: { id: editing, ...payload } });
    cancel();
  };

  const remove = (id, scheme) => { if (confirm(`Delete grant for ${scheme}?`)) dispatch({ type: 'DELETE_GRANT', payload: id }); };
  const set = (f, v) => setForm(x => ({ ...x, [f]: v }));

  const totalGrant = filtered.reduce((sum, g) => sum + (g.amount || 0), 0);

  const handleExportPDF = () => {
    const doc = generateGrantsListPDF(filtered, { year: filterYear, scheme: filterScheme, phase: filterPhase, constituency: filterConstituency });
    doc.save('Grants_Report.pdf');
  };

  const handleExportExcel = () => {
    exportGrantsToExcel(filtered);
  };

  const clearFilters = () => {
    setFilterYear('');
    setFilterScheme('');
    setFilterPhase('');
    setFilterConstituency('');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Grants</h1>
          <p>Manage scheme grants (Filtered Total: {fmt(totalGrant)})</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={handleExportPDF} title="Download PDF"><Download size={14} /> PDF</button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportExcel} title="Download Excel"><Download size={14} /> Excel</button>
          <button className="btn btn-primary btn-sm" onClick={startNew}><Plus size={14} /> Add Grant</button>
        </div>
      </div>

      <div className="filter-bar" style={{ marginBottom: 16 }}>
        <div className="form-group" style={{ minWidth: 250 }}>
          <label className="form-label">Search</label>
          <input className="form-input" placeholder="Scheme, GO Number..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Year</label>
          <select className="form-select" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
            <option value="">All Years</option>
            {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Scheme</label>
          <select className="form-select" value={filterScheme} onChange={e => setFilterScheme(e.target.value)}>
            <option value="">All Schemes</option>
            {uniqueSchemes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Phase</label>
          <select className="form-select" value={filterPhase} onChange={e => setFilterPhase(e.target.value)}>
            <option value="">All Phases</option>
            {uniquePhases.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Constituency</label>
          <select className="form-select" value={filterConstituency} onChange={e => setFilterConstituency(e.target.value)}>
            <option value="">All Constituencies</option>
            {uniqueConstituencies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {(filterYear || filterScheme || filterPhase || filterConstituency) && (
          <button className="btn btn-danger btn-sm" onClick={clearFilters} style={{ alignSelf: 'flex-end' }}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {editing && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><span className="card-title">{editing === 'new' ? 'New Grant Allocation' : 'Edit Grant'}</span></div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Scheme *</label>
              <select className="form-select" value={form.scheme} onChange={e => set('scheme', e.target.value)}>
                <option value="">Select Scheme</option>
                {schemes.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Constituency</label>
              <select className="form-select" value={form.constituency} onChange={e => set('constituency', e.target.value)}>
                <option value="">Select Constituency</option>
                {constituencies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Grant Amount (₹) *</label>
              <input className="form-input" type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Year *</label>
              <input className="form-input" type="number" value={form.year} onChange={e => set('year', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Phase</label>
              <select className="form-select" value={form.phase} onChange={e => set('phase', e.target.value)}>
                <option value="">Select Phase</option>
                <option value="Phase 1">Phase 1</option>
                <option value="Phase 2">Phase 2</option>
                <option value="Phase 3">Phase 3</option>
                <option value="Phase 4">Phase 4</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">GO Number</label>
              <input className="form-input" value={form.goNumber} onChange={e => set('goNumber', e.target.value)} placeholder="GO(Ms)No..." />
            </div>
            <div className="form-group">
              <label className="form-label">GO Date</label>
              <input className="form-input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
          </div>
          <div className="btn-group" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary btn-sm" onClick={cancel}><X size={14} /> Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={save}><Save size={14} /> Save</button>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>#</th><th>Scheme</th><th>Constituency</th><th>Year</th><th>Phase</th><th>GO Number</th><th>GO Date</th><th>Amount (₹)</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No grants recorded</td></tr>
            ) : filtered.map((g, i) => (
              <tr key={g.id}>
                <td>{i + 1}</td><td>{g.scheme}</td><td>{g.constituency || '—'}</td><td>{g.year}</td><td>{g.phase}</td><td>{g.goNumber}</td><td>{g.date}</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--emerald)' }}>{fmt(g.amount)}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-secondary btn-icon btn-sm" onClick={() => startEdit(g)}><Edit size={14} /></button>
                    <button className="btn btn-danger btn-icon btn-sm" onClick={() => remove(g.id, g.scheme)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

