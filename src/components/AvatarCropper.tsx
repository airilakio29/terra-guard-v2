import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Check, X, UploadCloud, AlertCircle } from 'lucide-react';

interface AvatarCropperProps {
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
  language?: 'en' | 'bm';
}

export const AvatarCropper: React.FC<AvatarCropperProps> = ({
  onSave,
  onCancel,
  language = 'en',
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const text = {
    en: {
      title: 'Crop & Resize Avatar',
      subtitle: 'Position your photo inside the square guide',
      selectFile: 'Choose Image File',
      supportedTypes: 'Supports JPEG, PNG, or WebP up to 5MB',
      zoom: 'Zoom',
      reset: 'Center',
      apply: 'Apply & Save (256x256)',
      cancel: 'Cancel',
      processing: 'Compressing...',
      errType: 'Invalid file format. Please select a JPEG, PNG, or WebP image.',
      errSize: 'Image is too large. Maximum file size is 5MB.',
      dragHint: 'Drag to adjust position • Scroll or use slider to zoom',
    },
    bm: {
      title: 'Potong & Saizkan Avatar',
      subtitle: 'Laraskan foto anda di dalam bingkai segiempat panduan',
      selectFile: 'Pilih Fail Imej',
      supportedTypes: 'Menyokong JPEG, PNG, atau WebP hingga 5MB',
      zoom: 'Zum',
      reset: 'Pusatkan',
      apply: 'Guna & Simpan (256x256)',
      cancel: 'Batal',
      processing: 'Memampatkan...',
      errType: 'Format fail tidak sah. Sila pilih imej JPEG, PNG, atau WebP.',
      errSize: 'Saiz fail terlalu besar. Had maksimum ialah 5MB.',
      dragHint: 'Seret untuk ubah kedudukan • Guna peluncur untuk zum',
    },
  }[language];

  // Handle file selection and validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate mime type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError(text.errType);
      return;
    }

    // Validate size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(text.errSize);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  // Drag pan handlers (Mouse & Touch)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageSrc) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!imageSrc || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPan({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  // Crop to 256x256 circular canvas
  const handleCropAndSave = () => {
    if (!imageRef.current || !viewportRef.current) return;
    setIsProcessing(true);

    try {
      const img = imageRef.current;
      const targetSize = 256;
      const canvas = document.createElement('canvas');
      canvas.width = targetSize;
      canvas.height = targetSize;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas 2D context unavailable');
      }

      // Smooth rendering quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Square clip mask for clean sharp avatar
      ctx.beginPath();
      ctx.rect(0, 0, targetSize, targetSize);
      ctx.closePath();
      ctx.clip();

      // Compute display ratios
      const viewportSize = 220; // 220px guide circle
      const scaleFactor = targetSize / viewportSize;

      // Base fitted dimensions of image inside viewport
      const naturalW = img.naturalWidth;
      const naturalH = img.naturalHeight;
      const aspect = naturalW / naturalH;

      let drawW: number;
      let drawH: number;

      if (aspect > 1) {
        drawH = viewportSize * zoom;
        drawW = drawH * aspect;
      } else {
        drawW = viewportSize * zoom;
        drawH = drawW / aspect;
      }

      // Center offset + pan
      const centerX = (viewportSize - drawW) / 2 + pan.x;
      const centerY = (viewportSize - drawH) / 2 + pan.y;

      // Draw onto 256x256 target canvas
      ctx.drawImage(
        img,
        centerX * scaleFactor,
        centerY * scaleFactor,
        drawW * scaleFactor,
        drawH * scaleFactor
      );

      // Export compressed WebP (or JPEG fallback)
      let compressedDataUrl = canvas.toDataURL('image/webp', 0.88);
      if (!compressedDataUrl.startsWith('data:image/webp')) {
        compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
      }

      onSave(compressedDataUrl);
    } catch (err) {
      console.error('[AvatarCropper] Export error:', err);
      setError('Failed to process image. Please try another photo.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="cropper-modal-overlay">
      <div className="cropper-modal-card">
        {/* Header */}
        <div className="cropper-modal-header">
          <div>
            <h3 className="cropper-modal-title">{text.title}</h3>
            <p className="cropper-modal-subtitle">{text.subtitle}</p>
          </div>
          <button className="cropper-close-btn" onClick={onCancel} aria-label={text.cancel}>
            <X size={18} />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="cropper-error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Viewport / Drag Area */}
        <div className="cropper-viewport-container">
          {!imageSrc ? (
            <div 
              className="cropper-upload-placeholder"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud size={44} color="var(--brand-primary)" />
              <button type="button" className="btn-secondary" style={{ marginTop: '8px' }}>
                {text.selectFile}
              </button>
              <span className="cropper-hint-text">{text.supportedTypes}</span>
            </div>
          ) : (
            <div
              ref={viewportRef}
              className="cropper-interactive-stage"
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              {/* Image being cropped */}
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Avatar preview"
                className="cropper-target-img"
                draggable={false}
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                }}
              />

              {/* Circular Overlay Mask */}
              <div className="cropper-circular-mask" />
            </div>
          )}
        </div>

        {/* Drag Hint */}
        {imageSrc && (
          <p className="cropper-drag-hint">{text.dragHint}</p>
        )}

        {/* Controls (Zoom & Reset) */}
        {imageSrc && (
          <div className="cropper-controls-bar">
            <div className="cropper-zoom-group">
              <button
                type="button"
                className="cropper-icon-btn"
                onClick={() => setZoom(prev => Math.max(1, prev - 0.2))}
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={e => setZoom(parseFloat(e.target.value))}
                className="cropper-slider"
                aria-label={text.zoom}
              />
              <button
                type="button"
                className="cropper-icon-btn"
                onClick={() => setZoom(prev => Math.min(3, prev + 0.2))}
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
            </div>

            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px' }}
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
            >
              <RotateCcw size={13} style={{ marginRight: '4px' }} />
              {text.reset}
            </button>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* Modal Actions */}
        <div className="cropper-modal-actions">
          {imageSrc && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              style={{ marginRight: 'auto' }}
            >
              {text.selectFile}
            </button>
          )}

          <button type="button" className="btn-secondary" onClick={onCancel} disabled={isProcessing}>
            {text.cancel}
          </button>

          {imageSrc && (
            <button
              type="button"
              className="btn-primary"
              onClick={handleCropAndSave}
              disabled={isProcessing}
            >
              <Check size={16} style={{ marginRight: '6px' }} />
              {isProcessing ? text.processing : text.apply}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
