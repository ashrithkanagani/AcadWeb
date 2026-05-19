import { useState, useMemo, useEffect } from 'react';

import EmptyState from '../components/common/EmptyState';

import { useAppContext } from '../hooks/useAppContext';



export default function Notes() {

  // 1. STATE MANAGEMENT

  const { notes, setNotes, currentUser } = useAppContext();

  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);

 

  // Modal & Form State

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editingNote, setEditingNote] = useState(null);

  const [formData, setFormData] = useState({ title: '', body: '', tag: 'Other' });



  const tagColors = {

    'OS': { color: 'var(--mint)', class: 'tag-os' },

    'DBMS': { color: 'var(--rose)', class: 'tag-dbms' },

    'AI': { color: 'var(--periwinkle)', class: 'tag-ai' },

    'Maths': { color: 'var(--amber)', class: 'tag-math' },

    'DSA': { color: 'var(--sky)', class: 'tag-cs' },

    'Other': { color: 'var(--coral)', class: 'tag-other' }

  };



  // 2. FETCH NOTES FROM BACKEND ON LOAD

  useEffect(() => {

    if (currentUser) {

      fetch(`http://localhost:8000/notes/${currentUser.id}`)

        .then(res => res.json())

        .then(data => {

          setNotes(data);

          setLoading(false);

        })

        .catch(err => {

          console.error("Error fetching notes:", err);

          setLoading(false);

        });

    } else {

      setLoading(false);

    }

  }, [currentUser, setNotes]);



  // 3. LOGIC & HANDLERS

  const filteredNotes = useMemo(() => {

    return notes.filter(note =>

      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||

      note.body.toLowerCase().includes(searchQuery.toLowerCase())

    );

  }, [notes, searchQuery]);



  const openModal = (note = null) => {

    if (note) {

      setEditingNote(note);

      // FIXED: Ensures standard fallbacks if note.tag does not match select fields

      const fallbackTag = tagColors[note.tag] ? note.tag : 'Other';

      setFormData({ title: note.title, body: note.body, tag: fallbackTag });

    } else {

      setEditingNote(null);

      setFormData({ title: '', body: '', tag: 'Other' });

    }

    setIsModalOpen(true);

  };



  const closeModal = () => {

    setIsModalOpen(false);

    setEditingNote(null);

    setFormData({ title: '', body: '', tag: 'Other' });

  };



  const handleSave = async (e) => {

    e.preventDefault();

    if (!formData.title.trim()) return;



    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const notePayload = {

      title: formData.title,

      body: formData.body,

      tag: formData.tag,

      date: dateStr,

      user_id: currentUser.id

    };



    try {

      if (editingNote) {

        const res = await fetch(`http://localhost:8000/notes/${editingNote.id}`, {

          method: 'PUT',

          headers: { 'Content-Type': 'application/json' },

          body: JSON.stringify(notePayload)

        });

        const updatedNote = await res.json();

        setNotes(notes.map(n => n.id === editingNote.id ? updatedNote : n));

      } else {

        const res = await fetch('http://localhost:8000/notes/', {

          method: 'POST',

          headers: { 'Content-Type': 'application/json' },

          body: JSON.stringify(notePayload)

        });

        const newNote = await res.json();

        setNotes([newNote, ...notes]);

      }

      closeModal();

    } catch (error) {

      console.error("Error saving note:", error);

    }

  };



  const handleDelete = async (id, e) => {

    e.stopPropagation();

    try {

      await fetch(`http://localhost:8000/notes/${id}`, {

        method: 'DELETE'

      });

      setNotes(notes.filter(n => n.id !== id));

    } catch (error) {

      console.error("Error deleting note:", error);

    }

  };



  return (

    <div className="page active">

      <div className="page-topbar">

        <div className="page-title-group">

          <div className="page-eyebrow">Feature 6</div>

          <div className="page-title">Quick Notes</div>

        </div>

        <div className="topbar-actions">

          <div className="search-wrap">

            <span className="search-icon"></span>


          </div>

          <button className="btn btn-primary" onClick={() => openModal()}>+ New Note</button>

        </div>

      </div>



      {notes.length === 0 && !searchQuery ? (

        <EmptyState

          icon="🗒️"

          title="No notes yet"

          subtitle="Jot down important exam topics, faculty instructions, or quick reminders."

          actionText="Create your first note"

          onAction={() => openModal()}

        />

      ) : (

        <div className="notes-grid">

          {filteredNotes.map(note => {

            const styleProps = tagColors[note.tag] || tagColors['Other'];

           

            return (

              <div

                key={note.id}

                className="note-card"

                style={{ '--note-color': styleProps.color }}

                onClick={() => openModal(note)}

              >

                <div className="note-title">{note.title}</div>

                <div className="note-body">{note.body}</div>

                <div className="note-footer">

                  <span className="note-date">{note.date}</span>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>

                    <span className={`note-tag ${styleProps.class}`}>{note.tag}</span>

                    <button

                      className="btn-ghost"

                      style={{ padding: 0, color: 'var(--coral)', fontSize: '0.85rem', zIndex: 2 }}

                      onClick={(e) => handleDelete(note.id, e)}

                    >

                      🗑

                    </button>

                  </div>

                </div>

              </div>

            );

          })}

        </div>

      )}



      {/* CREATE / EDIT MODAL */}

      {isModalOpen && (

        <div className="modal-overlay open" onClick={closeModal}>

          <div className="modal" onClick={e => e.stopPropagation()}>

            <div className="modal-title">{editingNote ? 'Edit Note' : 'Add New Note'}</div>

           

            <form onSubmit={handleSave}>

              <div className="form-group">

                <label className="form-label">Note Title</label>

                <input

                  className="form-input"

                  type="text"

                  placeholder="e.g., OS Exam Key Topics"

                  value={formData.title}

                  onChange={e => setFormData({...formData, title: e.target.value})}

                  autoFocus

                  required

                />

              </div>



              <div className="form-group">

                <label className="form-label">Subject / Tag</label>

                <select

                  className="form-select"

                  value={formData.tag}

                  onChange={e => setFormData({...formData, tag: e.target.value})}

                >

                  <option value="OS">Operating Systems</option>

                  <option value="DBMS">DBMS</option>

                  <option value="AI">AI & ML</option>

                  <option value="Maths">Mathematics</option>

                  <option value="DSA">Data Structures</option>

                  <option value="Other">Other</option>

                </select>

              </div>



              <div className="form-group">

                <label className="form-label">Note Content</label>

                <textarea

                  className="form-textarea"

                  placeholder="Type your notes here..."

                  value={formData.body}

                  onChange={e => setFormData({...formData, body: e.target.value})}

                  rows="5"

                ></textarea>

              </div>



              <div className="modal-footer">

                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>

                <button type="submit" className="btn btn-primary">{editingNote ? 'Save Changes' : 'Create Note'}</button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );

}