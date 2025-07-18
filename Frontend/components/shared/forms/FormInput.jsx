// Frontend/components/shared/forms/FormInput.jsx
import React, { useState } from 'react';
import './FormInput.scss';

const FormInput = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  required = false,
  disabled = false,
  readOnly = false,
  icon,
  prefix,
  suffix,
  maxLength,
  autoComplete,
  autoFocus = false,
  showPasswordToggle = true,
  onFocus,
  hint,
  size = 'medium', // 'small' | 'medium' | 'large'
  variant = 'default' // 'default' | 'filled' | 'borderless'
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const inputClasses = `
    form-input__field 
    form-input__field--${size}
    form-input__field--${variant}
    ${error ? 'form-input__field--error' : ''}
    ${icon ? 'form-input__field--with-icon' : ''}
    ${prefix ? 'form-input__field--with-prefix' : ''}
    ${suffix ? 'form-input__field--with-suffix' : ''}
  `.trim();

  return (
    <div className={`form-input ${isFocused ? 'form-input--focused' : ''}`}>
      {label && (
        <label className="form-input__label" htmlFor={name}>
          {label}
          {required && <span className="form-input__required">*</span>}
        </label>
      )}
      
      <div className="form-input__wrapper">
        {icon && <div className="form-input__icon">{icon}</div>}
        {prefix && <div className="form-input__prefix">{prefix}</div>}
        
        <input
          id={name}
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={inputClasses}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={maxLength}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
        />
        
        {suffix && <div className="form-input__suffix">{suffix}</div>}
        
        {type === 'password' && showPasswordToggle && (
          <button
            type="button"
            className="form-input__toggle"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd"/>
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
              </svg>
            )}
          </button>
        )}
      </div>
      
      {hint && !error && <p className="form-input__hint">{hint}</p>}
      {error && <p className="form-input__error">{error}</p>}
    </div>
  );
};

export default FormInput;
