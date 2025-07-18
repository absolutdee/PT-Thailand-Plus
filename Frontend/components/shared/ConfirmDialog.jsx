// Frontend/components/shared/ConfirmDialog.jsx
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './ConfirmDialog.scss';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'ยืนยันการดำเนินการ',
  message = 'คุณแน่ใจหรือไม่ที่จะดำเนินการนี้?',
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  type = 'warning',
  loading = false,
  showInput = false,
  inputPlaceholder = '',
  inputValidator = null
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setInputValue('');
      setInputError('');
      document.body.style.overflow = 'hidden';
    } else {
      handleClose();
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      onClose();
    }, 300);
  };

  const handleConfirm = async () => {
    if (showInput && inputValidator) {
      const error = inputValidator(inputValue);
      if (error) {
        setInputError(error);
        return;
      }
    }

    const result = showInput ? inputValue : true;
    await onConfirm(result);
    
    if (!loading) {
      handleClose();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      handleClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && !loading) {
      handleClose();
    }
  };

  useEffect(() => {
    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isVisible, loading]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return (
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" fill="#fee2e2"/>
            <path d="M24 16V24M24 32H24.01M44 24C44 35.0457 35.0457 44 24 44C12.9543 44 4 35.0457 4 24C4 12.9543 12.9543 4 24 4C35.0457 4 44 12.9543 44 24Z" stroke="#dc3545" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'success':
        return (
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" fill="#d1fae5"/>
            <path d="M32 18L20 30L14 24" stroke="#28a745" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'info':
        return (
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" fill="#dbeafe"/>
            <path d="M24 20V28M24 16H24.01M44 24C44 35.0457 35.0457 44 24 44C12.9543 44 4 35.0457 4 24C4 12.9543 12.9543 4 24 4C35.0457 4 44 12.9543 44 24Z" stroke="#17a2b8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      default:
        return (
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" fill="#fef3c7"/>
            <path d="M24 16V24M24 32H24.01" stroke="#ffc107" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
    }
  };

  const dialogContent = (
    <div 
      className={`confirm-dialog-backdrop ${isClosing ? 'confirm-dialog-backdrop--closing' : ''}`}
      onClick={handleBackdropClick}
    >
      <div className={`confirm-dialog ${isClosing ? 'confirm-dialog--closing' : ''}`}>
        <div className="confirm-dialog__icon">
          {getIcon()}
        </div>

        <h2 className="confirm-dialog__title">{title}</h2>
        <p className="confirm-dialog__message">{message}</p>

        {showInput && (
          <div className="confirm-dialog__input-wrapper">
            <input
              type="text"
              className={`confirm-dialog__input ${inputError ? 'confirm-dialog__input--error' : ''}`}
              placeholder={inputPlaceholder}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setInputError('');
              }}
              autoFocus
            />
            {inputError && (
              <span className="confirm-dialog__error">{inputError}</span>
            )}
          </div>
        )}

        <div className="confirm-dialog__actions">
          <button
            className="btn btn-outline-secondary"
            onClick={handleClose}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            className={`btn btn-${type === 'danger' ? 'danger' : 'primary'}`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm mr-2" />
                กำลังดำเนินการ...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
};

// useConfirmDialog Hook
export const useConfirmDialog = () => {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    config: {}
  });

  const showConfirm = (config) => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        config: {
          ...config,
          onConfirm: async (value) => {
            if (config.onConfirm) {
              await config.onConfirm(value);
            }
            resolve(value);
          },
          onClose: () => {
            setDialogState({ isOpen: false, config: {} });
            resolve(false);
          }
        }
      });
    });
  };

  const confirm = {
    show: showConfirm,
    danger: (config) => showConfirm({ ...config, type: 'danger' }),
    warning: (config) => showConfirm({ ...config, type: 'warning' }),
    info: (config) => showConfirm({ ...config, type: 'info' }),
    success: (config) => showConfirm({ ...config, type: 'success' }),
    input: (config) => showConfirm({ ...config, showInput: true })
  };

  return {
    dialogProps: {
      isOpen: dialogState.isOpen,
      ...dialogState.config
    },
    confirm
  };
};

export default ConfirmDialog;
