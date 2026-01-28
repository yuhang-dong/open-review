import * as vscode from 'vscode';

/**
 * Helper class for creating and manipulating comment threads in tests
 */
export class ThreadTestHelper {
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
		
		// Return placeholder ID (will be implemented with actual thread retrieval)
		return 'thread-id-placeholder';
	}

	/**
	 * Reply to an existing thread
	 */
	async replyToThread(threadId: string, content: string, author: string = 'Test User'): Promise<void> {
		await vscode.commands.executeCommand(
			'openReview.replyComment',
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
		await vscode.commands.executeCommand('openReview.deleteThread', threadId);
		await this.sleep(50);
	}
}
