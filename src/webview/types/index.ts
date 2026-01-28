// Core data models for the Code Review Webview Panel

/**
 * Represents the status of a comment thread
 */
export type ThreadStatus = 'open' | 'resolved';

/**
 * Represents the type of filter applied to threads
 */
export type FilterType = 'all' | 'open' | 'resolved';

/**
 * Represents the VS Code theme type
 */
export type ThemeType = 'light' | 'dark';

/**
 * Author information for comments
 */
export interface Author {
  name: string;
  avatarUrl?: string;
  email?: string;
}

/**
 * Individual comment within a thread
 */
export interface Comment {
  id: number;
  threadId: string;
  content: string;
  author: Author;
  createdAt: Date;
  isReply: boolean;
  parentCommentId?: number;
}

/**
 * Comment thread containing original comment and replies
 */
export interface CommentThread {
  id: string;
  filePath: string;
  lineNumber: number;
  lineRange?: {
    start: number;
    end: number;
  };
  status: ThreadStatus;
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Thread counts for filter tabs
 */
export interface ThreadCounts {
  all: number;
  open: number;
  resolved: number;
}

/**
 * UI state management for the review panel
 */
export interface UIState {
  activeFilter: FilterType;
  searchQuery: string;
  expandedThreads: Set<string>;
  replyingToThread?: string;
  theme: ThemeType;
}

/**
 * Result of filtering threads
 */
export interface FilteredThreadsResult {
  threads: CommentThread[];
  counts: ThreadCounts;
}

/**
 * Actions that can be performed on threads
 */
export interface ThreadAction {
  type: 'reply' | 'resolve' | 'reopen' | 'navigate' | 'deleteThread' | 'deleteComment';
  threadId: string;
  payload?: any;
}

/**
 * VS Code API interface for webview communication
 */
export interface VSCodeAPI {
  postMessage(message: WebviewMessage): void;
  getState(): any;
  setState(state: any): void;
}

/**
 * Specific payload types for extension messages
 */
export interface UpdateThreadsPayload {
  threads: CommentThread[];
}

export interface ThemeChangedPayload {
  theme: ThemeType;
}

export interface NavigateToFilePayload {
  filePath: string;
  lineNumber?: number;
}

/**
 * Specific payload types for webview messages
 */
export interface ReplyToThreadPayload {
  threadId: string;
  content: string;
  author: Author;
}

export interface ResolveThreadPayload {
  threadId: string;
}

export interface ReopenThreadPayload {
  threadId: string;
}

export interface NavigateToLocationPayload {
  filePath: string;
  lineNumber: number;
}

export interface DeleteThreadPayload {
  threadId: string;
}

export interface DeleteCommentPayload {
  threadId: string;
  commentId: number;
}

export interface ReadyPayload {
  // Empty payload for initialization
}

/**
 * Messages sent from extension host to webview
 */
export type ExtensionMessage = 
  | { type: 'updateThreads'; payload: UpdateThreadsPayload }
  | { type: 'themeChanged'; payload: ThemeChangedPayload }
  | { type: 'navigateToFile'; payload: NavigateToFilePayload };

/**
 * Messages sent from webview to extension host
 */
export type WebviewMessage = 
  | { type: 'replyToThread'; payload: ReplyToThreadPayload }
  | { type: 'resolveThread'; payload: ResolveThreadPayload }
  | { type: 'reopenThread'; payload: ReopenThreadPayload }
  | { type: 'navigateToLocation'; payload: NavigateToLocationPayload }
  | { type: 'deleteThread'; payload: DeleteThreadPayload }
  | { type: 'deleteComment'; payload: DeleteCommentPayload }
  | { type: 'ready'; payload: ReadyPayload };