import { useState } from 'react';
import { useProjects } from '../context/ProjectContext';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Edit, Trash2, X, Save } from 'lucide-react';

const empty = { name:'', classOfContractor:'', licenceExpiryDate:'' };

export default function ContractorManager() {
  const { contractors, dispatch } = useProjects();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState('');

  const filtered = contractors.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.classOfContractor||'').toLowerCase().includes(q);
  });

  const startEdit = (c) => { setEditing(c.id); setForm({ name:c.name, classOfContractor:c.classOfContractor||'', licenceExpiryDate:c.licenceExpiryDate||'' }); };
  const startNew = () => { setEditing('new'); setForm(empty); };
  const cancel = () => { setEditing(null); setForm(empty); };

  const save = () => {
    if (!form.name.trim()) return alert('Name is required');
    if (editing === 'new') {
      dispatch({ type:'ADD_CONTRACTOR', payload: { id:uuidv4(), ...form } });
    } else {
      dispatch({ type:'UPDATE_CONTRACTOR', payload: { id:editing, ...form } });
    }
    cancel();
  };

  const remove = (id, name) => { if (confirm(`Delete contractor "${name}"?`)) dispatch({ type:'DELETE_CONTRACTOR', payload:id }); };
  const set = (f, v) => setForm(x => ({...x, [f]:v}));

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';
  const now = new Date();

  return (
    <div>
      <div className="page-header">
        <div><h1>Contractors</h1><p>Manage contractor records ({contractors.length})</p></div>
        <button className="btn btn-primary btn-sm" onClick={startNew}><Plus size={14} /> Add Contractor</button>
      </div>

      <div className="filter-bar" style={{ marginBottom:16 }}>
        <div className="form-group" style={{ minWidth:250 }}>
          <label className="form-label">Search</label>
          <input className="form-input" placeholder="Name, class..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Edit/Add Form */}
      {editing && (
        <div className="card" style={{ marginBottom:16 }}>
          <div className="card-header"><span className="card-title">{editing==='new' ? 'New Contractor' : 'Edit Contractor'}</span></div>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">Contractor Name *</label><input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="M/s ..." /></div>
            <div className="form-group">
              <label className="form-label">Class of Contractor</label>
              <select className="form-select" value={form.classOfContractor} onChange={e => set('classOfContractor', e.target.value)}>
                <option value="">Select Class</option>
                <option value="Class A">Class A</option>
                <option value="Class B">Class B</option>
                <option value="Class C">Class C</option>
                <option value="Class D">Class D</option>
              </select>
            </div>
            <div className="form-group"><label className="form-label">Date of Expiry of Licence</label><input className="form-input" type="date" value={form.licenceExpiryDate} onChange={e => set('licenceExpiryDate', e.target.value)} /></div>
          </div>
          <div className="btn-group" style={{ marginTop:16, justifyContent:'flex-end' }}>
            <button className="btn btn-secondary btn-sm" onClick={cancel}><X size={14} /> Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={save}><Save size={14} /> Save</button>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>#</th><th>Contractor Name</th><th>Class</th><th>Licence Expiry</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>No contractors</td></tr>
            ) : filtered.map((c, i) => {
              const expDays = c.licenceExpiryDate ? Math.ceil((new Date(c.licenceExpiryDate) - now) / 86400000) : null;
              return (
                <tr key={c.id}>
                  <td>{i+1}</td>
                  <td>{c.name}</td>
                  <td><span className="status-badge completed" style={{ background:'var(--blue-glow)', color:'var(--blue)' }}>{c.classOfContractor || '—'}</span></td>
                  <td style={{ color: expDays !== null && expDays < 0 ? 'var(--rose)' : expDays !== null && expDays <= 30 ? 'var(--amber)' : '' }}>
                    {fmtDate(c.licenceExpiryDate)}
                    {expDays !== null && expDays < 0 && <span style={{ fontSize:10, marginLeft:6, color:'var(--rose)' }}>Expired</span>}
                    {expDays !== null && expDays >= 0 && expDays <= 30 && <span style={{ fontSize:10, marginLeft:6, color:'var(--amber)' }}>{expDays}d left</span>}
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:4 }}>
                      <button className="btn btn-secondary btn-icon btn-sm" onClick={() => startEdit(c)}><Edit size={14} /></button>
                      <button className="btn btn-danger btn-icon btn-sm" onClick={() => remove(c.id, c.name)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
