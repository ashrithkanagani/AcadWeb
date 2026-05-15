import { useState, useMemo } from 'react';

export default function Timetable() {
  const [file, setFile] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [timetableData, setTimetableData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [selectedDay, setSelectedDay] = useState(null);

  // Helper functions
  const colorForSubject = (subject) => {
    const palette = ['#5b8dee','#ee875b','#5beec5','#ee5b8d','#a05bee','#eec45b','#5baee','#c4ee5b','#5b5bee','#ee5b5b'];
    let hash = 0;
    for (let i = 0; i < subject.length; i++) hash = subject.charCodeAt(i) + ((hash << 5) - hash);
    return palette[Math.abs(hash) % palette.length];
  };

  const subjectIcon = (subject) => {
    const s = subject.toUpperCase();
    if (/LAB|PRAC|P$/.test(s)) return '🧪';
    if (/MATH|CALC|STAT/.test(s)) return '📐';
    if (/PHYS/.test(s)) return '⚛️';
    if (/CHEM/.test(s)) return '⚗️';
    if (/CS|CODE|PROG|SE/.test(s)) return '💻';
    if (/ENG|LANG|LIT/.test(s)) return '📖';
    if (/ECON|FIN|ACC/.test(s)) return '📊';
    return '📚';
  };

  // Helper to format "Monday" into { short: "MO", full: "MON" }
  const formatDay = (dayStr) => {
    const up = dayStr.toUpperCase();
    return {
      short: up.substring(0, 2),
      full: up.substring(0, 3)
    };
  };

  // Group data by day
  const { byDay, orderedDays } = useMemo(() => {
    if (!timetableData) return { byDay: {}, orderedDays: [] };
    
    const map = {};
    timetableData.forEach(e => {
      if (!map[e.day]) map[e.day] = [];
      map[e.day].push(e);
    });
    
    const DAY_ORDER = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
    const days = Object.keys(map).sort((a, b) => {
      const ia = DAY_ORDER.indexOf(a), ib = DAY_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });

    return { byDay: map, orderedDays: days };
  }, [timetableData]);

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    
    setFile(uploadedFile);
    setIsExtracting(true);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const res = await fetch('http://127.0.0.1:8000/process-timetable', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Server error processing image.');

      setTimetableData(data);
      // Prefer Friday, otherwise use the first day
      const fridayData = data.find(d => d.day && d.day.toLowerCase() === 'friday');
      const dayToSelect = fridayData ? fridayData.day : (data.length > 0 ? data[0].day : null);
      if (dayToSelect) setSelectedDay(dayToSelect);

    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleStartOver = () => {
    setFile(null);
    setTimetableData(null);
    setErrorMsg('');
    setSelectedDay(null);
  };

  const currentClasses = selectedDay && byDay[selectedDay] ? byDay[selectedDay] : [];

  return (
    <div className="page active">
      <div className="page-topbar">
        <div className="page-title-group">
          <div className="page-eyebrow">Feature 1</div>
          <div className="page-title">Timetable Extractor</div>
        </div>
        <div className="topbar-actions">
          {timetableData && (
            <button className="btn btn-primary" onClick={handleStartOver}>↩ Start Over</button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div style={{ background: 'rgba(249,112,104,0.1)', border: '1px solid var(--coral)', color: 'var(--coral)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '20px' }}>
          ❌ {errorMsg}
        </div>
      )}

      {/* Upload View */}
      {!timetableData && (
        <div className="tt-upload-zone" onClick={() => document.getElementById('tt-upload').click()} style={{ padding: '60px 20px', maxWidth: '600px', margin: '0 auto' }}>
          <div className="tt-upload-icon" style={{ fontSize: '3rem', marginBottom: '10px' }}>{isExtracting ? '⏳' : '📂'}</div>
          <div className="tt-upload-title">{isExtracting ? 'Analyzing with Gemini AI...' : 'Drop your timetable image here'}</div>
          <div className="tt-upload-sub">{isExtracting ? 'Extracting subjects, times, and faculty' : 'JPG, PNG, WebP supported'}</div>
          {!isExtracting && (
            <button className="btn btn-primary" style={{ marginTop: '20px' }}>Choose File</button>
          )}
          <input id="tt-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} disabled={isExtracting} />
        </div>
      )}

      {/* Extracted Data View */}
      {timetableData && (
        <div style={{ maxWidth: '800px' }}>
          
          {/* Success Banner */}
          <div className="tt-success-banner">
            ✅ Extracted {timetableData.length} periods across {orderedDays.length} days.
          </div>

          {/* Day Selector Strip */}
          <div className="day-strip">
            {orderedDays.map(day => {
              const { short, full } = formatDay(day);
              return (
                <button 
                  key={day} 
                  className={`day-pill ${selectedDay === day ? 'active' : ''}`}
                  onClick={() => setSelectedDay(day)}
                >
                  <span className="day-short">{short}</span>
                  <span className="day-full">{full}</span>
                </button>
              );
            })}
          </div>

          {/* Period Cards for Selected Day */}
          <div className="periods-wrap">
            {currentClasses.length > 0 ? (
              currentClasses.map((c, idx) => (
                <div key={idx} className="period-card" style={{ '--clr': colorForSubject(c.subject) }}>
                  <div className="period-icon-wrap">{subjectIcon(c.subject)}</div>
                  <div className="period-body">
                    <div className="period-code">{c.subject}</div>
                    <div className="period-time">{c.time}</div>
                    
                    <div className="period-meta-group">
                      {c.teacher && (
                        <div className="period-meta">
                          <span style={{ color: '#a05bee' }}>👤</span> {c.teacher}
                        </div>
                      )}
                      {c.room && (
                        <div className="period-meta">
                          <span style={{ color: '#ee5b8d' }}>📍</span> {c.room}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="period-chevron">›</div>
                </div>
              ))
            ) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No classes on this day.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}