import { useState } from 'react';
import EmptyState from '../components/common/EmptyState';
import { useAppContext } from '../hooks/useAppContext';

export default function Reminders() {
  // 1. STATE MANAGEMENT
  const { reminders, setReminders } = useAppContext();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', date: '', time: '', desc: '', color: 'var(--periwinkle)' });

  // 2. HANDLERS
  const handleDelete = (id) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const newReminder = {
      id: Date.now().toString(),
      name: formData.name,
      date: formData.date ? new Date(formData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Upcoming',
      time: formData.time || 'All Day',
      desc: formData.desc,
      color: formData.color
    };

    setReminders([newReminder, ...reminders]);
    setIsModalOpen(false);
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
                <button className="btn btn-ghost btn-icon">✏️</button>
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

      {/* ADD EVENT MODAL */}
      {isModalOpen && (
        <div className="modal-overlay open" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Add Event / Reminder</div>
            
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
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}