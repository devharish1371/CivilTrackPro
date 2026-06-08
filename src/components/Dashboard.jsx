import { useState, useMemo } from 'react';
import { useProjects } from '../context/ProjectContext';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Building2, IndianRupee, TrendingUp, AlertTriangle, Clock, CheckCircle, MapPin, Filter, X } from 'lucide-react';

const COLORS = ['#10b981','#f59e0b','#64748b','#06b6d4','#8b5cf6','#f43f5e','#3b82f6'];
const fmt = (n) => { if (n >= 10000000) return `₹${(n/10000000).toFixed(2)} Cr`; if (n >= 100000) return `₹${(n/100000).toFixed(2)} L`; return `₹${n.toLocaleString('en-IN')}`; };

export default function Dashboard() {
  const { projects, grants, getAlerts, schemes, constituencies } = useProjects();
  const navigate = useNavigate();
  const alerts = getAlerts();

  const [filters, setFilters] = useState({ constituency: '', scheme: '', phase: '' });
  const [showFilters, setShowFilters] = useState(false);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (filters.constituency && p.constituency !== filters.constituency) return false;
      if (filters.scheme && p.scheme !== filters.scheme) return false;
      if (filters.phase && p.phase !== filters.phase) return false;
      return true;
    });
  }, [projects, filters]);

  const filteredGrants = useMemo(() => {
    return grants.filter(g => {
      if (filters.scheme && g.scheme !== filters.scheme) return false;
      if (filters.constituency && g.constituency !== filters.constituency) return false;
      if (filters.phase && g.phase !== filters.phase) return false;
      return true;
    });
  }, [grants, filters]);

  const optsConstituency = useMemo(() => {
    const set = new Set();
    projects.filter(p => (!filters.scheme || p.scheme === filters.scheme) && (!filters.phase || p.phase === filters.phase)).forEach(p => p.constituency && set.add(p.constituency));
    grants.filter(g => (!filters.scheme || g.scheme === filters.scheme) && (!filters.phase || g.phase === filters.phase)).forEach(g => g.constituency && set.add(g.constituency));
    return Array.from(set).sort();
  }, [projects, grants, filters.scheme, filters.phase]);

  const optsScheme = useMemo(() => {
    const set = new Set();
    projects.filter(p => (!filters.constituency || p.constituency === filters.constituency) && (!filters.phase || p.phase === filters.phase)).forEach(p => p.scheme && set.add(p.scheme));
    grants.filter(g => (!filters.constituency || g.constituency === filters.constituency) && (!filters.phase || g.phase === filters.phase)).forEach(g => g.scheme && set.add(g.scheme));
    return Array.from(set).sort();
  }, [projects, grants, filters.constituency, filters.phase]);

  const optsPhase = useMemo(() => {
    const set = new Set();
    projects.filter(p => (!filters.constituency || p.constituency === filters.constituency) && (!filters.scheme || p.scheme === filters.scheme)).forEach(p => p.phase && set.add(p.phase));
    grants.filter(g => (!filters.constituency || g.constituency === filters.constituency) && (!filters.scheme || g.scheme === filters.scheme)).forEach(g => g.phase && set.add(g.phase));
    return Array.from(set).sort();
  }, [projects, grants, filters.constituency, filters.scheme]);

  const totalSanctioned = filteredProjects.reduce((s,p) => s + (p.sanctionedAmount||0), 0);
  const totalExpenditure = filteredProjects.reduce((s,p) => s + (p.expenditureIncurred||0), 0);
  const totalGrant = filteredGrants.reduce((s,g) => s + (g.amount||0), 0);
  const totalDeductions = filteredProjects.reduce((s,p) => s + (p.deductions||0), 0);
  const totalUtilised = totalExpenditure + totalDeductions;
  const totalBalance = totalSanctioned - totalUtilised;
  const completed = filteredProjects.filter(p => p.statusOfWork==='completed').length;
  const inProgress = filteredProjects.filter(p => p.statusOfWork==='in_progress').length;
  const yetToStart = filteredProjects.filter(p => p.statusOfWork==='yet_to_start').length;
  const geoTagged = filteredProjects.filter(p => p.latitude && p.longitude && Number(p.latitude)!==0).length;

  const statusData = [
    { name:'Completed', value:completed },
    { name:'In Progress', value:inProgress },
    { name:'Yet to Start', value:yetToStart },
  ].filter(d => d.value > 0);

  const schemeMap = {};
  filteredProjects.forEach(p => {
    if (!schemeMap[p.scheme]) schemeMap[p.scheme] = { name:p.scheme, sanctioned:0, expenditure:0, grant:0 };
    schemeMap[p.scheme].sanctioned += p.sanctionedAmount||0;
    schemeMap[p.scheme].expenditure += p.expenditureIncurred||0;
  });
  filteredGrants.forEach(g => {
    if (!schemeMap[g.scheme]) schemeMap[g.scheme] = { name:g.scheme, sanctioned:0, expenditure:0, grant:0 };
    schemeMap[g.scheme].grant += g.amount||0;
  });
  const schemeData = Object.values(schemeMap).sort((a,b) => b.sanctioned - a.sanctioned);

  const conMap = {};
  filteredProjects.forEach(p => {
    if (!conMap[p.constituency]) conMap[p.constituency] = { name:p.constituency, total:0, count:0, grant:0 };
    conMap[p.constituency].total += p.sanctionedAmount||0;
    conMap[p.constituency].count++;
  });
  filteredGrants.forEach(g => {
    if (g.constituency) {
      if (!conMap[g.constituency]) conMap[g.constituency] = { name:g.constituency, total:0, count:0, grant:0 };
      conMap[g.constituency].grant += g.amount||0;
    }
  });
  const conData = Object.values(conMap).sort((a,b) => (b.total+b.grant) - (a.total+a.grant));

  const clearFilters = () => setFilters({ constituency: '', scheme: '', phase: '' });
  const hasFilters = Object.values(filters).some(v => v);

  const Tip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background:'#131c31', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'10px 14px', fontSize:12 }}>
        <p style={{ fontWeight:600, marginBottom:4 }}>{label || payload[0]?.name}</p>
        {payload.map((p,i) => <p key={i} style={{ color:p.color }}>{p.name}: {typeof p.value==='number' && p.value>1000 ? fmt(p.value) : p.value}</p>)}
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>Dashboard</h1><p>Overview of {hasFilters ? 'filtered' : 'all'} civil engineering projects</p></div>
        <div className="btn-group">
          <button className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setShowFilters(!showFilters)}>
            <Filter size={14} /> Filters {hasFilters && <span style={{ background:'var(--rose)', color:'#fff', padding:'2px 6px', borderRadius:10, fontSize:10, marginLeft:4 }}>Active</span>}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="filter-bar" style={{ marginBottom: 20 }}>
          <div className="form-group">
            <label className="form-label">Constituency</label>
            <select className="form-select" value={filters.constituency} onChange={e => setFilters(f => ({...f, constituency:e.target.value}))}>
              <option value="">All Constituencies</option>
              {optsConstituency.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Scheme</label>
            <select className="form-select" value={filters.scheme} onChange={e => setFilters(f => ({...f, scheme:e.target.value}))}>
              <option value="">All Schemes</option>
              {optsScheme.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Phase</label>
            <select className="form-select" value={filters.phase} onChange={e => setFilters(f => ({...f, phase:e.target.value}))}>
              <option value="">All Phases</option>
              {optsPhase.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {hasFilters && <button className="btn btn-danger btn-sm" onClick={clearFilters} style={{ alignSelf:'flex-end' }}><X size={14} /> Clear</button>}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card cyan" onClick={() => navigate('/projects')} style={{ cursor:'pointer' }}>
          <div className="stat-icon cyan"><Building2 size={20} /></div>
          <div className="stat-value">{filteredProjects.length}</div><div className="stat-label">Total Projects</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon purple"><IndianRupee size={20} /></div>
          <div className="stat-value">{fmt(totalSanctioned)}</div><div className="stat-label">Total Sanctioned</div>
        </div>
        <div className="stat-card emerald">
          <div className="stat-icon emerald"><TrendingUp size={20} /></div>
          <div className="stat-value">{fmt(totalGrant)}</div><div className="stat-label">Total Grant Received</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-icon amber"><Clock size={20} /></div>
          <div className="stat-value">{fmt(totalUtilised)}</div><div className="stat-label">Total Utilised</div>
        </div>
        <div className="stat-card rose" onClick={() => navigate('/alerts')} style={{ cursor:'pointer' }}>
          <div className="stat-icon rose"><AlertTriangle size={20} /></div>
          <div className="stat-value">{alerts.length}</div><div className="stat-label">Active Alerts</div>
        </div>
        <div className="stat-card cyan" style={{ borderColor: totalBalance<0 ? 'var(--rose)' : '' }}>
          <div className="stat-icon cyan"><CheckCircle size={20} /></div>
          <div className="stat-value" style={{ color: totalBalance<0 ? 'var(--rose)' : 'var(--emerald)' }}>{fmt(totalBalance)}</div>
          <div className="stat-label">Total Balance</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">Status Distribution</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart><Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={4} dataKey="value" label={({name,value}) => `${name}: ${value}`}>
              {statusData.map((_,i) => <Cell key={i} fill={COLORS[i]} />)}
            </Pie><Tooltip content={<Tip />} /></PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title">Scheme-wise Budget (₹)</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={schemeData} layout="vertical" margin={{ left:10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tickFormatter={v => fmt(v)} tick={{ fill:'#94a3b8', fontSize:10 }} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fill:'#94a3b8', fontSize:10 }} />
              <Tooltip content={<Tip />} /><Legend />
              <Bar dataKey="sanctioned" name="Sanctioned" fill="#8b5cf6" radius={[0,4,4,0]} />
              <Bar dataKey="grant" name="Grant" fill="#10b981" radius={[0,4,4,0]} />
              <Bar dataKey="expenditure" name="Expenditure" fill="#06b6d4" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title">Constituency-wise Budget</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={conData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill:'#94a3b8', fontSize:10 }} angle={-20} textAnchor="end" height={50} />
              <YAxis tickFormatter={v => fmt(v)} tick={{ fill:'#94a3b8', fontSize:10 }} />
              <Tooltip content={<Tip />} /><Legend />
              <Bar dataKey="total" name="Sanctioned" fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="grant" name="Grant" fill="#06b6d4" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title">Recent Alerts</div>
          <div style={{ maxHeight:240, overflowY:'auto' }}>
            {alerts.length === 0 ? <div className="empty-state"><p>No active alerts</p></div> :
              alerts.slice(0,6).map(a => (
                <div key={a.id} className={`alert-item ${a.type}`} onClick={() => navigate(`/projects/${a.projectId}`)} style={{ cursor:'pointer' }}>
                  <div className={`alert-icon ${a.type}`}><AlertTriangle size={16} /></div>
                  <div className="alert-content"><h4>{a.title}</h4><p>{a.message}</p></div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="stats-grid">
        <div className="stat-card emerald"><div className="stat-icon emerald"><CheckCircle size={20} /></div><div className="stat-value">{completed}</div><div className="stat-label">Completed</div></div>
        <div className="stat-card amber"><div className="stat-icon amber"><Clock size={20} /></div><div className="stat-value">{inProgress}</div><div className="stat-label">In Progress</div></div>
        <div className="stat-card purple"><div className="stat-icon purple"><Building2 size={20} /></div><div className="stat-value">{yetToStart}</div><div className="stat-label">Yet to Start</div></div>
        <div className="stat-card cyan"><div className="stat-icon cyan"><MapPin size={20} /></div><div className="stat-value">{geoTagged}</div><div className="stat-label">Geo-Tagged</div></div>
      </div>
    </div>
  );
}
