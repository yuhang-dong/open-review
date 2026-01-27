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
      
      <div className="review-panel__content">
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
        
        <div className="review-panel__status">
          <div className="review-panel__status-item">
            <strong>Status:</strong> {isInitialized ? 'Connected' : 'Initializing...'}
          </div>
          <div className="review-panel__status-item">
            <strong>Theme:</strong> {state.theme}
          </div>
          <div className="review-panel__status-item">
            <strong>Threads:</strong> {state.threads.length}
          </div>
          <div className="review-panel__status-item">
            <strong>Filter:</strong> {state.activeFilter}
          </div>
          {state.searchQuery && (
            <div className="review-panel__status-item">
              <strong>Search:</strong> "{state.searchQuery}"
            </div>
          )}
        </div>
        
        {/* Development controls - will be removed when child components are added */}
        <div className="review-panel__dev-controls" style={{ marginBottom: '16px', padding: '12px', border: '1px dashed var(--vscode-panel-border)', borderRadius: '4px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--vscode-descriptionForeground)' }}>Development Controls (Task 3.1)</h4>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => handleFilterChange('all')}
              style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: 'var(--vscode-button-background)', color: 'var(--vscode-button-foreground)', border: 'none', borderRadius: '2px', cursor: 'pointer' }}
            >
              Filter: All
            </button>
            <button 
              onClick={() => handleFilterChange('open')}
              style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: 'var(--vscode-button-background)', color: 'var(--vscode-button-foreground)', border: 'none', borderRadius: '2px', cursor: 'pointer' }}
            >
              Filter: Open
            </button>
            <button 
              onClick={() => handleFilterChange('resolved')}
              style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: 'var(--vscode-button-background)', color: 'var(--vscode-button-foreground)', border: 'none', borderRadius: '2px', cursor: 'pointer' }}
            >
              Filter: Resolved
            </button>
            <input 
              type="text"
              placeholder="Test search..."
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: 'var(--vscode-input-background)', color: 'var(--vscode-input-foreground)', border: '1px solid var(--vscode-input-border)', borderRadius: '2px' }}
            />
          </div>
        </div>
        
        <div className="review-panel__placeholder">
          <h3>Review Panel Ready</h3>
          <p>The core ReviewPanel component is now implemented with:</p>
          <ul>
            <li>✅ State management for threads, filters, and search</li>
            <li>✅ VS Code API communication with React lifecycle</li>
            <li>✅ Theme detection and automatic theme switching</li>
            <li>✅ Error handling and loading states</li>
            <li>✅ State persistence between sessions</li>
          </ul>
          <p>Child components (FilterTabs, SearchBar, ThreadList) will be added in subsequent tasks.</p>
        </div>
      </div>
    </div>
  );
};

export default ReviewPanel;