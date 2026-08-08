import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  ShieldAlert, 
  LayoutDashboard, 
  Database, 
  Bot, 
  PlayCircle, 
  History, 
  Settings,
  Lock
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <ShieldAlert size={22} />
        </div>
        <div>
          <div>Governance Auditor</div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
            DataHub AI Safety
          </div>
        </div>
      </div>

      <nav className="nav-group">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/datasets" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Database size={18} />
          <span>Datasets Catalog</span>
        </NavLink>

        <NavLink to="/agents" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Bot size={18} />
          <span>Agent Registry</span>
        </NavLink>

        <NavLink to="/run-audit" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <PlayCircle size={18} />
          <span>Run Audit</span>
        </NavLink>

        <NavLink to="/audit-log" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <History size={18} />
          <span>Audit Trail Log</span>
        </NavLink>

        <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Settings size={18} />
          <span>Settings & OAuth</span>
        </NavLink>
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <Lock size={14} />
          <span>Apache 2.0 Licensed</span>
        </div>
      </div>
    </aside>
  );
};
