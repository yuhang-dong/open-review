import React, { useState } from 'react';
import { ReplySystemProps } from '../types/components';
import './ReplySystem.css';

/**
 * ReplySystem component for composing and submitting replies to comment threads
 * Provides a text input interface with Cancel and Reply action buttons
 * Handles reply form validation and submission
 */
const ReplySystem: React.FC<ReplySystemProps> = ({ threadId: _threadId, onReply, onCancel }) => {
  const [replyContent, setReplyContent] = useState('');

  /**
   * Handle reply submission
   * Validates that content is not empty before submitting
   */
  const handleSubmit = () => {
    const trimmedContent = replyContent.trim();
    if (trimmedContent) {
      onReply(trimmedContent);
      setReplyContent('');
    }
  };

  /**
   * Handle reply cancellation
   * Clears the input and notifies parent component
   */
  const handleCancel = () => {
    setReplyContent('');
    onCancel();
  };

  /**
   * Handle Enter key press for submission (Shift+Enter for new line)
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="reply-system">
      <textarea
        className="reply-system__textarea"
        placeholder="Write a reply..."
        value={replyContent}
        onChange={(e) => setReplyContent(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
        rows={3}
      />
      <div className="reply-system__actions">
        <button 
          className="reply-system__cancel-btn"
          onClick={handleCancel}
          type="button"
        >
          Cancel
        </button>
        <button 
          className="reply-system__submit-btn"
          onClick={handleSubmit}
          disabled={!replyContent.trim()}
          type="button"
        >
          Reply
        </button>
      </div>
    </div>
  );
};

export default ReplySystem;
