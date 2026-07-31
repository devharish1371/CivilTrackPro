import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { generateAlertsPDF, savePDF, sharePDF } from '../utils/pdfExport';
import { AlertTriangle, Clock, ShieldAlert, ChevronRight, FileText, Share2, Filter, X, Info } from 'lucide-react';

export default function AlertsPanel() {
  const { getAlerts } = useProjects();
  const navigate = useNavigate();
  const alerts = getAlerts();
  const [filters, setFilters] = useState({ juniorEngineer: '', assistantEngineer: '' });

  const juniorEngineerOptions = useMemo(
    () => [...new Set(alerts.map(a => a.juniorEngineer).filter(Boolean))].sort(),
    [alerts]
  );
  const assistantEngineerOptions = useMemo(
    () => [...new Set(alerts.map(a => a.assistantEngineer).filter(Boolean))].sort(),
    [alerts]
  );

  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      if (filters.juniorEngineer && a.juniorEngineer !== filters.juniorEngineer) return false;
      if (filters.assistantEngineer && a.assistantEngineer !== filters.assistantEngineer) return false;
      return true;
    });
  }, [alerts, filters]);

  const dangerAlerts = filteredAlerts.filter(a => a.type === 'danger');
  const warningAlerts = filteredAlerts.filter(a => a.type === 'warning');
  const infoAlerts = filteredAlerts.filter(a => a.type === 'info');
  const hasActiveFilters = Boolean(filters.juniorEngineer || filters.assistantEngineer);

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
  const clearFilters = () => setFilters({ juniorEngineer: '', assistantEngineer: '' });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Alerts</h1>
          <p>
            {filteredAlerts.length} active alerts requiring attention
            {hasActiveFilters ? ` (filtered from ${alerts.length})` : ''}
          </p>
        </div>
        {filteredAlerts.length > 0 && (
          <div className="btn-group">
            <button className="btn btn-secondary btn-sm" onClick={() => savePDF(generateAlertsPDF(filteredAlerts, filters), 'Active_Alerts.pdf')}><FileText size={14} /> PDF</button>
            <button className="btn btn-secondary btn-sm" onClick={() => sharePDF(generateAlertsPDF(filteredAlerts, filters), 'Active_Alerts.pdf')}><Share2 size={14} /> Share</button>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={16} /> Filter Alerts
          </span>
          {hasActiveFilters && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={clearFilters}>
              <X size={14} /> Clear
            </button>
          )}
        </div>
        <div className="filter-bar" style={{ marginBottom: 0 }}>
          <div className="form-group">
            <label className="form-label">Junior Engineer</label>
            <select
              className="form-select"
              value={filters.juniorEngineer}
              onChange={(e) => setFilters(f => ({ ...f, juniorEngineer: e.target.value }))}
            >
              <option value="">All Junior Engineers</option>
              {juniorEngineerOptions.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Assistant Engineer</label>
            <select
              className="form-select"
              value={filters.assistantEngineer}
              onChange={(e) => setFilters(f => ({ ...f, assistantEngineer: e.target.value }))}
            >
              <option value="">All Assistant Engineers</option>
              {assistantEngineerOptions.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {filteredAlerts.length === 0 ? (
        <div className="empty-state">
          <ShieldAlert size={48} />
          <h3>{hasActiveFilters ? 'No Matching Alerts' : 'All Clear!'}</h3>
          <p>{hasActiveFilters ? 'Try changing the JE or AE filter.' : 'No active alerts. All projects are within their timelines.'}</p>
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
                    <p style={{ marginTop: 6 }}>
                      JE: {a.juniorEngineer || '-'} | AE: {a.assistantEngineer || '-'}
                    </p>
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
                    <p style={{ marginTop: 6 }}>
                      JE: {a.juniorEngineer || '-'} | AE: {a.assistantEngineer || '-'}
                    </p>
                    <div className="alert-date">{fmtDate(a.date)}</div>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </div>
              ))}
            </div>
          )}

          {infoAlerts.length > 0 && (
            <div className="card">
              <div className="card-header">
                <span className="card-title" style={{ color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Info size={16} /> Upcoming ({infoAlerts.length})
                </span>
              </div>
              {infoAlerts.map(a => (
                <div key={a.id} className="alert-item info" onClick={() => navigate(`/projects/${a.projectId}`)} style={{ cursor: 'pointer' }}>
                  <div className="alert-icon info"><Info size={16} /></div>
                  <div className="alert-content" style={{ flex: 1 }}>
                    <h4>{a.title}</h4>
                    <p>{a.message}</p>
                    <p style={{ marginTop: 6 }}>
                      JE: {a.juniorEngineer || '-'} | AE: {a.assistantEngineer || '-'}
                    </p>
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
