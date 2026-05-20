import { useState } from 'react';
import EmptyState from '../components/common/EmptyState';
import { useAppContext } from '../hooks/useAppContext';

export default function Reminders() {
  // 1. STATE MANAGEMENT
  const { reminders, addReminder, deleteReminder, setReminders } = useAppContext();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [formData, setFormData] = useState({ name: '', date: '', time: '', desc: '', color: 'var(--periwinkle)' });

  // 2. HANDLERS
  const handleDelete = async (id) => {
    await deleteReminder(id);
  };

  // NEW: Populates form state with the chosen reminder data for updating
  const handleEditClick = (reminder) => {
    setEditingReminder(reminder);
    
    // Parse formatted date ("May 25, 2026") back into raw HTML input string format ("2026-05-25")
    let rawDate = '';
    if (reminder.date && reminder.date !== 'Upcoming') {
      const parsedDate = new Date(reminder.date);
      if (!isNaN(parsedDate.getTime())) {
        rawDate = parsedDate.toISOString().substring(0, 10);
      }
    }

    setFormData({
      name: reminder.name,
      date: rawDate,
      time: reminder.time === 'All Day' ? '' : reminder.time,
      desc: reminder.desc || '',
      color: reminder.color
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const formattedDate = formData.date 
      ? new Date(formData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
      : 'Upcoming';

    const payload = {
      name: formData.name,
      date: formattedDate,
      time: formData.time || 'All Day',
      desc: formData.desc,
      color: formData.color
    };

    if (editingReminder) {
      try {
        // Optimistic UI updates or direct PUT call depending on backend design 
        const res = await fetch(`http://localhost:8000/reminders/${editingReminder.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (res.ok) {
          const updated = await res.json();
          setReminders(reminders.map(r => r.id === editingReminder.id ? updated : r));
        } else {
          // Fallback state manipulation logic
          setReminders(reminders.map(r => r.id === editingReminder.id ? { ...r, ...payload } : r));
        }
      } catch (err) {
        setReminders(reminders.map(r => r.id === editingReminder.id ? { ...r, ...payload } : r));
      }
    } else {
      await addReminder(payload);
    }

    setIsModalOpen(false);
    setEditingReminder(null);
    setFormData({ name: '', date: '', time: '', desc: '', color: 'var(--periwinkle)' });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingReminder(null);
    setFormData({ name: '', date: '', time: '', desc: '', color: 'var(--periwinkle)' });
  };

  // 3. RENDER UI
  return (
    <div className="page active">
      {/* Top Bar */}
      <div className="page-topbar">
        <div className="page-title-group">
          <div className="page-eyebrow">Feature 5</div>
          <div className="page-title">Reminder Scheduler</div>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            + Add Event
          </button>
        </div>
      </div>

      {/* Reminders List */}
      {reminders.length === 0 ? (
        <EmptyState 
          icon="⏰" 
          title="No upcoming events" 
          subtitle="Schedule exams, meetings, and important academic activities."
          actionText="Add an event"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="reminder-list">
          {reminders.map((reminder) => (
            <div key={reminder.id} className="reminder-item">
              <div className="reminder-dot" style={{ background: reminder.color }}></div>
              <div className="reminder-body">
                <div className="reminder-name">{reminder.name}</div>
                <div className="reminder-time">📅 {reminder.date} · {reminder.time}</div>
                {reminder.desc && <div className="reminder-desc">{reminder.desc}</div>}
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {/* FIXED: Hooked up onClick event handler parameter dynamically */}
                <button 
                  className="btn btn-ghost btn-icon"
                  onClick={() => handleEditClick(reminder)}
                >
                  ✏️
                </button>
                <button 
                  className="btn btn-ghost btn-icon" 
                  style={{ color: 'var(--coral)' }}
                  onClick={() => handleDelete(reminder.id)}
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD / EDIT EVENT MODAL */}
      {isModalOpen && (
        <div className="modal-overlay open" onClick={handleCloseModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{editingReminder ? 'Edit Event / Reminder' : 'Add Event / Reminder'}</div>
            
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Event Name</label>
                <input 
                  className="form-input" 
                  type="text" 
                  placeholder="e.g., DBMS Internal Exam" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                  autoFocus
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input 
                    className="form-input" 
                    type="date" 
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Time</label>
                  <input 
                    className="form-input" 
                    type="time" 
                    value={formData.time}
                    onChange={e => setFormData({...formData, time: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Priority Color</label>
                <select 
                  className="form-select"
                  value={formData.color}
                  onChange={e => setFormData({...formData, color: e.target.value})}
                >
                  <option value="var(--coral)">Red (Urgent/Exam)</option>
                  <option value="var(--amber)">Yellow (Meeting/Review)</option>
                  <option value="var(--periwinkle)">Purple (Deadline)</option>
                  <option value="var(--mint)">Green (General)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Add notes or location..."
                  value={formData.desc}
                  onChange={e => setFormData({...formData, desc: e.target.value})}
                  rows="3"
                ></textarea>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingReminder ? 'Save Changes' : 'Add Event'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}