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

        const SESSION_DURATION =20 * 60 * 1000; // 10 minutes in milliseconds

       

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



  // --- NEW: Persistent Timetable State ---

  const [timetableData, setTimetableData] = useState(() => {

    try {

      const savedTimetable = localStorage.getItem('acadweb_timetable');

      return savedTimetable ? JSON.parse(savedTimetable) : null;

    } catch (error) {

      return null;

    }

  });

  const [timetableSelectedDay, setTimetableSelectedDay] = useState(null);



  // --- NEW: Global Settings State ---

  const [globalSettings, setGlobalSettings] = useState({

    appearance: { darkMode: true, compactView: false },

    notifications: { browserNotifs: true, assignmentReminders: true },

    profile: { name: 'Ashrith', email: 'user@university.edu' }

  });



  const updateGlobalSettings = (section, newSectionData) => {

    setGlobalSettings(prev => ({

      ...prev,

      [section]: newSectionData

    }));

  };



  // Auto-save timetable to browser memory whenever it changes

  useEffect(() => {

    if (timetableData) {

      localStorage.setItem('acadweb_timetable', JSON.stringify(timetableData));

    } else {

      localStorage.removeItem('acadweb_timetable');

    }

  }, [timetableData]);





  // Load files from backend on user change (fixes refresh not showing uploads)

  useEffect(() => {

    const fetchFiles = async () => {

      if (!user) return;

      try {

        const username = user.username ?? user.id;

        const res = await fetch(`http://localhost:8000/files/${encodeURIComponent(username)}`);

        if (!res.ok) {

          const text = await res.text();

          throw new Error(`Files fetch failed: ${res.status} ${res.statusText} - ${text}`);

        }

        const data = await res.json();

        // Backend returns metadata; adapt to UI model

        const normalized = (Array.isArray(data) ? data : []).map((f) => ({

          id: f.id,

          type: f.type ?? 'file',

          icon: f.type === 'folder' ? '📂' : '📄',

          name: f.name ?? f.filename ?? 'Untitled',

          parentId: f.parentId ?? 'root',

          meta: f.type === 'folder' ? 'Folder' : f.file_size ? `${f.file_size}` : f.file_type ?? '',

          url: f.url ?? f.cloudinary_url ?? null,

        }));

        setFiles(normalized.length ? normalized : [

          { id: 'default_1', type: 'file', icon: '📄', name: 'Welcome_Guide.pdf', parentId: 'root', meta: '12 KB', url: null }

        ]);

      } catch (error) {

        console.error('Error fetching files from backend:', error);

      }

    };



    fetchFiles();

  }, [user]);



  // Load reminders from backend when user changes

  useEffect(() => {

    const fetchReminders = async () => {

      if (!user) {

        setReminders([]);

        return;

      }



      try {

        const username = user.username ?? user.id;

        const res = await fetch(`http://localhost:8000/reminders/${encodeURIComponent(username)}`);

        if (!res.ok) {

          console.error('Failed to load reminders', await res.text());

          return;

        }

        const data = await res.json();

        setReminders(Array.isArray(data) ? data : []);

      } catch (err) {

        console.error('Error fetching reminders:', err);

        setReminders([]);

      }

    };



    fetchReminders();

  }, [user]);



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



  // Add a reminder via backend and update state

  const addReminder = async (reminder) => {

    console.log('addReminder called', reminder, 'user:', user);

    if (!user) {

      // still update locally if no user

      const temp = { id: Date.now().toString(), ...reminder };

      setReminders(prev => [temp, ...prev]);

      return temp;

    }



    try {

      const username = user.username ?? user.id;

      const payload = { username, ...reminder };

      const res = await fetch('http://localhost:8000/reminders/', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify(payload),

      });

      if (!res.ok) {

        const text = await res.text();

        throw new Error(`Add reminder failed: ${res.status} ${text}`);

      }

      const saved = await res.json();

      setReminders(prev => [saved, ...prev]);

      return saved;

    } catch (err) {

      console.error('Error adding reminder:', err);

      return null;

    }

  };



  // Delete a reminder via backend and update state

  const deleteReminder = async (id) => {

    if (!id) return;

    if (!user) {

      setReminders(prev => prev.filter(r => r.id !== id));

      return true;

    }



    try {

      const res = await fetch(`http://localhost:8000/reminders/${encodeURIComponent(id)}`, { method: 'DELETE' });

      if (!res.ok) {

        const text = await res.text();

        throw new Error(`Delete failed: ${res.status} ${text}`);

      }

      setReminders(prev => prev.filter(r => r.id !== id));

      return true;

    } catch (err) {

      console.error('Error deleting reminder:', err);

      return false;

    }

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

      addReminder,

      deleteReminder,

      files, setFiles,



      timetableData, setTimetableData,

      timetableSelectedDay, setTimetableSelectedDay,



      // Settings Global Wire

      settings: globalSettings,

      updateSettings: updateGlobalSettings

    }}>

      {children}

    </AppContext.Provider>

  );

}



const useAppContext = () => useContext(AppContext);



export { AppContext, useAppContext };