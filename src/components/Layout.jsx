import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { LayoutDashboard, FolderKanban, PlusCircle, FileText, Bell, Menu, X, Building2, HardHat, Users, Settings, Cloud, Target, Map, Banknote, Tags } from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/projects', icon: FolderKanban, label: 'Projects' },
  { path: '/projects/new', icon: PlusCircle, label: 'Add Project' },
  { path: '/grants', icon: Banknote, label: 'Grants' },
  { path: '/schemes', icon: Target, label: 'Schemes' },
  { path: '/categories', icon: Tags, label: 'Categories' },
  { path: '/constituencies', icon: Map, label: 'Constituencies' },
  { path: '/contractors', icon: HardHat, label: 'Contractors' },
  { path: '/engineers', icon: Users, label: 'Engineers' },
  { path: '/reports', icon: FileText, label: 'Reports' },
  { path: '/alerts', icon: Bell, label: 'Alerts' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

const pageTitles = {
  '/':'Dashboard', '/projects':'Projects', '/projects/new':'Add Project',
  '/reports':'Reports', '/alerts':'Alerts', '/contractors':'Contractors',
  '/engineers':'Engineers', '/settings':'Settings', '/schemes':'Schemes',
  '/constituencies':'Constituencies', '/grants':'Grants', '/categories':'Categories'
};

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const { getAlerts, gsheetConfig } = useProjects();
  const alertCount = getAlerts().length;
  const title = pageTitles[loc.pathname] || (loc.pathname.includes('/edit') ? 'Edit Project' : 'Project Detail');

  return (
    <div className="app-layout">
      <div className={`mobile-overlay ${open ? 'visible' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="logo"><Building2 size={20} /></div>
          <div>
            <h1>CivilTrack Pro</h1>
            <span>Project Management</span>
          </div>
          <button className="hamburger" style={{ marginLeft:'auto', display: open ? 'block' : 'none' }} onClick={() => setOpen(false)}><X size={20} /></button>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} end={item.path==='/'} className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setOpen(false)}>
              <item.icon />
              {item.label}
              {item.label === 'Alerts' && alertCount > 0 && <span className="nav-badge">{alertCount}</span>}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding:'14px', borderTop:'1px solid var(--border-subtle)', fontSize:'11px', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:6 }}>
          {gsheetConfig.connected && <><Cloud size={12} style={{ color:'var(--emerald)' }} /> Sheets Synced</>}
          {!gsheetConfig.connected && <>© 2025 CivilTrack Pro</>}
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="hamburger" onClick={() => setOpen(true)}><Menu size={20} /></button>
            <h2>{title}</h2>
          </div>
          <div className="topbar-right">
            <NavLink to="/alerts" className="topbar-btn"><Bell size={18} />{alertCount > 0 && <span className="badge-dot" />}</NavLink>
          </div>
        </header>
        <div className="page-content fade-in">{children}</div>
      </main>
    </div>
  );
}
