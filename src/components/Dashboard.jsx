import { useProjects } from '../context/ProjectContext';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Building2, IndianRupee, TrendingUp, AlertTriangle, Clock, CheckCircle, MapPin } from 'lucide-react';

const COLORS = ['#10b981','#f59e0b','#64748b','#06b6d4','#8b5cf6','#f43f5e','#3b82f6'];
const fmt = (n) => { if (n >= 10000000) return `₹${(n/10000000).toFixed(2)} Cr`; if (n >= 100000) return `₹${(n/100000).toFixed(2)} L`; return `₹${n.toLocaleString('en-IN')}`; };

export default function Dashboard() {
  const { projects, grants, getAlerts } = useProjects();
  const navigate = useNavigate();
  const alerts = getAlerts();

  const totalSanctioned = projects.reduce((s,p) => s + (p.sanctionedAmount||0), 0);
  const totalExpenditure = projects.reduce((s,p) => s + (p.expenditureIncurred||0), 0);
  const totalGrant = grants.reduce((s,g) => s + (g.amount||0), 0);
  const totalDeductions = projects.reduce((s,p) => s + (p.deductions||0), 0);
  const totalUtilised = totalExpenditure + totalDeductions;
  const totalBalance = totalSanctioned - totalUtilised;
  const completed = projects.filter(p => p.statusOfWork==='completed').length;
  const inProgress = projects.filter(p => p.statusOfWork==='in_progress').length;
  const yetToStart = projects.filter(p => p.statusOfWork==='yet_to_start').length;
  const geoTagged = projects.filter(p => p.latitude && p.longitude && Number(p.latitude)!==0).length;

  const statusData = [
    { name:'Completed', value:completed },
    { name:'In Progress', value:inProgress },
    { name:'Yet to Start', value:yetToStart },
  ].filter(d => d.value > 0);

  const schemeMap = {};
  projects.forEach(p => {
    if (!schemeMap[p.scheme]) schemeMap[p.scheme] = { name:p.scheme, sanctioned:0, expenditure:0, grant:0 };
    schemeMap[p.scheme].sanctioned += p.sanctionedAmount||0;
    schemeMap[p.scheme].expenditure += p.expenditureIncurred||0;
  });
  grants.forEach(g => {
    if (!schemeMap[g.scheme]) schemeMap[g.scheme] = { name:g.scheme, sanctioned:0, expenditure:0, grant:0 };
    schemeMap[g.scheme].grant += g.amount||0;
  });
  const schemeData = Object.values(schemeMap).sort((a,b) => b.sanctioned - a.sanctioned);

  const conMap = {};
  projects.forEach(p => {
    if (!conMap[p.constituency]) conMap[p.constituency] = { name:p.constituency, total:0, count:0 };
    conMap[p.constituency].total += p.sanctionedAmount||0;
    conMap[p.constituency].count++;
  });
  const conData = Object.values(conMap).sort((a,b) => b.total - a.total);

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
      <div className="page-header"><div><h1>Dashboard</h1><p>Overview of all civil engineering projects</p></div></div>

      <div className="stats-grid">
        <div className="stat-card cyan" onClick={() => navigate('/projects')} style={{ cursor:'pointer' }}>
          <div className="stat-icon cyan"><Building2 size={20} /></div>
          <div className="stat-value">{projects.length}</div><div className="stat-label">Total Projects</div>
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
              <Tooltip content={<Tip />} />
              <Bar dataKey="total" name="Sanctioned" fill="#10b981" radius={[4,4,0,0]} />
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
