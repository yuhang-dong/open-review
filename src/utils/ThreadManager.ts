import * as vscode from 'vscode';
import { ReviewComment } from '../types/ReviewComment';
import { CommentThread } from '../webview/types';

// Extend CommentThread with our custom properties
export interface ExtendedCommentThread extends vscode.CommentThread {
	customId?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

export class ThreadManager {
	private threads: ExtendedCommentThread[] = [];
	private threadIdCounter = 1;
	private onThreadsChanged?: () => void;

	constructor(onThreadsChanged?: () => void) {
		this.onThreadsChanged = onThreadsChanged;
	}

	/**
	 * Generate a unique thread ID
	 */
	private generateThreadId(): string {
		return `thread-${this.threadIdCounter++}-${Date.now()}`;
	}

	/**
	 * Initialize thread metadata
	 */
	private initializeThread(thread: ExtendedCommentThread): void {
		if (!thread.customId) {
			thread.customId = this.generateThreadId();
			thread.createdAt = new Date();
			thread.updatedAt = new Date();
		}
	}

	/**
	 * Update thread timestamp
	 */
	private updateThreadTimestamp(thread: ExtendedCommentThread): void {
		thread.updatedAt = new Date();
		this.notifyChange();
	}

	/**
	 * Notify that threads have changed
	 */
	private notifyChange(): void {
		if (this.onThreadsChanged) {
			this.onThreadsChanged();
		}
	}

	/**
	 * Add a new thread
	 */
	public addThread(thread: ExtendedCommentThread): void {
		// Don't add if already exists
		if (this.threads.includes(thread)) {
			this.updateThreadTimestamp(thread);
			return;
		}
		
		this.initializeThread(thread);
		this.threads.push(thread);
		this.notifyChange();
	}

	/**
	 * Remove a thread
	 */
	public removeThread(thread: ExtendedCommentThread): void {
		const index = this.threads.indexOf(thread);
		if (index > -1) {
			this.threads.splice(index, 1);
			this.notifyChange();
		}
	}

	/**
	 * Update a thread (marks it as updated)
	 */
	public updateThread(thread: ExtendedCommentThread): void {
		this.updateThreadTimestamp(thread);
	}

	/**
	 * Find thread by custom ID
	 */
	public findThreadById(customId: string): ExtendedCommentThread | undefined {
		return this.threads.find(t => t.customId === customId);
	}

	/**
	 * Get all threads
	 */
	public getAllThreads(): ExtendedCommentThread[] {
		return [...this.threads];
	}

	/**
	 * Add comment to thread
	 */
	public addCommentToThread(thread: ExtendedCommentThread, comment: ReviewComment): void {
		// If thread is not managed yet, add it first
		if (!this.threads.includes(thread)) {
			this.addThread(thread);
		}
		
		thread.comments = [...thread.comments, comment];
		this.updateThreadTimestamp(thread);
	}

	/**
	 * Remove comment from thread
	 */
	public removeCommentFromThread(thread: ExtendedCommentThread, commentId: number): void {
		thread.comments = thread.comments.filter(cmt => (cmt as ReviewComment).id !== commentId);
		
		if (thread.comments.length === 0) {
			thread.dispose();
			this.removeThread(thread);
		} else {
			this.updateThreadTimestamp(thread);
		}
	}

	/**
	 * Save comment in thread
	 */
	public saveCommentInThread(thread: ExtendedCommentThread, commentId: number): void {
		thread.comments = thread.comments.map(cmt => {
			if ((cmt as ReviewComment).id === commentId) {
				(cmt as ReviewComment).save();
				cmt.mode = vscode.CommentMode.Preview;
			}
			return cmt;
		});
		this.updateThreadTimestamp(thread);
	}

	/**
	 * Resolve thread
	 */
	public resolveThread(customId: string): void {
		const thread = this.findThreadById(customId);
		if (thread) {
			thread.state = vscode.CommentThreadState.Resolved;
			const existingContext = thread.contextValue || '';
			thread.contextValue = existingContext.includes('resolved') ? existingContext : `${existingContext}|resolved`;
			this.updateThreadTimestamp(thread);
		}
	}

	/**
	 * Reopen thread
	 */
	public reopenThread(customId: string): void {
		const thread = this.findThreadById(customId);
		if (thread) {
			thread.state = vscode.CommentThreadState.Unresolved;
			const existingContext = thread.contextValue || '';
			thread.contextValue = existingContext.replace('|resolved', '').replace('resolved', '');
			this.updateThreadTimestamp(thread);
		}
	}

	/**
	 * Reply to thread
	 */
	public replyToThread(customId: string, content: string, authorName: string): void {
		const thread = this.findThreadById(customId);
		if (thread) {
			const newComment = new ReviewComment(
				content, 
				vscode.CommentMode.Preview, 
				{ name: authorName }, 
				thread
			);
			this.addCommentToThread(thread, newComment);
		}
	}

	/**
	 * Convert threads to webview format
	 */
	public toWebviewFormat(): CommentThread[] {
		return this.threads.map(thread => {
			const range = thread.range;
			
			return {
				id: thread.customId || `fallback-${thread.uri.toString()}-${range?.start.line || 0}`,
				filePath: vscode.workspace.asRelativePath(thread.uri),
				lineNumber: range ? range.start.line + 1 : 1,
				// Support range display - include end line if it's a multi-line range
				lineRange: range && range.start.line !== range.end.line ? {
					start: range.start.line + 1,
					end: range.end.line + 1
				} : undefined,
				// Use thread state if available, otherwise infer from contextValue
				status: (() => {
					if (thread.state === vscode.CommentThreadState.Resolved) return 'resolved' as const;
					if (thread.contextValue?.includes('resolved')) return 'resolved' as const;
					return 'open' as const;
				})(),
				comments: thread.comments.map((comment, index) => {
					const reviewComment = comment as ReviewComment;
					return {
						id: `${thread.customId}:comment:${reviewComment.id}`,
						threadId: thread.customId || '',
						content: typeof comment.body === 'string' ? comment.body : comment.body.value,
						author: {
							name: comment.author.name,
							avatarUrl: comment.author.iconPath?.toString()
						},
						// Use stored creation date from ReviewComment
						createdAt: reviewComment.createdAt,
						isReply: index > 0,
						parentCommentId: index > 0 ? `${thread.customId}:comment:${(thread.comments[0] as ReviewComment).id}` : undefined
					};
				}),
				// Use stored dates from thread
				createdAt: thread.createdAt || new Date(),
				updatedAt: thread.updatedAt || new Date()
			};
		});
	}
}