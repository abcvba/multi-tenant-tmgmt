import { LayoutDashboard, CheckSquare, FolderGit2, Users, BarChart3, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--color-mint)' }}></div>
        <span>TaskFlow</span>
      </div>
      
      <nav>
        <Link to="/dashboard" className="nav-item">
          <LayoutDashboard size={20} />
          Dashboard
        </Link>
        <Link to="/tasks" className="nav-item active">
          <CheckSquare size={20} />
          My Tasks
        </Link>
        <Link to="/projects" className="nav-item">
          <FolderGit2 size={20} />
          Projects
        </Link>
        <Link to="/team" className="nav-item">
          <Users size={20} />
          Team
        </Link>
        <Link to="/reports" className="nav-item">
          <BarChart3 size={20} />
          Reports
        </Link>
        <Link to="/settings" className="nav-item">
          <Settings size={20} />
          Settings
        </Link>
      </nav>
    </div>
  );
}
