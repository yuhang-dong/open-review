import * as vscode from 'vscode';
import { ReviewComment } from '../../types/ReviewComment';
import { ExtendedCommentThread } from '../../utils/ThreadManager';

/**
 * Thread data for building test threads
 */
interface ThreadData {
	uri?: vscode.Uri;
	range?: vscode.Range;
	comments: vscode.Comment[];
	collapsibleState: vscode.CommentThreadCollapsibleState;
	canReply: boolean;
	state?: vscode.CommentThreadState;
	contextValue?: string;
	customId?: string;
	createdAt?: Date;
	updatedAt?: Date;
	label?: string;
}

/**
 * Builder class for creating test thread data
 * Provides a fluent API for constructing comment threads with various configurations
 */
export class ThreadBuilder {
	private threadData: ThreadData = {
		comments: [],
		collapsibleState: vscode.CommentThreadCollapsibleState.Expanded,
		canReply: true,
		state: vscode.CommentThreadState.Unresolved
	};
	private commentCounter = 0;

	/**
	 * Set the thread ID
	 */
	withId(id: string): this {
		this.threadData.customId = id;
		return this;
	}

	/**
	 * Set the file URI
	 */
	withFile(fileUri: vscode.Uri): this {
		this.threadData.uri = fileUri;
		return this;
	}

	/**
	 * Set the file path (converts to URI)
	 */
	withFilePath(filePath: string): this {
		this.threadData.uri = vscode.Uri.file(filePath);
		return this;
	}

	/**
	 * Set the line number (creates a range at that line)
	 */
	withLine(lineNumber: number): this {
		this.threadData.range = new vscode.Range(lineNumber, 0, lineNumber, 0);
		return this;
	}

	/**
	 * Set the line range
	 */
	withLineRange(startLine: number, endLine: number): this {
		this.threadData.range = new vscode.Range(startLine, 0, endLine, 0);
		return this;
	}

	/**
	 * Set the thread status (resolved or unresolved)
	 */
	withStatus(status: 'open' | 'resolved'): this {
		if (status === 'resolved') {
			this.threadData.state = vscode.CommentThreadState.Resolved;
			this.threadData.contextValue = 'resolved';
		} else {
			this.threadData.state = vscode.CommentThreadState.Unresolved;
			this.threadData.contextValue = '';
		}
		return this;
	}

	/**
	 * Set the created timestamp
	 */
	withCreatedAt(date: Date): this {
		this.threadData.createdAt = date;
		return this;
	}

	/**
	 * Set the updated timestamp
	 */
	withUpdatedAt(date: Date): this {
		this.threadData.updatedAt = date;
		return this;
	}

	/**
	 * Add a comment to the thread
	 */
	withComment(content: string, author: string = 'Test User'): this {
		// Create a mock thread for the comment
		const mockThread = this.buildMock();
		
		const comment = new ReviewComment(
			content,
			vscode.CommentMode.Preview,
			{ name: author },
			mockThread
		);
		
		this.threadData.comments = [...this.threadData.comments, comment];
		this.commentCounter++;
		return this;
	}

	/**
	 * Add multiple comments to the thread
	 */
	withComments(comments: Array<{ content: string; author?: string }>): this {
		comments.forEach(({ content, author }) => {
			this.withComment(content, author);
		});
		return this;
	}

	/**
	 * Set the collapsible state
	 */
	withCollapsibleState(state: vscode.CommentThreadCollapsibleState): this {
		this.threadData.collapsibleState = state;
		return this;
	}

	/**
	 * Set whether the thread can receive replies
	 */
	withCanReply(canReply: boolean): this {
		this.threadData.canReply = canReply;
		return this;
	}

	/**
	 * Set a custom context value
	 */
	withContextValue(contextValue: string): this {
		this.threadData.contextValue = contextValue;
		return this;
	}

	/**
	 * Build and return the thread data
	 * Note: This returns thread data suitable for testing
	 */
	build(): ThreadData {
		// Validate required fields
		if (!this.threadData.uri) {
			throw new Error('Thread must have a file URI. Use withFile() or withFilePath()');
		}
		if (!this.threadData.range) {
			throw new Error('Thread must have a line range. Use withLine() or withLineRange()');
		}

		// Set default timestamps if not provided
		if (!this.threadData.createdAt) {
			this.threadData.createdAt = new Date();
		}
		if (!this.threadData.updatedAt) {
			this.threadData.updatedAt = new Date();
		}

		return { ...this.threadData };
	}

	/**
	 * Build and return a mock thread that can be used in tests
	 * This creates a more complete mock with all required VS Code properties
	 */
	buildMock(): ExtendedCommentThread {
		const data = this.threadData;
		
		// Create a mock object that satisfies the ExtendedCommentThread interface
		const mockThread: ExtendedCommentThread = {
			uri: data.uri || vscode.Uri.file('/default/file.ts'),
			range: data.range || new vscode.Range(0, 0, 0, 0),
			comments: data.comments,
			collapsibleState: data.collapsibleState,
			canReply: data.canReply,
			state: data.state,
			contextValue: data.contextValue,
			customId: data.customId,
			createdAt: data.createdAt || new Date(),
			updatedAt: data.updatedAt || new Date(),
			dispose: () => {},
			label: data.label
		};

		return mockThread;
	}

	/**
	 * Reset the builder to create a new thread
	 */
	reset(): this {
		this.threadData = {
			comments: [],
			collapsibleState: vscode.CommentThreadCollapsibleState.Expanded,
			canReply: true,
			state: vscode.CommentThreadState.Unresolved
		};
		this.commentCounter = 0;
		return this;
	}
}

/**
 * Factory function to create a new ThreadBuilder
 */
export function createThreadBuilder(): ThreadBuilder {
	return new ThreadBuilder();
}
