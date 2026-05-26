import { useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { AlertTriangle, Clock, ShieldAlert, ChevronRight } from 'lucide-react';

export default function AlertsPanel() {
  const { getAlerts } = useProjects();
  const navigate = useNavigate();
  const alerts = getAlerts();

  const dangerAlerts = alerts.filter(a => a.type === 'danger');
  const warningAlerts = alerts.filter(a => a.type === 'warning');

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Alerts</h1>
          <p>{alerts.length} active alerts requiring attention</p>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="empty-state">
          <ShieldAlert size={48} />
          <h3>All Clear!</h3>
          <p>No active alerts. All projects are within their timelines.</p>
        </div>
      ) : (
        <>
          {dangerAlerts.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <span className="card-title" style={{ color: 'var(--rose)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={16} /> Critical ({dangerAlerts.length})
                </span>
              </div>
              {dangerAlerts.map(a => (
                <div key={a.id} className="alert-item danger" onClick={() => navigate(`/projects/${a.projectId}`)} style={{ cursor: 'pointer' }}>
                  <div className="alert-icon danger"><AlertTriangle size={16} /></div>
                  <div className="alert-content" style={{ flex: 1 }}>
                    <h4>{a.title}</h4>
                    <p>{a.message}</p>
                    <div className="alert-date">{fmtDate(a.date)}</div>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </div>
              ))}
            </div>
          )}

          {warningAlerts.length > 0 && (
            <div className="card">
              <div className="card-header">
                <span className="card-title" style={{ color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={16} /> Warnings ({warningAlerts.length})
                </span>
              </div>
              {warningAlerts.map(a => (
                <div key={a.id} className="alert-item warning" onClick={() => navigate(`/projects/${a.projectId}`)} style={{ cursor: 'pointer' }}>
                  <div className="alert-icon warning"><Clock size={16} /></div>
                  <div className="alert-content" style={{ flex: 1 }}>
                    <h4>{a.title}</h4>
                    <p>{a.message}</p>
                    <div className="alert-date">{fmtDate(a.date)}</div>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
