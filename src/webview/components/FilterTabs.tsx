import React from 'react';
import { FilterTabsProps } from '../types/components';
import { FilterType } from '../types';

/**
 * FilterTabs component for filtering comment threads by status
 * 
 * Requirements implemented:
 * - 2.1: Provide three tabs: "All", "Open", and "Resolved"
 * - 2.6: Maintain selected tab state during panel sessions
 */
const FilterTabs: React.FC<FilterTabsProps> = ({
  activeFilter,
  onFilterChange,
  threadCounts
}) => {
  const filters: Array<{ key: FilterType; label: string; count: number }> = [
    { key: 'all', label: 'All', count: threadCounts.all },
    { key: 'open', label: 'Open', count: threadCounts.open },
    { key: 'resolved', label: 'Resolved', count: threadCounts.resolved }
  ];

  const handleFilterClick = (filter: FilterType) => {
    onFilterChange(filter);
  };

  const handleKeyDown = (event: React.KeyboardEvent, filter: FilterType) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleFilterClick(filter);
    }
  };

  return (
    <div className="filter-tabs" role="tablist" aria-label="Filter comment threads">
      {filters.map(({ key, label }) => (
        <button
          key={key}
          className={`filter-tabs__tab ${activeFilter === key ? 'filter-tabs__tab--active' : ''}`}
          onClick={() => handleFilterClick(key)}
          onKeyDown={(e) => handleKeyDown(e, key)}
          role="tab"
          aria-selected={activeFilter === key}
          aria-controls={`thread-list-${key}`}
          tabIndex={activeFilter === key ? 0 : -1}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default FilterTabs;