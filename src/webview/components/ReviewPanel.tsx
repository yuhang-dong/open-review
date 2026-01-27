import React, { useState, useEffect } from 'react';
import { ReviewPanelProps, ReviewPanelState } from '../types/components';
import { FilterType, ExtensionMessage } from '../types';

/**
 * Root component for the Code Review Webview Panel
 * Manages global state and coordinates child components
 */
const ReviewPanel: React.FC<ReviewPanelProps> = ({ vscode }) => {
  const [state, setState] = useState<ReviewPanelState>({
    threads: [],
    activeFilter: 'all',
    searchQuery: '',
    theme: 'light'
  });

  useEffect(() => {
    // Set up message handlers using our API wrapper
    const unsubscribeUpdateThreads = vscode.onDidReceiveMessage('updateThreads', (message: ExtensionMessage) => {
      if (message.type === 'updateThreads') {
        setState(prev => ({
          ...prev,
          threads: message.payload.threads
        }));
      }
    });

    const unsubscribeThemeChanged = vscode.onDidReceiveMessage('themeChanged', (message: ExtensionMessage) => {
      if (message.type === 'themeChanged') {
        setState(prev => ({
          ...prev,
          theme: message.payload.theme
        }));
      }
    });

    const unsubscribeNavigateToFile = vscode.onDidReceiveMessage('navigateToFile', (message: ExtensionMessage) => {
      if (message.type === 'navigateToFile') {
        // Handle file navigation response
        console.log('Navigate to file:', message.payload);
      }
    });

    // Initialize the webview
    vscode.initialize();

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeUpdateThreads();
      unsubscribeThemeChanged();
      unsubscribeNavigateToFile();
    };
  }, [vscode]);

  const handleFilterChange = (filter: FilterType) => {
    setState(prev => ({
      ...prev,
      activeFilter: filter
    }));
  };

  const handleSearchChange = (query: string) => {
    setState(prev => ({
      ...prev,
      searchQuery: query
    }));
  };

  // Suppress unused function warnings for placeholder implementation
  void handleFilterChange;
  void handleSearchChange;

  return (
    <div className={`review-panel theme-${state.theme}`}>
      <div className="review-panel__header">
        <h1 className="review-panel__title">Open Review</h1>
        <p className="review-panel__subtitle">Code review comments and discussions</p>
      </div>
      
      <div className="review-panel__content">
        {/* Filter tabs will be added in task 4 */}
        {/* Search bar will be added in task 4 */}
        {/* Thread list will be added in task 6 */}
        
        <div className="review-panel__placeholder">
          <p>Review panel components will be implemented in subsequent tasks</p>
          <p>Current state:</p>
          <ul>
            <li>Threads: {state.threads.length}</li>
            <li>Filter: {state.activeFilter}</li>
            <li>Search: {state.searchQuery || 'none'}</li>
            <li>Theme: {state.theme}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReviewPanel;