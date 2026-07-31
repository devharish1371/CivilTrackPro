import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { AlertTriangle, ArrowUpRight, CalendarClock, CheckCircle2, ChevronLeft, ChevronRight, CircleAlert, Edit, Eye, FileWarning, ListChecks, MapPin, ShieldAlert, WalletCards } from 'lucide-react';

const DAY_MS = 86400000;
const UPCOMING_DAYS = 45;
const ACTIONS_PER_PAGE = 10;

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const daysFromToday = (date, today) => Math.ceil((date - today) / DAY_MS);

const formatDate = (date) => date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const actionMeta = {
  urgent: { label: 'Urgent', icon: CircleAlert, className: 'danger' },
  upcoming: { label: 'Upcoming', icon: CalendarClock, className: 'warning' },
  compliance: { label: 'Compliance', icon: ShieldAlert, className: 'warning' },
  financial: { label: 'Financial', icon: WalletCards, className: 'danger' },
  information: { label: 'Data Check', icon: FileWarning, className: 'info' },
};

function addAction(actions, project, type, title, detail, dueDate = null) {
  actions.push({
    id: `${project.id}-${type}`,
    projectId: project.id,
    projectName: project.projectName || 'Unnamed Project',
    constituency: project.constituency || '',
    juniorEngineer: project.juniorEngineer || '',
    assistantEngineer: project.assistantEngineer || '',
    type,
    title,
    detail,
    dueDate,
  });
}

function buildActions(projects, today) {
  const actions = [];

  projects.forEach(project => {
    const completionDate = toDate(project.dateOfCompletionContract);
    const completionDays = completionDate ? daysFromToday(completionDate, today) : null;
    const isCompleted = project.statusOfWork === 'completed';

    if (!isCompleted && completionDays !== null && completionDays < 0) {
      addAction(actions, project, 'urgent', 'Contract completion overdue', `${Math.abs(completionDays)} day${Math.abs(completionDays) === 1 ? '' : 's'} overdue`, completionDate);
    } else if (!isCompleted && completionDays !== null && completionDays <= UPCOMING_DAYS) {
      addAction(actions, project, 'upcoming', 'Contract completion approaching', `Due ${formatDate(completionDate)} (${completionDays} day${completionDays === 1 ? '' : 's'})`, completionDate);
    }

    const expiryDate = toDate(project.expiryDate);
    const expiryDays = expiryDate ? daysFromToday(expiryDate, today) : null;
    const securityReleased = Boolean(project.securityDepositReleaseDate);
    if (!securityReleased && expiryDays !== null && expiryDays < 0) {
      addAction(actions, project, 'compliance', 'Performance guarantee expired', `Expired ${Math.abs(expiryDays)} day${Math.abs(expiryDays) === 1 ? '' : 's'} ago`, expiryDate);
    } else if (!securityReleased && expiryDays !== null && expiryDays <= UPCOMING_DAYS) {
      addAction(actions, project, 'compliance', 'Performance guarantee expiring', `Expires ${formatDate(expiryDate)} (${expiryDays} day${expiryDays === 1 ? '' : 's'})`, expiryDate);
    }

    const sanctioned = Number(project.sanctionedAmount) || 0;
    const expenditure = Number(project.expenditureIncurred) || 0;
    if (sanctioned > 0 && expenditure > sanctioned) {
      addAction(actions, project, 'financial', 'Budget exceeded', `Expenditure is ₹${(expenditure - sanctioned).toLocaleString('en-IN')} over sanctioned amount`);
    }

    const hasUc = project.ucSent === 'Yes' || Boolean(project.ucSentDate);
    if (expenditure > 0 && !hasUc) {
      addAction(actions, project, 'compliance', 'Utilisation certificate pending', 'Expenditure is recorded but no UC submission date is available');
    }

    const missing = [
      !project.juniorEngineer && 'Junior Engineer',
      !project.assistantEngineer && 'Assistant Engineer',
      (!project.latitude || !project.longitude || Number(project.latitude) === 0) && 'Map location',
      !project.contractorName && 'Contractor',
    ].filter(Boolean);
    if (missing.length > 0) {
      addAction(actions, project, 'information', 'Project details incomplete', `Add: ${missing.join(', ')}`);
    }

    if (!isCompleted && project.statusOfWork === 'in_progress' && (Number(project.progress) || 0) === 0) {
      addAction(actions, project, 'urgent', 'Progress update needed', 'Project is marked in progress but has 0% progress recorded');
    }
  });

  return actions.sort((a, b) => {
    const priority = { urgent: 0, financial: 1, compliance: 2, upcoming: 3, information: 4 };
    const priorityDiff = priority[a.type] - priority[b.type];
    if (priorityDiff !== 0) return priorityDiff;
    if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return a.projectName.localeCompare(b.projectName);
  });
}

