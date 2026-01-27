// Component prop interfaces for the Code Review Webview Panel

import { 
  CommentThread, 
  FilterType, 
  ThreadCounts, 
  ThreadAction, 
  ThemeType 
} from './index';
import { VSCodeAPIWrapper } from '../api';

/**
 * Props for the root ReviewPanel component
 */
export interface ReviewPanelProps {
  vscode: VSCodeAPIWrapper;
}

/**
 * State interface for the ReviewPanel component
 */
export interface ReviewPanelState {
  threads: CommentThread[];
  activeFilter: FilterType;
  searchQuery: string;
  theme: ThemeType;
}

/**
 * Props for the FilterTabs component
 */
export interface FilterTabsProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  threadCounts: ThreadCounts;
}

/**
 * Props for the SearchBar component
 */
export interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
}

/**
 * Props for the ThreadList component
 */
export interface ThreadListProps {
  threads: CommentThread[];
  onThreadAction: (action: ThreadAction) => void;
}

/**
 * Props for the ThreadCard component
 */
export interface ThreadCardProps {
  thread: CommentThread;
  onAction: (action: ThreadAction) => void;
  isExpanded?: boolean;
}

/**
 * Props for the ReplySystem component
 */
export interface ReplySystemProps {
  threadId: string;
  onReply: (content: string) => void;
  onCancel: () => void;
}