import React from 'react';

interface ErrorStateProps {
  theme: string;
  error: string;
  onRetry: () => void;
}

/**
 * Error state component for the ReviewPanel
 */
const ErrorState: React.FC<ErrorStateProps> = ({ theme, error, onRetry }) => {
  return (
    <div className={`review-panel theme-${theme}`}>
      <div className="review-panel__header">
        <h1 className="review-panel__title">Open Review</h1>
        <p className="review-panel__subtitle">Code review comments and discussions</p>
      </div>
      <div className="review-panel__content">
        <div className="review-panel__error">
          <h3>Error Loading Review Panel</h3>
          <p>{error}</p>
          <button 
            onClick={onRetry}
            className="review-panel__retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorState;