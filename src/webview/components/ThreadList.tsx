import React, { useState, useCallback } from 'react';
import { ThreadListProps } from '../types/components';
import { CommentThread } from '../types';
import './ThreadList.css';
import './ThreadCard.css';

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
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [isLoading] = useState(false);

  const handleThreadExpand = useCallback((threadId: string) => {
    setExpandedThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(threadId)) {
        newSet.delete(threadId);
      } else {
        newSet.add(threadId);
      }
      return newSet;
    });
  }, []);

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
          isExpanded={expandedThreads.has(thread.id)}
          onToggleExpand={() => handleThreadExpand(thread.id)}
          onAction={onThreadAction}
        />
      ))}
    </div>
  );
};

/**
 * Individual thread card component matching the pencil design exactly
 */
interface ThreadCardProps {
  thread: CommentThread;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAction: (action: any) => void;
}

const ThreadCard: React.FC<ThreadCardProps> = ({
  thread,
  isExpanded,
  onToggleExpand,
  onAction
}) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');

  const handleNavigate = useCallback(() => {
    onAction({
      type: 'navigate',
      threadId: thread.id,
      payload: {
        filePath: thread.filePath,
        lineNumber: thread.lineNumber
      }
    });
  }, [thread, onAction]);

  const handleReplyClick = useCallback(() => {
    setShowReplyInput(true);
  }, []);

  const handleReplySubmit = useCallback(() => {
    if (replyText.trim()) {
      onAction({
        type: 'reply',
        threadId: thread.id,
        payload: {
          content: replyText
        }
      });
      setReplyText('');
      setShowReplyInput(false);
    }
  }, [thread.id, replyText, onAction]);

  const handleReplyCancel = useCallback(() => {
    setReplyText('');
    setShowReplyInput(false);
  }, []);

  const handleResolve = useCallback(() => {
    onAction({
      type: 'resolve',
      threadId: thread.id
    });
  }, [thread.id, onAction]);

  const originalComment = thread.comments.find(c => !c.isReply);
  const replies = thread.comments.filter(c => c.isReply);

  if (!originalComment) return null;

  return (
    <div className="thread-card">
      {/* Header with file info, status, and expand button */}
      <div className="thread-card__header">
        <div className="thread-card__left">
          <div className="thread-card__file-badge" onClick={handleNavigate}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <line x1="10" y1="9" x2="8" y2="9"/>
            </svg>
            <span className="thread-card__filename">{thread.filePath}</span>
          </div>
          
          <span className="thread-card__line-number">L{thread.lineNumber}</span>
        </div>
        
        <div className="thread-card__right">
          <div className="thread-card__status-badge">
            <span className={`thread-card__status thread-card__status--${thread.status}`}>
              {thread.status.toUpperCase()}
            </span>
          </div>
          
          {/* Expand/Collapse button */}
          <button 
            className="thread-card__expand-btn"
            onClick={onToggleExpand}
            aria-label={isExpanded ? "Collapse thread" : "Expand thread"}
          >
            <svg 
              width="12" 
              height="12" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              className={isExpanded ? 'thread-card__expand-icon--expanded' : ''}
            >
              <polyline points="9,18 15,12 9,6"></polyline>
            </svg>
          </button>
        </div>
      </div>

      {/* Comment content */}
      <div className="thread-card__content">
        <p className="thread-card__comment-text">{originalComment.content}</p>
        
        <div className="thread-card__meta">
          <span className="thread-card__author">{originalComment.author.name}</span>
          <span className="thread-card__date">
            {new Date(originalComment.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'numeric',
              day: 'numeric'
            })}
          </span>
        </div>
      </div>

      {/* Expanded content - replies and actions */}
      {isExpanded && (
        <div className="thread-card__expanded">
          {/* Replies section (if has replies) */}
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
                    <span className="thread-card__reply-date">
                      {new Date(reply.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reply input for open threads */}
          {thread.status === 'open' && !showReplyInput && (
            <div className="thread-card__reply-input">
              <button 
                className="thread-card__reply-btn"
                onClick={handleReplyClick}
              >
                Reply
              </button>
            </div>
          )}

          {/* Reply form when active */}
          {thread.status === 'open' && showReplyInput && (
            <div className="thread-card__reply-form">
              <textarea
                className="thread-card__reply-textarea"
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={3}
                autoFocus
              />
              <div className="thread-card__reply-actions">
                <button 
                  className="thread-card__reply-cancel"
                  onClick={handleReplyCancel}
                >
                  Cancel
                </button>
                <button 
                  className="thread-card__reply-submit"
                  onClick={handleReplySubmit}
                  disabled={!replyText.trim()}
                >
                  Reply
                </button>
              </div>
            </div>
          )}

          {/* Resolve button for open threads */}
          {thread.status === 'open' && (
            <div className="thread-card__resolve-section">
              <button 
                className="thread-card__resolve-btn"
                onClick={handleResolve}
              >
                Resolve Thread
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ThreadList;