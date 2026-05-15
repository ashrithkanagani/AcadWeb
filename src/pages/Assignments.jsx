import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import EmptyState from '../components/common/EmptyState';

export default function Assignments() {
  // 1. STATE MANAGEMENT
  const { assignments, setAssignments, currentUser } = useAppContext();
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', subject: 'OS', date: '', time: '', reminder: '1 day before' });

  // 2. TAG COLORS MAPPING
  const tagMapping = {
    'OS': 'tag-os',
    'DBMS': 'tag-dbms',
    'AI': 'tag-ai',
    'Maths': 'tag-math',
    'DSA': 'tag-cs',
    'Other': 'tag-other'
  };

  // 3. FETCH ASSIGNMENTS FROM BACKEND ON LOAD
  useEffect(() => {
    if (currentUser) {
      fetch(`http://localhost:8000/assignments/?user_id=${currentUser.id}`)
        .then(res => res.json())
        .then(data => {
          setAssignments(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error fetching assignments:", err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  // 3. LOGIC & HANDLERS
  const toggleAssignment = async (id) => {
    const assignment = assignments.find(a => a.id === id);
    if (!assignment) return;

    const updatedAssignment = { ...assignment, completed: !assignment.completed };

    try {
      await fetch(`http://localhost:8000/assignments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAssignment)
      });
      setAssignments(assignments.map(a => 
        a.id === id ? updatedAssignment : a
      ));
    } catch (error) {
      console.error("Error updating assignment:", error);
    }
  };

  const deleteAssignment = async (id) => {
    try {
      await fetch(`http://localhost:8000/assignments/${id}`, {
        method: 'DELETE'
      });
      setAssignments(assignments.filter(a => a.id !== id));
    } catch (error) {
      console.error("Error deleting assignment:", error);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const payload = {
      title: formData.name,
      subject: formData.subject,
      dueDate: formData.date,
      time: formData.time,
      completed: false,
      user_id: currentUser.id
    };

    try {
      const res = await fetch('http://localhost:8000/assignments/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const savedAssignment = await res.json();
      setAssignments([savedAssignment, ...assignments]);
      setIsModalOpen(false);
      setFormData({ name: '', subject: 'OS', date: '', time: '', reminder: '1 day before' });
    } catch (error) {
      console.error("Error saving assignment:", error);
    }
  };

  // 4. RENDER UI
  return (
    <div className="page active">
      {/* Top Bar */}
      <div className="page-topbar">
        <div className="page-title-group">
          <div className="page-eyebrow">Feature 2</div>
          <div className="page-title">Assignment Tracker</div>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            + Add Assignment
          </button>
        </div>
      </div>

      {/* List Area */}
      {assignments.length === 0 ? (
        <EmptyState 
          icon="📌" 
          title="No assignments yet" 
          subtitle="Track your deadlines and set custom reminders here."
          actionText="Add your first assignment"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="assignment-list">
          {assignments.map((assign) => (
            <div key={assign.id} className={`assignment-item ${assign.completed ? 'completed' : ''}`}>
              
              {/* Custom Checkbox */}
              <div 
                className="assign-checkbox" 
                onClick={() => toggleAssignment(assign.id)}
                style={assign.completed ? { background: 'var(--mint)', borderColor: 'var(--mint)', color: '#0b0d12' } : {}}
              >
                {assign.completed ? '✓' : ''}
              </div>
              
              {/* Assignment Details */}
              <div className="assign-body">
                <div className="assign-name">{assign.title}</div>
                <div className="assign-meta">
                  <span className={`assign-subject ${tagMapping[assign.subject] || 'tag-other'}`}>
                    {assign.subject}
                  </span>
                  <span className={`assign-due ${assign.completed ? 'completed' : 'pending'}`}>
                    Due {new Date(assign.dueDate).toLocaleDateString()} {assign.time ? `· ${assign.time}` : ''}
                  </span>
                </div>
              </div>
              
              {/* Hover Actions */}
              <div className="assign-actions">
                <button className="btn btn-ghost btn-icon">✏️</button>
                <button 
                  className="btn btn-ghost btn-icon" 
                  style={{ color: 'var(--coral)' }}
                  onClick={() => deleteAssignment(assign.id)}
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="modal-overlay open" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Add Assignment</div>
            
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Assignment Name</label>
                <input 
                  className="form-input" 
                  type="text" 
                  placeholder="e.g., OS Lab Report — Unit 3" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                  autoFocus
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <select 
                    className="form-select"
                    value={formData.subject}
                    onChange={e => setFormData({...formData, subject: e.target.value})}
                  >
                    <option value="OS">Operating Systems</option>
                    <option value="DBMS">DBMS</option>
                    <option value="AI">AI & ML</option>
                    <option value="Maths">Mathematics III</option>
                    <option value="DSA">Data Structures</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Deadline Date</label>
                  <input 
                    className="form-input" 
                    type="date" 
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Deadline Time</label>
                  <input 
                    className="form-input" 
                    type="time" 
                    value={formData.time}
                    onChange={e => setFormData({...formData, time: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Remind Me</label>
                  <select 
                    className="form-select"
                    value={formData.reminder}
                    onChange={e => setFormData({...formData, reminder: e.target.value})}
                  >
                    <option value="1 day before">1 day before</option>
                    <option value="3 hours before">3 hours before</option>
                    <option value="30 min before">30 min before</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}