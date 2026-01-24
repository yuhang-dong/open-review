import * as vscode from 'vscode';
import { AssetManager } from '../utils/AssetManager';

export class SidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'openReview.sidebarView';

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

        // Set the HTML content for the webview using AssetManager
        webviewView.webview.html = this._assetManager.getWebviewHtml(webviewView.webview);

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
}