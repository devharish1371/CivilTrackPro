import { useState } from 'react';
import { useProjects } from '../context/ProjectContext';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Edit, Trash2, X, Save } from 'lucide-react';

const empty = { name: '' };

export default function CategoryManager() {
  const { categories, dispatch } = useProjects();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState('');

  const filtered = categories.filter(c => {
    if (!search) return true;
    return c.name.toLowerCase().includes(search.toLowerCase());
  });

  const startEdit = (c) => { setEditing(c.id); setForm({ name: c.name }); };
  const startNew = () => { setEditing('new'); setForm(empty); };
  const cancel = () => { setEditing(null); setForm(empty); };

  const save = () => {
    if (!form.name.trim()) return alert('Name is required');
    if (editing === 'new') dispatch({ type: 'ADD_CATEGORY', payload: { id: uuidv4(), ...form } });
    else dispatch({ type: 'UPDATE_CATEGORY', payload: { id: editing, ...form } });
    cancel();
  };

  const remove = (id, name) => { if (confirm(`Delete category "${name}"?`)) dispatch({ type: 'DELETE_CATEGORY', payload: id }); };

  return (
    <div>
      <div className="page-header">
        <div><h1>Categories</h1><p>Manage project categories ({categories.length})</p></div>
        <button className="btn btn-primary btn-sm" onClick={startNew}><Plus size={14} /> Add Category</button>
      </div>

      <div className="filter-bar" style={{ marginBottom: 16 }}>
        <div className="form-group" style={{ minWidth: 250 }}>
          <label className="form-label">Search</label>
          <input className="form-input" placeholder="Category name..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {editing && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><span className="card-title">{editing === 'new' ? 'New Category' : 'Edit Category'}</span></div>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">Category Name *</label><input className="form-input" value={form.name} onChange={e => setForm({ name: e.target.value })} /></div>
          </div>
          <div className="btn-group" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary btn-sm" onClick={cancel}><X size={14} /> Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={save}><Save size={14} /> Save</button>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>#</th><th>Category Name</th><th style={{ width: 100 }}>Actions</th></tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={3} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No categories</td></tr>
            ) : filtered.map((c, i) => (
              <tr key={c.id}>
                <td>{i + 1}</td><td>{c.name}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
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
