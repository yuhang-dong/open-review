import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as vscode from 'vscode';

/**
 * Configuration for setting up a test workspace
 */
export interface TestWorkspaceConfig {
	files: Array<{
		path: string;
		content: string;
	}>;
	folders?: string[];
}

/**
 * Helper class for managing test workspaces
 * Handles creation and cleanup of temporary workspaces for testing
 */
export class TestWorkspaceManager {
	private workspaceRoot: string | undefined;

	/**
	 * Set up a test workspace with specified files and folders
	 */
	async setup(config: TestWorkspaceConfig): Promise<vscode.Uri> {
		// Create temporary workspace directory
		this.workspaceRoot = await fs.mkdtemp(
			path.join(os.tmpdir(), 'open-review-test-')
		);

		// Create files
		for (const file of config.files) {
			const filePath = path.join(this.workspaceRoot, file.path);
			await fs.mkdir(path.dirname(filePath), { recursive: true });
			await fs.writeFile(filePath, file.content);
		}

		// Create folders
		if (config.folders) {
			for (const folder of config.folders) {
				await fs.mkdir(path.join(this.workspaceRoot, folder), { recursive: true });
			}
		}

		return vscode.Uri.file(this.workspaceRoot);
	}

	/**
	 * Clean up the test workspace
	 */
	async cleanup(): Promise<void> {
		if (this.workspaceRoot) {
			await fs.rm(this.workspaceRoot, { recursive: true, force: true });
			this.workspaceRoot = undefined;
		}
	}

	/**
	 * Get the absolute path for a file in the test workspace
	 */
	getFilePath(relativePath: string): string {
		if (!this.workspaceRoot) {
			throw new Error('Workspace not initialized. Call setup() first.');
		}
		return path.join(this.workspaceRoot, relativePath);
	}

	/**
	 * Get the workspace root URI
	 */
	getWorkspaceRoot(): vscode.Uri | undefined {
		return this.workspaceRoot ? vscode.Uri.file(this.workspaceRoot) : undefined;
	}
}
