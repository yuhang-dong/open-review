import React from 'react';

interface LoadingStateProps {
  theme: string;
}

/**
 * Loading state component for the ReviewPanel
 */
const LoadingState: React.FC<LoadingStateProps> = ({ theme }) => {
  return (
    <div className={`review-panel theme-${theme}`}>
      <div className="review-panel__header">
        <h1 className="review-panel__title">Open Review</h1>
        <p className="review-panel__subtitle">Code review comments and discussions</p>
      </div>
      <div className="review-panel__content">
        <div className="review-panel__loading">
          <p>Loading review data...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingState;