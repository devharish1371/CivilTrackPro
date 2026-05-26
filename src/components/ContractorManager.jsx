import { useState } from 'react';
import { useProjects } from '../context/ProjectContext';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Edit, Trash2, X, Save, HardHat } from 'lucide-react';

const empty = { name:'', phone:'', email:'', address:'', registrationNo:'', category:'A' };

export default function ContractorManager() {
  const { contractors, dispatch } = useProjects();
  const [editing, setEditing] = useState(null); // null | 'new' | contractor id
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState('');

  const filtered = contractors.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.registrationNo.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
  });

  const startEdit = (c) => { setEditing(c.id); setForm({ name:c.name, phone:c.phone, email:c.email, address:c.address, registrationNo:c.registrationNo, category:c.category }); };
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

  return (
    <div>
      <div className="page-header">
        <div><h1>Contractors</h1><p>Manage contractor records ({contractors.length})</p></div>
        <button className="btn btn-primary btn-sm" onClick={startNew}><Plus size={14} /> Add Contractor</button>
      </div>

      <div className="filter-bar" style={{ marginBottom:16 }}>
        <div className="form-group" style={{ minWidth:250 }}>
          <label className="form-label">Search</label>
          <input className="form-input" placeholder="Name, registration..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Edit/Add Form */}
      {editing && (
        <div className="card" style={{ marginBottom:16 }}>
          <div className="card-header"><span className="card-title">{editing==='new' ? 'New Contractor' : 'Edit Contractor'}</span></div>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">Name *</label><input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Address</label><input className="form-input" value={form.address} onChange={e => set('address', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Registration No.</label><input className="form-input" value={form.registrationNo} onChange={e => set('registrationNo', e.target.value)} /></div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="A">Category A</option><option value="B">Category B</option><option value="C">Category C</option><option value="D">Category D</option>
              </select>
            </div>
          </div>
          <div className="btn-group" style={{ marginTop:16, justifyContent:'flex-end' }}>
            <button className="btn btn-secondary btn-sm" onClick={cancel}><X size={14} /> Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={save}><Save size={14} /> Save</button>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>#</th><th>Name</th><th>Phone</th><th>Email</th><th>Registration No</th><th>Category</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>No contractors</td></tr>
            ) : filtered.map((c, i) => (
              <tr key={c.id}>
                <td>{i+1}</td><td>{c.name}</td><td>{c.phone}</td><td>{c.email}</td><td>{c.registrationNo}</td>
                <td><span className="status-badge completed" style={{ background:'var(--blue-glow)', color:'var(--blue)' }}>{c.category}</span></td>
                <td>
                  <div style={{ display:'flex', gap:4 }}>
                    <button className="btn btn-secondary btn-icon btn-sm" onClick={() => startEdit(c)}><Edit size={14} /></button>
                    <button className="btn btn-danger btn-icon btn-sm" onClick={() => remove(c.id, c.name)}><Trash2 size={14} /></button>
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
