import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import * as net from 'net';

/**
 * Development server status
 */
export enum DevServerStatus {
  STOPPED = 'stopped',
  STARTING = 'starting',
  RUNNING = 'running',
  ERROR = 'error'
}

/**
 * Development server configuration
 */
export interface DevServerConfig {
  port: number;
  host: string;
  protocol: 'http' | 'https';
  hmr: boolean;
  hmrPort: number;
}

/**
 * DevServerManager handles automatic Vite dev server startup, port detection,
 * and conflict resolution for the webview development workflow.
 * 
 * Responsibilities:
 * - Start and stop Vite dev server automatically
 * - Detect and resolve port conflicts
 * - Provide server status and URL information
 * - Handle server lifecycle events
 */
export class DevServerManager {
  private readonly _extensionUri: vscode.Uri;
  private readonly _webviewPath: string;
  private _serverProcess: cp.ChildProcess | null = null;
  private _status: DevServerStatus = DevServerStatus.STOPPED;
  private _config: DevServerConfig;
  private _outputChannel: vscode.OutputChannel;
  private _statusBarItem: vscode.StatusBarItem;

  // Event emitters for status changes
  private _onStatusChanged = new vscode.EventEmitter<DevServerStatus>();
  public readonly onStatusChanged = this._onStatusChanged.event;

  constructor(extensionUri: vscode.Uri) {
    this._extensionUri = extensionUri;
    this._webviewPath = path.join(extensionUri.fsPath, 'src', 'webview');
    this._config = {
      port: 3000,
      host: 'localhost',
      protocol: 'http',
      hmr: true,
      hmrPort: 3001
    };

    // Create output channel for dev server logs
    this._outputChannel = vscode.window.createOutputChannel('Open Review Dev Server');
    
    // Create status bar item
    this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this._statusBarItem.text = '$(server) Dev Server: Stopped';
    this._statusBarItem.tooltip = 'Open Review Development Server Status';
    this._statusBarItem.show();

    // Update status bar when status changes
    this.onStatusChanged(status => {
      this._updateStatusBar(status);
    });
  }

  /**
   * Gets the current server status
   */
  public get status(): DevServerStatus {
    return this._status;
  }

  /**
   * Gets the current server configuration
   */
  public get config(): DevServerConfig {
    return { ...this._config };
  }

  /**
   * Gets the development server URL
   */
  public getServerUrl(): string {
    return `${this._config.protocol}://${this._config.host}:${this._config.port}`;
  }

  /**
   * Gets the HMR WebSocket URL
   */
  public getHmrUrl(): string {
    return `ws://${this._config.host}:${this._config.hmrPort}`;
  }

  /**
   * Starts the development server with automatic port detection
   */
  public async startServer(): Promise<boolean> {
    if (this._status === DevServerStatus.RUNNING || this._status === DevServerStatus.STARTING) {
      return true;
    }

    this._setStatus(DevServerStatus.STARTING);
    this._outputChannel.appendLine('Starting Vite development server...');

    try {
      // Find available ports
      const availablePort = await this._findAvailablePort(this._config.port);
      const availableHmrPort = await this._findAvailablePort(this._config.hmrPort);

      if (availablePort !== this._config.port) {
        this._outputChannel.appendLine(`Port ${this._config.port} is busy, using port ${availablePort}`);
        this._config.port = availablePort;
      }

      if (availableHmrPort !== this._config.hmrPort) {
        this._outputChannel.appendLine(`HMR port ${this._config.hmrPort} is busy, using port ${availableHmrPort}`);
        this._config.hmrPort = availableHmrPort;
      }

      // Start the Vite dev server
      const success = await this._spawnDevServer();
      
      if (success) {
        this._setStatus(DevServerStatus.RUNNING);
        this._outputChannel.appendLine(`Development server started at ${this.getServerUrl()}`);
        this._outputChannel.appendLine(`HMR WebSocket available at ${this.getHmrUrl()}`);
        return true;
      } else {
        this._setStatus(DevServerStatus.ERROR);
        return false;
      }
    } catch (error) {
      this._outputChannel.appendLine(`Failed to start development server: ${error}`);
      this._setStatus(DevServerStatus.ERROR);
      return false;
    }
  }

  /**
   * Stops the development server
   */
  public async stopServer(): Promise<void> {
    if (this._status === DevServerStatus.STOPPED) {
      return;
    }

    this._outputChannel.appendLine('Stopping development server...');

    if (this._serverProcess) {
      // Gracefully terminate the process
      this._serverProcess.kill('SIGTERM');
      
      // Wait for process to exit or force kill after timeout
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          if (this._serverProcess && !this._serverProcess.killed) {
            this._serverProcess.kill('SIGKILL');
          }
          resolve();
        }, 5000);

