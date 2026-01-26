import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { DevServerManager, DevServerStatus } from './DevServerManager';

/**
 * Asset manifest structure for production builds
 */
interface AssetManifest {
  entryPoints: {
    main: {
      js: string[];
      css: string[];
    };
  };
  base: string;
}

/**
 * Development server configuration
 */
interface DevServerConfig {
  port: number;
  host: string;
  protocol: 'http' | 'https';
  hmr: boolean;
}

/**
 * AssetManager handles loading of React application assets in both development and production modes.
 * 
 * Responsibilities:
 * - Detect development vs production environment
 * - Generate proper asset URIs for webview consumption
 * - Handle Vite dev server integration in development mode
 * - Load pre-built assets in production mode
 * - Manage automatic dev server startup and lifecycle
 */
export class AssetManager {
  private readonly _extensionUri: vscode.Uri;
  private readonly _webviewDistPath: string;
  private readonly _devServerConfig: DevServerConfig;
  private _manifest: AssetManifest | null = null;
  private _devServerManager: DevServerManager | null = null;

  constructor(extensionUri: vscode.Uri) {
    this._extensionUri = extensionUri;
    this._webviewDistPath = path.join(extensionUri.fsPath, 'out', 'webview');
    this._devServerConfig = {
      port: 3000,
      host: 'localhost',
      protocol: 'http',
      hmr: true
    };
  }

  /**
   * Determines if the extension is running in development mode
   * Development mode is detected by checking if Vite dev server is running
   * or if NODE_ENV is set to 'development'
   */
  public isDevelopmentMode(): boolean {
    // Check environment variable first
    if (process.env.NODE_ENV === 'development') {
      return true;
    }

    // Check if we're in extension development host (when debugging extension)
    if (vscode.env.sessionId && vscode.env.machineId === 'someValue') {
      return true;
    }

    // Check if production assets exist - if not, assume development
    const manifestPath = path.join(this._webviewDistPath, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      return true;
    }

    return false;
  }

  /**
   * Gets the complete HTML content for the webview
   * Handles both development and production asset loading
   * Automatically starts dev server in development mode
   */
  public async getWebviewHtml(webview: vscode.Webview): Promise<string> {
    const isDev = this.isDevelopmentMode();
    
    if (isDev) {
      // Ensure dev server is running
      await this._ensureDevServerRunning();
      return this._getDevHtml(webview);
    } else {
      return this._getProdHtml(webview);
    }
  }

  /**
   * Gets asset URIs for the current environment
   * Returns arrays of JS and CSS URIs that can be used in webview
   */
  public getAssetUris(webview: vscode.Webview): { js: vscode.Uri[], css: vscode.Uri[] } {
    const isDev = this.isDevelopmentMode();
    
    if (isDev) {
      return this._getDevAssetUris(webview);
    } else {
      return this._getProdAssetUris(webview);
    }
  }

