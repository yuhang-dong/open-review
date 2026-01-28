import * as vscode from 'vscode';

/**
 * Helper class for interacting with the extension during tests
 */
export class ExtensionTestHelper {
	private extension: vscode.Extension<any> | undefined;

	/**
	 * Activate the extension and wait for it to be ready
	 */
	async activate(): Promise<void> {
		this.extension = vscode.extensions.getExtension('openreview.open-review');
		if (!this.extension) {
			throw new Error('Extension not found');
		}

		if (!this.extension.isActive) {
			await this.extension.activate();
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
	getExtension(): vscode.Extension<any> | undefined {
		return this.extension;
	}

	/**
	 * Sleep for specified milliseconds
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}
