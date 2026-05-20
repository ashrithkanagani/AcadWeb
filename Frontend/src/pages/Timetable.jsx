import { useState, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';

export default function Timetable() {
  const { setTimetableData: setTimetableDataGlobal } = useAppContext();

  const [file, setFile] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [timetableData, setTimetableData] = useState(null); 
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedDay, setSelectedDay] = useState(null);

  const colorForSubject = (subject) => {
    const palette = ['#5b8dee','#ee875b','#5beec5','#ee5b8d','#a05bee','#eec45b','#5baee','#c4ee5b','#5b5bee','#ee5b5b'];
    let hash = 0;
    for (let i = 0; i < (subject||'').length; i++) hash = subject.charCodeAt(i) + ((hash << 5) - hash);
    return palette[Math.abs(hash) % palette.length];
  };

  const subjectIcon = (subject) => {
    const s = (subject||'').toUpperCase();
    if (/LAB|PRAC|P$/.test(s)) return '🧪';
    if (/MATH|CALC|STAT/.test(s)) return '📐';
    if (/PHYS/.test(s)) return '⚛️';
    if (/CHEM/.test(s)) return '⚗️';
    if (/CS|CODE|PROG|SE/.test(s)) return '💻';
    if (/ENG|LANG|LIT/.test(s)) return '📖';
    if (/ECON|FIN|ACC/.test(s)) return '📊';
    return '📚';
  };

  const formatDay = (dayStr) => {
    const up = (dayStr||'').toUpperCase();
    return { short: up.substring(0, 2), full: up.substring(0, 3) };
  };

  // NEW: Formats "L1-BMAT202P-LO" into "BMAT202P (Slot: L1)"
  const cleanSubject = (rawString) => {
    if (!rawString) return '';
    const parts = rawString.split('-');
    if (parts.length >= 2) {
      return `${parts[1]} (Slot: ${parts[0]})`;
    }
    return rawString;
  };

  const { byDay, orderedDays } = useMemo(() => {
    if (!timetableData) return { byDay: {}, orderedDays: [] };
    
    const map = {};
    timetableData.forEach(e => {
      if(!e.day) return;
      const cleanDay = e.day.charAt(0).toUpperCase() + e.day.slice(1).toLowerCase();
      if (!map[cleanDay]) map[cleanDay] = [];
      map[cleanDay].push(e);
    });
    
    const getDayWeight = (dayStr) => {
      const d = dayStr.toUpperCase();
      if (d.startsWith('MO')) return 1; if (d.startsWith('TU')) return 2;
      if (d.startsWith('WE')) return 3; if (d.startsWith('TH')) return 4;
      if (d.startsWith('FR')) return 5; if (d.startsWith('SA')) return 6;
      if (d.startsWith('SU')) return 7; return 99;
    };

    const days = Object.keys(map).sort((a, b) => getDayWeight(a) - getDayWeight(b));
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

      setTimetableDataGlobal(data);
      setTimetableData(data);

      const mondayData = data.find(d => d.day && d.day.toUpperCase().startsWith('MO'));
      const dayToSelect = mondayData ? mondayData.day : (data.length > 0 ? data[0].day : null);
      
      if (dayToSelect) {
        const cleanDay = dayToSelect.charAt(0).toUpperCase() + dayToSelect.slice(1).toLowerCase();
        setSelectedDay(cleanDay);
      }

    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setIsExtracting(false);
    }
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
            <button className="btn btn-primary" onClick={() => {
              setFile(null);
              setTimetableData(null); 
              setErrorMsg('');
              setSelectedDay(null);
            }}>
              ↩ Extract Another
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div style={{ background: 'rgba(249,112,104,0.1)', border: '1px solid var(--coral)', color: 'var(--coral)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '20px' }}>
          ❌ {errorMsg}
        </div>
      )}

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

      {timetableData && (
        <div style={{ maxWidth: '100%' }}>
          <div className="tt-success-banner">
            ✅ Extracted {timetableData.length} periods across {orderedDays.length} days.
          </div>

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

          <div className="periods-wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', marginTop: '20px' }}>
            {currentClasses.length > 0 ? (
              currentClasses.map((c, idx) => (
                <div key={idx} className="period-card" style={{ '--clr': colorForSubject(c.subject), padding: '14px 16px', margin: '0' }}>
                  <div className="period-icon-wrap" style={{ width: '36px', height: '36px', fontSize: '1.1rem' }}>
                    {subjectIcon(c.subject)}
                  </div>
                  <div className="period-body">
                    {/* Applying the format function here! */}
                    <div className="period-code" style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '4px' }}>
                      {cleanSubject(c.subject)}
                    </div>
                    <div className="period-time" style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '8px' }}>
                      {c.time}
                    </div>
                    
                    <div className="period-meta-group" style={{ gap: '12px' }}>
                      {c.teacher && (
                        <div className="period-meta" style={{ fontSize: '0.8rem' }}>
                          <span style={{ color: '#a05bee' }}>👤</span> {c.teacher}
                        </div>
                      )}
                      {c.room && (
                        <div className="period-meta" style={{ fontSize: '0.8rem' }}>
                          <span style={{ color: '#ee5b8d' }}>📍</span> {c.room}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
                No classes on this day.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}