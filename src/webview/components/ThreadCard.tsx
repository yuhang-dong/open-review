import React from 'react';
import { ThreadCardProps } from '../types/components';

/**
 * ThreadCard component for displaying individual thread information
 * Will be implemented in task 6.2
 */
const ThreadCard: React.FC<ThreadCardProps> = ({ thread, onAction, isExpanded }) => {
  // Suppress unused parameter warnings for placeholder component
  void onAction;
  void isExpanded;

  return (
    <div className="thread-card">
      <p>ThreadCard component - to be implemented in task 6.2</p>
      <p>Thread ID: {thread.id}</p>
    </div>
  );
};

export default ThreadCard;