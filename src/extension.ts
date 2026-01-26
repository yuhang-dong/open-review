import * as vscode from 'vscode';
import { CONTROLLER_ID, CONTROLLER_LABEL } from './constants/common';
import { exportThreadsAsMarkdown } from './utils/parseCopyableStringFromThreads';
import { getUserName } from './utils/getUserName';
import { NoteComment } from './types/NoteComment';
import { SidebarProvider } from './sidebar/SidebarProvider';


export function activate(context: vscode.ExtensionContext) {
	console.log('Open Review extension is being activated...');

	try {
		// Register the webview provider
		const sidebarProvider = new SidebarProvider(context.extensionUri);
		console.log('SidebarProvider created with viewType:', SidebarProvider.viewType);
		
		context.subscriptions.push(
			vscode.window.registerWebviewViewProvider(SidebarProvider.viewType, sidebarProvider)
		);
		console.log('WebviewViewProvider registered for viewType:', SidebarProvider.viewType);
		
		// Add sidebar provider to subscriptions for proper disposal
		context.subscriptions.push(sidebarProvider);

		console.log('Open Review extension activated successfully!');
	} catch (error) {
		console.error('Error during sidebar provider registration:', error);
		vscode.window.showErrorMessage(
			`Failed to register sidebar provider: ${error instanceof Error ? error.message : String(error)}`
		);
		// Continue with rest of extension activation even if sidebar fails
	}

	const allThreads: vscode.CommentThread[] = [];
	// A `CommentController` is able to provide comments for documents.
	const commentController = vscode.comments.createCommentController(CONTROLLER_ID, CONTROLLER_LABEL);
	context.subscriptions.push(commentController);

	// A `CommentingRangeProvider` controls where gutter decorations that allow adding comments are shown
	commentController.commentingRangeProvider = {
		provideCommentingRanges: (document: vscode.TextDocument, _token: vscode.CancellationToken) => {
			const lineCount = document.lineCount;
			return [new vscode.Range(0, 0, lineCount - 1, 0)];
		}
	};

	context.subscriptions.push(vscode.commands.registerCommand('openReview.createNote', (reply: vscode.CommentReply) => {
		replyNote(reply);
		allThreads.push(reply.thread);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('openReview.replyNote', (reply: vscode.CommentReply) => {
		replyNote(reply);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('openReview.startDraft', (reply: vscode.CommentReply) => {
		const thread = reply.thread;
		thread.contextValue = 'draft';
		const newComment = new NoteComment(reply.text, vscode.CommentMode.Preview, { name: getUserName() }, thread);
		newComment.label = 'pending';
		thread.comments = [...thread.comments, newComment];
	}));

	context.subscriptions.push(vscode.commands.registerCommand('openReview.finishDraft', (reply: vscode.CommentReply) => {
		const thread = reply.thread;

		if (!thread) {
			return;
		}

		thread.contextValue = undefined;
		thread.collapsibleState = vscode.CommentThreadCollapsibleState.Collapsed;
		if (reply.text) {
			const newComment = new NoteComment(reply.text, vscode.CommentMode.Preview, { name: getUserName() }, thread);
			thread.comments = [...thread.comments, newComment].map(comment => {
				comment.label = undefined;
				return comment;
			});
		}
		allThreads.push(thread);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('openReview.deleteNoteComment', (comment: NoteComment) => {
		const thread = comment.parent;
		if (!thread) {
			return;
		}

		thread.comments = thread.comments.filter(cmt => (cmt as NoteComment).id !== comment.id);

		if (thread.comments.length === 0) {
			thread.dispose();
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('openReview.deleteNote', (thread: vscode.CommentThread) => {
		thread.dispose();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('openReview.cancelsaveNote', (comment: NoteComment) => {
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
	}));

	context.subscriptions.push(vscode.commands.registerCommand('openReview.saveNote', (comment: NoteComment) => {
		const thread = comment.parent;
		if (!thread) {
			return;
		}

		thread.comments = thread.comments.map(cmt => {
			if ((cmt as NoteComment).id === comment.id) {
				(cmt as NoteComment).savedBody = cmt.body;
				cmt.mode = vscode.CommentMode.Preview;
			}

			return cmt;
		});
	}));

	context.subscriptions.push(vscode.commands.registerCommand('openReview.editNote', (comment: NoteComment) => {
		if (!comment.parent) {
			return;
		}

		comment.parent.comments = comment.parent.comments.map(cmt => {
			if ((cmt as NoteComment).id === comment.id) {
				cmt.mode = vscode.CommentMode.Editing;
			}

			return cmt;
		});
	}));

	context.subscriptions.push(vscode.commands.registerCommand('openReview.dispose', () => {
		commentController.dispose();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('openReview.exportAllThread', async () => {
		const copyableStringFromThreads = exportThreadsAsMarkdown(allThreads);
		await vscode.env.clipboard.writeText(copyableStringFromThreads);
		vscode.window.showInformationMessage(
			`Exported ${allThreads.length} comments to clipboard`
		);
	}));

	function replyNote(reply: vscode.CommentReply) {
		const thread = reply.thread;
		const newComment = new NoteComment(new vscode.MarkdownString(reply.text), vscode.CommentMode.Preview, { name: getUserName() }, thread, thread.comments.length ? 'canDelete' : undefined);
		if (thread.contextValue === 'draft') {
			newComment.label = 'pending';
		}

		thread.comments = [...thread.comments, newComment];
	}
}

export function deactivate() {
	// Extension cleanup is handled automatically by VS Code through context.subscriptions
	// All registered commands, providers, and disposables are properly disposed
}