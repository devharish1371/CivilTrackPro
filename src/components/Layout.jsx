import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { lockSession } from './SessionGate';
import { LayoutDashboard, FolderKanban, PlusCircle, FileText, Bell, Menu, X, Building2, HardHat, Users, Settings, Cloud, CloudOff, Target, Map, MapPin, Banknote, Tags, LogOut, Sun, Moon, CalendarDays, Columns3, Lock } from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/kanban', icon: Columns3, label: 'Kanban Board' },
  { path: '/projects', icon: FolderKanban, label: 'Projects' },
  { path: '/map', icon: Map, label: 'Global Map' },
  { path: '/timeline', icon: CalendarDays, label: 'Timeline' },
  { path: '/projects/new', icon: PlusCircle, label: 'Add Project' },
  { path: '/grants', icon: Banknote, label: 'Grants' },
  { path: '/schemes', icon: Target, label: 'Schemes' },
  { path: '/categories', icon: Tags, label: 'Categories' },
  { path: '/constituencies', icon: Map, label: 'Constituencies' },
  { path: '/panchayats', icon: MapPin, label: 'Panchayats' },
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
  '/constituencies':'Constituencies', '/panchayats':'Village Panchayats', '/grants':'Grants', '/categories':'Categories',
  '/kanban':'Kanban Board', '/map':'Global Map', '/timeline':'Project Timeline'
};

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('ct-theme') || 'dark');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const loc = useLocation();
  const { getAlerts, firebaseConnected } = useProjects();
  const alertCount = getAlerts().length;
  const title = pageTitles[loc.pathname] || (loc.pathname.includes('/edit') ? 'Edit Project' : 'Project Detail');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Apply theme to <html> element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ct-theme', theme);
  }, [theme]);

  useEffect(() => {
    setOpen(false);
  }, [loc.pathname]);

  useEffect(() => {
    if (window.innerWidth > 1024) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

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
          <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); if(window.confirm('Are you sure you want to exit the app?')) { window.close(); window.location.href = 'about:blank'; } }}>
            <LogOut />
            Exit App
          </a>
          <a href="#" className="nav-item" style={{ color: 'var(--rose)' }} onClick={async (e) => { e.preventDefault(); await lockSession(); window.location.reload(); }}>
            <Lock />
            Lock Session
          </a>
        </nav>
        <div style={{ padding:'14px', borderTop:'1px solid var(--border-subtle)', fontSize:'11px', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:6 }}>
          {firebaseConnected && <><Cloud size={12} style={{ color:'var(--emerald)' }} /> Firebase Synced</>}
          {!firebaseConnected && <>© 2025 CivilTrack Pro</>}
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="hamburger" onClick={() => setOpen(true)}><Menu size={20} /></button>
            <h2>{title}</h2>
          </div>
          <div className="topbar-right">
            {!isOnline && (
              <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, fontWeight:500, color:'var(--rose)', background:'var(--rose-light, rgba(244,63,94,0.1))', padding:'4px 8px', borderRadius:4, marginRight: 8 }}>
                <CloudOff size={14} /> Offline Mode
              </span>
            )}
            {/* Theme toggle */}
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <NavLink to="/alerts" className="topbar-btn"><Bell size={18} />{alertCount > 0 && <span className="badge-dot" />}</NavLink>
          </div>
        </header>
        <div className="page-content fade-in">{children}</div>
      </main>
    </div>
  );
}
