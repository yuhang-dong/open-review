import React from 'react';
import { FilterTabsProps } from '../types/components';

/**
 * FilterTabs component for filtering threads by status
 * Will be implemented in task 4.1
 */
const FilterTabs: React.FC<FilterTabsProps> = ({ 
  activeFilter, 
  onFilterChange, 
  threadCounts 
}) => {
  // Suppress unused parameter warnings for placeholder component
  void activeFilter;
  void onFilterChange;
  void threadCounts;

  return (
    <div className="filter-tabs">
      <p>FilterTabs component - to be implemented in task 4.1</p>
    </div>
  );
};

export default FilterTabs;