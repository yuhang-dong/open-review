import * as vscode from 'vscode';
import { ThreadManager } from '../../utils/ThreadManager';
import { SidebarProvider } from '../../sidebar/SidebarProvider';

// Extension API interface
interface ExtensionAPI {
	threadManager: ThreadManager;
	sidebarProvider: SidebarProvider;
}

/**
 * Helper class for interacting with the extension during tests
 */
export class ExtensionTestHelper {
	private extension: vscode.Extension<ExtensionAPI> | undefined;
	private api: ExtensionAPI | undefined;

	/**
	 * Activate the extension and wait for it to be ready
	 */
	async activate(): Promise<void> {
		this.extension = vscode.extensions.getExtension('openreview.open-review');
		if (!this.extension) {
			throw new Error('Extension not found');
		}

		if (!this.extension.isActive) {
			this.api = await this.extension.activate();
		} else {
			this.api = this.extension.exports;
		}

		// Wait for extension to fully initialize
		await this.waitForExtensionReady();
	}

	/**
	 * Wait for the extension to be fully initialized
	 */
	async waitForExtensionReady(timeout: number = 5000): Promise<void> {
		const startTime = Date.now();
		
		// Poll until extension is ready or timeout
		while (Date.now() - startTime < timeout) {
			// Check if commands are registered
			const commands = await vscode.commands.getCommands();
			if (commands.includes('openReview.createComment')) {
				return;
			}
			
			await this.sleep(100);
		}
		
		throw new Error('Extension failed to initialize within timeout');
	}

	/**
	 * Execute a VS Code command
	 */
	async executeCommand<T>(command: string, ...args: any[]): Promise<T> {
		return await vscode.commands.executeCommand<T>(command, ...args);
	}

	/**
	 * Get the extension instance
	 */
	getExtension(): vscode.Extension<ExtensionAPI> | undefined {
		return this.extension;
	}

	/**
	 * Get the thread manager (for testing purposes)
	 */
	getThreadManager(): ThreadManager | undefined {
		return this.api?.threadManager;
	}

	/**
	 * Get the sidebar provider (for testing purposes)
	 */
	getSidebarProvider(): SidebarProvider | undefined {
		return this.api?.sidebarProvider;
	}

	/**
	 * Sleep for specified milliseconds
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}
