import { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';

export default function Files() {
  const { files, setFiles } = useAppContext(); // Using Global State
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: 'root', name: 'My Files' }]);

  const currentFolderId = breadcrumbs[breadcrumbs.length - 1].id;
  const currentViewItems = files.filter(item => item.parentId === currentFolderId);

  // ... (keep openFolder, navigateBreadcrumb, handleNewFolderMock as they were) ...

  const handleRealUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    // Create a temporary URL so you can actually open the file in a new tab!
    const fileUrl = URL.createObjectURL(uploadedFile);

    const newFile = {
      id: Date.now().toString(),
      type: 'file',
      icon: '📄',
      name: uploadedFile.name,
      parentId: currentFolderId,
      meta: (uploadedFile.size / 1024).toFixed(1) + ' KB',
      url: fileUrl // Save the URL to open it later
    };
    setFiles([...files, newFile]);
    
    // Reset the input so you can upload the same file again if needed
    e.target.value = null; 
  };

  const handleItemClick = (item) => {
    if (item.type === 'folder') {
      setBreadcrumbs([...breadcrumbs, { id: item.id, name: item.name }]);
    } else if (item.url) {
      window.open(item.url, '_blank'); // Opens the real file in a new tab!
    }
  };

  const navigateBreadcrumb = (index) => {
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    setFiles(files.filter(item => item.id !== id));
  };

  const handleNewFolder = () => {
    const folderName = prompt('Enter folder name:');
    if (folderName && folderName.trim()) {
      const newFolder = {
        id: Date.now().toString(),
        type: 'folder',
        icon: '📂',
        name: folderName.trim(),
        parentId: currentFolderId,
        meta: 'Folder'
      };
      setFiles([...files, newFolder]);
    }
  };

  return (
    <div className="page active">
      {/* Top Bar */}
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

      {/* Breadcrumb Navigation */}
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
      
      {/* Update the Upload Box in the Grid to trigger the hidden input */}
      <div className="file-grid">
        {currentViewItems.map(item => (
          <div key={item.id} className="file-item" style={{ position: 'relative' }} onClick={() => handleItemClick(item)}>
            <button className="btn-ghost" style={{ position: 'absolute', top: '6px', right: '6px', padding: '4px', color: 'var(--coral)', fontSize: '0.8rem' }} onClick={(e) => handleDelete(item.id, e)}>🗑</button>
            <div className="file-icon">{item.type === 'folder' ? '📂' : item.icon}</div>
            <div className="file-name">{item.name}</div>
            <div className="file-meta">{item.meta}</div>
          </div>
        ))}

        <div className="file-item" style={{ borderStyle: 'dashed', color: 'var(--text-muted)', justifyContent: 'center' }} onClick={() => document.getElementById('real-file-upload').click()}>
          <div style={{ fontSize: '1.5rem' }}>+</div>
          <div className="file-name" style={{ color: 'var(--text-muted)' }}>Upload file</div>
          <input id="real-file-upload" type="file" style={{ display: 'none' }} onChange={handleRealUpload} />
        </div>
      </div>
    </div>
  );
}