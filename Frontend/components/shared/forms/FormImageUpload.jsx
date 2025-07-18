
// Frontend/components/shared/forms/FormImageUpload.jsx
import React, { useState, useRef } from 'react';
import { formatFileSize } from '../../../utils/helpers';
import './FormImageUpload.scss';

const FormImageUpload = ({
  label,
  name,
  value = [],
  onChange,
  error,
  multiple = false,
  maxFiles = 1,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
  required = false,
  disabled = false,
  hint,
  preview = true,
  aspectRatio,
  onUpload,
  onRemove
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = async (files) => {
    const validFiles = files.filter(file => {
      if (!acceptedFormats.includes(file.type)) {
        alert(`ไฟล์ ${file.name} ไม่ใช่รูปแบบที่รองรับ`);
        return false;
      }
      if (file.size > maxFileSize) {
        alert(`ไฟล์ ${file.name} มีขนาดใหญ่เกิน ${formatFileSize(maxFileSize)}`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const currentFiles = Array.isArray(value) ? value : [];
    const remainingSlots = maxFiles - currentFiles.length;
    const filesToUpload = validFiles.slice(0, remainingSlots);

    if (onUpload) {
      // Custom upload handler
      for (const file of filesToUpload) {
        const fileId = Date.now() + Math.random();
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
        
        try {
          const uploadedFile = await onUpload(file, (progress) => {
            setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
          });
          
          const newFiles = multiple 
            ? [...currentFiles, uploadedFile]
            : [uploadedFile];
          
          onChange({ target: { name, value: newFiles } });
        } catch (error) {
          console.error('Upload failed:', error);
          alert(`อัพโหลดไฟล์ ${file.name} ไม่สำเร็จ`);
        } finally {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fileId];
            return newProgress;
          });
        }
      }
    } else {
      // Local file handling
      const newFiles = [];
      for (const file of filesToUpload) {
        const reader = new FileReader();
        const result = await new Promise((resolve) => {
          reader.onload = (e) => resolve({
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            type: file.type,
            url: e.target.result,
            file: file
          });
          reader.readAsDataURL(file);
        });
        newFiles.push(result);
      }
      
      const updatedFiles = multiple 
        ? [...currentFiles, ...newFiles]
        : newFiles;
      
      onChange({ target: { name, value: updatedFiles } });
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = async (fileId) => {
    if (onRemove) {
      await onRemove(fileId);
    }
    
    const newFiles = value.filter(file => file.id !== fileId);
    onChange({ target: { name, value: newFiles } });
  };

  const currentFiles = Array.isArray(value) ? value : [];
  const canUploadMore = currentFiles.length < maxFiles;

  return (
    <div className="form-image-upload">
      {label && (
        <label className="form-image-upload__label">
          {label}
          {required && <span className="form-image-upload__required">*</span>}
        </label>
      )}

      {canUploadMore && (
        <div
          className={`form-image-upload__dropzone ${isDragging ? 'form-image-upload__dropzone--dragging' : ''} ${disabled ? 'form-image-upload__dropzone--disabled' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            multiple={multiple && maxFiles > 1}
            onChange={handleFileSelect}
            disabled={disabled}
            style={{ display: 'none' }}
          />

          <div className="form-image-upload__dropzone-content">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M24 32V16M24 16L18 22M24 16L30 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M40 28V36C40 38.2091 38.2091 40 36 40H12C9.79086 40 8 38.2091 8 36V28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            
            <p className="form-image-upload__dropzone-text">
              {isDragging ? 'วางไฟล์ที่นี่' : 'คลิกหรือลากไฟล์มาที่นี่'}
            </p>
            
            <p className="form-image-upload__dropzone-hint">
              {acceptedFormats.map(format => format.split('/')[1].toUpperCase()).join(', ')}
              {' • '}
              ไม่เกิน {formatFileSize(maxFileSize)}
              {maxFiles > 1 && ` • สูงสุด ${maxFiles} ไฟล์`}
            </p>
          </div>
        </div>
      )}

      {currentFiles.length > 0 && preview && (
        <div className="form-image-upload__preview-grid">
          {currentFiles.map((file) => (
            <div key={file.id} className="form-image-upload__preview-item">
              <div 
                className="form-image-upload__preview-image"
                style={{ aspectRatio: aspectRatio }}
              >
                <img src={file.url} alt={file.name} />
                
                {uploadProgress[file.id] !== undefined && (
                  <div className="form-image-upload__progress">
                    <div 
                      className="form-image-upload__progress-bar"
                      style={{ width: `${uploadProgress[file.id]}%` }}
                    />
                  </div>
                )}
              </div>
              
              <div className="form-image-upload__preview-info">
                <p className="form-image-upload__preview-name">{file.name}</p>
                <p className="form-image-upload__preview-size">{formatFileSize(file.size)}</p>
              </div>
              
              {!disabled && (
                <button
                  type="button"
                  className="form-image-upload__preview-remove"
                  onClick={() => handleRemove(file.id)}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {hint && !error && <p className="form-image-upload__hint">{hint}</p>}
      {error && <p className="form-image-upload__error">{error}</p>}
    </div>
  );
};

export default FormImageUpload;
