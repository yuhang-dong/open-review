import React from 'react';
import { SearchBarProps } from '../types/components';

/**
 * SearchBar component for searching through comments
 * Will be implemented in task 4.3
 */
const SearchBar: React.FC<SearchBarProps> = ({ 
  searchQuery, 
  onSearchChange, 
  placeholder = "Search comments..." 
}) => {
  // Suppress unused parameter warnings for placeholder component
  void searchQuery;
  void onSearchChange;
  void placeholder;

  return (
    <div className="search-bar">
      <p>SearchBar component - to be implemented in task 4.3</p>
    </div>
  );
};

export default SearchBar;