        if (this._serverProcess) {
          this._serverProcess.on('exit', () => {
            clearTimeout(timeout);
            resolve();
          });
        } else {
          clearTimeout(timeout);
          resolve();
        }
      });

      this._serverProcess = null;
    }

    this._setStatus(DevServerStatus.STOPPED);
    this._outputChannel.appendLine('Development server stopped');
  }

  /**
   * Restarts the development server
   */
  public async restartServer(): Promise<boolean> {
    await this.stopServer();
    return await this.startServer();
  }

  /**
   * Checks if the development server is running and accessible
   */
  public async isServerAccessible(): Promise<boolean> {
    if (this._status !== DevServerStatus.RUNNING) {
      return false;
    }

    return new Promise((resolve) => {
      const socket = new net.Socket();
      const timeout = setTimeout(() => {
        socket.destroy();
        resolve(false);
      }, 2000);

      socket.connect(this._config.port, this._config.host, () => {
        clearTimeout(timeout);
        socket.destroy();
        resolve(true);
      });

      socket.on('error', () => {
        clearTimeout(timeout);
        resolve(false);
      });
    });
  }

  /**
   * Disposes resources and stops the server
   */
  public dispose(): void {
    this.stopServer();
    this._outputChannel.dispose();
    this._statusBarItem.dispose();
    this._onStatusChanged.dispose();
  }

  /**
   * Finds an available port starting from the given port number
   */
  private async _findAvailablePort(startPort: number): Promise<number> {
    const maxAttempts = 10;
    
    for (let i = 0; i < maxAttempts; i++) {
      const port = startPort + i;
      const isAvailable = await this._isPortAvailable(port);
      
      if (isAvailable) {
        return port;
      }
    }

    throw new Error(`No available port found after ${maxAttempts} attempts starting from ${startPort}`);
  }

  /**
   * Checks if a port is available
   */
  private _isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.listen(port, this._config.host, () => {
        server.close(() => resolve(true));
      });

      server.on('error', () => resolve(false));
    });
  }

  /**
   * Spawns the Vite development server process
   */
  private _spawnDevServer(): Promise<boolean> {
    return new Promise((resolve) => {
      const viteConfigPath = path.join(this._webviewPath, 'vite.config.ts');
      
      // Use npm run dev:webview command which uses the vite config
      const args = ['run', 'dev:webview'];
      
      // Set environment variables for the dev server
      const env = {
        ...process.env,
        VITE_DEV_SERVER_PORT: this._config.port.toString(),
        VITE_HMR_PORT: this._config.hmrPort.toString(),
        NODE_ENV: 'development'
      };

      this._serverProcess = cp.spawn('npm', args, {
        cwd: this._extensionUri.fsPath,
        env,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let serverStarted = false;
      const startupTimeout = setTimeout(() => {
        if (!serverStarted) {
          this._outputChannel.appendLine('Server startup timeout');
          resolve(false);
        }
      }, 30000); // 30 second timeout

      // Handle stdout
      if (this._serverProcess.stdout) {
        this._serverProcess.stdout.on('data', (data: Buffer) => {
          const output = data.toString();
          this._outputChannel.append(output);

          // Check for server ready indicators
          if (output.includes('Local:') || output.includes('ready in') || output.includes(`localhost:${this._config.port}`)) {
            if (!serverStarted) {
              serverStarted = true;
              clearTimeout(startupTimeout);
              resolve(true);
            }
          }
        });
      }

      // Handle stderr
      if (this._serverProcess.stderr) {
        this._serverProcess.stderr.on('data', (data: Buffer) => {
          const error = data.toString();
          this._outputChannel.append(`Error: ${error}`);
          
          // Check for port conflict errors
          if (error.includes('EADDRINUSE') || error.includes('address already in use')) {
            this._outputChannel.appendLine('Port conflict detected, will retry with different port');
          }
        });
      }

      // Handle process exit
      this._serverProcess.on('exit', (code, signal) => {
        this._outputChannel.appendLine(`Development server exited with code ${code}, signal ${signal}`);
        this._serverProcess = null;
        
        if (!serverStarted) {
          clearTimeout(startupTimeout);
          resolve(false);
        }
        
        // Update status if server exits unexpectedly
        if (this._status === DevServerStatus.RUNNING) {
          this._setStatus(DevServerStatus.ERROR);
        }
      });

      // Handle process errors
      this._serverProcess.on('error', (error) => {
        this._outputChannel.appendLine(`Failed to start development server: ${error.message}`);
        clearTimeout(startupTimeout);
        
        if (!serverStarted) {
          resolve(false);
        }
      });
    });
  }

  /**
   * Sets the server status and emits change event
   */
  private _setStatus(status: DevServerStatus): void {
    if (this._status !== status) {
      this._status = status;
      this._onStatusChanged.fire(status);
    }
  }

  /**
   * Updates the status bar item based on current status
   */
  private _updateStatusBar(status: DevServerStatus): void {
    switch (status) {
      case DevServerStatus.STOPPED:
        this._statusBarItem.text = '$(server) Dev Server: Stopped';
        this._statusBarItem.backgroundColor = undefined;
        break;
      case DevServerStatus.STARTING:
        this._statusBarItem.text = '$(loading~spin) Dev Server: Starting...';
        this._statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        break;
      case DevServerStatus.RUNNING:
        this._statusBarItem.text = `$(server) Dev Server: Running (${this._config.port})`;
        this._statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
        break;
      case DevServerStatus.ERROR:
        this._statusBarItem.text = '$(error) Dev Server: Error';
        this._statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        break;
    }
  }
}