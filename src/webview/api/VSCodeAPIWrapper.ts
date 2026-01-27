// VS Code API Wrapper for webview communication
// Provides type-safe message handling with validation and error handling

import { VSCodeAPI, ExtensionMessage, WebviewMessage } from '../types';

/**
 * Error types for webview communication
 */
export class WebviewCommunicationError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'WebviewCommunicationError';
  }
}

export class MessageValidationError extends Error {
  constructor(message: string, public readonly invalidMessage?: unknown) {
    super(message);
    this.name = 'MessageValidationError';
  }
}

/**
 * Message handler type for extension messages
 */
export type MessageHandler<T extends ExtensionMessage = ExtensionMessage> = (message: T) => void;

/**
 * Wrapper class for VS Code webview API with type safety and error handling
 */
export class VSCodeAPIWrapper {
  private vscode: VSCodeAPI;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private isInitialized = false;

  constructor(vscode?: VSCodeAPI) {
    // Acquire VS Code API if not provided
    this.vscode = vscode || this.acquireVSCodeAPI();
    this.setupMessageListener();
  }

  /**
   * Safely acquire VS Code API with error handling
   */
  private acquireVSCodeAPI(): VSCodeAPI {
    try {
      // @ts-ignore - VS Code API is injected globally
      const api = acquireVsCodeApi();
      if (!api) {
        throw new WebviewCommunicationError('VS Code API not available');
      }
      return api;
    } catch (error) {
      throw new WebviewCommunicationError(
        'Failed to acquire VS Code API',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Set up message listener for extension messages
   */
  private setupMessageListener(): void {
    try {
      window.addEventListener('message', (event) => {
        try {
          const message = event.data as ExtensionMessage;
          this.handleExtensionMessage(message);
        } catch (error) {
          console.error('Error handling extension message:', error);
          // Don't throw here to prevent breaking the message loop
        }
      });
    } catch (error) {
      throw new WebviewCommunicationError(
        'Failed to setup message listener',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Validate extension message structure
   */
  private validateExtensionMessage(message: unknown): message is ExtensionMessage {
    if (!message || typeof message !== 'object') {
      return false;
    }

    const msg = message as Record<string, unknown>;

    if (typeof msg.type !== 'string') {
      return false;
    }

    const validTypes = ['updateThreads', 'themeChanged', 'navigateToFile'];
    if (!validTypes.includes(msg.type)) {
      return false;
    }

    // Validate payload structure based on message type
    switch (msg.type) {
      case 'updateThreads':
        return !!(msg.payload && 
                 typeof msg.payload === 'object' && 
                 Array.isArray((msg.payload as any).threads));
      case 'themeChanged':
        return !!(msg.payload && 
                 typeof msg.payload === 'object' && 
                 typeof (msg.payload as any).theme === 'string' && 
                 ['light', 'dark'].includes((msg.payload as any).theme));
      case 'navigateToFile':
        return !!(msg.payload && 
                 typeof msg.payload === 'object' && 
                 typeof (msg.payload as any).filePath === 'string');
      default:
        return false;
    }
  }

  /**
   * Handle incoming extension messages
   */
  private handleExtensionMessage(message: unknown): void {
    if (!this.validateExtensionMessage(message)) {
      const error = new MessageValidationError(
        `Invalid extension message format: ${JSON.stringify(message)}`,
        message
      );
      console.error(error.message, error.invalidMessage);
      return;
    }

    const handlers = this.messageHandlers.get(message.type) || [];
    handlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error(`Error in message handler for ${message.type}:`, error);
      }
    });
  }

  /**
   * Send message to extension host
   * TypeScript ensures message structure at compile time
   */
  public postMessage(message: WebviewMessage): void {
    try {
      this.vscode.postMessage(message);
    } catch (error) {
      throw new WebviewCommunicationError(
        'Failed to send message to extension',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Register message handler for specific message type
   */
  public onDidReceiveMessage<T extends ExtensionMessage>(
    messageType: T['type'],
    handler: MessageHandler<T>
  ): () => void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }

    const handlers = this.messageHandlers.get(messageType)!;
    handlers.push(handler as MessageHandler);

    // Return unsubscribe function
    return () => {
      const index = handlers.indexOf(handler as MessageHandler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    };
  }

  /**
   * Convenience method to send reply message
   */
  public replyToThread(threadId: string, content: string, author: { name: string; avatarUrl?: string; email?: string }): void {
    this.postMessage({
      type: 'replyToThread',
      payload: { threadId, content, author }
    });
  }

  /**
   * Convenience method to resolve thread
   */
  public resolveThread(threadId: string): void {
    this.postMessage({
      type: 'resolveThread',
      payload: { threadId }
    });
  }

  /**
   * Convenience method to navigate to location
   */
  public navigateToLocation(filePath: string, lineNumber: number): void {
    this.postMessage({
      type: 'navigateToLocation',
      payload: { filePath, lineNumber }
    });
  }

  /**
   * Initialize the webview by sending ready message
   */
  public initialize(): void {
    if (this.isInitialized) {
      console.warn('VSCodeAPIWrapper already initialized');
      return;
    }

    try {
      this.postMessage({ type: 'ready', payload: {} });
      this.isInitialized = true;
    } catch (error) {
      throw new WebviewCommunicationError(
        'Failed to initialize webview communication',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get webview state
   */
  public getState(): any {
    try {
      return this.vscode.getState();
    } catch (error) {
      throw new WebviewCommunicationError(
        'Failed to get webview state',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Set webview state
   */
  public setState(state: any): void {
    try {
      this.vscode.setState(state);
    } catch (error) {
      throw new WebviewCommunicationError(
        'Failed to set webview state',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Check if the wrapper is initialized
   */
  public get initialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.messageHandlers.clear();
    this.isInitialized = false;
  }
}

/**
 * Create a singleton instance of the API wrapper
 */
let apiWrapperInstance: VSCodeAPIWrapper | null = null;

/**
 * Get or create the API wrapper instance
 */
export function getVSCodeAPIWrapper(vscode?: VSCodeAPI): VSCodeAPIWrapper {
  if (!apiWrapperInstance) {
    apiWrapperInstance = new VSCodeAPIWrapper(vscode);
  }
  return apiWrapperInstance;
}

/**
 * Reset the API wrapper instance (mainly for testing)
 */
export function resetVSCodeAPIWrapper(): void {
  if (apiWrapperInstance) {
    apiWrapperInstance.dispose();
    apiWrapperInstance = null;
  }
}