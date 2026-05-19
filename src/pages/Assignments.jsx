import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import EmptyState from '../components/common/EmptyState';

export default function Assignments() {
  // 1. STATE MANAGEMENT
  // FIXED: Changed currentUser to user to align perfectly with your AppContext provider file
  const { assignments, setAssignments, user } = useAppContext();
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // Track if we are editing an item
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
    if (user) {
      const userId = user.id || user.username;
      fetch(`http://localhost:8000/assignments/?user_id=${userId}`)
        .then(res => res.json())
        .then(data => {
          setAssignments(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error fetching assignments:", err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [user, setAssignments]);

  // 4. LOGIC & HANDLERS
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
      setAssignments(assignments.map(a => a.id === id ? updatedAssignment : a));
    } catch (error) {
      console.error("Error updating assignment status:", error);
    }
  };

  // FIXED: Added startEditing handler to capture data and populate the form modal safely
  const startEditing = (assign) => {
    setEditingId(assign.id);
    
    // Ensure format matches HTML input requirement type="date" (YYYY-MM-DD)
    let cleanDate = '';
    if (assign.dueDate) {
      const d = new Date(assign.dueDate);
      cleanDate = isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
    }

    setFormData({
      name: assign.title || '',
      subject: assign.subject || 'OS',
      date: cleanDate,
      time: assign.time || '',
      reminder: assign.reminder || '1 day before'
    });
    setIsModalOpen(true);
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

  // FIXED: Consolidated save handler to process both updates and additions dynamically
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !user) return;

    const userId = user.id || user.username;
    const payload = {
      title: formData.name,
      subject: formData.subject,
      dueDate: formData.date,
      time: formData.time,
      completed: editingId ? assignments.find(a => a.id === editingId)?.completed || false : false,
      user_id: userId
    };

    try {
      if (editingId) {
        // Handle existing item edit pipeline update
        const res = await fetch(`http://localhost:8000/assignments/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const updated = await res.json();
        setAssignments(assignments.map(a => a.id === editingId ? updated : a));
      } else {
        // Handle creation pipeline add
        const res = await fetch('http://localhost:8000/assignments/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const savedAssignment = await res.json();
        setAssignments([savedAssignment, ...assignments]);
      }

      // Reset and clear modal properties setup state
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: '', subject: 'OS', date: '', time: '', reminder: '1 day before' });
    } catch (error) {
      console.error("Error saving assignment data:", error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', subject: 'OS', date: '', time: '', reminder: '1 day before' });
  };

  // Safe UI date string parser wrapper helper
  const parseDisplayDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? dateString : d.toLocaleDateString();
  };

  if (loading) {
    return <div className="page active"><div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading records...</div></div>;
  }

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
                    Due {parseDisplayDate(assign.dueDate)} {assign.time ? `· ${assign.time}` : ''}
                  </span>
                </div>
              </div>
              
              {/* Hover Actions */}
              <div className="assign-actions">
                {/* FIXED: Connected pencil icon layout button to startEditing data trigger handler */}
                <button className="btn btn-ghost btn-icon" onClick={() => startEditing(assign)}>✏️</button>
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

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="modal-overlay open" onClick={handleCloseModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            {/* FIXED: Title dynamically shifts layout header text depending on edit status state flag */}
            <div className="modal-title">{editingId ? 'Edit Assignment' : 'Add Assignment'}</div>
            
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Assignment Name</label>
                <input 
                  className="form-input" 
                  type="text" 
                  placeholder="e.g., My Assignment" 
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
                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Save Changes' : 'Add Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}