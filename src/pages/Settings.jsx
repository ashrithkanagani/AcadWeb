import { useAppContext } from '../hooks/useAppContext';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { settings, updateSettings, logout } = useAppContext();
  const navigate = useNavigate();

  // Deconstruct blocks with structured object safety fallbacks
  const {
    appearance = { darkMode: true, compactView: false },
    notifications = { browserNotifs: true, assignmentReminders: true },
    profile = { name: 'User', email: 'user@university.edu' }
  } = settings || {};

  const handleToggleAppearance = (key) => {
    updateSettings('appearance', {
      ...appearance,
      [key]: !appearance[key]
    });
  };

  const handleToggleNotifications = (key) => {
    updateSettings('notifications', {
      ...notifications,
      [key]: !notifications[key]
    });
  };

  const handleProfileChange = (field, value) => {
    updateSettings('profile', {
      ...profile,
      [field]: value
    });
  };

  const handleSaveChanges = () => {
    alert('Profile updated successfully!');
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="page active">
      {/* Top Bar */}
      <div className="page-topbar">
        <div className="page-title-group">
          <div className="page-eyebrow">Account</div>
          <div className="page-title">Settings</div>
        </div>
      </div>

      {/* Appearance Section */}
      <div className="settings-section">
        <div className="settings-section-title">Appearance</div>
        
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Dark Mode</div>
            <div className="settings-row-desc">Use dark theme across the application</div>
          </div>
          <div 
            className={`toggle ${appearance.darkMode ? 'on' : ''}`} 
            onClick={() => handleToggleAppearance('darkMode')}
          ></div>
        </div>
        
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Compact View</div>
            <div className="settings-row-desc">Reduce padding and card sizes</div>
          </div>
          <div 
            className={`toggle ${appearance.compactView ? 'on' : ''}`} 
            onClick={() => handleToggleAppearance('compactView')}
          ></div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="settings-section">
        <div className="settings-section-title">Notifications</div>
        
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Browser Notifications</div>
            <div className="settings-row-desc">Show desktop alerts for reminders and deadlines</div>
          </div>
          <div 
            className={`toggle ${notifications.browserNotifs ? 'on' : ''}`} 
            onClick={() => handleToggleNotifications('browserNotifs')}
          ></div>
        </div>
        
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Assignment Reminders</div>
            <div className="settings-row-desc">Get notified before assignment deadlines</div>
          </div>
          <div 
            className={`toggle ${notifications.assignmentReminders ? 'on' : ''}`} 
            onClick={() => handleToggleNotifications('assignmentReminders')}
          ></div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="settings-section">
        <div className="settings-section-title">Profile</div>
        
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Name</div>
          </div>
          <div>
            <input 
              className="form-input" 
              type="text" 
              value={profile.name} 
              onChange={(e) => handleProfileChange('name', e.target.value)}
              style={{ width: '200px' }} 
            />
          </div>
        </div>
        
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Email</div>
          </div>
          <div>
            <input 
              className="form-input" 
              type="email" 
              value={profile.email} 
              onChange={(e) => handleProfileChange('email', e.target.value)}
              style={{ width: '260px' }} 
            />
          </div>
        </div>
        
        <div style={{ marginTop: '16px' }}>
          <button className="btn btn-primary" onClick={handleSaveChanges}>
            Save Changes
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="settings-section" style={{ borderColor: 'rgba(249,112,104,0.2)' }}>
        <div className="settings-section-title" style={{ color: 'var(--coral)' }}>Danger Zone</div>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Sign Out</div>
            <div className="settings-row-desc">Log out of your account on this device</div>
          </div>
          <button className="btn btn-danger" onClick={handleSignOut}>Sign Out</button>
        </div>
      </div>
    </div>
  );
}