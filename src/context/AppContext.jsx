import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  // 1. AUTH STATE (Persistent via localStorage)
  const [user, setUser] = useState(() => {
    try {
      const savedSession = localStorage.getItem('acadweb_session');
      if (savedSession) {
        const { userObj, timestamp } = JSON.parse(savedSession);
        const now = Date.now();
        const SESSION_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds
        
        if (now - timestamp < SESSION_DURATION) {
          return userObj;
        } else {
          localStorage.removeItem('acadweb_session');
        }
      }
    } catch (error) {
      console.error('Error restoring session:', error);
      localStorage.removeItem('acadweb_session');
    }
    return null;
  });
  
  // 2. LOCAL STATE (For features we haven't moved to the Python backend yet)
  const [notes, setNotes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [files, setFiles] = useState([
    { id: 'default_1', type: 'file', icon: '📄', name: 'Welcome_Guide.pdf', parentId: 'root', meta: '12 KB', url: null }
  ]);

  // Keep files stored per user so uploads survive refresh
  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem(`acadweb_files_${user.id}`);
    if (saved) {
      try {
        setFiles(JSON.parse(saved));
      } catch (error) {
        console.error('Error parsing stored files:', error);
      }
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    try {
      localStorage.setItem(`acadweb_files_${user.id}`, JSON.stringify(files));
    } catch (error) {
      console.error('Error saving files to localStorage:', error);
    }
  }, [files, user]);

  // 3. LOGIN & LOGOUT HANDLERS
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('acadweb_session', JSON.stringify({
      userObj: userData,
      timestamp: Date.now()
    }));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('acadweb_session');
    
    // Clear local data so the next person doesn't see it
    setNotes([]);
    setAssignments([]);
    setReminders([]);
    setFiles([
      { id: 'default_1', type: 'file', icon: '📄', name: 'Welcome_Guide.pdf', parentId: 'root', meta: '12 KB', url: null }
    ]);
  };

  // 4. PROVIDE DATA TO THE APP
  return (
    <AppContext.Provider value={{ 
      // Auth
      user,
      currentUser: user,
      setUser: login,
      setCurrentUser: login,
      logout,
      
      // Temporary Local Data
      notes, setNotes,
      assignments, setAssignments,
      reminders, setReminders,
      files, setFiles
    }}>
      {children}
    </AppContext.Provider>
  );
}

const useAppContext = () => useContext(AppContext);

// Force a combined export at the very end of the file
export { AppContext, useAppContext };