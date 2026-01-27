import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ReviewPanelState } from '../types/components';
import { FilterType, ExtensionMessage, ThreadCounts, CommentThread, ThreadAction } from '../types';
import { VSCodeAPIWrapper } from '../api/VSCodeAPIWrapper';
import { ThemeUtils } from '../utils/themeUtils';

/**
 * Custom hook for managing ReviewPanel state and VS Code API communication
 */
export function useReviewPanel(vscode: VSCodeAPIWrapper) {
  // Core state management
  const [state, setState] = useState<ReviewPanelState>({
    threads: [],
    activeFilter: 'all',
    searchQuery: '',
    theme: ThemeUtils.detectInitialTheme()
  });

  // UI state management
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Refs for cleanup and state persistence
  const unsubscribersRef = useRef<(() => void)[]>([]);
  const stateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Restore persisted state from VS Code
   */
  const restorePersistedState = useCallback(() => {
    try {
      const persistedState = vscode.getState();
      if (persistedState) {
        setState(prev => ({
          ...prev,
          activeFilter: persistedState.activeFilter || prev.activeFilter,
          searchQuery: persistedState.searchQuery || prev.searchQuery,
        }));
      }
    } catch (error) {
      console.warn('Failed to restore persisted state:', error);
    }
  }, [vscode]);

  /**
   * Handle filter changes with state persistence
   */
  const handleFilterChange = useCallback((filter: FilterType) => {
    setState(prev => {
      const newState = {
        ...prev,
        activeFilter: filter
      };
      
      // Persist filter state
      try {
        vscode.setState({ ...vscode.getState(), activeFilter: filter });
      } catch (error) {
        console.warn('Failed to persist filter state:', error);
      }
      
      return newState;
    });
  }, [vscode]);

  /**
   * Handle search changes with debouncing
   */
  const handleSearchChange = useCallback((query: string) => {
    setState(prev => {
      const newState = {
        ...prev,
        searchQuery: query
      };
      
      // Debounce state persistence
      if (stateTimeoutRef.current) {
        clearTimeout(stateTimeoutRef.current);
      }
      
      stateTimeoutRef.current = setTimeout(() => {
        try {
          vscode.setState({ ...vscode.getState(), searchQuery: query });
        } catch (error) {
          console.warn('Failed to persist search state:', error);
        }
      }, 300);
      
      return newState;
    });
  }, [vscode]);

  /**
   * Handle thread actions (reply, resolve, navigate)
   */
  const handleThreadAction = useCallback((action: ThreadAction) => {
    try {
      switch (action.type) {
        case 'navigate':
          vscode.postMessage({
            type: 'navigateToLocation',
            payload: {
              filePath: action.payload.filePath,
              lineNumber: action.payload.lineNumber
            }
          });
          break;
          
        case 'resolve':
          vscode.postMessage({
            type: 'resolveThread',
            payload: {
              threadId: action.threadId
            }
          });
          break;
          
        case 'reply':
          // Send reply message to extension
          // Extension will handle getting author info via getUserName()
          vscode.postMessage({
            type: 'replyToThread',
            payload: {
              threadId: action.threadId,
              content: action.payload.content,
              // Empty author name triggers extension to use getUserName()
              author: { name: '' }
            }
          });
          break;
          
        default:
          console.warn('Unknown thread action type:', action.type);
      }
    } catch (error) {
      console.error('Failed to handle thread action:', error);
      setError(error instanceof Error ? error.message : 'Failed to handle thread action');
    }
  }, [vscode]);

  /**
   * Filter and search threads based on current state
   */
  const filteredThreads = useMemo((): CommentThread[] => {
    let filtered = state.threads;

    // Apply status filter
    if (state.activeFilter !== 'all') {
      filtered = filtered.filter(thread => thread.status === state.activeFilter);
    }

    // Apply search filter
    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(thread => {
        // Search in file path
        if (thread.filePath.toLowerCase().includes(query)) {
          return true;
        }
        
        // Search in comment content
        const hasMatchingComment = thread.comments.some(comment => 
          comment.content.toLowerCase().includes(query) ||
          comment.author.name.toLowerCase().includes(query)
        );
        
        return hasMatchingComment;
      });
    }

    return filtered;
  }, [state.threads, state.activeFilter, state.searchQuery]);

  /**
   * Initialize webview communication and state
   */
  useEffect(() => {
    let mounted = true;

    const initializeWebview = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Apply initial theme to document
        ThemeUtils.applyTheme(state.theme);

        // Set up message handlers
        const unsubscribeUpdateThreads = vscode.onDidReceiveMessage('updateThreads', (message: ExtensionMessage) => {
          if (message.type === 'updateThreads' && mounted) {
            setState(prev => ({
              ...prev,
              threads: message.payload.threads
            }));
            setIsLoading(false);
          }
        });

        const unsubscribeThemeChanged = vscode.onDidReceiveMessage('themeChanged', (message: ExtensionMessage) => {
          if (message.type === 'themeChanged' && mounted) {
            const newTheme = message.payload.theme;
            setState(prev => ({
              ...prev,
              theme: newTheme
            }));
            // Apply theme immediately to document
            ThemeUtils.applyTheme(newTheme);
          }
        });

        const unsubscribeNavigateToFile = vscode.onDidReceiveMessage('navigateToFile', (message: ExtensionMessage) => {
          if (message.type === 'navigateToFile') {
            // Handle file navigation response - this could be used for confirmation
            console.log('Navigate to file response:', message.payload);
          }
        });

        // Store unsubscribers for cleanup
        unsubscribersRef.current = [
          unsubscribeUpdateThreads,
          unsubscribeThemeChanged,
          unsubscribeNavigateToFile
        ];

        // Restore any persisted state
        restorePersistedState();

        // Initialize the webview communication
        if (!vscode.initialized) {
          vscode.initialize();
        }

        if (mounted) {
          setIsInitialized(true);
          setIsLoading(false);
        }

      } catch (error) {
        console.error('Failed to initialize webview:', error);
        if (mounted) {
          setError(error instanceof Error ? error.message : 'Failed to initialize webview');
          setIsLoading(false);
        }
      }
    };

    initializeWebview();

    // Cleanup function
    return () => {
      mounted = false;
      
      // Clear any pending timeouts
      if (stateTimeoutRef.current) {
        clearTimeout(stateTimeoutRef.current);
      }
      
      // Unsubscribe from all message handlers
      unsubscribersRef.current.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          console.warn('Error during cleanup:', error);
        }
      });
      unsubscribersRef.current = [];
    };
  }, [vscode, restorePersistedState]);

  /**
   * Apply theme changes to document when theme state changes
   */
  useEffect(() => {
    ThemeUtils.applyTheme(state.theme);
  }, [state.theme]);

  /**
   * Calculate thread counts for filter tabs
   */
  const threadCounts = useMemo((): ThreadCounts => {
    const openCount = state.threads.filter(thread => thread.status === 'open').length;
    const resolvedCount = state.threads.filter(thread => thread.status === 'resolved').length;
    
    return {
      all: state.threads.length,
      open: openCount,
      resolved: resolvedCount
    };
  }, [state.threads]);

  return {
    // State
    state,
    isLoading,
    error,
    isInitialized,
    threadCounts,
    filteredThreads,
    
    // Actions
    handleFilterChange,
    handleSearchChange,
    handleThreadAction,
    
    // Utilities
    setError
  };
}