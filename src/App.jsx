import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppContext } from './context/AppContext'; // Updated import path!
import { useEffect } from 'react';

import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Notes from './pages/Notes';
import Timetable from './pages/Timetable';
import Assignments from './pages/Assignments';
import PhotoToPdf from './pages/PhotoToPdf';
import Reminders from './pages/Reminders';
import Settings from './pages/Settings';
import Files from './pages/Files';
import './assets/global.css';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user } = useAppContext(); // Changed from currentUser to user
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
}

// Theme Provider Component
function ThemedRouter({ children }) {
  const { settings } = useAppContext();
  
  useEffect(() => {
    // Apply theme settings to document (with safe fallbacks)
    const darkMode = settings?.appearance?.darkMode ?? true;
    const compactView = settings?.appearance?.compactView ?? false;
    
    if (darkMode) {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
    
    if (compactView) {
      document.documentElement.setAttribute('data-compact', 'true');
    } else {
      document.documentElement.removeAttribute('data-compact');
    }
  }, [settings?.appearance]);

  return children;
}

function App() {
  const { user, logout } = useAppContext(); // Changed from currentUser to user

  // Validate session on app load and after page refresh
  useEffect(() => {
    if (user) {
      try {
        const savedSession = localStorage.getItem('acadweb_session');
        if (!savedSession) {
          logout();
          return;
        }

        const { timestamp } = JSON.parse(savedSession);
        const now = Date.now();
        const SESSION_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

        if (now - timestamp >= SESSION_DURATION) {
          // Session expired, log out
          logout();
        }
      } catch (error) {
        console.error('Error validating session:', error);
        logout();
      }
    }
  }, [user, logout]); // Added dependencies to avoid React warnings

  return (
    <Router>
      <ThemedRouter>
        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to="/" /> : <Login />}
          />

          {/* Root redirects to Dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/notes"
            element={
              <ProtectedRoute>
                <Layout>
                  <Notes />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/timetable"
            element={
              <ProtectedRoute>
                <Layout>
                  <Timetable />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/assignments"
            element={
              <ProtectedRoute>
                <Layout>
                  <Assignments />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/files"
            element={
              <ProtectedRoute>
                <Layout>
                  <Files />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/pdf"
            element={
              <ProtectedRoute>
                <Layout>
                  <PhotoToPdf />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reminders"
            element={
              <ProtectedRoute>
                <Layout>
                  <Reminders />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </ThemedRouter>
    </Router>
  );
}

export default App;