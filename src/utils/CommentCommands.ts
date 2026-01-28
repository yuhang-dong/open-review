import * as vscode from 'vscode';
import { ReviewComment } from '../types/ReviewComment';
import { ThreadManager, ExtendedCommentThread } from './ThreadManager';
import { getUserName } from './getUserName';

export class CommentCommands {
	constructor(private threadManager: ThreadManager) {}

	private ensureValidCommentId(commentId: number): number | null {
		return Number.isFinite(commentId) ? commentId : null;
	}

	/**
	 * Create a new thread with an initial comment.
	 */
	public createThread(reply: vscode.CommentReply): void {
		this.replyComment(reply);
		const thread = reply.thread as ExtendedCommentThread;
		this.threadManager.addThread(thread);
	}

	/**
	 * Reply to an existing thread.
	 */
	public replyComment(reply: vscode.CommentReply): void {
		const thread = reply.thread as ExtendedCommentThread;
		const newComment = new ReviewComment(
			new vscode.MarkdownString(reply.text), 
			vscode.CommentMode.Preview, 
			{ name: getUserName() }, 
			thread, 
			thread.comments.length ? 'canDelete' : undefined
		);
		
		if (thread.contextValue === 'draft') {
			newComment.label = 'pending';
		}

		this.threadManager.addCommentToThread(thread, newComment);
	}

	/**
	 * Start a draft comment
	 */
	public startDraft(reply: vscode.CommentReply): void {
		const thread = reply.thread as ExtendedCommentThread;
		thread.contextValue = 'draft';
		const newComment = new ReviewComment(reply.text, vscode.CommentMode.Preview, { name: getUserName() }, thread);
		newComment.label = 'pending';
		
		this.threadManager.addCommentToThread(thread, newComment);
	}

	/**
	 * Finish a draft comment
	 */
	public finishDraft(reply: vscode.CommentReply): void {
		const thread = reply.thread as ExtendedCommentThread;

		if (!thread) {
			return;
		}

		thread.contextValue = thread.contextValue?.replace('draft', '') || undefined;
		thread.collapsibleState = vscode.CommentThreadCollapsibleState.Collapsed;
		
		if (reply.text) {
			const newComment = new ReviewComment(reply.text, vscode.CommentMode.Preview, { name: getUserName() }, thread);
			thread.comments = [...thread.comments, newComment].map(comment => {
				comment.label = undefined;
				return comment;
			});
		}
		
		this.threadManager.addThread(thread);
	}

	/**
	 * Delete a comment from a thread
	 */
	public deleteComment(comment: ReviewComment): void {
		const thread = comment.parent as ExtendedCommentThread;
		if (!thread) {
			return;
		}

		this.threadManager.removeCommentFromThread(thread, comment.id);
	}

	/**
	 * Delete an entire thread
	 */
	public deleteThread(thread: ExtendedCommentThread): void {
		thread.dispose();
		this.threadManager.removeThread(thread);
	}

	/**
	 * Delete an entire thread from webview, by threadId
	 */
	public deleteThreadById(threadId: string): void {
		const thread = this.threadManager.findThreadById(threadId);
		if (!thread) {
			return;
		}
		this.deleteThread(thread);
	}

	/**
	 * Delete a specific reply/comment from webview, by threadId + webview commentId
	 */
	public deleteCommentById(threadId: string, commentId: number): void {
		const thread = this.threadManager.findThreadById(threadId);
		if (!thread) {
			return;
		}

		const numericCommentId = this.ensureValidCommentId(commentId);
		if (numericCommentId === null) {
			return;
		}

		this.threadManager.removeCommentFromThread(thread, numericCommentId);
	}

	/**
	 * Cancel saving a comment (revert changes)
	 */
	public cancelSaveComment(comment: ReviewComment): void {
		if (!comment.parent) {
			return;
		}

		comment.parent.comments = comment.parent.comments.map(cmt => {
			if ((cmt as ReviewComment).id === comment.id) {
				cmt.body = (cmt as ReviewComment).savedBody;
				cmt.mode = vscode.CommentMode.Preview;
			}
			return cmt;
		});
	}

	/**
	 * Save a comment
	 */
	public saveComment(comment: ReviewComment): void {
		const thread = comment.parent as ExtendedCommentThread;
		if (!thread) {
			return;
		}

		this.threadManager.saveCommentInThread(thread, comment.id);
	}

	/**
	 * Edit a comment
	 */
	public editComment(comment: ReviewComment): void {
		if (!comment.parent) {
			return;
		}

		comment.parent.comments = comment.parent.comments.map(cmt => {
			if ((cmt as ReviewComment).id === comment.id) {
				cmt.mode = vscode.CommentMode.Editing;
			}
			return cmt;
		});
	}

	/**
	 * Resolve a thread from webview
	 */
	public resolveThread(threadId: string): void {
		this.threadManager.resolveThread(threadId);
	}

	/**
	 * Reopen a thread from webview
	 */
	public reopenThread(threadId: string): void {
		this.threadManager.reopenThread(threadId);
	}

	/**
	 * Reply to a thread from webview
	 */
	public replyToThread(threadId: string, content: string, authorName: string): void {
		this.threadManager.replyToThread(threadId, content, authorName || getUserName());
	}
}