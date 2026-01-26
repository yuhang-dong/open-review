import * as vscode from 'vscode';
import * as os from 'os';
import * as cp from 'child_process';
import { CONTROLLER_ID, CONTROLLER_LABEL } from './constants/common';
import { exportThreadsAsMarkdown } from './utils/parseCopyableStringFromThreads';
import { SidebarProvider } from './sidebar/SidebarProvider';

let commentId = 1;

/**
 * Get the username with priority:
 * 1. Workspace git username (only if workspace is a git repository)
 * 2. System (mac/linux/windows) user name
 * 3. Default name from runtime (vscode / kiro / cursor)
 */
function getUserName(): string {
	vscode.window.showInformationMessage(
        `Exported ${vscode.env.appName.toLowerCase()} comments to clipboard`
      );
	// 1. Try to get workspace git username (only if it's a git repository)
	try {
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
		if (workspaceFolder) {
			// First check if this is a git repository
			cp.execSync('git rev-parse --is-inside-work-tree', { 
				encoding: 'utf8',
				cwd: workspaceFolder,
				timeout: 3000,
				stdio: 'pipe'
			});
			
			// If we get here, it's a git repository, so get the username
			const gitUserName = cp.execSync('git config user.name', { 
				encoding: 'utf8',
				cwd: workspaceFolder,
				timeout: 3000
			}).trim();
			if (gitUserName) {
				return gitUserName;
			}
		}
	} catch (error) {
		// Not a git repository or git config not available, continue to next option
	}

	// 2. Try to get system username
	try {
		const systemUserName = os.userInfo().username;
		if (systemUserName) {
			return systemUserName;
		}
	} catch (error) {
		// System username not available, continue to next option
	}

	// 3. Default name based on runtime
	const productName = vscode.env.appName.toLowerCase();
	if (productName.includes('cursor')) {
		return 'cursor';
	} else if (productName.includes('kiro')) {
		return 'kiro';
	} else {
		return 'vscode';
	}
}

class NoteComment implements vscode.Comment {
	id: number;
	label: string | undefined;
	savedBody: string | vscode.MarkdownString; // for the Cancel button
	constructor(
		public body: string | vscode.MarkdownString,
		public mode: vscode.CommentMode,
		public author: vscode.CommentAuthorInformation,
		public parent?: vscode.CommentThread,
		public contextValue?: string
	) {
		this.id = ++commentId;
		this.savedBody = this.body;
	}
}


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

	const allThreads: NoteComment[] = [];
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