import { useState, useMemo } from 'react';
import { useProjects } from '../context/ProjectContext';
import { useNavigate } from 'react-router-dom';
import { statusOptions } from '../data/sampleData';
import { Eye, Edit, MessageSquare, AlertCircle } from 'lucide-react';

export default function KanbanBoard() {
  const { projects, dispatch } = useProjects();
  const navigate = useNavigate();
  const [draggedItem, setDraggedItem] = useState(null);

  // Group projects by status
  const columns = useMemo(() => {
    const cols = {};
    statusOptions.forEach(s => cols[s.value] = []);
    projects.forEach(p => {
      const status = p.statusOfWork || 'yet_to_start';
      if (!cols[status]) cols[status] = [];
      cols[status].push(p);
    });
    return cols;
  }, [projects]);

  const handleDragStart = (e, project) => {
    setDraggedItem(project);
    e.dataTransfer.setData('text/plain', project.id);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    if (!draggedItem) return;
    
    if (draggedItem.statusOfWork !== newStatus) {
      const updatedProject = { ...draggedItem, statusOfWork: newStatus };
      dispatch({ type: 'UPDATE_PROJECT', payload: updatedProject });
    }
    setDraggedItem(null);
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>Kanban Board</h1><p>Drag and drop to update project status</p></div>
      </div>

      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16, height: 'calc(100vh - 180px)' }}>
        {statusOptions.map(status => (
          <div 
            key={status.value}
            style={{ 
              minWidth: 320, 
              width: 320,
              background: 'var(--surface-color)', 
              borderRadius: 8, 
              display: 'flex', 
              flexDirection: 'column',
              border: '1px solid var(--border-subtle)',
              height: '100%'
            }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status.value)}
          >
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`status-badge ${status.value}`} style={{ padding: '2px 8px', borderRadius: 12 }}>
                  {status.label}
                </span>
              </h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-color)', padding: '2px 8px', borderRadius: 12 }}>
                {columns[status.value]?.length || 0}
              </span>
            </div>
            
            <div style={{ padding: 12, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(columns[status.value] || []).map(p => (
                <div 
                  key={p.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, p)}
                  style={{
                    background: 'var(--bg-color)',
                    border: '1px solid var(--border-subtle)',
                    padding: 12,
                    borderRadius: 6,
                    cursor: 'grab',
                    opacity: draggedItem?.id === p.id ? 0.5 : 1,
                    transition: 'transform 0.1s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                >
                  <h4 style={{ fontSize: 13, margin: '0 0 8px 0', lineHeight: 1.4 }}>{p.projectName}</h4>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span><strong>Scheme:</strong> {p.scheme}</span>
                    <span><strong>Location:</strong> {p.constituency}</span>
                  </div>
                  
                  {p.progress > 0 && (
                     <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom: 8 }}>
                       <div className="progress-bar" style={{ flex: 1 }}><div className={`progress-fill ${p.progress>=80?'green':p.progress>=40?'amber':'red'}`} style={{ width:`${p.progress}%` }} /></div>
                       <span style={{ fontSize:10, fontWeight: 600 }}>{p.progress}%</span>
                     </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                     <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                       ₹{(p.sanctionedAmount || 0).toLocaleString('en-IN')}
                     </span>
                     <div style={{ display: 'flex', gap: 4 }}>
                       <button className="btn btn-secondary btn-sm btn-icon" onClick={() => navigate(`/projects/${p.id}`)} title="View"><Eye size={14}/></button>
                     </div>
                  </div>
                </div>
              ))}
              {columns[status.value]?.length === 0 && (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 12, border: '1px dashed var(--border-subtle)', borderRadius: 6 }}>
                  Drop projects here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
