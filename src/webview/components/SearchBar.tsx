import React, { useState, useEffect, useCallback } from 'react';
import { SearchBarProps } from '../types/components';

/**
 * SearchBar component for searching through comments
 * Provides real-time search with debouncing and follows pencil-welcome.pen design
 * Supports case-insensitive search across content, file paths, and author names
 */
const SearchBar: React.FC<SearchBarProps> = ({ 
  searchQuery, 
  onSearchChange, 
  placeholder = "Search comments..." 
}) => {
  const [localQuery, setLocalQuery] = useState(searchQuery);

  // Debounce search input to avoid excessive filtering
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localQuery !== searchQuery) {
        onSearchChange(localQuery);
      }
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timeoutId);
  }, [localQuery, searchQuery, onSearchChange]);

  // Sync local state when external searchQuery changes
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuery(event.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setLocalQuery('');
    onSearchChange('');
  }, [onSearchChange]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow immediate search on Enter key
    if (event.key === 'Enter') {
      onSearchChange(localQuery);
    }
    // Clear search on Escape key
    if (event.key === 'Escape') {
      handleClearSearch();
    }
  }, [localQuery, onSearchChange, handleClearSearch]);

  return (
    <div className="search-bar">
      <div className="search-bar__input-container">
        <div className="search-bar__icon">
          {/* Lucide search icon matching pencil-welcome.pen design */}
          <svg 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
        <input
          type="text"
          className="search-bar__input"
          value={localQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search comments"
          autoComplete="off"
          spellCheck="false"
        />
        {localQuery && (
          <button
            type="button"
            className="search-bar__clear"
            onClick={handleClearSearch}
            aria-label="Clear search"
            title="Clear search"
          >
            {/* X icon for clearing search */}
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;