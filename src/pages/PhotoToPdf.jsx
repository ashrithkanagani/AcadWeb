import { useState, useRef } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import axios from 'axios'; // <-- ADDED AXIOS

export default function PhotoToPdf() {
  // 1. GET GLOBAL STATE
  const { files, setFiles } = useAppContext();
  
  // Filter out ONLY the folders to show in the destination list
  const availableFolders = files.filter(f => f.type === 'folder');

  // 2. COMPONENT STATE
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageData, setSelectedImageData] = useState(null);
  const [pdfName, setPdfName] = useState('New_Document');
  const [isConverting, setIsConverting] = useState(false);
  const [conversionSuccess, setConversionSuccess] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  // Refs for camera
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  
  // Default to the first available folder if one exists
  const [selectedFolder, setSelectedFolder] = useState(() => availableFolders.length > 0 ? availableFolders[0].name : '');

  // --- NEW HELPER FUNCTION ---
  // This turns your camera's Base64 string back into a physical file for Python!
  const dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[arr.length - 1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
  }

  // 3. HANDLERS
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(file.name);
        setSelectedImageData(event.target.result);
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setPdfName(nameWithoutExt);
        setConversionSuccess(false);
        setIsCameraActive(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (error) {
      alert('Cannot access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsCameraActive(false);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      
      const imageData = canvasRef.current.toDataURL('image/jpeg');
      const timestamp = new Date().toLocaleString('en-US', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/[\/:]/g, '-');
      setSelectedImage('Photo_' + timestamp + '.jpg');
      setSelectedImageData(imageData);
      setPdfName('Photo_' + timestamp);
      stopCamera();
      setConversionSuccess(false);
    }
  };

  // --- UPDATED CONVERT FUNCTION ---
  const handleConvert = async () => {
    if (!selectedImage || !selectedFolder) return;
    
    setIsConverting(true);
    setConversionSuccess(false);

    try {
      // Get the logged-in user
      const username = localStorage.getItem("username");
      if (!username) {
        alert("Please log in to save files to the cloud.");
        setIsConverting(false);
        return;
      }

      // 1. Prepare the physical file
      const fileExtension = selectedImage.substring(selectedImage.lastIndexOf('.')) || '.jpg';
      const fullFilename = pdfName + fileExtension;
      const physicalFile = dataURLtoFile(selectedImageData, fullFilename);

      // 2. Package it up for FastAPI
      const formData = new FormData();
      formData.append("username", username);
      formData.append("file", physicalFile);

      // 3. Send to MongoDB via Python
      const response = await axios.post("http://localhost:8000/photos/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      // 4. Update your local React UI state so the folder system still works visually
      const targetFolder = availableFolders.find(f => f.name === selectedFolder);
      const targetFolderId = targetFolder ? targetFolder.id : 'root';
      
      const newFile = {
        id: response.data.id, // Use the real ID from MongoDB
        type: 'file',
        icon: '🖼️',
        name: fullFilename,
        parentId: targetFolderId,
        meta: (selectedImageData.length / 1024).toFixed(1) + ' KB',
        url: selectedImageData, 
        imageData: selectedImageData 
      };
      
      setFiles([...files, newFile]);
      
      setIsConverting(false);
      setConversionSuccess(true);
      
      setTimeout(() => {
        setSelectedImage(null);
        setSelectedImageData(null);
        setPdfName('New_Document');
        setConversionSuccess(false);
      }, 3000);

    } catch (error) {
      console.error("Error saving photo to cloud:", error);
      alert("Failed to upload. Is your Python server running?");
      setIsConverting(false);
    }
  };

  // 4. RENDER UI
  return (
    <div className="page active">
      {/* Top Bar */}
      <div className="page-topbar">
        <div className="page-title-group">
          <div className="page-eyebrow">Feature 4</div>
          <div className="page-title">Photo Upload</div>
        </div>
      </div>

      <div className="two-col">
        {/* LEFT COLUMN: Upload & Destination */}
        <div>
          {/* Step 1: Upload */}
          <div className="section-header" style={{ marginBottom: '12px' }}>
            <div className="section-title">1. Upload / Capture Image</div>
          </div>
          
          {!isCameraActive ? (
            <div 
              className="tt-upload-zone" 
              style={{ padding: '36px 20px', marginBottom: '20px', borderColor: selectedImage ? 'var(--mint)' : '' }}
            >
              <div style={{ fontSize: '2.2rem' }}>{selectedImage ? '✅' : '📷'}</div>
              <div style={{ fontWeight: '700', fontSize: '0.92rem' }}>
                {selectedImage ? selectedImage : 'Drop image or capture'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {selectedImage ? 'Image ready for conversion' : 'Lab work, handwritten notes, handouts'}
              </div>
              {!selectedImage && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button 
                    className="btn btn-outline" 
                    onClick={() => document.getElementById('image-upload').click()}
                  >
                    📁 Browse Files
                  </button>
                  <button 
                    className="btn btn-outline" 
                    onClick={startCamera}
                  >
                    📸 Camera Access
                  </button>
                </div>
              )}
              <input 
                id="image-upload" 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={handleImageSelect}
              />
            </div>
          ) : (
            <div style={{ marginBottom: '20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              <video 
                ref={videoRef}
                autoPlay
                playsInline
                style={{ width: '100%', height: '300px', display: 'block', objectFit: 'cover', backgroundColor: '#000' }}
              />
              <div style={{ display: 'flex', gap: '10px', padding: '16px', justifyContent: 'center' }}>
                <button 
                  className="btn btn-primary" 
                  onClick={takePhoto}
                >
                  📸 Take Photo
                </button>
                <button 
                  className="btn btn-outline" 
                  onClick={stopCamera}
                >
                  ✕ Cancel
                </button>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Step 2: Destination Folder */}
          <div className="section-header" style={{ marginBottom: '12px' }}>
            <div className="section-title">2. Select Destination Folder</div>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              
              {/* Render dynamic folders */}
              {availableFolders.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>
                  No folders exist. Go to <strong>Cloud Files</strong> to create one.
                </div>
              ) : (
                availableFolders.map((folder) => {
                  const isSelected = selectedFolder === folder.name;
                  return (
                    <div 
                      key={folder.id}
                      onClick={() => setSelectedFolder(folder.name)}
                      style={{
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        padding: '8px 12px', 
                        borderRadius: 'var(--radius-xs)', 
                        cursor: 'pointer',
                        background: isSelected ? 'var(--surface2)' : 'transparent',
                        border: isSelected ? '1px solid var(--border2)' : '1px solid transparent',
                        color: isSelected ? 'var(--mint)' : 'var(--text-dim)',
                        transition: 'all 0.15s'
                      }}
                    >
                      📂 {folder.name} {isSelected && '← selected'}
                    </div>
                  );
                })
              )}

            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Configuration & Conversion */}
        <div>
          <div className="section-header" style={{ marginBottom: '12px' }}>
            <div className="section-title">3. Configure & Upload</div>
          </div>
          
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', marginBottom: '20px' }}>
            <div className="form-group">
              <label className="form-label">File Name</label>
              <input 
                className="form-input" 
                type="text" 
                value={pdfName}
                onChange={(e) => setPdfName(e.target.value)}
                placeholder="e.g., My_Photo" 
              />
            </div>
            
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              📁 Destination: <strong style={{ color: 'var(--mint)' }}>{selectedFolder || 'None selected'}</strong>
            </div>
            
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={!selectedImage || isConverting || !selectedFolder}
              onClick={handleConvert}
            >
              {isConverting ? 'Uploading...' : conversionSuccess ? '✅ Uploaded Successfully!' : 'Upload to Cloud →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}