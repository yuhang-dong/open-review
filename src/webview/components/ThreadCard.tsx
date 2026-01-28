import React, { useState } from 'react';
import { ThreadCardProps } from '../types/components';
import ReplySystem from './ReplySystem';
import './ThreadCard.css';

/**
 * ThreadCard component for displaying individual thread information
 * Displays file path, line number, comment count, status indicators, and expandable replies
 */
const ThreadCard: React.FC<ThreadCardProps> = ({ thread, onAction, isExpanded: initialExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [isReplying, setIsReplying] = useState(false);

  // Get the original comment (first non-reply comment)
  const originalComment = thread.comments.find(c => !c.isReply);
  
  // Get all replies
  const replies = thread.comments.filter(c => c.isReply);
  
  // Calculate comment count (original + replies)
  const commentCount = thread.comments.length;

  /**
   * Format timestamp to relative time (e.g., "2h ago")
   */
  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  };

  /**
   * Handle expand/collapse toggle
   */
  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  /**
   * Handle file location navigation
   * Validates file path and line number before sending navigation request
   */
  const handleNavigateToFile = () => {
    // Validate file path
    if (!thread.filePath || thread.filePath.trim() === '') {
      console.error('Invalid file path: empty or undefined');
      return;
    }

    // Validate line number
    if (thread.lineNumber === undefined || thread.lineNumber === null || thread.lineNumber < 1) {
      console.error('Invalid line number:', thread.lineNumber);
      return;
    }

    try {
      onAction({
        type: 'navigate',
        threadId: thread.id,
        payload: {
          filePath: thread.filePath,
          lineNumber: thread.lineNumber
        }
      });
    } catch (error) {
      console.error('Failed to navigate to file location:', error);
    }
  };

  /**
   * Handle reply submission
   */
  const handleReplySubmit = (content: string) => {
    onAction({
      type: 'reply',
      threadId: thread.id,
      payload: {
        content
      }
    });
    setIsReplying(false);
  };

  /**
   * Handle reply cancellation
   */
  const handleReplyCancel = () => {
    setIsReplying(false);
  };

  /**
   * Handle thread resolution
   */
  const handleResolve = () => {
    onAction({
      type: 'resolve',
      threadId: thread.id,
      payload: {}
    });
  };

  /**
   * Handle thread reopening
   */
  const handleReopen = () => {
    onAction({
      type: 'reopen',
      threadId: thread.id,
      payload: {}
    });
  };

  /**
   * Handle deleting an entire thread
   */
  const handleDeleteThread = () => {
    onAction({
      type: 'deleteThread',
      threadId: thread.id,
      payload: {}
    });
  };

  /**
   * Handle deleting a reply/comment (small gray delete)
   */
  const handleDeleteComment = (commentId: number) => {
    onAction({
      type: 'deleteComment',
      threadId: thread.id,
      payload: { commentId }
    });
  };

  /**
   * Extract filename from file path
   */
  const getFileName = (filePath: string): string => {
    const parts = filePath.split('/');
    return parts[parts.length - 1] || filePath;
  };

  if (!originalComment) {
    return null; // Don't render if there's no original comment
  }

  return (
    <div className="thread-card">
      {/* Header with file info, status, and expand button */}
      <div className="thread-card__header">
        <div className="thread-card__left">
          <div 
            className="thread-card__file-badge" 
            onClick={handleNavigateToFile}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleNavigateToFile();
              }
            }}
            role="button"
            tabIndex={0}
            title={`Navigate to ${thread.filePath}:${thread.lineNumber}`}
            aria-label={`Navigate to ${getFileName(thread.filePath)} line ${thread.lineNumber}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="thread-card__filename">{getFileName(thread.filePath)}</span>
          </div>
          <span className="thread-card__line-number">L{thread.lineNumber}</span>
        </div>

        <div className="thread-card__right">
          {commentCount > 1 && (
            <div className="thread-card__comment-count">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>{commentCount}</span>
            </div>
          )}
          
          <div className="thread-card__status-badge">
            <span className={`thread-card__status thread-card__status--${thread.status}`}>
              {thread.status}
            </span>
          </div>

          <button
            className="thread-card__delete-btn"
            onClick={handleDeleteThread}
            aria-label="Delete thread"
            title="Delete thread"
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>

          <button 
            className="thread-card__expand-btn"
            onClick={handleToggleExpand}
            aria-label={isExpanded ? 'Collapse thread' : 'Expand thread'}
            type="button"
          >
            <svg 
              className={isExpanded ? 'thread-card__expand-icon--expanded' : ''}
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Original comment content */}
      <div className="thread-card__content">
        <p className="thread-card__comment-text">{originalComment.content}</p>
        
        <div className="thread-card__meta">
          <span className="thread-card__author">{originalComment.author.name}</span>
          <span className="thread-card__dot">•</span>
          <span className="thread-card__date">{formatTimestamp(originalComment.createdAt)}</span>
        </div>
      </div>

      {/* Expanded section with replies and actions */}
      {isExpanded && (
        <div className="thread-card__expanded">
          {/* Replies section */}
          {replies.length > 0 && (
            <div className="thread-card__replies">
              <div className="thread-card__replies-header">
                Replies ({replies.length})
              </div>
              {replies.map((reply) => (
                <div key={reply.id} className="thread-card__reply">
                  <p className="thread-card__reply-text">{reply.content}</p>
                  <div className="thread-card__reply-meta">
                    <span className="thread-card__reply-author">{reply.author.name}</span>
                    <span className="thread-card__dot">•</span>
                    <span className="thread-card__reply-date">{formatTimestamp(reply.createdAt)}</span>

                    <button
                      className="thread-card__reply-delete-btn"
                      onClick={() => handleDeleteComment(reply.id)}
                      aria-label="Delete reply"
                      title="Delete reply"
                      type="button"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reply input section */}
          {!isReplying ? (
            <div className="thread-card__reply-input">
              <button 
                className="thread-card__reply-btn"
                onClick={() => setIsReplying(true)}
              >
                Reply
              </button>
            </div>
          ) : (
            <ReplySystem
              threadId={thread.id}
              onReply={handleReplySubmit}
              onCancel={handleReplyCancel}
            />
          )}

          {/* Resolve/Reopen button */}
          {thread.status === 'open' ? (
            <div className="thread-card__resolve-section">
              <button 
                className="thread-card__resolve-btn"
                onClick={handleResolve}
              >
                Resolve Thread
              </button>
            </div>
          ) : (
            <div className="thread-card__resolve-section">
              <button 
                className="thread-card__reopen-btn"
                onClick={handleReopen}
              >
                Reopen Thread
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ThreadCard;