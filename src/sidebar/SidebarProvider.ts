import * as vscode from 'vscode';
import { AssetManager } from '../utils/AssetManager';

export class SidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'openReview.webviewView';

    private _view?: vscode.WebviewView;
    private _assetManager: AssetManager;

    constructor(private readonly _extensionUri: vscode.Uri) {
        this._assetManager = new AssetManager(_extensionUri);
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

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

        // Set the HTML content for the webview using AssetManager (async)
        this._loadWebviewContent(webviewView);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'alert':
                        vscode.window.showErrorMessage(message.text);
                        return;
                }
            },
            undefined,
            []
        );
    }

    /**
     * Loads webview content asynchronously
     */
    private async _loadWebviewContent(webviewView: vscode.WebviewView) {
        try {
            // Set the HTML content for the webview using AssetManager
            webviewView.webview.html = await this._assetManager.getWebviewHtml(webviewView.webview);
        } catch (error) {
            // Fallback to a simple error message if dev server fails
            webviewView.webview.html = this._getErrorHtml(`Failed to load webview: ${error}`);
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
        this._assetManager.dispose();
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
                    }
                </style>
            </head>
            <body>
                <div class="error-container">
                    <div class="error-icon">⚠️</div>
                    <div class="error-message">Failed to load webview</div>
                    <div class="error-details">${errorMessage}</div>
                </div>
            </body>
            </html>`;
    }
}