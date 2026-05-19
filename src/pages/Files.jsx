import { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';

export default function Files() {
  const { user, files, setFiles } = useAppContext();
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: 'root', name: 'My Files' }]);
  const [isUploading, setIsUploading] = useState(false);

  const currentFolderId = breadcrumbs[breadcrumbs.length - 1].id;
  const currentViewItems = files.filter(item => item.parentId === currentFolderId);

  // --- 1. UPLOAD FILE (Uses FormData for Cloudinary) ---
  const handleRealUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setIsUploading(true); // Show loading UI

    try {
      if (user) {
        const username = user.username ?? user.id;
        
        // PACK THE TRUCK: We must use FormData here, NOT JSON!
        const formData = new FormData();
        formData.append("username", username);
        formData.append("parentId", currentFolderId);
        formData.append("file", uploadedFile); 

        // SEND THE TRUCK (No headers needed, browser handles FormData automatically)
        const res = await fetch('http://localhost:8000/files/', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const saved = await res.json();
          
          const normalized = {
            id: saved.id,
            type: saved.file_type?.includes('image') ? 'image' : 'file',
            icon: '📄',
            name: saved.filename,
            parentId: saved.parentId ?? currentFolderId,
            meta: saved.file_size,
            url: saved.url // The permanent Cloudinary link!
          };

          setFiles(prev => [...prev, normalized]);
        } else {
          console.error('Upload rejected by server:', await res.text());
          alert("Upload failed. Check Python terminal for errors.");
        }
      }
    } catch (err) {
      console.error('Error while uploading:', err);
    } finally {
      setIsUploading(false);
      e.target.value = null; 
    }
  };

  const handleItemClick = (item) => {
    if (item.type === 'folder') {
      setBreadcrumbs([...breadcrumbs, { id: item.id, name: item.name }]);
    } else if (item.url) {
      window.open(item.url, '_blank'); 
    }
  };

  const navigateBreadcrumb = (index) => {
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    setFiles(files.filter(item => item.id !== id));

    try {
      await fetch(`http://localhost:8000/files/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  // --- 2. CREATE FOLDER (Uses JSON, hits the /folder route) ---
  const handleNewFolder = async () => {
      const folderName = prompt('Enter folder name:');
      if (!folderName || !folderName.trim()) return;

      const newFolder = {
        id: Date.now().toString(),
        type: 'folder',
        icon: '📂',
        name: folderName.trim(),
        parentId: currentFolderId,
        meta: 'Folder'
      };

      setFiles(prev => [...prev, newFolder]);

      if (!user) return;

      try {
        const res = await fetch('http://localhost:8000/files/folder', {  
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: user.username ?? user.id,
            type: 'folder',
            name: folderName.trim(),
            parentId: currentFolderId,
          }),
        });

        if (res.ok) {
          const saved = await res.json();
          const normalized = {
            id: saved.id,
            type: saved.type ?? 'folder',
            icon: '📂',
            name: saved.name,
            parentId: saved.parentId ?? currentFolderId,
            meta: 'Folder',
            url: saved.url ?? null
          };
          setFiles(prev => [normalized, ...prev.filter(item => item.id !== newFolder.id)]);
        } else {
          console.error('Failed to persist folder', await res.text());
        }
      } catch (err) {
        console.error('Error saving folder:', err);
    }
  };

  return (
    <div className="page active">
      <div className="page-topbar">
        <div className="page-title-group">
          <div className="page-eyebrow">Cloud Storage</div>
          <div className="page-title">Files</div>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-secondary" onClick={handleNewFolder}>
            📁 New Folder
          </button>
        </div>
      </div>

      <div className="breadcrumb-nav">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="breadcrumb-item"
              onClick={() => navigateBreadcrumb(index)}
              style={{
                background: index === breadcrumbs.length - 1 ? 'var(--surface)' : 'transparent',
                color: index === breadcrumbs.length - 1 ? 'var(--text)' : 'var(--text-muted)',
                border: index === breadcrumbs.length - 1 ? '1px solid var(--border)' : 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: index === breadcrumbs.length - 1 ? '600' : '500',
                transition: 'all 0.2s'
              }}
            >
              {crumb.name}
            </button>
            {index < breadcrumbs.length - 1 && <span style={{ color: 'var(--text-muted)' }}>›</span>}
          </div>
        ))}
      </div>
      
      <div className="file-grid">
        {currentViewItems.map(item => (
          <div key={item.id} className="file-item" style={{ position: 'relative' }} onClick={() => handleItemClick(item)}>
            <button className="btn-ghost" style={{ position: 'absolute', top: '6px', right: '6px', padding: '4px', color: 'var(--coral)', fontSize: '0.8rem' }} onClick={(e) => handleDelete(item.id, e)}>🗑</button>
            <div className="file-icon">{item.type === 'folder' ? '📂' : item.icon}</div>
            <div className="file-name">{item.name}</div>
            <div className="file-meta">{item.meta}</div>
          </div>
        ))}

        <div className="file-item" style={{ borderStyle: 'dashed', color: 'var(--text-muted)', justifyContent: 'center', cursor: isUploading ? 'not-allowed' : 'pointer' }} onClick={() => !isUploading && document.getElementById('real-file-upload').click()}>
          <div style={{ fontSize: '1.5rem' }}>{isUploading ? '⏳' : '+'}</div>
          <div className="file-name" style={{ color: 'var(--text-muted)' }}>
            {isUploading ? 'Uploading...' : 'Upload file'}
          </div>
          <input id="real-file-upload" type="file" style={{ display: 'none' }} onChange={handleRealUpload} disabled={isUploading} />
        </div>
      </div>
    </div>
  );
}