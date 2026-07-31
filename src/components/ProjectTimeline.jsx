import { useMemo, useState } from 'react';
import { useProjects } from '../context/ProjectContext';
import { useNavigate } from 'react-router-dom';

export default function ProjectTimeline() {
  const { projects } = useProjects();
  const navigate = useNavigate();
  const [filterYear, setFilterYear] = useState('');

  const years = useMemo(() => [...new Set(projects.map(p => p.yearOfSanction))].sort((a,b) => b-a), [projects]);

  const timelineProjects = useMemo(() => {
    let filtered = projects;
    if (filterYear) filtered = filtered.filter(p => p.yearOfSanction === Number(filterYear));
    
    // Only include projects that have both dates
    return filtered
      .filter(p => p.workOrderDate && p.dateOfCompletionContract)
      .map(p => {
        const start = new Date(p.workOrderDate);
        const end = new Date(p.dateOfCompletionContract);
        return { ...p, start, end };
      })
      .sort((a, b) => a.start - b.start); // Sort by start date
  }, [projects, filterYear]);

  // Determine global min and max dates to calculate percentages
  const { minDate, maxDate, totalDuration } = useMemo(() => {
    if (timelineProjects.length === 0) return { minDate: new Date(), maxDate: new Date(), totalDuration: 1 };
    let min = timelineProjects[0].start;
    let max = timelineProjects[0].end;
    
    timelineProjects.forEach(p => {
      if (p.start < min) min = p.start;
      if (p.end > max) max = p.end;
    });
    
    // Add 10% padding to dates
    const padding = (max - min) * 0.1;
    min = new Date(min.getTime() - padding);
    max = new Date(max.getTime() + padding);
    
    return { minDate: min, maxDate: max, totalDuration: max - min };
  }, [timelineProjects]);

  const today = new Date();
  const todayPercentage = ((today - minDate) / totalDuration) * 100;

  return (
    <div>
      <div className="page-header">
        <div><h1>Project Timeline</h1><p>Gantt chart view of contract durations</p></div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <select className="form-select" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
            <option value="">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 24, overflowX: 'auto' }}>
        {timelineProjects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            No projects found with valid Work Order and Completion dates.
          </div>
        ) : (
          <div style={{ minWidth: 800, position: 'relative', paddingTop: 20 }}>
            {/* Today Line */}
            {today >= minDate && today <= maxDate && (
              <div style={{
                position: 'absolute',
                left: `${todayPercentage}%`,
                top: 0,
                bottom: 0,
                width: 2,
                background: 'var(--rose)',
                zIndex: 10
              }}>
                <div style={{ 
                  position: 'absolute', 
                  top: -20, 
                  left: -20, 
                  background: 'var(--rose)', 
                  color: 'white', 
                  fontSize: 10, 
                  padding: '2px 6px', 
                  borderRadius: 4,
                  whiteSpace: 'nowrap'
                }}>
                  Today
                </div>
              </div>
            )}

            {/* Timeline Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {timelineProjects.map(p => {
                const startPct = Math.max(0, ((p.start - minDate) / totalDuration) * 100);
                const endPct = Math.min(100, ((p.end - minDate) / totalDuration) * 100);
                const width = Math.max(1, endPct - startPct);
                
                const isOverdue = p.statusOfWork !== 'completed' && p.end < today;
                const color = p.statusOfWork === 'completed' ? 'var(--emerald)' : (isOverdue ? 'var(--rose)' : 'var(--cyan)');

                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', height: 40, position: 'relative', borderBottom: '1px solid var(--border-subtle)' }}>
                    {/* Project Label */}
                    <div style={{ width: 200, flexShrink: 0, paddingRight: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 500, cursor: 'pointer' }} onClick={() => navigate(`/projects/${p.id}`)}>
                      {p.projectName}
                    </div>
                    
                    {/* Gantt Area */}
                    <div style={{ flex: 1, position: 'relative', height: '100%' }}>
                      <div 
                        style={{
                          position: 'absolute',
                          left: `${startPct}%`,
                          width: `${width}%`,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          height: 16,
                          background: color,
                          borderRadius: 4,
                          cursor: 'pointer',
                          opacity: 0.8
                        }}
                        title={`${p.projectName}\nStart: ${p.start.toLocaleDateString()}\nEnd: ${p.end.toLocaleDateString()}`}
                        onClick={() => navigate(`/projects/${p.id}`)}
                      />
                      
                      {/* Dates text inside the row for clarity */}
                      <div style={{
                          position: 'absolute',
                          left: `${startPct}%`,
                          top: '50%',
                          transform: 'translate(-100%, -50%)',
                          paddingRight: 8,
                          fontSize: 10,
                          color: 'var(--text-muted)'
                      }}>
                        {p.start.toLocaleDateString()}
                      </div>
                      <div style={{
                          position: 'absolute',
                          left: `${endPct}%`,
                          top: '50%',
                          transform: 'translate(0, -50%)',
                          paddingLeft: 8,
                          fontSize: 10,
                          color: 'var(--text-muted)'
                      }}>
                        {p.end.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
