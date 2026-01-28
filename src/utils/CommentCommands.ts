import * as vscode from 'vscode';
import { NoteComment } from '../types/NoteComment';
import { ThreadManager, ExtendedCommentThread } from './ThreadManager';
import { getUserName } from './getUserName';

export class CommentCommands {
	constructor(private threadManager: ThreadManager) {}

	private parseNumericNoteCommentIdFromWebviewCommentId(webviewCommentId: string): number | null {
		// Expected format from ThreadManager.toWebviewFormat():
		// `${thread.customId}:comment:${noteComment.id}`
		const match = /:comment:(\d+)$/.exec(webviewCommentId);
		if (!match) {
			return null;
		}

		const numericId = Number(match[1]);
		return Number.isFinite(numericId) ? numericId : null;
	}

	/**
	 * Create a new note/thread
	 */
	public createNote(reply: vscode.CommentReply): void {
		this.replyNote(reply);
		const thread = reply.thread as ExtendedCommentThread;
		this.threadManager.addThread(thread);
	}

	/**
	 * Reply to an existing note/thread
	 */
	public replyNote(reply: vscode.CommentReply): void {
		const thread = reply.thread as ExtendedCommentThread;
		const newComment = new NoteComment(
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
		const newComment = new NoteComment(reply.text, vscode.CommentMode.Preview, { name: getUserName() }, thread);
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
			const newComment = new NoteComment(reply.text, vscode.CommentMode.Preview, { name: getUserName() }, thread);
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
	public deleteNoteComment(comment: NoteComment): void {
		const thread = comment.parent as ExtendedCommentThread;
		if (!thread) {
			return;
		}

		this.threadManager.removeCommentFromThread(thread, comment.id);
	}

	/**
	 * Delete an entire thread
	 */
	public deleteNote(thread: ExtendedCommentThread): void {
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
		this.deleteNote(thread);
	}

	/**
	 * Delete a specific reply/comment from webview, by threadId + webview commentId
	 */
	public deleteCommentById(threadId: string, commentId: string): void {
		const thread = this.threadManager.findThreadById(threadId);
		if (!thread) {
			return;
		}

		const numericCommentId = this.parseNumericNoteCommentIdFromWebviewCommentId(commentId);
		if (numericCommentId === null) {
			return;
		}

		this.threadManager.removeCommentFromThread(thread, numericCommentId);
	}

	/**
	 * Cancel saving a note (revert changes)
	 */
	public cancelSaveNote(comment: NoteComment): void {
		if (!comment.parent) {
			return;
		}

		comment.parent.comments = comment.parent.comments.map(cmt => {
			if ((cmt as NoteComment).id === comment.id) {
				cmt.body = (cmt as NoteComment).savedBody;
				cmt.mode = vscode.CommentMode.Preview;
			}
			return cmt;
		});
	}

	/**
	 * Save a note
	 */
	public saveNote(comment: NoteComment): void {
		const thread = comment.parent as ExtendedCommentThread;
		if (!thread) {
			return;
		}

		this.threadManager.saveCommentInThread(thread, comment.id);
	}

	/**
	 * Edit a note
	 */
	public editNote(comment: NoteComment): void {
		if (!comment.parent) {
			return;
		}

		comment.parent.comments = comment.parent.comments.map(cmt => {
			if ((cmt as NoteComment).id === comment.id) {
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