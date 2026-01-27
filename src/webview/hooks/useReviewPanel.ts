import { useState, useEffect, useCallback, useRef } from 'react';
import { ReviewPanelState } from '../types/components';
import { FilterType, ExtensionMessage } from '../types';
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

  return {
    // State
    state,
    isLoading,
    error,
    isInitialized,
    
    // Actions
    handleFilterChange,
    handleSearchChange,
    
    // Utilities
    setError
  };
}