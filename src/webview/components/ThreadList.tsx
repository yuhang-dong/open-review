import React, { useState } from 'react';
import { ThreadListProps } from '../types/components';
import ThreadCard from './ThreadCard';
import './ThreadList.css';

/**
 * ThreadList component for rendering filtered thread collections
 * Following the exact design from docs/panel.pen
 * 
 * Requirements implemented:
 * - 4.5: Support expandable and collapsible thread details
 * - Loading states and empty state handling
 * - Container component for rendering filtered thread collections
 */
const ThreadList: React.FC<ThreadListProps> = ({
  threads,
  onThreadAction
}) => {
  const [isLoading] = useState(false);

  // Loading state
  if (isLoading) {
    return (
      <div className="thread-list thread-list--loading">
        <div className="thread-list__loading-indicator">
          <div className="thread-list__loading-spinner"></div>
          <span className="thread-list__loading-text">Loading threads...</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (!threads || threads.length === 0) {
    return (
      <div className="thread-list thread-list--empty">
        <div className="thread-list__empty-state">
          <div className="thread-list__empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              <path d="M8 9h8"/>
              <path d="M8 13h6"/>
            </svg>
          </div>
          <h3 className="thread-list__empty-title">No comments found</h3>
          <p className="thread-list__empty-description">
            There are no review comments to display. Comments will appear here when they are added to your code.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="thread-list">
      {threads.map((thread) => (
        <ThreadCard
          key={thread.id}
          thread={thread}
          onAction={onThreadAction}
        />
      ))}
    </div>
  );
};

export default ThreadList;