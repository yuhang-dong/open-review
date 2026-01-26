import * as vscode from 'vscode';
import { AssetManager } from '../utils/AssetManager';

export class SidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'openReview.webviewView';

    private _view?: vscode.WebviewView;
    private _assetManager: AssetManager;
    private _outputChannel: vscode.OutputChannel;

    constructor(private readonly _extensionUri: vscode.Uri) {
        this._assetManager = new AssetManager(_extensionUri);
        this._outputChannel = vscode.window.createOutputChannel('Open Review Sidebar');
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        try {
            this._outputChannel.appendLine('Initializing webview...');
            
            webviewView.webview.options = {
                // Allow scripts in the webview
                enableScripts: true,
                // Allow command URIs
                enableCommandUris: true,
                // Restrict the webview to only loading content from our extension's directory
                localResourceRoots: [
                    this._extensionUri
                ]
            };

            this._outputChannel.appendLine('Webview options configured successfully');

            // Set the HTML content for the webview using AssetManager (async)
            this._loadWebviewContent(webviewView);

            // Handle messages from the webview
            webviewView.webview.onDidReceiveMessage(
                message => {
                    try {
                        this._handleWebviewMessage(message);
                    } catch (error) {
                        this._outputChannel.appendLine(`Error handling webview message: ${error}`);
                        console.error('Error handling webview message:', error);
                    }
                },
                undefined,
                []
            );

            this._outputChannel.appendLine('Webview initialized successfully');
        } catch (error) {
            this._outputChannel.appendLine(`Critical error during webview initialization: ${error}`);
            console.error('Critical error during webview initialization:', error);
            
            // Show error to user
            vscode.window.showErrorMessage(`Failed to initialize sidebar webview: ${error instanceof Error ? error.message : String(error)}`);
            
            // Set fallback content
            webviewView.webview.html = this._getCriticalErrorHtml(error instanceof Error ? error.message : String(error));
        }
    }

    /**
     * Loads webview content asynchronously with comprehensive error handling
     */
    private async _loadWebviewContent(webviewView: vscode.WebviewView) {
        try {
            this._outputChannel.appendLine('Loading webview content...');
            
            // Set the HTML content for the webview using AssetManager
            webviewView.webview.html = await this._assetManager.getWebviewHtml(webviewView.webview);
            
            this._outputChannel.appendLine('Webview content loaded successfully');
        } catch (error) {
            this._outputChannel.appendLine(`Error loading webview content: ${error}`);
            console.error('Error loading webview content:', error);
            
            // Determine error type and provide appropriate fallback
            if (error instanceof Error) {
                if (error.message.includes('Failed to start development server')) {
                    this._outputChannel.appendLine('Development server failed to start, attempting fallback to production assets...');
                    await this._attemptProductionFallback(webviewView);
                } else if (error.message.includes('TypeScript')) {
                    this._outputChannel.appendLine('TypeScript compilation error detected');
                    webviewView.webview.html = this._getTypeScriptErrorHtml(error.message);
                } else {
                    webviewView.webview.html = this._getErrorHtml(error.message);
                }
            } else {
                webviewView.webview.html = this._getErrorHtml(`Unknown error: ${String(error)}`);
            }
            
            // Show user notification for critical errors
            vscode.window.showWarningMessage(
                'Webview failed to load. Check the Open Review Sidebar output channel for details.',
                'Show Output'
            ).then(selection => {
                if (selection === 'Show Output') {
                    this._outputChannel.show();
                }
            });
        }
    }

    /**
     * Attempts to fallback to production assets when dev server fails
     */
    private async _attemptProductionFallback(webviewView: vscode.WebviewView): Promise<void> {
        try {
            this._outputChannel.appendLine('Attempting production asset fallback...');
            
            // Force asset manager to use production mode
            const prodHtml = await this._assetManager.getProductionFallbackHtml(webviewView.webview);
            webviewView.webview.html = prodHtml;
            
            this._outputChannel.appendLine('Successfully loaded production assets as fallback');
            
            vscode.window.showInformationMessage(
                'Development server failed to start. Using production assets instead.',
                'Show Output'
            ).then(selection => {
                if (selection === 'Show Output') {
                    this._outputChannel.show();
                }
            });
        } catch (fallbackError) {
            this._outputChannel.appendLine(`Production fallback also failed: ${fallbackError}`);
            webviewView.webview.html = this._getDevServerErrorHtml(fallbackError instanceof Error ? fallbackError.message : String(fallbackError));
        }
    }

    /**
     * Handles messages from the webview with error handling
     */
    private _handleWebviewMessage(message: any): void {
        this._outputChannel.appendLine(`Received webview message: ${JSON.stringify(message)}`);
        
        switch (message.command) {
            case 'alert':
                vscode.window.showErrorMessage(message.text);
                break;
            case 'error':
                this._outputChannel.appendLine(`Webview reported error: ${message.error}`);
                console.error('Webview error:', message.error);
                break;
            case 'log':
                this._outputChannel.appendLine(`Webview log: ${message.message}`);
                break;
            case 'ready':
                this._outputChannel.appendLine('Webview reported ready state');
                break;
            default:
                this._outputChannel.appendLine(`Unknown webview message command: ${message.command}`);
        }
    }

    /**
     * Gets the asset manager instance for external access
     */
    public getAssetManager(): AssetManager {
        return this._assetManager;
    }

    /**
     * Disposes the sidebar provider and cleans up resources
     */
    public dispose(): void {
        try {
            this._outputChannel.appendLine('Disposing sidebar provider...');
            this._assetManager.dispose();
            this._outputChannel.appendLine('Sidebar provider disposed successfully');
            this._outputChannel.dispose();
        } catch (error) {
            console.error('Error during sidebar provider disposal:', error);
        }
    }

    /**
     * Generates error HTML when webview fails to load
     */
    private _getErrorHtml(errorMessage: string): string {
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Open Review - Error</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                        padding: 20px;
                        margin: 0;
                    }
                    .error-container {
                        text-align: center;
                        padding: 20px;
                    }
                    .error-icon {
                        font-size: 48px;
                        color: var(--vscode-errorForeground);
                        margin-bottom: 16px;
                    }
                    .error-message {
                        color: var(--vscode-errorForeground);
                        margin-bottom: 16px;
                        font-weight: bold;
                    }
                    .error-details {
                        font-size: 12px;
                        color: var(--vscode-descriptionForeground);
                        font-family: var(--vscode-editor-font-family);
                        background-color: var(--vscode-textCodeBlock-background);
                        padding: 8px;
                        border-radius: 4px;
                        text-align: left;
                        white-space: pre-wrap;
                        margin-bottom: 16px;
                    }
                    .retry-button {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 8px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-family: var(--vscode-font-family);
                    }
                    .retry-button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                </style>
            </head>
            <body>
                <div class="error-container">
                    <div class="error-icon">⚠️</div>
                    <div class="error-message">Failed to load webview</div>
                    <div class="error-details">${this._escapeHtml(errorMessage)}</div>
                    <button class="retry-button" onclick="window.location.reload()">Retry</button>
                </div>
                <script>
                    // Send error to extension for logging
                    const vscode = acquireVsCodeApi();
                    vscode.postMessage({
                        command: 'error',
                        error: '${this._escapeHtml(errorMessage)}'
                    });
                </script>
            </body>
            </html>`;
    }

    /**
     * Generates TypeScript compilation error HTML
     */
    private _getTypeScriptErrorHtml(errorMessage: string): string {
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Open Review - TypeScript Error</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                        padding: 20px;
                        margin: 0;
                    }
                    .error-container {
                        text-align: center;
                        padding: 20px;
                    }
                    .error-icon {
                        font-size: 48px;
                        color: var(--vscode-errorForeground);
                        margin-bottom: 16px;
                    }
                    .error-message {
                        color: var(--vscode-errorForeground);
                        margin-bottom: 16px;
                        font-weight: bold;
                    }
                    .error-details {
                        font-size: 12px;
                        color: var(--vscode-descriptionForeground);
                        font-family: var(--vscode-editor-font-family);
                        background-color: var(--vscode-textCodeBlock-background);
                        padding: 12px;
                        border-radius: 4px;
                        text-align: left;
                        white-space: pre-wrap;
                        margin-bottom: 16px;
                        border-left: 4px solid var(--vscode-errorForeground);
                    }
                    .help-text {
                        font-size: 14px;
                        color: var(--vscode-descriptionForeground);
                        margin-bottom: 16px;
                    }
                </style>
            </head>
            <body>
                <div class="error-container">
                    <div class="error-icon">🔧</div>
                    <div class="error-message">TypeScript Compilation Error</div>
                    <div class="help-text">Fix the TypeScript errors in your code and the webview will reload automatically.</div>
                    <div class="error-details">${this._escapeHtml(errorMessage)}</div>
                </div>
                <script>
                    const vscode = acquireVsCodeApi();
                    vscode.postMessage({
                        command: 'error',
                        error: 'TypeScript compilation error: ${this._escapeHtml(errorMessage)}'
                    });
                </script>
            </body>
            </html>`;
    }

    /**
     * Generates development server error HTML
     */
    private _getDevServerErrorHtml(errorMessage: string): string {
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Open Review - Dev Server Error</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                        padding: 20px;
                        margin: 0;
                    }
                    .error-container {
                        text-align: center;
                        padding: 20px;
                    }
                    .error-icon {
                        font-size: 48px;
                        color: var(--vscode-errorForeground);
                        margin-bottom: 16px;
                    }
                    .error-message {
                        color: var(--vscode-errorForeground);
                        margin-bottom: 16px;
                        font-weight: bold;
                    }
                    .error-details {
                        font-size: 12px;
                        color: var(--vscode-descriptionForeground);
                        font-family: var(--vscode-editor-font-family);
                        background-color: var(--vscode-textCodeBlock-background);
                        padding: 12px;
                        border-radius: 4px;
                        text-align: left;
                        white-space: pre-wrap;
                        margin-bottom: 16px;
                        border-left: 4px solid var(--vscode-errorForeground);
                    }
                    .help-text {
                        font-size: 14px;
                        color: var(--vscode-descriptionForeground);
                        margin-bottom: 16px;
                    }
                    .troubleshooting {
                        text-align: left;
                        background-color: var(--vscode-textBlockQuote-background);
                        padding: 12px;
                        border-radius: 4px;
                        margin-top: 16px;
                    }
                    .troubleshooting h4 {
                        margin-top: 0;
                        color: var(--vscode-foreground);
                    }
                    .troubleshooting ul {
                        margin: 8px 0;
                        padding-left: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="error-container">
                    <div class="error-icon">🚫</div>
                    <div class="error-message">Development Server Failed</div>
                    <div class="help-text">Both development server and production fallback failed to load.</div>
                    <div class="error-details">${this._escapeHtml(errorMessage)}</div>
                    <div class="troubleshooting">
                        <h4>Troubleshooting Steps:</h4>
                        <ul>
                            <li>Check if Node.js and npm are installed</li>
                            <li>Run <code>npm install</code> in the extension directory</li>
                            <li>Check the "Open Review Sidebar" output channel for detailed logs</li>
                            <li>Restart VS Code and try again</li>
                        </ul>
                    </div>
                </div>
                <script>
                    const vscode = acquireVsCodeApi();
                    vscode.postMessage({
                        command: 'error',
                        error: 'Dev server error: ${this._escapeHtml(errorMessage)}'
                    });
                </script>
            </body>
            </html>`;
    }

    /**
     * Generates critical error HTML for initialization failures
     */
    private _getCriticalErrorHtml(errorMessage: string): string {
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Open Review - Critical Error</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                        padding: 20px;
                        margin: 0;
                    }
                    .error-container {
                        text-align: center;
                        padding: 20px;
                    }
                    .error-icon {
                        font-size: 48px;
                        color: var(--vscode-errorForeground);
                        margin-bottom: 16px;
                    }
                    .error-message {
                        color: var(--vscode-errorForeground);
                        margin-bottom: 16px;
                        font-weight: bold;
                        font-size: 18px;
                    }
                    .error-details {
                        font-size: 12px;
                        color: var(--vscode-descriptionForeground);
                        font-family: var(--vscode-editor-font-family);
                        background-color: var(--vscode-textCodeBlock-background);
                        padding: 12px;
                        border-radius: 4px;
                        text-align: left;
                        white-space: pre-wrap;
                        margin-bottom: 16px;
                        border: 2px solid var(--vscode-errorForeground);
                    }
                </style>
            </head>
            <body>
                <div class="error-container">
                    <div class="error-icon">💥</div>
                    <div class="error-message">Critical Initialization Error</div>
                    <div class="error-details">${this._escapeHtml(errorMessage)}</div>
                    <p>Please restart VS Code and check the extension logs.</p>
                </div>
            </body>
            </html>`;
    }

    /**
     * Escapes HTML characters to prevent XSS
     */
    private _escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}