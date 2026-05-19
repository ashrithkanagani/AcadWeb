import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../hooks/useAppContext';
import { useEffect, useState, useMemo } from 'react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { assignments, setAssignments, reminders, files, notes, currentUser, timetableData } = useAppContext();

  const safeAssignments = Array.isArray(assignments) ? assignments : [];
  const safeReminders = Array.isArray(reminders) ? reminders : [];
  const safeFiles = Array.isArray(files) ? files : [];
  const safeNotes = Array.isArray(notes) ? notes : [];

  const totalAssignments = safeAssignments.length;
  const completedAssignments = safeAssignments.filter(a => a.completed).length;
  const pendingAssignments = totalAssignments - completedAssignments;
  const completionPercentage = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

  const totalReminders = safeReminders.length;
  const upcomingRemindersList = safeReminders
    .filter(r => r.date && new Date(r.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 4);

  const totalFiles = safeFiles.length;
  const totalSize = safeFiles.reduce((acc, file) => acc + (parseFloat(file.meta) || 0), 0);
  const totalNotes = safeNotes.length;

  const formatDay = (dayStr) => {
    const up = (dayStr||'').toUpperCase();
    return { short: up.substring(0, 2), full: up.substring(0, 3) };
  };

  const cleanSubject = (rawString) => {
    if (!rawString) return '';
    const parts = rawString.split('-');
    if (parts.length >= 2) {
      return `${parts[1]} (Slot: ${parts[0]})`;
    }
    return rawString;
  };

  const { dashboardDays, defaultDay } = useMemo(() => {
    if (!Array.isArray(timetableData) || timetableData.length === 0) return { dashboardDays: [], defaultDay: null };
    
    const map = {};
    timetableData.forEach(c => {
      if(c.day) {
        const clean = c.day.charAt(0).toUpperCase() + c.day.slice(1).toLowerCase();
        map[clean] = true;
      }
    });
    
    const getDayWeight = (d) => {
      const u = d.toUpperCase();
      if (u.startsWith('MO')) return 1; if (u.startsWith('TU')) return 2;
      if (u.startsWith('WE')) return 3; if (u.startsWith('TH')) return 4;
      if (u.startsWith('FR')) return 5; if (u.startsWith('SA')) return 6;
      if (u.startsWith('SU')) return 7; return 99;
    };
    
    const days = Object.keys(map).sort((a, b) => getDayWeight(a) - getDayWeight(b));
    const realToday = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    let current = days.find(d => d.toUpperCase() === realToday.toUpperCase());
    if (!current && days.length > 0) current = days[0]; 
    
    return { dashboardDays: days, defaultDay: current };
  }, [timetableData]);

  const [activeDashboardDay, setActiveDashboardDay] = useState('');

  useEffect(() => {
    if (defaultDay) setActiveDashboardDay(defaultDay);
  }, [defaultDay]);

  const targetClasses = useMemo(() => {
    if (!Array.isArray(timetableData) || !activeDashboardDay) return [];
    return timetableData.filter((c) => {
      if (!c.day) return false;
      const clean = c.day.charAt(0).toUpperCase() + c.day.slice(1).toLowerCase();
      return clean === activeDashboardDay;
    });
  }, [timetableData, activeDashboardDay]);

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!currentUser) return;
      try {
        const res = await fetch(`http://localhost:8000/assignments/?user_id=${currentUser.id}`);
        if (res.ok) {
          const data = await res.json();
          setAssignments(Array.isArray(data) ? data : (Array.isArray(data?.assignments) ? data.assignments : []));
        }
      } catch (err) { console.error('Error fetching assignments:', err); }
    };
    fetchAssignments();
  }, [currentUser, setAssignments]);

  return (
    <div className="page active">
      <div className="page-topbar">
        <div className="page-title-group">
          <div className="page-eyebrow">Overview</div>
          <div className="page-title">Dashboard</div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        {/* 1. Assignments Card */}
        <div 
          className="stat-card" 
          onClick={() => navigate('/assignments')}
          style={{ '--card-accent': 'var(--mint)', cursor: 'pointer', transition: 'transform 0.15s ease' }}
        >
          <div className="stat-icon" style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', opacity: 1, filter: 'none' }}>
            <img src="/assignment.webp" alt="Assignments" style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 1 }} />
          </div>
          <div className="stat-label">Assignments</div>
          <div className="stat-value" style={{ color: 'var(--mint)' }}>{totalAssignments}</div>
          <div className="stat-sub">{pendingAssignments} pending · {completedAssignments} done</div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${completionPercentage}%` }}></div></div>
        </div>

        {/* 2. Reminders Card */}
        <div 
          className="stat-card" 
          onClick={() => navigate('/reminders')}
          style={{ '--card-accent': 'var(--amber)', cursor: 'pointer', transition: 'transform 0.15s ease' }}
        >
          <div className="stat-icon" style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', opacity: 1, filter: 'none' }}>
            <img src="/reminder.webp" alt="Reminders" style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 1 }} />
          </div>
          <div className="stat-label">Reminders</div>
          <div className="stat-value" style={{ color: 'var(--amber)' }}>{totalReminders}</div>
          <div className="stat-sub">{upcomingRemindersList.length} upcoming today</div>
        </div>

        {/* 3. Cloud Files Card */}
        <div 
          className="stat-card" 
          onClick={() => navigate('/files')}
          style={{ '--card-accent': 'var(--periwinkle)', cursor: 'pointer', transition: 'transform 0.15s ease' }}
        >
          <div className="stat-icon" style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', opacity: 1, filter: 'none' }}>
            <img src="/cloudfiles.webp" alt="Cloud Files" style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 1 }} />
          </div>
          <div className="stat-label">Cloud Files</div>
          <div className="stat-value" style={{ color: 'var(--periwinkle)' }}>{totalFiles}</div>
          <div className="stat-sub">~{totalSize.toFixed(1)} KB used</div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${Math.min(totalSize / 100 * 10, 100)}%`, background: 'var(--periwinkle)' }}></div></div>
        </div>

        {/* 4. Notes Card */}
        <div 
          className="stat-card" 
          onClick={() => navigate('/notes')}
          style={{ '--card-accent': 'var(--rose)', cursor: 'pointer', transition: 'transform 0.15s ease' }}
        >
          <div className="stat-icon" style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', opacity: 1, filter: 'none' }}>
            <img src="/notes.webp" alt="Notes" style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 1 }} />
          </div>
          <div className="stat-label">Notes</div>
          <div className="stat-value" style={{ color: 'var(--rose)' }}>{totalNotes}</div>
          <div className="stat-sub">Updated recently</div>
        </div>
      </div>

      <div className="section-header">
        <div className="section-title">Feature Modules</div>
      </div>

      <div className="features-grid">
        {/* 1. Timetable Extractor */}
        <div className="feature-card" style={{ '--card-color': 'var(--mint)', '--card-glow': 'rgba(94,232,176,0.06)', '--card-rgb': '94,232,176' }} onClick={() => navigate('/timetable')}>
          <div className="feature-icon-wrap" style={{ padding: '6px' }}>
            <img src="/TimeTable.webp" alt="Timetable Extractor" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div><div className="feature-name">Timetable Extractor</div><div className="feature-desc">Upload any timetable image. Gemini AI extracts subjects, rooms & faculty instantly.</div></div>
        </div>

        {/* 2. Assignment Tracker */}
        <div className="feature-card" style={{ '--card-color': 'var(--sky)', '--card-glow': 'rgba(91,196,245,0.06)', '--card-rgb': '91,196,245' }} onClick={() => navigate('/assignments')}>
          <div className="feature-icon-wrap" style={{ padding: '6px' }}>
            <img src="/assignment.webp" alt="Assignments" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div><div className="feature-name">Assignment Tracker</div><div className="feature-desc">Track deadlines, set custom reminders, and manage every assignment.</div></div>
        </div>

        {/* 3. Cloud File Manager */}
        <div className="feature-card" style={{ '--card-color': 'var(--periwinkle)', '--card-glow': 'rgba(123,142,245,0.06)', '--card-rgb': '123,142,245' }} onClick={() => navigate('/files')}>
          <div className="feature-icon-wrap" style={{ padding: '6px' }}>
            <img src="/cloudfiles.webp" alt="Cloud Files" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div><div className="feature-name">Cloud File Manager</div><div className="feature-desc">Nested folder hierarchy with upload, download, rename, and cloud access.</div></div>
        </div>

        {/* 4. Photo -> PDF Upload */}
        <div className="feature-card" style={{ '--card-color': 'var(--coral)', '--card-glow': 'rgba(249,112,104,0.06)', '--card-rgb': '249,112,104' }} onClick={() => navigate('/pdf')}>
          <div className="feature-icon-wrap" style={{ padding: '6px' }}>
            <img src="/imageUpload.webp" alt="PDF Upload" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div><div className="feature-name">Photo Upload</div><div className="feature-desc">Capture handwritten notes or lab sheets, convert to PDF, and save to cloud folders.</div></div>
        </div>

        {/* 5. Reminder Scheduler */}
        <div className="feature-card" style={{ '--card-color': 'var(--amber)', '--card-glow': 'rgba(245,197,66,0.06)', '--card-rgb': '245,197,66' }} onClick={() => navigate('/reminders')}>
          <div className="feature-icon-wrap" style={{ padding: '6px' }}>
            <img src="/reminder.webp" alt="Reminders" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div><div className="feature-name">Reminder Scheduler</div><div className="feature-desc">Schedule exams, meetings, and events with notification support.</div></div>
        </div>

        {/* 6. Quick Notes */}
        <div className="feature-card" style={{ '--card-color': 'var(--rose)', '--card-glow': 'rgba(225,107,153,0.06)', '--card-rgb': '225,107,153' }} onClick={() => navigate('/notes')}>
          <div className="feature-icon-wrap" style={{ padding: '6px' }}>
            <img src="/notes.webp" alt="Notes" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div><div className="feature-name">Quick Notes</div><div className="feature-desc">Lightning-fast note capture. Searchable, cloud-synced, organized by topic tags.</div></div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .dash-split { flex-direction: column !important; }
          .dash-doodle-panel { display: none !important; } 
        }

        .premium-update-btn {
          background: var(--btn-bg, rgba(91, 141, 238, 0.08));
          border: 1px solid var(--btn-border, rgba(91, 141, 238, 0.2));
          color: var(--btn-text, #5b8dee);
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 0.88rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .premium-update-btn:hover {
          background: #5b8dee;
          border-color: #5b8dee;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(91, 141, 238, 0.3);
          transform: translateY(-1px);
        }
        .premium-update-btn:active {
          transform: translateY(0px);
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }
      `}</style>

      {/* TIMETABLE DASHBOARD WIDGET */}
      {Array.isArray(timetableData) && timetableData.length > 0 && (
        <div style={{ marginTop: '34px', marginBottom: '30px' }}>
          
          {/* Section Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div className="quick-schedule-title" style={{ fontSize: '1.2rem', fontWeight: '700', letterSpacing: '-0.02em' }}>Quick Schedule</div>
            <button className="premium-update-btn" onClick={() => navigate('/timetable')}>
              <span style={{ fontSize: '0.95rem' }}></span> Update Schedule
            </button>
          </div>

          {/* Days Ribbon Controller */}
          <div className="day-strip" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
            {dashboardDays.map(day => {
              const { short, full } = formatDay(day);
              const isSelected = activeDashboardDay === day;
              return (
                <button 
                  key={day} 
                  className={`day-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => setActiveDashboardDay(day)}
                  style={{
                    background: isSelected ? 'var(--sky, #5b8dee)' : 'var(--surface, #161920)',
                    color: isSelected ? '#ffffff' : 'var(--text-muted, #8a99ad)',
                    border: isSelected ? '1px solid var(--sky, #5b8dee)' : '1px solid var(--border, rgba(255,255,255,0.06))',
                    borderRadius: '12px',
                    padding: '10px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span className="day-short" style={{ fontWeight: '700', fontSize: '1.1rem' }}>{short}</span>
                  <span className="day-full" style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.8 }}>{full}</span>
                </button>
              );
            })}
          </div>

          {/* SPLIT LAYOUT CONTAINER */}
          <div className="dash-split" style={{ display: 'flex', gap: '30px', alignItems: 'stretch' }}>
            
            {/* LEFT SIDE: Premium Adaptive Cards */}
            <div style={{ flex: '1.4', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {(() => {
                const colorForSubject = (s) => {
                  const palette = ['#5b8dee','#ee875b','#5beec5','#ee5b8d','#a05bee','#eec45b','#5baee','#c4ee5b','#5b5bee','#ee5b5b'];
                  let hash = 0; for (let i = 0; i < (s||'').length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
                  return palette[Math.abs(hash) % palette.length];
                };

                const getClassIcon = (slotCode) => {
                  const upperSlot = (slotCode || '').toUpperCase();
                  if (upperSlot.startsWith('L')) {
                    return '/lab.webp';
                  }
                  return '/theory.webp';
                };

                return targetClasses.length > 0 ? (
                  targetClasses.map((c, idx) => {
                    const parsedSubject = c.subject || '';
                    const segmentParts = parsedSubject.split('-');
                    const baseCode = segmentParts.length >= 2 ? segmentParts[1] : parsedSubject;
                    const blockSlot = segmentParts.length >= 2 ? segmentParts[0] : '';

                    return (
                      <div 
                        key={idx} 
                        style={{ 
                          position: 'relative',
                          background: 'var(--surface, #161920)', 
                          border: '1px solid var(--border, rgba(255,255,255,0.06))',
                          borderRadius: '16px',
                          padding: '18px 24px', 
                          margin: '0', 
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '20px',
                          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
                          overflow: 'hidden'
                        }}
                      >
                        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: colorForSubject(c.subject) }} />

                        <div style={{ 
                          width: '56px', 
                          height: '56px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          overflow: 'hidden',
                          flexShrink: 0,
                          background: 'var(--surface2, #1e2330)',
                          borderRadius: '12px' 
                        }}>
                          <img 
                            src={getClassIcon(blockSlot)} 
                            alt="Class Type" 
                            style={{ width: '70%', height: '70%', objectFit: 'contain' }} 
                          />
                        </div>

                        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <span className="period-code" style={{ fontSize: '1.1rem', fontWeight: '600', letterSpacing: '-0.01em' }}>
                              {baseCode}
                            </span>
                            {blockSlot && (
                              <span style={{ 
                                fontSize: '0.75rem', 
                                fontWeight: '600', 
                                padding: '2px 8px', 
                                borderRadius: '6px', 
                                background: 'rgba(91, 141, 238, 0.15)', 
                                color: '#5b8dee' 
                              }}>
                                {blockSlot}
                              </span>
                            )}
                          </div>

                          {/* Time Container using custom /clock.webp asset */}
                          <div className="period-time" style={{ fontSize: '0.88rem', fontWeight: '400', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <img src="/clock.webp" alt="Time" style={{ width: '14px', height: '14px', objectFit: 'contain' }} /> {c.time}
                          </div>
                          
                          <div style={{ display: 'flex', gap: '14px', marginTop: '2px', alignItems: 'center' }}>
                            {c.teacher && (
                              <div className="period-meta" style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ color: '#a05bee' }}>👤</span> {c.teacher}
                              </div>
                            )}
                            {c.room && (
                              <div className="period-meta" style={{ 
                                fontSize: '0.78rem', 
                                color: '#ee5b8d', 
                                background: 'rgba(238, 91, 141, 0.12)',
                                padding: '2px 10px',
                                borderRadius: '6px',
                                fontWeight: '500',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                {/* Location pill container using custom /venue.webp asset */}
                                <img src="/venue.webp" alt="Location" style={{ width: '12px', height: '12px', objectFit: 'contain' }} /> {c.room}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '30px', textAlign: 'center', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    🏝 Free day! No classes scheduled.
                  </div>
                );
              })()}
            </div>

            {/* RIGHT SIDE: FULL POWER HIGH-CONTRAST DOODLE */}
            <div 
              className="dash-doodle-panel" 
              style={{ 
                flex: '0.8', 
                position: 'relative',
                display: 'flex', 
                alignItems: 'stretch', 
                justifyContent: 'center', 
                borderRadius: '12px',
                border: '1px solid var(--border, rgba(255,255,255,0.04))',
                overflow: 'hidden',
                background: 'var(--surface, #161920)'
              }}
            >
              <img 
                src="/doodle.webp" 
                alt="Schedule Illustration" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover', 
                  opacity: 1, 
                  userSelect: 'none',
                  pointerEvents: 'none'
                }} 
              />
            </div>

          </div>
        </div>
      )}

      {/* Two Column Layout (Assignments + Reminders) */}
      <div className="two-col">
        <div>
          <div className="section-header">
            <div className="section-title" style={{ color: 'var(--text-main)' }}>Upcoming Deadlines</div>
            <button className="btn btn-ghost" onClick={() => navigate('/assignments')}>View all →</button>
          </div>
          
          <div className="assignment-list">
            {safeAssignments.filter(a => !a.completed).slice(0, 2).map(a => (
              <div 
                key={a.id} 
                className="assignment-item" 
                onClick={() => navigate('/assignments')}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                <div style={{ width: '32px', height: '32px', flexShrink: 0, overflow: 'hidden' }}>
                  <img src="/assignment.webp" alt="Deadline" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div className="assign-body" style={{ flex: 1 }}>
                  <div className="assign-name" style={{ color: 'var(--text-main)' }}>{a.title}</div>
                  <div className="assign-meta">
                    <span className="assign-subject tag-other">{a.subject || 'General'}</span>
                    <span className="assign-due urgent">⚠ Due {new Date(a.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
            {safeAssignments.filter(a => !a.completed).length === 0 && (
              <div className="empty-state-small"><div className="empty-icon">✅</div><div className="empty-text">No upcoming deadlines</div></div>
            )}
          </div>
        </div>

        <div>
          <div className="section-header">
            <div className="section-title" style={{ color: 'var(--text-main)' }}>Upcoming Reminders</div>
            <button className="btn btn-ghost" onClick={() => navigate('/reminders')}>Manage →</button>
          </div>

          <div className="reminder-list">
            {upcomingRemindersList.length > 0 ? (
              upcomingRemindersList.map(r => (
                <div 
                  key={r.id} 
                  className="reminder-item" 
                  onClick={() => navigate('/reminders')}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                  <div style={{ width: '32px', height: '32px', flexShrink: 0, overflow: 'hidden' }}>
                    <img src="/reminder.webp" alt="Reminder" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <div className="reminder-body" style={{ flex: 1 }}>
                    <div className="reminder-name" style={{ color: 'var(--text-main)' }}>{r.name}</div>
                    <div className="reminder-time" style={{ color: 'var(--text-muted)' }}>{r.date} · {r.time}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state-small"><div className="empty-icon">🔔</div><div className="empty-text">No upcoming reminders</div></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}