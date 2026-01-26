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
  id: string;
  threadId: string;
  content: string;
  author: Author;
  createdAt: Date;
  isReply: boolean;
  parentCommentId?: string;
}

/**
 * Comment thread containing original comment and replies
 */
export interface CommentThread {
  id: string;
  filePath: string;
  lineNumber: number;
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
  type: 'reply' | 'resolve' | 'navigate';
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
 * Messages sent from extension host to webview
 */
export interface ExtensionMessage {
  type: 'updateThreads' | 'themeChanged' | 'navigateToFile';
  payload: any;
}

/**
 * Messages sent from webview to extension host
 */
export interface WebviewMessage {
  type: 'replyToThread' | 'resolveThread' | 'navigateToLocation' | 'ready';
  payload: any;
}