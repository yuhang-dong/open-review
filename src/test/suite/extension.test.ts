import * as assert from 'assert';
import * as vscode from 'vscode';
import { ExtensionTestHelper } from '../helpers/extensionHelpers';
import { SidebarProvider } from '../../sidebar/SidebarProvider';

describe('Extension Activation Tests', () => {
	let extensionHelper: ExtensionTestHelper;

	beforeEach(async () => {
		extensionHelper = new ExtensionTestHelper();
	});

	it('extension loads successfully', async () => {
		// Get the extension
		const extension = vscode.extensions.getExtension('openreview.open-review');
		
		// Verify extension is found
		assert.ok(extension, 'Extension should be found');
		assert.strictEqual(extension.id, 'openreview.open-review', 'Extension ID should match');
	});

	it('extension is active after activation', async () => {
		// Activate the extension
		await extensionHelper.activate();
		
		// Get the extension
		const extension = extensionHelper.getExtension();
		
		// Verify extension is active
		assert.ok(extension, 'Extension should be found');
		assert.strictEqual(extension.isActive, true, 'Extension should be active after activation');
		
		// Verify extension exports the expected API
		const api = extension.exports;
		assert.ok(api, 'Extension should export an API');
		assert.ok(api.threadManager, 'Extension API should include threadManager');
		assert.ok(api.sidebarProvider, 'Extension API should include sidebarProvider');
	});

	it('all extension commands are registered', async () => {
		// Activate the extension
		await extensionHelper.activate();
		
		// Get all registered commands
		const commands = await vscode.commands.getCommands();
		
		// List of expected commands from package.json
		const expectedCommands = [
			'openReview.createComment',
			'openReview.replyComment',
			'openReview.startDraft',
			'openReview.finishDraft',
			'openReview.deleteComment',
			'openReview.deleteThread',
			'openReview.cancelSaveComment',
			'openReview.saveComment',
			'openReview.editComment',
			'openReview.disposeComments',
			'openReview.resolveThread',
			'openReview.reopenThread',
			'openReview.replyToThread',
			'openReview.deleteThreadById',
			'openReview.deleteCommentById',
			'openReview.exportAllThread'
		];
		
		// Verify each expected command is registered
		for (const expectedCommand of expectedCommands) {
			assert.ok(
				commands.includes(expectedCommand),
				`Command ${expectedCommand} should be registered`
			);
		}
	});

	it('commands are available through VS Code API', async () => {
		// Activate the extension
		await extensionHelper.activate();
		
		// Test that we can get command information
		const commands = await vscode.commands.getCommands(true);
		
		// Verify key commands are available
		const keyCommands = [
			'openReview.createComment',
			'openReview.exportAllThread',
			'openReview.resolveThread'
		];
		
		for (const command of keyCommands) {
			assert.ok(
				commands.includes(command),
				`Command ${command} should be available through VS Code API`
			);
		}
	});

	it('sidebar provider is registered', async () => {
		// Activate the extension
		await extensionHelper.activate();
		
		// Get the sidebar provider from the extension API
		const sidebarProvider = extensionHelper.getSidebarProvider();
		
		// Verify sidebar provider exists
		assert.ok(sidebarProvider, 'Sidebar provider should be registered');
		
		// Verify it's an instance of SidebarProvider
		assert.ok(
			sidebarProvider instanceof SidebarProvider,
			'Sidebar provider should be an instance of SidebarProvider'
		);
	});

	it('webview view type is correct', async () => {
		// Activate the extension
		await extensionHelper.activate();
		
		// Verify the static viewType property matches expected value
		assert.strictEqual(
			SidebarProvider.viewType,
			'openReview.webviewView',
			'Webview view type should match the expected value'
		);
		
		// Get the sidebar provider
		const sidebarProvider = extensionHelper.getSidebarProvider();
		assert.ok(sidebarProvider, 'Sidebar provider should exist');
	});
});
