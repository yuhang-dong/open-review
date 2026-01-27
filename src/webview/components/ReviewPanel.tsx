import React from 'react';
import { ReviewPanelProps } from '../types/components';
import { useReviewPanel } from '../hooks/useReviewPanel';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import FilterTabs from './FilterTabs';
import SearchBar from './SearchBar';
import ThreadList from './ThreadList';
import './ReviewPanel.css';

/**
 * Root component for the Code Review Webview Panel
 * Manages global state and coordinates child components
 * 
 * Requirements implemented:
 * - 1.1: Panel available as webview panel
 * - 1.2: Display title "Open Review" with subtitle
 * - 1.3: Support both dark and light themes automatically
 * - 1.4: Update appearance immediately on theme changes
 */
const ReviewPanel: React.FC<ReviewPanelProps> = ({ vscode }) => {
  const {
    state,
    isLoading,
    error,
    isInitialized,
    threadCounts,
    filteredThreads,
    handleFilterChange,
    handleSearchChange,
    handleThreadAction,
    setError
  } = useReviewPanel(vscode);

  // Handle retry for error state
  const handleRetry = () => {
    setError(null);
    window.location.reload();
  };

  // Error boundary fallback
  if (error) {
    return (
      <ErrorState 
        theme={state.theme} 
        error={error} 
        onRetry={handleRetry} 
      />
    );
  }

  // Loading state
  if (isLoading) {
    return <LoadingState theme={state.theme} />;
  }

  return (
    <div className={`review-panel theme-${state.theme}`} data-initialized={isInitialized}>
      <div className="review-panel__header">
        <h1 className="review-panel__title">Open Review</h1>
        <p className="review-panel__subtitle">Code review comments and discussions</p>
      </div>
      
      <FilterTabs
        activeFilter={state.activeFilter}
        onFilterChange={handleFilterChange}
        threadCounts={threadCounts}
      />
      
      <SearchBar
        searchQuery={state.searchQuery}
        onSearchChange={handleSearchChange}
        placeholder="Search comments..."
      />
      
      <ThreadList
        threads={filteredThreads}
        onThreadAction={handleThreadAction}
      />
    </div>
  );
};

export default ReviewPanel;