  /**
   * Generates development HTML with Vite dev server integration
   */
  private _getDevHtml(webview: vscode.Webview): string {
    const devServerUrl = this._getDevServerUrl();
    
    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src ${devServerUrl}; img-src ${webview.cspSource} https: data:; style-src ${webview.cspSource} 'unsafe-inline';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Open Review</title>
        <style>
          body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100vh;
            overflow: hidden;
          }
          iframe {
            width: 100%;
            height: 100%;
            border: none;
          }
        </style>
      </head>
      <body>
        <iframe src="${devServerUrl}" title="Open Review React App"></iframe>
      </body>
      </html>`;
  }

  /**
   * Generates production HTML with pre-built assets
   */
  private _getProdHtml(webview: vscode.Webview): string {
    const assets = this._getProdAssetUris(webview);
    const nonce = this._getNonce();

    // Generate CSS link tags
    const cssLinks = assets.css.map(uri => 
      `<link href="${uri}" rel="stylesheet">`
    ).join('\n        ');

    // Generate script tags
    const scriptTags = assets.js.map(uri => 
      `<script nonce="${nonce}" src="${uri}"></script>`
    ).join('\n        ');

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${cssLinks}
        <title>Open Review</title>
      </head>
      <body>
        <div id="root"></div>
        ${scriptTags}
      </body>
      </html>`;
  }

  /**
   * Gets development asset URIs (points to Vite dev server)
   */
  private _getDevAssetUris(webview: vscode.Webview): { js: vscode.Uri[], css: vscode.Uri[] } {
    const devServerUrl = this._getDevServerUrl();
    
    // In development, we only need the main entry point
    // CSS is injected by Vite automatically
    return {
      js: [vscode.Uri.parse(`${devServerUrl}/src/main.tsx`)],
      css: [] // CSS is handled by Vite HMR
    };
  }

  /**
   * Gets production asset URIs from built files
   */
  private _getProdAssetUris(webview: vscode.Webview): { js: vscode.Uri[], css: vscode.Uri[] } {
    const manifest = this._loadManifest();
    
    if (!manifest) {
      // Fallback to expected file names if manifest is not available
      return {
        js: [webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'out', 'webview', 'assets', 'index.js'))],
        css: [webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'out', 'webview', 'assets', 'index.css'))]
      };
    }

    const jsUris = manifest.entryPoints.main.js.map(jsFile => 
      webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'out', 'webview', jsFile))
    );

    const cssUris = manifest.entryPoints.main.css.map(cssFile => 
      webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'out', 'webview', cssFile))
    );

    return { js: jsUris, css: cssUris };
  }

  /**
   * Loads the asset manifest from production build
   */
  private _loadManifest(): AssetManifest | null {
    if (this._manifest) {
      return this._manifest;
    }

    const manifestPath = path.join(this._webviewDistPath, 'manifest.json');
    
    try {
      if (fs.existsSync(manifestPath)) {
        const manifestContent = fs.readFileSync(manifestPath, 'utf8');
        this._manifest = JSON.parse(manifestContent);
        return this._manifest;
      }
    } catch (error) {
      console.error('Failed to load asset manifest:', error);
    }

    return null;
  }

  /**
   * Generates a cryptographically secure nonce for CSP
   */
  private _getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  /**
   * Gets the development server URL for external access
   */
  public getDevServerUrl(): string {
    return this._getDevServerUrl();
  }

  /**
   * Updates the development server configuration
   */
  public updateDevServerConfig(config: Partial<DevServerConfig>): void {
    Object.assign(this._devServerConfig, config);
  }

  /**
   * Gets the dev server manager instance
   */
  public getDevServerManager(): DevServerManager | null {
    return this._devServerManager;
  }

  /**
   * Starts the development server if not already running
   */
  public async startDevServer(): Promise<boolean> {
    if (!this._devServerManager) {
      this._devServerManager = new DevServerManager(this._extensionUri);
    }
    
    return await this._devServerManager.startServer();
  }

  /**
   * Stops the development server
   */
  public async stopDevServer(): Promise<void> {
    if (this._devServerManager) {
      await this._devServerManager.stopServer();
    }
  }

  /**
   * Disposes the asset manager and stops dev server
   */
  public dispose(): void {
    if (this._devServerManager) {
      this._devServerManager.dispose();
      this._devServerManager = null;
    }
  }

  /**
   * Ensures the development server is running
   */
  private async _ensureDevServerRunning(): Promise<void> {
    if (!this._devServerManager) {
      this._devServerManager = new DevServerManager(this._extensionUri);
    }

    if (this._devServerManager.status !== DevServerStatus.RUNNING) {
      const started = await this._devServerManager.startServer();
      if (!started) {
        throw new Error('Failed to start development server');
      }
    }
  }

  /**
   * Gets the current development server URL
   */
  private _getDevServerUrl(): string {
    if (this._devServerManager) {
      return this._devServerManager.getServerUrl();
    }
    
    // Fallback to default configuration
    return `${this._devServerConfig.protocol}://${this._devServerConfig.host}:${this._devServerConfig.port}`;
  }

  /**
   * Gets the HMR WebSocket URL for live reloading
   */
  private _getHmrWebSocketUrl(): string {
    if (this._devServerManager) {
      return this._devServerManager.getHmrUrl();
    }
    
    // Fallback to default HMR port
    return `ws://${this._devServerConfig.host}:3001`;
  }
}