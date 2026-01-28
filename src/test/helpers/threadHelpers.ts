import * as vscode from 'vscode';
import { ExtensionTestHelper } from './extensionHelpers';

/**
 * Helper class for creating and manipulating comment threads in tests
 */
export class ThreadTestHelper {
	private extensionHelper: ExtensionTestHelper;

	constructor(extensionHelper: ExtensionTestHelper) {
		this.extensionHelper = extensionHelper;
	}

	/**
	 * Sleep for specified milliseconds
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * Create a comment thread at the specified location
	 */
	async createThread(
		fileUri: vscode.Uri,
		line: number,
		content: string,
		author: string = 'Test User'
	): Promise<string> {
		// Open the document
		const document = await vscode.workspace.openTextDocument(fileUri);
		await vscode.window.showTextDocument(document);

		// Create a comment reply object
		const range = new vscode.Range(line, 0, line, 0);
		const reply: vscode.CommentReply = {
			thread: {
				uri: fileUri,
				range: range,
				comments: [],
				collapsibleState: vscode.CommentThreadCollapsibleState.Expanded,
				canReply: true,
				dispose: () => {}
			} as any,
			text: content
		};

		// Execute create comment command
		await vscode.commands.executeCommand('openReview.createComment', reply);

		// Wait for thread to be created
		await this.sleep(100);
		
		// Get the thread ID from the thread manager
		return this.getLatestThreadId(fileUri, line);
	}

	/**
	 * Get the latest thread ID for a specific file and line
	 */
	private getLatestThreadId(fileUri: vscode.Uri, line: number): string {
		const threadManager = this.extensionHelper.getThreadManager();
		if (!threadManager) {
			throw new Error('ThreadManager not available');
		}

		const allThreads = threadManager.getAllThreads();
		
		// Find the thread at the specified location
		const thread = allThreads.find(t => 
			t.uri.toString() === fileUri.toString() && 
			t.range && t.range.start.line === line
		);

		if (!thread || !thread.customId) {
			throw new Error(`Thread not found at ${fileUri.toString()}:${line}`);
		}

		return thread.customId;
	}

	/**
	 * Get all thread IDs
	 */
	getAllThreadIds(): string[] {
		const threadManager = this.extensionHelper.getThreadManager();
		if (!threadManager) {
			throw new Error('ThreadManager not available');
		}

		return threadManager.getAllThreads()
			.map(t => t.customId)
			.filter((id): id is string => id !== undefined);
	}

	/**
	 * Get thread by ID
	 */
	getThreadById(threadId: string): any {
		const threadManager = this.extensionHelper.getThreadManager();
		if (!threadManager) {
			throw new Error('ThreadManager not available');
		}

		const thread = threadManager.findThreadById(threadId);
		if (!thread) {
			throw new Error(`Thread ${threadId} not found`);
		}

		return thread;
	}

	/**
	 * Reply to an existing thread
	 */
	async replyToThread(threadId: string, content: string, author: string = 'Test User'): Promise<void> {
		await vscode.commands.executeCommand(
			'openReview.replyToThread',
			threadId,
			content,
			author
		);
		await this.sleep(50);
	}

	/**
	 * Resolve a thread
	 */
	async resolveThread(threadId: string): Promise<void> {
		await vscode.commands.executeCommand('openReview.resolveThread', threadId);
		await this.sleep(50);
	}

	/**
	 * Reopen a resolved thread
	 */
	async reopenThread(threadId: string): Promise<void> {
		await vscode.commands.executeCommand('openReview.reopenThread', threadId);
		await this.sleep(50);
	}

	/**
	 * Delete a thread
	 */
	async deleteThread(threadId: string): Promise<void> {
		await vscode.commands.executeCommand('openReview.deleteThreadById', threadId);
		await this.sleep(50);
	}

	/**
	 * Delete a specific comment from a thread
	 */
	async deleteComment(threadId: string, commentId: number): Promise<void> {
		await vscode.commands.executeCommand('openReview.deleteCommentById', threadId, commentId);
		await this.sleep(50);
	}
}
