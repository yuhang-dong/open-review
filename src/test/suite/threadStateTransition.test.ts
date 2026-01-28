import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fc from 'fast-check';
import { 
	TestWorkspaceManager, 
	ExtensionTestHelper, 
	ThreadTestHelper 
} from '../helpers';
import { SAMPLE_TYPESCRIPT } from '../fixtures';

describe('Thread State Transition Tests', () => {
	let workspaceManager: TestWorkspaceManager;
	let extensionHelper: ExtensionTestHelper;
	let threadHelper: ThreadTestHelper;
	let testFileUri: vscode.Uri;

	beforeEach(async () => {
		// Set up test workspace
		workspaceManager = new TestWorkspaceManager();
		await workspaceManager.setup({
			files: [
				{ path: 'test.ts', content: SAMPLE_TYPESCRIPT },
				{ path: 'test2.ts', content: SAMPLE_TYPESCRIPT }
			]
		});

		// Activate extension
		extensionHelper = new ExtensionTestHelper();
		await extensionHelper.activate();

		// Create thread helper
		threadHelper = new ThreadTestHelper(extensionHelper);

		// Get test file URI
		testFileUri = vscode.Uri.file(workspaceManager.getFilePath('test.ts'));
	});

	afterEach(async () => {
		// Clean up workspace
		await workspaceManager.cleanup();
	});

	// Task 7.1: Write test for resolving thread
	it('resolves thread and persists resolved state', async () => {
		const content = 'Thread to be resolved';

		// Create thread
		const threadId = await threadHelper.createThread(
			testFileUri,
			5,
			content
		);

		// Verify thread starts without explicit state (undefined or unresolved)
		const threadBefore = threadHelper.getThreadById(threadId);
		// Thread state can be undefined initially or Unresolved
		const initialState = threadBefore.state;
		assert.ok(
			initialState === undefined || initialState === vscode.CommentThreadState.Unresolved,
			'Thread should start as undefined or unresolved'
		);

		// Resolve the thread
		await threadHelper.resolveThread(threadId);

		// Verify thread state changed to resolved
		const threadAfter = threadHelper.getThreadById(threadId);
		assert.strictEqual(
			threadAfter.state,
			vscode.CommentThreadState.Resolved,
			'Thread state should be resolved'
		);

		// Verify state persists by retrieving thread again
		const threadPersisted = threadHelper.getThreadById(threadId);
		assert.strictEqual(
			threadPersisted.state,
			vscode.CommentThreadState.Resolved,
			'Resolved state should persist'
		);

		// Verify contextValue includes 'resolved'
		assert.ok(
			threadPersisted.contextValue?.includes('resolved'),
			'Thread contextValue should include resolved marker'
		);
	});

	it('resolved thread appears as resolved in webview format', async () => {
		const content = 'Thread to check webview format';

		// Create and resolve thread
		const threadId = await threadHelper.createThread(
			testFileUri,
			10,
			content
		);
		await threadHelper.resolveThread(threadId);

		// Get thread manager and convert to webview format
		const threadManager = extensionHelper.getThreadManager();
		assert.ok(threadManager, 'Thread manager should be available');
		const webviewThreads = threadManager.toWebviewFormat();

		// Find the resolved thread
		const webviewThread = webviewThreads.find(t => t.id === threadId);
		assert.ok(webviewThread, 'Thread should exist in webview format');
		assert.strictEqual(
			webviewThread.status,
			'resolved',
			'Thread should have resolved status in webview format'
		);
	});

	// Task 7.2: Write test for reopening thread
	it('reopens resolved thread and persists open state', async () => {
		const content = 'Thread to be reopened';

		// Create and resolve thread
		const threadId = await threadHelper.createThread(
			testFileUri,
			15,
			content
		);
		await threadHelper.resolveThread(threadId);

		// Verify thread is resolved
		const threadResolved = threadHelper.getThreadById(threadId);
		assert.strictEqual(
			threadResolved.state,
			vscode.CommentThreadState.Resolved,
			'Thread should be resolved before reopening'
		);

		// Reopen the thread
		await threadHelper.reopenThread(threadId);

		// Verify thread state changed to unresolved
		const threadAfter = threadHelper.getThreadById(threadId);
		assert.strictEqual(
			threadAfter.state,
			vscode.CommentThreadState.Unresolved,
			'Thread state should be unresolved after reopening'
		);

		// Verify state persists by retrieving thread again
		const threadPersisted = threadHelper.getThreadById(threadId);
		assert.strictEqual(
			threadPersisted.state,
			vscode.CommentThreadState.Unresolved,
			'Unresolved state should persist'
		);

		// Verify contextValue no longer includes 'resolved'
		assert.ok(
			!threadPersisted.contextValue?.includes('resolved'),
			'Thread contextValue should not include resolved marker'
		);
	});

	it('reopened thread appears as open in webview format', async () => {
		const content = 'Thread to check webview format after reopen';

		// Create, resolve, then reopen thread
		const threadId = await threadHelper.createThread(
			testFileUri,
			20,
			content
		);
		await threadHelper.resolveThread(threadId);
		await threadHelper.reopenThread(threadId);

		// Get thread manager and convert to webview format
		const threadManager = extensionHelper.getThreadManager();
		assert.ok(threadManager, 'Thread manager should be available');
		const webviewThreads = threadManager.toWebviewFormat();

		// Find the reopened thread
		const webviewThread = webviewThreads.find(t => t.id === threadId);
		assert.ok(webviewThread, 'Thread should exist in webview format');
		assert.strictEqual(
			webviewThread.status,
			'open',
			'Thread should have open status in webview format after reopening'
		);
	});

	// Task 7.3: Write test for resolve-reopen round trip
	it('performs resolve-reopen round trip correctly', async () => {
		const content = 'Thread for round trip test';

		// Create thread
		const threadId = await threadHelper.createThread(
			testFileUri,
			25,
			content
		);

		// Verify initial state is open (undefined or unresolved)
		const threadInitial = threadHelper.getThreadById(threadId);
		const initialState = threadInitial.state;
		assert.ok(
			initialState === undefined || initialState === vscode.CommentThreadState.Unresolved,
			'Thread should start as undefined or unresolved'
		);

		// Resolve thread
		await threadHelper.resolveThread(threadId);
		const threadResolved = threadHelper.getThreadById(threadId);
		assert.strictEqual(
			threadResolved.state,
			vscode.CommentThreadState.Resolved,
			'Thread should be resolved'
		);

		// Reopen thread
		await threadHelper.reopenThread(threadId);
		const threadReopened = threadHelper.getThreadById(threadId);
		assert.strictEqual(
			threadReopened.state,
			vscode.CommentThreadState.Unresolved,
			'Thread should return to unresolved state after round trip'
		);

		// Verify thread is back to open state
		const threadManager = extensionHelper.getThreadManager();
		assert.ok(threadManager, 'Thread manager should be available');
		const webviewThreads = threadManager.toWebviewFormat();
		const webviewThread = webviewThreads.find(t => t.id === threadId);
		assert.strictEqual(
			webviewThread?.status,
			'open',
			'Thread should have open status after round trip'
		);
	});

	it('performs multiple resolve-reopen cycles', async () => {
		const content = 'Thread for multiple cycles';

		// Create thread
		const threadId = await threadHelper.createThread(
			testFileUri,
			30,
			content
		);

		// Perform 3 resolve-reopen cycles
		for (let i = 0; i < 3; i++) {
			// Resolve
			await threadHelper.resolveThread(threadId);
			const threadResolved = threadHelper.getThreadById(threadId);
			assert.strictEqual(
				threadResolved.state,
				vscode.CommentThreadState.Resolved,
				`Thread should be resolved in cycle ${i + 1}`
			);

			// Reopen
			await threadHelper.reopenThread(threadId);
			const threadReopened = threadHelper.getThreadById(threadId);
			assert.strictEqual(
				threadReopened.state,
				vscode.CommentThreadState.Unresolved,
				`Thread should be unresolved in cycle ${i + 1}`
			);
		}

		// Verify final state is open
		const threadFinal = threadHelper.getThreadById(threadId);
		assert.strictEqual(
			threadFinal.state,
			vscode.CommentThreadState.Unresolved,
			'Thread should end in unresolved state'
		);
	});

	// Task 7.4: Write property test for state transitions
	// Feature: e2e-testing, Property 8: Thread State Transitions Are Correct
	it('thread state transitions are correct (property test)', async function() {
		// Increase timeout for property test
		this.timeout(20000);

		const commentPrefixes = ['TODO:', 'FIXME:', 'NOTE:', 'Review:', 'Question:', 'Bug:'];
		const commentBodies = [
			'This needs to be refactored',
			'Check the logic here',
			'Add error handling',
			'Optimize this section',
			'Update documentation',
			'Verify edge cases'
		];

		let iterationCounter = 0;

		await fc.assert(
			fc.asyncProperty(
				fc.constantFrom(...commentPrefixes),
				fc.constantFrom(...commentBodies),
				fc.boolean(), // Whether to do round trip
				async (prefix, body, doRoundTrip) => {
					// Use unique line number for each iteration
					const lineNumber = iterationCounter++;
					const content = `${prefix} ${body}`;

					// Create thread
					const threadId = await threadHelper.createThread(
						testFileUri,
						lineNumber,
						content
					);

					// Verify initial state is unresolved or undefined
					const threadInitial = threadHelper.getThreadById(threadId);
					const initialState = threadInitial.state;
					assert.ok(
						initialState === undefined || initialState === vscode.CommentThreadState.Unresolved,
						'Thread should start as undefined or unresolved'
					);

					// Resolve thread
					await threadHelper.resolveThread(threadId);
					const threadResolved = threadHelper.getThreadById(threadId);
					assert.strictEqual(
						threadResolved.state,
						vscode.CommentThreadState.Resolved,
						'Thread should be resolved after resolveThread'
					);

					// Verify contextValue includes 'resolved'
					assert.ok(
						threadResolved.contextValue?.includes('resolved'),
						'Thread contextValue should include resolved marker'
					);

					// Verify webview format shows resolved
					const threadManager = extensionHelper.getThreadManager();
					assert.ok(threadManager, 'Thread manager should be available');
					let webviewThreads = threadManager.toWebviewFormat();
					let webviewThread = webviewThreads.find(t => t.id === threadId);
					assert.strictEqual(
						webviewThread?.status,
						'resolved',
						'Thread should have resolved status in webview format'
					);

					// If doing round trip, reopen the thread
					if (doRoundTrip) {
						await threadHelper.reopenThread(threadId);
						const threadReopened = threadHelper.getThreadById(threadId);
						assert.strictEqual(
							threadReopened.state,
							vscode.CommentThreadState.Unresolved,
							'Thread should be unresolved after reopenThread'
						);

						// Verify contextValue no longer includes 'resolved'
						assert.ok(
							!threadReopened.contextValue?.includes('resolved'),
							'Thread contextValue should not include resolved marker after reopen'
						);

						// Verify webview format shows open
						webviewThreads = threadManager.toWebviewFormat();
						webviewThread = webviewThreads.find(t => t.id === threadId);
						assert.strictEqual(
							webviewThread?.status,
							'open',
							'Thread should have open status in webview format after reopen'
						);
					}
				}
			),
			{ numRuns: 20 }
		);
	});

	// Task 7.5: Write test for sidebar status display
	it('sidebar shows correct status for resolved threads', async () => {
		const content1 = 'First thread to resolve';
		const content2 = 'Second thread to resolve';

		// Create two threads
		const threadId1 = await threadHelper.createThread(testFileUri, 35, content1);
		const threadId2 = await threadHelper.createThread(testFileUri, 40, content2);

		// Resolve first thread
		await threadHelper.resolveThread(threadId1);

		// Get webview format
		const threadManager = extensionHelper.getThreadManager();
		assert.ok(threadManager, 'Thread manager should be available');
		const webviewThreads = threadManager.toWebviewFormat();

		// Find threads in webview format
		const webviewThread1 = webviewThreads.find(t => t.id === threadId1);
		const webviewThread2 = webviewThreads.find(t => t.id === threadId2);

		// Verify first thread shows as resolved
		assert.ok(webviewThread1, 'First thread should exist in webview format');
		assert.strictEqual(
			webviewThread1.status,
			'resolved',
			'First thread should show resolved status in sidebar'
		);

		// Verify second thread shows as open
		assert.ok(webviewThread2, 'Second thread should exist in webview format');
		assert.strictEqual(
			webviewThread2.status,
			'open',
			'Second thread should show open status in sidebar'
		);
	});

	it('sidebar shows correct status for open threads', async () => {
		const content1 = 'Thread that stays open';
		const content2 = 'Thread that gets resolved then reopened';

		// Create two threads
		const threadId1 = await threadHelper.createThread(testFileUri, 45, content1);
		const threadId2 = await threadHelper.createThread(testFileUri, 50, content2);

		// Resolve and reopen second thread
		await threadHelper.resolveThread(threadId2);
		await threadHelper.reopenThread(threadId2);

		// Get webview format
		const threadManager = extensionHelper.getThreadManager();
		assert.ok(threadManager, 'Thread manager should be available');
		const webviewThreads = threadManager.toWebviewFormat();

		// Find threads in webview format
		const webviewThread1 = webviewThreads.find(t => t.id === threadId1);
		const webviewThread2 = webviewThreads.find(t => t.id === threadId2);

		// Verify both threads show as open
		assert.ok(webviewThread1, 'First thread should exist in webview format');
		assert.strictEqual(
			webviewThread1.status,
			'open',
			'First thread should show open status in sidebar'
		);

		assert.ok(webviewThread2, 'Second thread should exist in webview format');
		assert.strictEqual(
			webviewThread2.status,
			'open',
			'Second thread should show open status in sidebar after reopening'
		);
	});

	it('sidebar status updates when thread state changes', async () => {
		const content = 'Thread to track status changes';

		// Create thread
		const threadId = await threadHelper.createThread(testFileUri, 55, content);

		// Get thread manager
		const threadManager = extensionHelper.getThreadManager();
		assert.ok(threadManager, 'Thread manager should be available');

		// Check initial status
		let webviewThreads = threadManager.toWebviewFormat();
		let webviewThread = webviewThreads.find(t => t.id === threadId);
		assert.strictEqual(webviewThread?.status, 'open', 'Thread should start as open');

		// Resolve thread and check status
		await threadHelper.resolveThread(threadId);
		webviewThreads = threadManager.toWebviewFormat();
		webviewThread = webviewThreads.find(t => t.id === threadId);
		assert.strictEqual(webviewThread?.status, 'resolved', 'Thread should be resolved');

		// Reopen thread and check status
		await threadHelper.reopenThread(threadId);
		webviewThreads = threadManager.toWebviewFormat();
		webviewThread = webviewThreads.find(t => t.id === threadId);
		assert.strictEqual(webviewThread?.status, 'open', 'Thread should be open again');
	});

	// Task 7.6: Write property test for sidebar status reflection
	// Feature: e2e-testing, Property 9: Sidebar Reflects Thread Status
	it('sidebar reflects thread status (property test)', async function() {
		// Increase timeout for property test
		this.timeout(20000);

		const commentPrefixes = ['TODO:', 'FIXME:', 'NOTE:', 'Review:', 'Question:', 'Bug:'];
		const commentBodies = [
			'This needs to be refactored',
			'Check the logic here',
			'Add error handling',
			'Optimize this section',
			'Update documentation',
			'Verify edge cases'
		];

		let iterationCounter = 0;

		await fc.assert(
			fc.asyncProperty(
				fc.constantFrom(...commentPrefixes),
				fc.constantFrom(...commentBodies),
				fc.constantFrom('open', 'resolved', 'roundtrip'), // Target state
				async (prefix, body, targetState) => {
					// Use unique line number for each iteration
					const lineNumber = iterationCounter++;
					const content = `${prefix} ${body}`;

					// Create thread
					const threadId = await threadHelper.createThread(
						testFileUri,
						lineNumber,
						content
					);

					// Get thread manager
					const threadManager = extensionHelper.getThreadManager();
					assert.ok(threadManager, 'Thread manager should be available');

					// Apply state transition based on target state
					if (targetState === 'resolved') {
						await threadHelper.resolveThread(threadId);
					} else if (targetState === 'roundtrip') {
						await threadHelper.resolveThread(threadId);
						await threadHelper.reopenThread(threadId);
					}
					// 'open' state requires no action

					// Get thread from thread manager
					const thread = threadHelper.getThreadById(threadId);

					// Get webview format
					const webviewThreads = threadManager.toWebviewFormat();
					const webviewThread = webviewThreads.find(t => t.id === threadId);

					// Verify webview thread exists
					assert.ok(webviewThread, 'Thread should exist in webview format');

					// Verify sidebar status matches actual thread state
					const expectedStatus = targetState === 'resolved' ? 'resolved' : 'open';
					assert.strictEqual(
						webviewThread.status,
						expectedStatus,
						`Sidebar should reflect ${expectedStatus} status`
					);

					// Verify thread state matches expected state
					const expectedThreadState = targetState === 'resolved' 
						? vscode.CommentThreadState.Resolved 
						: vscode.CommentThreadState.Unresolved;
					
					// Thread state can be undefined for 'open' state
					if (targetState === 'open') {
						assert.ok(
							thread.state === undefined || thread.state === vscode.CommentThreadState.Unresolved,
							'Thread state should be undefined or unresolved for open status'
						);
					} else {
						assert.strictEqual(
							thread.state,
							expectedThreadState,
							`Thread state should be ${expectedThreadState}`
						);
					}

					// Verify consistency between thread state and webview status
					if (thread.state === vscode.CommentThreadState.Resolved) {
						assert.strictEqual(
							webviewThread.status,
							'resolved',
							'Resolved thread state should map to resolved status in sidebar'
						);
					} else {
						assert.strictEqual(
							webviewThread.status,
							'open',
							'Unresolved thread state should map to open status in sidebar'
						);
					}
				}
			),
			{ numRuns: 20 }
		);
	});
});
