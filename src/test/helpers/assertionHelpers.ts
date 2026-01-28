import * as assert from 'assert';
import * as vscode from 'vscode';

/**
 * Custom assertion helpers for extension-specific validations
 */
export class AssertionHelper {
	/**
	 * Assert that a thread exists in the thread list
	 */
	static assertThreadExists(threadId: string, threads: any[]): void {
		const thread = threads.find(t => t.id === threadId);
		assert.ok(thread, `Thread ${threadId} should exist`);
	}

	/**
	 * Assert that a thread has the expected number of comments
	 */
	static assertThreadHasComments(thread: any, expectedCount: number): void {
		assert.strictEqual(
			thread.comments.length,
			expectedCount,
			`Thread should have ${expectedCount} comments`
		);
	}

	/**
	 * Assert that a thread has the expected status
	 */
	static assertThreadStatus(thread: any, expectedStatus: 'open' | 'resolved'): void {
		assert.strictEqual(
			thread.status,
			expectedStatus,
			`Thread status should be ${expectedStatus}`
		);
	}

	/**
	 * Assert that a comment has the expected content
	 */
	static assertCommentContent(comment: any, expectedContent: string): void {
		assert.strictEqual(
			comment.content,
			expectedContent,
			'Comment content should match'
		);
	}

	/**
	 * Assert that a thread is at the expected location
	 */
	static assertThreadLocation(
		thread: any,
		expectedFile: string,
		expectedLine: number
	): void {
		assert.strictEqual(thread.filePath, expectedFile, 'File path should match');
		assert.strictEqual(thread.lineNumber, expectedLine, 'Line number should match');
	}

	/**
	 * Assert that a command executes without error
	 */
	static async assertCommandExecutes(command: string, ...args: any[]): Promise<void> {
		try {
			await vscode.commands.executeCommand(command, ...args);
		} catch (error) {
			assert.fail(`Command ${command} should execute without error: ${error}`);
		}
	}

	/**
	 * Assert that a condition eventually becomes true within a timeout
	 */
	static async assertEventuallyTrue(
		condition: () => boolean | Promise<boolean>,
		timeout: number = 3000,
		message?: string
	): Promise<void> {
		const startTime = Date.now();

		while (Date.now() - startTime < timeout) {
			if (await condition()) {
				return;
			}
			await new Promise(resolve => setTimeout(resolve, 50));
		}

		assert.fail(message || 'Condition did not become true within timeout');
	}
}
