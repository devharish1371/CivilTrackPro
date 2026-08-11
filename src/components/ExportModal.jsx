import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { REPORT_COLUMNS, DEFAULT_COLUMNS } from '../utils/pdfExport';

export default function ExportModal({ isOpen, onClose, onExport, reportType, exportFormat = 'pdf' }) {
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (isOpen && reportType) {
      // Default to the predefined columns for this report type
      setSelected(DEFAULT_COLUMNS[reportType] || []);
    }
  }, [isOpen, reportType]);

  if (!isOpen) return null;

  const handleToggle = (id) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleExport = () => {
    if (selected.length === 0) {
      alert("Please select at least one column to export.");
      return;
    }
    onExport(selected);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div className="card" style={{ width: '90%', maxWidth: 450, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>Select {exportFormat === 'excel' ? 'Excel' : 'PDF'} Columns</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>
        
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Choose the fields you want to include in your exported report.
        </p>

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16, paddingRight: 8 }}>
          {[...REPORT_COLUMNS].sort((a, b) => a.label.localeCompare(b.label)).map(col => (
            <label key={col.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
              <input type="checkbox" checked={selected.includes(col.id)} onChange={() => handleToggle(col.id)} style={{ display: 'none' }} />
              <div style={{ width: 20, height: 20, borderRadius: 4, border: '1px solid', borderColor: selected.includes(col.id) ? 'var(--cyan)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12, background: selected.includes(col.id) ? 'var(--cyan)' : 'transparent', transition: 'all 0.2s ease' }}>
                {selected.includes(col.id) && <Check size={14} color="#000" />}
              </div>
              <span style={{ fontSize: 14, color: selected.includes(col.id) ? 'var(--text-primary)' : 'var(--text-secondary)', transition: 'color 0.2s ease' }}>
                {col.label.replace('\n', ' ')}
              </span>
            </label>
          ))}
        </div>

        <div className="btn-group" style={{ justifyContent: 'flex-end', marginTop: 'auto' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleExport}>Download {exportFormat === 'excel' ? 'Excel' : 'PDF'}</button>
        </div>
      </div>
    </div>
  );
}
