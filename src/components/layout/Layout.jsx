import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../hooks/useAppContext'; // Import context

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Pull data from global state
  const { assignments, reminders, currentUser, logout } = useAppContext();
  const navigate = useNavigate();
  
  // Only count assignments that are NOT completed
  const activeAssignments = Array.isArray(assignments) ? assignments.filter(a => !a.completed).length : 0;
  const activeReminders = Array.isArray(reminders) ? reminders.length : 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => setSidebarOpen(open => !open);

  return (
    <div className={`app-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        {/* Logo section */}
        <div className="sidebar-logo">
          <div className="logo-mark">A</div>
          <div className="logo-name">Acad<span>Web</span></div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">Navigation</div>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">🏠</span> Dashboard
          </NavLink>
          
          <div className="sidebar-section-label">Features</div>
          <NavLink to="/timetable" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">🗓</span> AI Timetable
          </NavLink>
          
          <NavLink to="/assignments" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">✅</span> Assignments
            {/* DYNAMIC BADGE: Only show if greater than 0 */}
            {activeAssignments > 0 && <span className="nav-badge">{activeAssignments}</span>}
          </NavLink>
          
          <NavLink to="/files" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">📁</span> Cloud Files
          </NavLink>
          
          <NavLink to="/pdf" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">📄</span> Photo Upload
          </NavLink>
          
          <NavLink to="/reminders" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">🔔</span> Reminders
            {/* DYNAMIC BADGE: Only show if greater than 0 */}
            {activeReminders > 0 && <span className="nav-badge">{activeReminders}</span>}
          </NavLink>
          
          <NavLink to="/notes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">📝</span> Quick Notes
          </NavLink>
          
          <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">⚙️</span> Settings
          </NavLink>
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <div
            className="user-chip"
            style={{ cursor: 'pointer', position: 'relative' }}
            onClick={handleLogout}
            title="Click to logout"
          >
            <div className="user-avatar">👤</div>
            <div className="user-info">
              <div className="user-name">{currentUser?.username || currentUser?.id || 'User'}</div>
              <div className="user-role" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click to logout</div>
            </div>
          </div>
        </div>
      </aside>
      <button
        type="button"
        className={`sidebar-toggle ${sidebarOpen ? 'open' : 'closed'}`}
        onClick={toggleSidebar}
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {sidebarOpen ? '◀' : '▶'}
      </button>
      <main className="main-content">{children}</main>
    </div>
  );
}