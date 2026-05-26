import { useState } from 'react';
import { useProjects } from '../context/ProjectContext';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Edit, Trash2, X, Save } from 'lucide-react';

const empty = { name: '' };

export default function SchemeManager() {
  const { schemes, dispatch } = useProjects();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState('');

  const filtered = schemes.filter(s => {
    if (!search) return true;
    return s.name.toLowerCase().includes(search.toLowerCase());
  });

  const startEdit = (s) => { setEditing(s.id); setForm({ name: s.name }); };
  const startNew = () => { setEditing('new'); setForm(empty); };
  const cancel = () => { setEditing(null); setForm(empty); };

  const save = () => {
    if (!form.name.trim()) return alert('Name is required');
    if (editing === 'new') dispatch({ type: 'ADD_SCHEME', payload: { id: uuidv4(), ...form } });
    else dispatch({ type: 'UPDATE_SCHEME', payload: { id: editing, ...form } });
    cancel();
  };

  const remove = (id, name) => { if (confirm(`Delete scheme "${name}"?`)) dispatch({ type: 'DELETE_SCHEME', payload: id }); };

  return (
    <div>
      <div className="page-header">
        <div><h1>Schemes</h1><p>Manage project schemes ({schemes.length})</p></div>
        <button className="btn btn-primary btn-sm" onClick={startNew}><Plus size={14} /> Add Scheme</button>
      </div>

      <div className="filter-bar" style={{ marginBottom: 16 }}>
        <div className="form-group" style={{ minWidth: 250 }}>
          <label className="form-label">Search</label>
          <input className="form-input" placeholder="Scheme name..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {editing && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><span className="card-title">{editing === 'new' ? 'New Scheme' : 'Edit Scheme'}</span></div>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">Scheme Name *</label><input className="form-input" value={form.name} onChange={e => setForm({ name: e.target.value })} /></div>
          </div>
          <div className="btn-group" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary btn-sm" onClick={cancel}><X size={14} /> Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={save}><Save size={14} /> Save</button>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>#</th><th>Scheme Name</th><th style={{ width: 100 }}>Actions</th></tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={3} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No schemes</td></tr>
            ) : filtered.map((s, i) => (
              <tr key={s.id}>
                <td>{i + 1}</td><td>{s.name}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-secondary btn-icon btn-sm" onClick={() => startEdit(s)}><Edit size={14} /></button>
                    <button className="btn btn-danger btn-icon btn-sm" onClick={() => remove(s.id, s.name)}><Trash2 size={14} /></button>
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
