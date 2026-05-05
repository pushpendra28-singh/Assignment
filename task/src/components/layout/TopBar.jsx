import { useLocation } from 'react-router-dom';
import './TopBar.css';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/tasks': 'All Tasks',
  '/team': 'Team Management',
  '/profile': 'Profile',
};

export default function TopBar({ onMenuClick }) {
  const location = useLocation();

  const title =
    Object.entries(PAGE_TITLES).find(([path]) =>
      location.pathname.startsWith(path)
    )?.[1] || 'Nexus';

  return (
    <header className="topbar">
      <button className="topbar-menu-btn" onClick={onMenuClick}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <div className="topbar-title">{title}</div>
      <div className="topbar-right">
        <div className="topbar-badge">
          <span className="topbar-badge-dot" />
          Live
        </div>
      </div>
    </header>
  );
}