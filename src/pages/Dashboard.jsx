import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../hooks/useAppContext';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { assignments, setAssignments, reminders, files, notes, currentUser } = useAppContext();

  const safeAssignments = Array.isArray(assignments) ? assignments : [];
  const safeReminders = Array.isArray(reminders) ? reminders : [];
  const safeFiles = Array.isArray(files) ? files : [];
  const safeNotes = Array.isArray(notes) ? notes : [];

  // Calculate stats
  const totalAssignments = safeAssignments.length;
  const completedAssignments = safeAssignments.filter(a => a.completed).length;
  const pendingAssignments = totalAssignments - completedAssignments;
  const completionPercentage = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

  const totalReminders = safeReminders.length;
  const upcomingReminders = safeReminders.filter(r => new Date(r.date) >= new Date()).length;
  const upcomingRemindersList = safeReminders
    .filter(r => r.date && new Date(r.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 4);

  const totalFiles = safeFiles.length;
  const totalSize = safeFiles.reduce((acc, file) => {
    const size = parseFloat(file.meta) || 0;
    return acc + size;
  }, 0);

  const totalNotes = safeNotes.length;
  const recentNotesCount = safeNotes.filter(note => {
    const noteDate = new Date(note.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return noteDate > weekAgo;
  }).length;

  // Fetch assignments on component mount
  useEffect(() => {
    fetchAssignments();
  }, [currentUser]);

  const fetchAssignments = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`http://localhost:8000/assignments/?user_id=${currentUser.id}`);
      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`Assignments fetch failed: ${res.status} ${res.statusText} - ${errorBody}`);
      }
      const data = await res.json();
      const assignmentsData = Array.isArray(data)
        ? data
        : Array.isArray(data?.assignments)
          ? data.assignments
          : [];
      setAssignments(assignmentsData);
    } catch (err) {
      console.error('Error fetching assignments:', err);
    }
  };

  return (
    <div className="page active">
      {/* Top Bar */}
      <div className="page-topbar">
        <div className="page-title-group">
          <div className="page-eyebrow">Overview</div>
          <div className="page-title">Dashboard</div>
        </div>
        <div className="topbar-actions">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input className="search-input" type="text" placeholder="Search anything…" />
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card" style={{ '--card-accent': 'var(--mint)' }}>
          <div className="stat-icon">✅</div>
          <div className="stat-label">Assignments</div>
          <div className="stat-value" style={{ color: 'var(--mint)' }}>{totalAssignments}</div>
          <div className="stat-sub">{pendingAssignments} pending · {completedAssignments} done</div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${completionPercentage}%` }}></div></div>
        </div>
        <div className="stat-card" style={{ '--card-accent': 'var(--amber)' }}>
          <div className="stat-icon">🔔</div>
          <div className="stat-label">Reminders</div>
          <div className="stat-value" style={{ color: 'var(--amber)' }}>{totalReminders}</div>
          <div className="stat-sub">{upcomingReminders} upcoming today</div>
        </div>
        <div className="stat-card" style={{ '--card-accent': 'var(--periwinkle)' }}>
          <div className="stat-icon">📁</div>
          <div className="stat-label">Cloud Files</div>
          <div className="stat-value" style={{ color: 'var(--periwinkle)' }}>{totalFiles}</div>
          <div className="stat-sub">~{totalSize.toFixed(1)} KB used</div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${Math.min(totalSize / 100 * 10, 100)}%`, background: 'var(--periwinkle)' }}></div></div>
        </div>
        <div className="stat-card" style={{ '--card-accent': 'var(--rose)' }}>
          <div className="stat-icon">📝</div>
          <div className="stat-label">Notes</div>
          <div className="stat-value" style={{ color: 'var(--rose)' }}>{totalNotes}</div>
          <div className="stat-sub">{recentNotesCount} updated recently</div>
        </div>
      </div>

      <div className="section-header">
        <div className="section-title">Feature Modules</div>
      </div>

      {/* Feature Cards Grid */}
      <div className="features-grid">
        <div 
          className="feature-card" 
          style={{ '--card-color': 'var(--mint)', '--card-glow': 'rgba(94,232,176,0.06)', '--card-rgb': '94,232,176' }} 
          onClick={() => navigate('/timetable')}
        >
          <div className="feature-icon-wrap">🤖</div>
          <div>
            <div className="feature-name">Timetable Extractor</div>
            <div className="feature-desc">Upload any timetable image. Gemini AI extracts subjects, rooms & faculty instantly.</div>
          </div>
          <div className="feature-arrow">Open module →</div>
        </div>

        <div 
          className="feature-card" 
          style={{ '--card-color': 'var(--sky)', '--card-glow': 'rgba(91,196,245,0.06)', '--card-rgb': '91,196,245' }} 
          onClick={() => navigate('/assignments')}
        >
          <div className="feature-icon-wrap">📌</div>
          <div>
            <div className="feature-name">Assignment Tracker</div>
            <div className="feature-desc">Track deadlines, set custom reminders, and manage every assignment in one place.</div>
          </div>
          <div className="feature-arrow">Open module →</div>
        </div>

        <div 
          className="feature-card" 
          style={{ '--card-color': 'var(--periwinkle)', '--card-glow': 'rgba(123,142,245,0.06)', '--card-rgb': '123,142,245' }} 
          onClick={() => navigate('/files')}
        >
          <div className="feature-icon-wrap">☁️</div>
          <div>
            <div className="feature-name">Cloud File Manager</div>
            <div className="feature-desc">Nested folder hierarchy with upload, download, rename, and cross-device access.</div>
          </div>
          <div className="feature-arrow">Open module →</div>
        </div>

        <div 
          className="feature-card" 
          style={{ '--card-color': 'var(--coral)', '--card-glow': 'rgba(249,112,104,0.06)', '--card-rgb': '249,112,104' }} 
          onClick={() => navigate('/pdf')}
        >
          <div className="feature-icon-wrap">📷</div>
          <div>
            <div className="feature-name">Photo → PDF Upload</div>
            <div className="feature-desc">Capture handwritten notes or lab sheets, convert to PDF, and save to cloud folders.</div>
          </div>
          <div className="feature-arrow">Open module →</div>
        </div>

        <div 
          className="feature-card" 
          style={{ '--card-color': 'var(--amber)', '--card-glow': 'rgba(245,197,66,0.06)', '--card-rgb': '245,197,66' }} 
          onClick={() => navigate('/reminders')}
        >
          <div className="feature-icon-wrap">⏰</div>
          <div>
            <div className="feature-name">Reminder Scheduler</div>
            <div className="feature-desc">Schedule exams, meetings, and events with browser notification support.</div>
          </div>
          <div className="feature-arrow">Open module →</div>
        </div>

        <div 
          className="feature-card" 
          style={{ '--card-color': 'var(--rose)', '--card-glow': 'rgba(225,107,153,0.06)', '--card-rgb': '225,107,153' }} 
          onClick={() => navigate('/notes')}
        >
          <div className="feature-icon-wrap">🗒</div>
          <div>
            <div className="feature-name">Quick Notes</div>
            <div className="feature-desc">Lightning-fast note capture. Searchable, cloud-synced, organized by topic tags.</div>
          </div>
          <div className="feature-arrow">Open module →</div>
        </div>
      </div>

      {/* Two Column Layout for Recent Activity */}
      <div className="two-col">
        {/* Recent Assignments Column */}
        <div>
          <div className="section-header">
            <div className="section-title">Upcoming Deadlines</div>
            <button className="btn btn-ghost" onClick={() => navigate('/assignments')}>View all →</button>
          </div>
          
          <div className="assignment-list">
            {assignments.filter(a => !a.completed).slice(0, 2).map(assignment => (
              <div key={assignment.id} className="assignment-item">
                <div className="assign-checkbox"></div>
                <div className="assign-body">
                  <div className="assign-name">{assignment.title}</div>
                  <div className="assign-meta">
                    <span className="assign-subject tag-other">{assignment.subject || 'General'}</span>
                    <span className="assign-due urgent">⚠ Due {new Date(assignment.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
            {assignments.filter(a => !a.completed).length === 0 && (
              <div className="empty-state-small">
                <div className="empty-icon">✅</div>
                <div className="empty-text">No upcoming deadlines</div>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Reminders Column */}
        <div>
          <div className="section-header">
            <div className="section-title">Upcoming Reminders</div>
            <button className="btn btn-ghost" onClick={() => navigate('/reminders')}>Manage →</button>
          </div>

          <div className="reminder-list">
            {upcomingRemindersList.length > 0 ? (
              upcomingRemindersList.map(reminder => (
                <div key={reminder.id} className="reminder-item">
                  <div className="reminder-dot" style={{ background: reminder.color }}></div>
                  <div className="reminder-body">
                    <div className="reminder-name">{reminder.name}</div>
                    <div className="reminder-time">{reminder.date} · {reminder.time}</div>
                    {reminder.desc && <div className="reminder-desc">{reminder.desc}</div>}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state-small">
                <div className="empty-icon">🔔</div>
                <div className="empty-text">No upcoming reminders</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
//             </div>
//           </div>
//         </div>
//       </div>
      
//     </div>
//   );
// }
//           <div className="feature-icon-wrap">☁️</div>
//           <div>
//             <div className="feature-name">Cloud File Manager</div>
//             <div className="feature-desc">Nested folder hierarchy with upload, download, rename, and cross-device access.</div>
//           </div>
//           <div className="feature-arrow">Open module →</div>
//         </div>

//         <div className="feature-card" style={{ '--card-color': 'var(--coral)', '--card-glow': 'rgba(249,112,104,0.06)', '--card-rgb': '249,112,104' }} onClick={() => navigate('/pdf')}>
//           <div className="feature-icon-wrap">📷</div>
//           <div>
//             <div className="feature-name">Photo → PDF Upload</div>
//             <div className="feature-desc">Capture handwritten notes or lab sheets, convert to PDF, and save to cloud folders.</div>
//           </div>
//           <div className="feature-arrow">Open module →</div>
//         </div>

//         <div className="feature-card" style={{ '--card-color': 'var(--amber)', '--card-glow': 'rgba(245,197,66,0.06)', '--card-rgb': '245,197,66' }} onClick={() => navigate('/reminders')}>
//           <div className="feature-icon-wrap">⏰</div>
//           <div>
//             <div className="feature-name">Reminder Scheduler</div>
//             <div className="feature-desc">Schedule exams, meetings, and events with browser notification support.</div>
//           </div>
//           <div className="feature-arrow">Open module →</div>
//         </div>

//         <div className="feature-card" style={{ '--card-color': 'var(--rose)', '--card-glow': 'rgba(225,107,153,0.06)', '--card-rgb': '225,107,153' }} onClick={() => navigate('/notes')}>
//           <div className="feature-icon-wrap">🗒</div>
//           <div>
//             <div className="feature-name">Quick Notes</div>
//             <div className="feature-desc">Lightning-fast note capture. Searchable, cloud-synced, organized by topic tags.</div>
//           </div>
//           <div className="feature-arrow">Open module →</div>
//         </div>
//       </div>

//       {/* Two Column Layout for Recent Activity */}
//       <div className="two-col">
//         {/* DYNAMIC Recent Assignments Column */}
//         <div>
//           <div className="section-header">
//             <div className="section-title">Upcoming Deadlines</div>
//             <button className="btn btn-ghost" onClick={() => navigate('/assignments')}>View all →</button>
//           </div>
          
//           <div className="assignment-list">
//             {upcomingAssignments.length === 0 ? (
//               <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border)' }}>
//                 No pending assignments. You're all caught up!
//               </div>
//             ) : (
//               upcomingAssignments.map(assign => (
//                 <div key={assign.id} className="assignment-item">
//                   <div className="assign-checkbox"></div>
//                   <div className="assign-body">
//                     <div className="assign-name">{assign.name}</div>
//                     <div className="assign-meta">
//                       <span className={`assign-subject ${assignTagMapping[assign.tagKey] || 'tag-other'}`}>
//                         {assign.subject}
//                       </span>
//                       <span className={`assign-due ${assign.dueClass}`}>
//                         {assign.dueText}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//         </div>

//         {/* DYNAMIC Recent Notes Column */}
//         <div>
//           <div className="section-header">
//             <div className="section-title">Recent Notes</div>
//             <button className="btn btn-ghost" onClick={() => navigate('/notes')}>View all →</button>
//           </div>
          
//           <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
//             {recentNotes.length === 0 ? (
//               <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border)' }}>
//                 No notes found. Create one in the Quick Notes module.
//               </div>
//             ) : (
//               recentNotes.map(note => {
//                 const styleProps = noteTagColors[note.tag] || noteTagColors['Other'];
//                 return (
//                   <div key={note.id} className="note-card" style={{ '--note-color': styleProps.color, minHeight: 'auto', cursor: 'default', transform: 'none' }}>
//                     <div className="note-title">{note.title}</div>
//                     <div className="note-body">{note.body}</div>
//                     <div className="note-footer">
//                       <span className="note-date">{note.date}</span>
//                       <span className={`note-tag ${styleProps.class}`}>{note.tag}</span>
//                     </div>
//                   </div>
//                 );
//               })
//             )}
//           </div>
//         </div>
//       </div>
      
//     </div>
//   );
// }