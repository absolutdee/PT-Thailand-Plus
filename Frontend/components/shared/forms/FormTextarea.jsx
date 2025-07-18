
// Frontend/components/shared/forms/FormTextarea.jsx
import React, { useState, useRef, useEffect } from 'react';
import './FormTextarea.scss';

const FormTextarea = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  required = false,
  disabled = false,
  readOnly = false,
  rows = 4,
  maxLength,
  autoResize = false,
  showCounter = false,
  hint,
  size = 'medium',
  variant = 'default',
  onFocus
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (autoResize && textareaRef.current) {
      adjustHeight();
    }
  }, [value, autoResize]);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const handleChange = (e) => {
    onChange(e);
    if (autoResize) {
      adjustHeight();
    }
  };

  const characterCount = value ? value.length : 0;
  const characterLimit = maxLength || 0;

  const textareaClasses = `
    form-textarea__field
    form-textarea__field--${size}
    form-textarea__field--${variant}
    ${error ? 'form-textarea__field--error' : ''}
    ${autoResize ? 'form-textarea__field--auto-resize' : ''}
  `.trim();

  return (
    <div className={`form-textarea ${isFocused ? 'form-textarea--focused' : ''}`}>
      {label && (
        <label className="form-textarea__label" htmlFor={name}>
          {label}
          {required && <span className="form-textarea__required">*</span>}
        </label>
      )}

      <div className="form-textarea__wrapper">
        <textarea
          ref={textareaRef}
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={textareaClasses}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          rows={!autoResize ? rows : undefined}
          maxLength={maxLength}
        />
      </div>

      <div className="form-textarea__footer">
        <div className="form-textarea__footer-left">
          {hint && !error && <p className="form-textarea__hint">{hint}</p>}
          {error && <p className="form-textarea__error">{error}</p>}
        </div>
        
        {showCounter && (
          <div className="form-textarea__counter">
            <span className={characterCount > characterLimit * 0.9 ? 'warning' : ''}>
              {characterCount}
            </span>
            {maxLength && <span>/{characterLimit}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormTextarea;
