import * as assert from 'assert';
import * as vscode from 'vscode';
import { 
	TestWorkspaceManager, 
	ExtensionTestHelper, 
	ThreadTestHelper,
	AssertionHelper 
} from '../helpers';
import { createThreadBuilder, SAMPLE_TYPESCRIPT } from '../fixtures';

describe('Test Helpers Suite', () => {
	let workspaceManager: TestWorkspaceManager;
	let extensionHelper: ExtensionTestHelper;
	let threadHelper: ThreadTestHelper;

	beforeEach(async () => {
		workspaceManager = new TestWorkspaceManager();
		extensionHelper = new ExtensionTestHelper();
		
		// Activate extension
		await extensionHelper.activate();
		
		// Create thread helper
		threadHelper = new ThreadTestHelper(extensionHelper);
	});

	afterEach(async () => {
		await workspaceManager.cleanup();
	});

	it('TestWorkspaceManager creates workspace', async () => {
		const workspaceUri = await workspaceManager.setup({
			files: [
				{ path: 'test.ts', content: SAMPLE_TYPESCRIPT }
			]
		});

		assert.ok(workspaceUri, 'Workspace URI should be created');
		
		const filePath = workspaceManager.getFilePath('test.ts');
		assert.ok(filePath, 'File path should be resolved');
		assert.ok(filePath.includes('test.ts'), 'File path should contain test.ts');
	});

	it('ExtensionTestHelper activates extension', async () => {
		const extension = extensionHelper.getExtension();
		assert.ok(extension, 'Extension should be available');
		assert.ok(extension?.isActive, 'Extension should be active');
	});

	it('ExtensionTestHelper provides ThreadManager', () => {
		const threadManager = extensionHelper.getThreadManager();
		assert.ok(threadManager, 'ThreadManager should be available');
	});

	it('ThreadBuilder creates thread data', () => {
		const builder = createThreadBuilder();
		const thread = builder
			.withFilePath('/test/file.ts')
			.withLine(10)
			.withComment('Test comment', 'Test User')
			.withStatus('open')
			.build();

		assert.ok(thread.uri, 'Thread should have URI');
		assert.ok(thread.range, 'Thread should have range');
		assert.strictEqual(thread.comments.length, 1, 'Thread should have one comment');
		assert.strictEqual(thread.state, vscode.CommentThreadState.Unresolved, 'Thread should be unresolved');
	});

	it('ThreadBuilder creates resolved thread', () => {
		const builder = createThreadBuilder();
		const thread = builder
			.withFilePath('/test/file.ts')
			.withLine(5)
			.withComment('Resolved comment')
			.withStatus('resolved')
			.build();

		assert.strictEqual(thread.state, vscode.CommentThreadState.Resolved, 'Thread should be resolved');
		assert.ok(thread.contextValue?.includes('resolved'), 'Thread context should include resolved');
	});

	it('ThreadBuilder creates thread with multiple comments', () => {
		const builder = createThreadBuilder();
		const thread = builder
			.withFilePath('/test/file.ts')
			.withLine(15)
			.withComments([
				{ content: 'First comment', author: 'User 1' },
				{ content: 'Second comment', author: 'User 2' },
				{ content: 'Third comment', author: 'User 3' }
			])
			.build();

		assert.strictEqual(thread.comments.length, 3, 'Thread should have three comments');
	});

	it('AssertionHelper.assertEventuallyTrue waits for condition', async () => {
		let value = false;
		
		// Set value to true after 100ms
		setTimeout(() => { value = true; }, 100);
		
		// Should wait and succeed
		await AssertionHelper.assertEventuallyTrue(() => value, 500);
		
		assert.strictEqual(value, true, 'Value should be true');
	});

	it('AssertionHelper.assertEventuallyTrue times out', async () => {
		let didTimeout = false;
		
		try {
			await AssertionHelper.assertEventuallyTrue(() => false, 200, 'Should timeout');
		} catch (error) {
			didTimeout = true;
		}
		
		assert.ok(didTimeout, 'Should have timed out');
	});
});
