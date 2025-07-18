
// Frontend/components/shared/forms/SearchBar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';
import './SearchBar.scss';

const SearchBar = ({
  placeholder = 'ค้นหา...',
  value,
  onChange,
  onSearch,
  suggestions = [],
  showSuggestions = true,
  loading = false,
  size = 'medium',
  variant = 'default',
  icon,
  clearable = true,
  autoFocus = false,
  delay = 300
}) => {
  const [localValue, setLocalValue] = useState(value || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  
  const debouncedValue = useDebounce(localValue, delay);

  useEffect(() => {
    if (debouncedValue && onSearch) {
      onSearch(debouncedValue);
    }
  }, [debouncedValue, onSearch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange?.(newValue);
    setShowDropdown(true);
    setSelectedIndex(-1);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange?.('');
    onSearch?.('');
    inputRef.current?.focus();
  };

  const handleSelectSuggestion = (suggestion) => {
    const value = typeof suggestion === 'string' ? suggestion : suggestion.value;
    setLocalValue(value);
    onChange?.(value);
    onSearch?.(value);
    setShowDropdown(false);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        } else {
          onSearch?.(localValue);
          setShowDropdown(false);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        break;
    }
  };

  const searchClasses = `
    search-bar
    search-bar--${size}
    search-bar--${variant}
  `.trim();

  return (
    <div className={searchClasses} ref={searchRef}>
      <div className="search-bar__wrapper">
        <div className="search-bar__icon">
          {icon || (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
            </svg>
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          className="search-bar__input"
          placeholder={placeholder}
          value={localValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowDropdown(true)}
          autoFocus={autoFocus}
        />

        {loading && (
          <div className="search-bar__loading">
            <div className="search-bar__spinner" />
          </div>
        )}

        {clearable && localValue && !loading && (
          <button
            type="button"
            className="search-bar__clear"
            onClick={handleClear}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/>
            </svg>
          </button>
        )}
      </div>

      {showSuggestions && showDropdown && suggestions.length > 0 && (
        <div className="search-bar__dropdown">
          <ul className="search-bar__suggestions">
            {suggestions.map((suggestion, index) => {
              const isSelected = index === selectedIndex;
              const label = typeof suggestion === 'string' 
                ? suggestion 
                : suggestion.label;
              
              return (
                <li
                  key={index}
                  className={`search-bar__suggestion ${isSelected ? 'search-bar__suggestion--selected' : ''}`}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  {typeof suggestion === 'object' && suggestion.icon && (
                    <span className="search-bar__suggestion-icon">
                      {suggestion.icon}
                    </span>
                  )}
                  <span className="search-bar__suggestion-text">{label}</span>
                  {typeof suggestion === 'object' && suggestion.category && (
                    <span className="search-bar__suggestion-category">
                      {suggestion.category}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
