
// Frontend/components/shared/forms/FilterPanel.jsx
import React, { useState } from 'react';
import FormSelect from './FormSelect';
import FormInput from './FormInput';
import './FilterPanel.scss';

const FilterPanel = ({
  filters = [],
  values = {},
  onChange,
  onReset,
  onApply,
  showApplyButton = true,
  collapsible = true,
  defaultExpanded = true,
  title = 'ตัวกรอง'
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [localValues, setLocalValues] = useState(values);

  const handleChange = (name, value) => {
    const newValues = { ...localValues, [name]: value };
    setLocalValues(newValues);
    
    if (!showApplyButton) {
      onChange?.(newValues);
    }
  };

  const handleApply = () => {
    onChange?.(localValues);
    onApply?.(localValues);
  };

  const handleReset = () => {
    const resetValues = {};
    filters.forEach(filter => {
      resetValues[filter.name] = filter.defaultValue || '';
    });
    
    setLocalValues(resetValues);
    onChange?.(resetValues);
    onReset?.();
  };

  const renderFilter = (filter) => {
    const value = localValues[filter.name] || filter.defaultValue || '';

    switch (filter.type) {
      case 'select':
        return (
          <FormSelect
            key={filter.name}
            label={filter.label}
            name={filter.name}
            value={value}
            onChange={(e) => handleChange(filter.name, e.target.value)}
            options={filter.options}
            placeholder={filter.placeholder}
            multiple={filter.multiple}
            searchable={filter.searchable}
            size="small"
          />
        );

      case 'range':
        return (
          <div key={filter.name} className="filter-panel__range">
            <label className="filter-panel__label">{filter.label}</label>
            <div className="filter-panel__range-inputs">
              <FormInput
                type="number"
                placeholder={filter.minPlaceholder || 'ต่ำสุด'}
                value={value.min || ''}
                onChange={(e) => handleChange(filter.name, { ...value, min: e.target.value })}
                size="small"
              />
              <span className="filter-panel__range-separator">-</span>
              <FormInput
                type="number"
                placeholder={filter.maxPlaceholder || 'สูงสุด'}
                value={value.max || ''}
                onChange={(e) => handleChange(filter.name, { ...value, max: e.target.value })}
                size="small"
              />
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div key={filter.name} className="filter-panel__checkbox-group">
            <label className="filter-panel__label">{filter.label}</label>
            {filter.options.map(option => (
              <label key={option.value} className="filter-panel__checkbox">
                <input
                  type="checkbox"
                  checked={value.includes(option.value)}
                  onChange={(e) => {
                    const newValue = e.target.checked
                      ? [...value, option.value]
                      : value.filter(v => v !== option.value);
                    handleChange(filter.name, newValue);
                  }}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'radio':
        return (
          <div key={filter.name} className="filter-panel__radio-group">
            <label className="filter-panel__label">{filter.label}</label>
            {filter.options.map(option => (
              <label key={option.value} className="filter-panel__radio">
                <input
                  type="radio"
                  name={filter.name}
                  checked={value === option.value}
                  onChange={() => handleChange(filter.name, option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        );

      default:
        return (
          <FormInput
            key={filter.name}
            label={filter.label}
            name={filter.name}
            type={filter.type || 'text'}
            value={value}
            onChange={(e) => handleChange(filter.name, e.target.value)}
            placeholder={filter.placeholder}
            size="small"
          />
        );
    }
  };

  const activeFiltersCount = Object.values(localValues).filter(v => 
    v !== '' && v !== null && v !== undefined && 
    (!Array.isArray(v) || v.length > 0)
  ).length;

  return (
    <div className={`filter-panel ${isExpanded ? 'filter-panel--expanded' : ''}`}>
      <div className="filter-panel__header">
        <h3 className="filter-panel__title">
          {title}
          {activeFiltersCount > 0 && (
            <span className="filter-panel__count">{activeFiltersCount}</span>
          )}
        </h3>
        
        {collapsible && (
          <button
            type="button"
            className="filter-panel__toggle"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d={isExpanded ? "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" : "M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"} clipRule="evenodd"/>
            </svg>
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="filter-panel__content">
          <div className="filter-panel__filters">
            {filters.map(filter => renderFilter(filter))}
          </div>

          <div className="filter-panel__actions">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={handleReset}
            >
              ล้างตัวกรอง
            </button>
            
            {showApplyButton && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleApply}
              >
                ใช้ตัวกรอง
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
