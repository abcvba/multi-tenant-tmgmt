import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Users, ScrollText, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function AvatarEl({ name, url, size = 'md' }: { name?: string | null; url?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  if (url) return <img src={url} className={`avatar avatar-${size}`} alt={name || ''} />;
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return <div className={`avatar avatar-${size}`}>{initials}</div>;
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">⚡</div>
          <span className="sidebar-logo-text">Tempo</span>
        </div>

        <span className="sidebar-section-label">Workspace</span>
        <nav>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <LayoutDashboard size={17} /> Dashboard
          </NavLink>
          <NavLink to="/tasks" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <CheckSquare size={17} /> Tasks
          </NavLink>
        </nav>

        <span className="sidebar-section-label">Manage</span>
        <nav>
          <NavLink to="/team" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Users size={17} /> Team
          </NavLink>
          {user?.role === 'ADMIN' && (
            <NavLink to="/audit" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <ScrollText size={17} /> Audit Log
            </NavLink>
          )}
          <NavLink to="/settings" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Settings size={17} /> Settings
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={handleLogout} title="Logout">
            <AvatarEl name={user?.name} url={user?.avatarUrl} size="sm" />
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name || user?.email}</div>
              <div className="sidebar-user-role">{user?.role}</div>
            </div>
            <LogOut size={15} style={{ color: 'var(--color-text-dim)', flexShrink: 0 }} />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export { AvatarEl };
