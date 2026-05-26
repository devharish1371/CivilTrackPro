import { useState } from 'react';
import { useProjects } from '../context/ProjectContext';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Edit, Trash2, X, Save } from 'lucide-react';

const empty = { name:'', designation:'Junior Engineer', phone:'', email:'', division:'' };

export default function EngineerManager() {
  const { engineers, dispatch } = useProjects();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState('');

  const filtered = engineers.filter(e => {
    if (!search) return true;
    const q = search.toLowerCase();
    return e.name.toLowerCase().includes(q) || e.designation.toLowerCase().includes(q) || e.division.toLowerCase().includes(q);
  });

  const startEdit = (e) => { setEditing(e.id); setForm({ name:e.name, designation:e.designation, phone:e.phone, email:e.email, division:e.division }); };
  const startNew = () => { setEditing('new'); setForm(empty); };
  const cancel = () => { setEditing(null); setForm(empty); };

  const save = () => {
    if (!form.name.trim()) return alert('Name is required');
    if (editing === 'new') dispatch({ type:'ADD_ENGINEER', payload: { id:uuidv4(), ...form } });
    else dispatch({ type:'UPDATE_ENGINEER', payload: { id:editing, ...form } });
    cancel();
  };

  const remove = (id, name) => { if (confirm(`Delete "${name}"?`)) dispatch({ type:'DELETE_ENGINEER', payload:id }); };
  const set = (f, v) => setForm(x => ({...x, [f]:v}));

  return (
    <div>
      <div className="page-header">
        <div><h1>Engineers</h1><p>Manage engineer records ({engineers.length})</p></div>
        <button className="btn btn-primary btn-sm" onClick={startNew}><Plus size={14} /> Add Engineer</button>
      </div>

      <div className="filter-bar" style={{ marginBottom:16 }}>
        <div className="form-group" style={{ minWidth:250 }}>
          <label className="form-label">Search</label>
          <input className="form-input" placeholder="Name, designation, division..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {editing && (
        <div className="card" style={{ marginBottom:16 }}>
          <div className="card-header"><span className="card-title">{editing==='new' ? 'New Engineer' : 'Edit Engineer'}</span></div>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">Name *</label><input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div className="form-group">
              <label className="form-label">Designation</label>
              <select className="form-select" value={form.designation} onChange={e => set('designation', e.target.value)}>
                <option value="Junior Engineer">Junior Engineer</option>
                <option value="Assistant Engineer">Assistant Engineer</option>
                <option value="Executive Engineer">Executive Engineer</option>
              </select>
            </div>
            <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Division</label><input className="form-input" value={form.division} onChange={e => set('division', e.target.value)} /></div>
          </div>
          <div className="btn-group" style={{ marginTop:16, justifyContent:'flex-end' }}>
            <button className="btn btn-secondary btn-sm" onClick={cancel}><X size={14} /> Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={save}><Save size={14} /> Save</button>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>#</th><th>Name</th><th>Designation</th><th>Phone</th><th>Email</th><th>Division</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>No engineers</td></tr>
            ) : filtered.map((e, i) => (
              <tr key={e.id}>
                <td>{i+1}</td><td>{e.name}</td>
                <td><span className={`status-badge ${e.designation==='Junior Engineer'?'in_progress':'completed'}`}>{e.designation}</span></td>
                <td>{e.phone}</td><td>{e.email}</td><td>{e.division}</td>
                <td>
                  <div style={{ display:'flex', gap:4 }}>
                    <button className="btn btn-secondary btn-icon btn-sm" onClick={() => startEdit(e)}><Edit size={14} /></button>
                    <button className="btn btn-danger btn-icon btn-sm" onClick={() => remove(e.id, e.name)}><Trash2 size={14} /></button>
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
