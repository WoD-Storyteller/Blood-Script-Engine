import { useState, useRef } from "react";

interface PortraitUploaderProps {
  currentPortrait?: string;
  onUploadComplete: (objectPath: string) => void;
  disabled?: boolean;
}

export function PortraitUploader({
  currentPortrait,
  onUploadComplete,
  disabled = false,
}: PortraitUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setError(null);
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      const urlResponse = await fetch('/api/companion/portrait/request-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type,
        }),
      });

      if (!urlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadURL, objectPath } = await urlResponse.json();

      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      onUploadComplete(objectPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const displayImage = preview || (currentPortrait ? `/objects${currentPortrait}` : null);

  return (
    <div className="portrait-uploader">
      <div 
        className="portrait-container"
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '8px',
          border: '2px dashed rgba(139, 0, 0, 0.5)',
          backgroundColor: 'rgba(20, 20, 25, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled || isUploading ? 'not-allowed' : 'pointer',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {displayImage ? (
          <img 
            src={displayImage} 
            alt="Character portrait"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div style={{ textAlign: 'center', color: '#888', fontSize: '12px', padding: '8px' }}>
            {isUploading ? 'Uploading...' : 'Click to upload portrait'}
          </div>
        )}
        
        {isUploading && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '12px',
          }}>
            Uploading...
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        style={{ display: 'none' }}
      />

      {error && (
        <div style={{ color: '#ff4444', fontSize: '11px', marginTop: '4px' }}>
          {error}
        </div>
      )}
    </div>
  );
}