export default function ActionCenter() {
  const { projects } = useProjects();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const today = useMemo(() => new Date(), []);
  const actions = useMemo(() => buildActions(projects, today), [projects, today]);

  const counts = useMemo(() => ({
    all: actions.length,
    urgent: actions.filter(a => a.type === 'urgent' || a.type === 'financial').length,
    upcoming: actions.filter(a => a.type === 'upcoming').length,
    compliance: actions.filter(a => a.type === 'compliance').length,
    information: actions.filter(a => a.type === 'information').length,
  }), [actions]);

  const applyFilter = (nextFilter) => {
    setFilter(nextFilter);
    setPage(1);
  };

  const visibleActions = useMemo(() => {
    if (filter === 'all') return actions;
    if (filter === 'urgent') return actions.filter(a => a.type === 'urgent' || a.type === 'financial');
    return actions.filter(a => a.type === filter);
  }, [actions, filter]);

  const totalPages = Math.max(1, Math.ceil(visibleActions.length / ACTIONS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedActions = visibleActions.slice(
    (currentPage - 1) * ACTIONS_PER_PAGE,
    currentPage * ACTIONS_PER_PAGE
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Action Center</h1>
          <p>Prioritized follow-ups across {projects.length} projects</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/projects')}>
          <ListChecks size={14} /> View Projects
        </button>
      </div>

      <div className="action-summary-grid">
        <button className={`action-summary-card danger ${filter === 'urgent' ? 'selected' : ''}`} onClick={() => applyFilter('urgent')}>
          <div className="stat-icon rose"><AlertTriangle size={20} /></div>
          <div className="stat-value">{counts.urgent}</div>
          <div className="stat-label">Needs Attention</div>
        </button>
        <button className={`action-summary-card warning ${filter === 'upcoming' ? 'selected' : ''}`} onClick={() => applyFilter('upcoming')}>
          <div className="stat-icon amber"><CalendarClock size={20} /></div>
          <div className="stat-value">{counts.upcoming}</div>
          <div className="stat-label">Upcoming Deadlines</div>
        </button>
        <button className={`action-summary-card compliance ${filter === 'compliance' ? 'selected' : ''}`} onClick={() => applyFilter('compliance')}>
          <div className="stat-icon blue"><ShieldAlert size={20} /></div>
          <div className="stat-value">{counts.compliance}</div>
          <div className="stat-label">Compliance Follow-ups</div>
        </button>
        <button className={`action-summary-card information ${filter === 'information' ? 'selected' : ''}`} onClick={() => applyFilter('information')}>
          <div className="stat-icon purple"><FileWarning size={20} /></div>
          <div className="stat-value">{counts.information}</div>
          <div className="stat-label">Data Checks</div>
        </button>
      </div>

      <div className="card action-center-card">
        <div className="card-header action-center-header">
          <div>
            <span className="card-title">Follow-up Queue</span>
            <p className="action-center-subtitle">Select an item to open its project record.</p>
          </div>
          <select className="form-select action-filter" value={filter} onChange={e => applyFilter(e.target.value)}>
            <option value="all">All Actions ({counts.all})</option>
            <option value="urgent">Needs Attention ({counts.urgent})</option>
            <option value="upcoming">Upcoming ({counts.upcoming})</option>
            <option value="compliance">Compliance ({counts.compliance})</option>
            <option value="information">Data Checks ({counts.information})</option>
          </select>
        </div>

        {visibleActions.length === 0 ? (
          <div className="action-empty-state">
            <CheckCircle2 size={38} />
            <h3>Everything is clear</h3>
            <p>No follow-ups match this filter.</p>
          </div>
        ) : (
          <div className="action-list">
            {paginatedActions.map(action => {
              const meta = actionMeta[action.type];
              const Icon = meta.icon;
              return (
                <div key={action.id} className={`action-item ${meta.className}`}>
                  <div className={`action-item-icon ${meta.className}`}><Icon size={17} /></div>
                  <div className="action-item-content">
                    <div className="action-item-heading">
                      <div>
                        <span className={`action-type ${meta.className}`}>{meta.label}</span>
                        <h3>{action.title}</h3>
                      </div>
                      {action.dueDate && <span className="action-due-date">{formatDate(action.dueDate)}</span>}
                    </div>
                    <p className="action-project-name">{action.projectName}</p>
                    <p className="action-detail">{action.detail}</p>
                    <div className="action-context">
                      {action.constituency && <span><MapPin size={12} /> {action.constituency}</span>}
                      {action.juniorEngineer && <span>JE: {action.juniorEngineer}</span>}
                      {action.assistantEngineer && <span>AE: {action.assistantEngineer}</span>}
                    </div>
                  </div>
                  <div className="action-item-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/projects/${action.projectId}`)} title="View project"><Eye size={14} /> View</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/projects/${action.projectId}/edit`)} title="Edit project"><Edit size={14} /> Edit</button>
                    <ArrowUpRight size={16} className="action-arrow" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {visibleActions.length > 0 && (
          <div className="action-pagination">
            <span>Showing {(currentPage - 1) * ACTIONS_PER_PAGE + 1}–{Math.min(currentPage * ACTIONS_PER_PAGE, visibleActions.length)} of {visibleActions.length} actions</span>
            {totalPages > 1 && (
              <div className="btn-group">
                <button className="btn btn-secondary btn-sm" onClick={() => setPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                  <ChevronLeft size={14} /> Previous
                </button>
                <span className="action-page-number">Page {currentPage} of {totalPages}</span>
                <button className="btn btn-secondary btn-sm" onClick={() => setPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
                  Next <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
