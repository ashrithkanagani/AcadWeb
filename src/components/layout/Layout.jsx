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
          {/* UPDATED: Replaced text 'A' with a fully adaptive image element */}
          <div className="logo-mark" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img 
              src="/acad1.png" 
              alt="AcadWeb Logo" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>
          <div className="logo-name">Acad<span>Web</span></div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">Navigation</div>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon" style={{ display: 'inline-flex', width: '20px', height: '20px', overflow: 'hidden' }}>
              <img src="/Dashboard.webp" alt="Timetable" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </span>
            Dashboard
          </NavLink>
          
          <div className="sidebar-section-label">Features</div>
          
          {/* 1. AI Timetable */}
          <NavLink to="/timetable" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon" style={{ display: 'inline-flex', width: '20px', height: '20px', overflow: 'hidden' }}>
              <img src="/TimeTable.webp" alt="Timetable" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </span> 
            AI Timetable
          </NavLink>
          
          {/* 2. Assignments */}
          <NavLink to="/assignments" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon" style={{ display: 'inline-flex', width: '20px', height: '20px', overflow: 'hidden' }}>
              <img src="/assignment.webp" alt="Assignments" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </span> 
            Assignments
            {/* DYNAMIC BADGE: Only show if greater than 0 */}
            {activeAssignments > 0 && <span className="nav-badge">{activeAssignments}</span>}
          </NavLink>
          
          {/* 3. Cloud Files */}
          <NavLink to="/files" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon" style={{ display: 'inline-flex', width: '20px', height: '20px', overflow: 'hidden' }}>
              <img src="/cloudfiles.webp" alt="Cloud Files" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </span> 
            Cloud Files
          </NavLink>
          
          {/* 4. Photo Upload */}
          <NavLink to="/pdf" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon" style={{ display: 'inline-flex', width: '20px', height: '20px', overflow: 'hidden' }}>
              <img src="/imageUpload.webp" alt="Photo Upload" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </span> 
            Photo Upload
          </NavLink>
          
          {/* 5. Reminders */}
          <NavLink to="/reminders" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon" style={{ display: 'inline-flex', width: '20px', height: '20px', overflow: 'hidden' }}>
              <img src="/reminder.webp" alt="Reminders" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </span> 
            Reminders
            {/* DYNAMIC BADGE: Only show if greater than 0 */}
            {activeReminders > 0 && <span className="nav-badge">{activeReminders}</span>}
          </NavLink>
          
          {/* 6. Quick Notes */}
          <NavLink to="/notes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon" style={{ display: 'inline-flex', width: '20px', height: '20px', overflow: 'hidden' }}>
              <img src="/notes.webp" alt="Quick Notes" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </span> 
            Quick Notes
          </NavLink>
          
          {/* 7. Settings */}
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