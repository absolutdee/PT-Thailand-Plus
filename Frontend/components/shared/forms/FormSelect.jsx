
// Frontend/components/shared/forms/FormSelect.jsx
import React, { useState, useRef, useEffect } from 'react';
import './FormSelect.scss';

const FormSelect = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  options = [],
  error,
  placeholder = 'เลือก...',
  required = false,
  disabled = false,
  multiple = false,
  searchable = false,
  clearable = false,
  size = 'medium',
  variant = 'default',
  icon,
  hint,
  optionRenderer,
  valueRenderer
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const selectRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = searchable
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setSearchTerm('');
      setFocusedIndex(-1);
    }
  };

  const handleSelect = (option) => {
    if (multiple) {
      const newValue = value?.includes(option.value)
        ? value.filter(v => v !== option.value)
        : [...(value || []), option.value];
      onChange({ target: { name, value: newValue } });
    } else {
      onChange({ target: { name, value: option.value } });
      setIsOpen(false);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange({ target: { name, value: multiple ? [] : '' } });
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[focusedIndex]);
        }
        break;
    }
  };

  const getDisplayValue = () => {
    if (multiple) {
      if (!value || value.length === 0) return placeholder;
      const selectedLabels = value.map(v => {
        const option = options.find(o => o.value === v);
        return option?.label || v;
      });
      return valueRenderer ? valueRenderer(selectedLabels) : selectedLabels.join(', ');
    } else {
      const selectedOption = options.find(o => o.value === value);
      if (!selectedOption) return placeholder;
      return valueRenderer ? valueRenderer(selectedOption) : selectedOption.label;
    }
  };

  const selectClasses = `
    form-select
    form-select--${size}
    form-select--${variant}
    ${isOpen ? 'form-select--open' : ''}
    ${error ? 'form-select--error' : ''}
    ${disabled ? 'form-select--disabled' : ''}
  `.trim();

  return (
    <div className={selectClasses} ref={selectRef}>
      {label && (
        <label className="form-select__label" htmlFor={name}>
          {label}
          {required && <span className="form-select__required">*</span>}
        </label>
      )}

      <div
        className="form-select__control"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {icon && <div className="form-select__icon">{icon}</div>}
        
        <div className="form-select__value">
          {getDisplayValue()}
        </div>

        <div className="form-select__indicators">
          {clearable && (value || (multiple && value?.length > 0)) && (
            <button
              type="button"
              className="form-select__clear"
              onClick={handleClear}
              tabIndex={-1}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/>
              </svg>
            </button>
          )}
          
          <div className="form-select__arrow">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="form-select__dropdown">
          {searchable && (
            <div className="form-select__search">
              <input
                ref={searchInputRef}
                type="text"
                className="form-select__search-input"
                placeholder="ค้นหา..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path fillRule="evenodd" d="M10.442 10.442a1 1 0 011.415 0l3.85 3.85a1 1 0 01-1.414 1.415l-3.85-3.85a1 1 0 010-1.415z" clipRule="evenodd"/>
                <path fillRule="evenodd" d="M6.5 12a5.5 5.5 0 100-11 5.5 5.5 0 000 11zM13 6.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" clipRule="evenodd"/>
              </svg>
            </div>
          )}

          <ul className="form-select__options" role="listbox">
            {filteredOptions.length === 0 ? (
              <li className="form-select__no-options">ไม่พบข้อมูล</li>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = multiple
                  ? value?.includes(option.value)
                  : value === option.value;
                const isFocused = index === focusedIndex;

                return (
                  <li
                    key={option.value}
                    className={`
                      form-select__option
                      ${isSelected ? 'form-select__option--selected' : ''}
                      ${isFocused ? 'form-select__option--focused' : ''}
                      ${option.disabled ? 'form-select__option--disabled' : ''}
                    `.trim()}
                    onClick={() => !option.disabled && handleSelect(option)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    {multiple && (
                      <div className="form-select__checkbox">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          tabIndex={-1}
                        />
                      </div>
                    )}
                    {optionRenderer ? optionRenderer(option) : option.label}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      {hint && !error && <p className="form-select__hint">{hint}</p>}
      {error && <p className="form-select__error">{error}</p>}
    </div>
  );
};

export default FormSelect;
