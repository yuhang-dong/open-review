import React from 'react';
import { ThreadListProps } from '../types/components';

/**
 * ThreadList component for rendering filtered thread collections
 * Will be implemented in task 6.1
 */
const ThreadList: React.FC<ThreadListProps> = ({ threads, onThreadAction }) => {
  // Suppress unused parameter warnings for placeholder component
  void onThreadAction;

  return (
    <div className="thread-list">
      <p>ThreadList component - to be implemented in task 6.1</p>
      <p>Threads to display: {threads.length}</p>
    </div>
  );
};

export default ThreadList;