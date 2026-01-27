import * as vscode from 'vscode';
import { CONTROLLER_ID, CONTROLLER_LABEL } from './constants/common';
import { exportThreadsAsMarkdown } from './utils/parseCopyableStringFromThreads';
import { NoteComment } from './types/NoteComment';
import { SidebarProvider } from './sidebar/SidebarProvider';
import { ThreadManager } from './utils/ThreadManager';
import { CommentCommands } from './utils/CommentCommands';

export function activate(context: vscode.ExtensionContext) {
	console.log('Open Review extension is being activated...');

	let sidebarProvider: SidebarProvider;

	try {
		// Register the webview provider
		sidebarProvider = new SidebarProvider(context.extensionUri);
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

	// Initialize thread manager with webview update callback
	const threadManager = new ThreadManager(() => {
		try {
			const webviewThreads = threadManager.toWebviewFormat();
			sidebarProvider.updateThreads(webviewThreads);
		} catch (error) {
			console.error('Error updating webview threads:', error);
		}
	});

	// Initialize comment commands
	const commentCommands = new CommentCommands(threadManager);

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

	// Register all comment commands
	context.subscriptions.push(vscode.commands.registerCommand('openReview.createNote', (reply: vscode.CommentReply) => {
		commentCommands.createNote(reply);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('openReview.replyNote', (reply: vscode.CommentReply) => {
		commentCommands.replyNote(reply);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('openReview.startDraft', (reply: vscode.CommentReply) => {
		commentCommands.startDraft(reply);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('openReview.finishDraft', (reply: vscode.CommentReply) => {
		commentCommands.finishDraft(reply);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('openReview.deleteNoteComment', (comment: NoteComment) => {
		commentCommands.deleteNoteComment(comment);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('openReview.deleteNote', (thread: vscode.CommentThread) => {
		commentCommands.deleteNote(thread as any);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('openReview.cancelsaveNote', (comment: NoteComment) => {
		commentCommands.cancelSaveNote(comment);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('openReview.saveNote', (comment: NoteComment) => {
		commentCommands.saveNote(comment);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('openReview.editNote', (comment: NoteComment) => {
		commentCommands.editNote(comment);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('openReview.dispose', () => {
		commentController.dispose();
	}));

	// Webview-initiated commands
	context.subscriptions.push(vscode.commands.registerCommand('openReview.resolveThread', (threadId: string) => {
		commentCommands.resolveThread(threadId);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('openReview.reopenThread', (threadId: string) => {
		commentCommands.reopenThread(threadId);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('openReview.replyToThread', (threadId: string, content: string, authorName: string) => {
		commentCommands.replyToThread(threadId, content, authorName);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('openReview.exportAllThread', async () => {
		const allThreads = threadManager.getAllThreads();
		const copyableStringFromThreads = exportThreadsAsMarkdown(allThreads);
		await vscode.env.clipboard.writeText(copyableStringFromThreads);
		vscode.window.showInformationMessage(
			`Exported ${allThreads.length} comments to clipboard`
		);
	}));
}

export function deactivate() {
	// Extension cleanup is handled automatically by VS Code through context.subscriptions
	// All registered commands, providers, and disposables are properly disposed
}